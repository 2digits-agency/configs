import { Diagnostic, Rule, RuleContext, Visitor, type ESTree, type Variable } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Equivalence from 'effect/Equivalence';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';

import {
  argumentAt,
  findAncestor,
  parentOfType,
  staticPath,
  unwrapExpression,
  type FunctionNode,
} from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { lookupVariable, soleDefinition } from '../../internal/scope';
import type { ImportBindings } from '../../schemas/imports';

/**
 * The service a `yield* Tag` or `yield* Effect.service(Tag)` initializer reads from the environment.
 *
 * @param init Variable initializer.
 * @param imports Import bindings of the file.
 */
function yieldedService(init: ESTree.Expression, imports: ImportBindings): Opt.Option<ESTree.Expression> {
  const value = unwrapExpression(init);

  if (value.type !== 'YieldExpression' || !value.delegate || P.isNullish(value.argument)) {
    return Opt.none();
  }

  const yielded = unwrapExpression(value.argument);

  return yielded.type === 'CallExpression' &&
    imports.isApi(yielded.callee, 'Effect', 'service' satisfies keyof typeof Effect)
    ? Opt.map(argumentAt(yielded, 0), unwrapExpression)
    : Opt.some(yielded);
}

function isProvideService(node: ESTree.Node, imports: ImportBindings): boolean {
  return imports.isApi(node, 'Effect', 'provideService' satisfies keyof typeof Effect);
}

/**
 * The service and implementation of `Effect.provideService(Tag, impl)`, the data-first `Effect.provideService(self,
 * Tag, impl)` and the curried `Effect.provideService(Tag)(impl)` and `Effect.provideService(Tag)(self, impl)`.
 *
 * @param node Call.
 * @param imports Import bindings of the file.
 */
function provideServiceArguments(
  node: ESTree.CallExpression,
  imports: ImportBindings,
): Opt.Option<readonly [ESTree.Expression, ESTree.Expression]> {
  const implementation = argumentAt(node, node.arguments.length - 1);

  if (isProvideService(node.callee, imports) && node.arguments.length >= 2) {
    return Opt.all([argumentAt(node, node.arguments.length - 2), implementation]);
  }

  const callee = unwrapExpression(node.callee);

  return callee.type === 'CallExpression' && isProvideService(callee.callee, imports) && callee.arguments.length === 1
    ? Opt.all([argumentAt(callee, 0), implementation])
    : Opt.none();
}

const sameFunction = Opt.makeEquivalence(Equivalence.strictEqual<FunctionNode>());

const sameVariable = Opt.makeEquivalence(Equivalence.strictEqual<Variable>());

/**
 * The innermost function around `node`, including function declarations, which also run later than where they are
 * written.
 *
 * @param node Start node.
 */
function owningFunction(node: ESTree.Node): Opt.Option<FunctionNode> {
  return findAncestor(
    node,
    (ancestor): ancestor is FunctionNode =>
      ancestor.type === 'ArrowFunctionExpression' ||
      ancestor.type === 'FunctionDeclaration' ||
      ancestor.type === 'FunctionExpression',
  );
}

/**
 * Whether `node` is a pipeline step of `Effect.fn(body, ...steps)` or `Effect.fn('name')(body, ...steps)`, which runs
 * on every later call of the function rather than where it is written.
 *
 * @param node Call.
 * @param imports Import bindings of the file.
 */
function isEffectFnStep(node: ESTree.CallExpression, imports: ImportBindings): boolean {
  return Opt.exists(parentOfType(node, 'CallExpression'), (parent) => {
    const callee = unwrapExpression(parent.callee);

    return (
      callee !== node &&
      imports.isApi(callee.type === 'CallExpression' ? callee.callee : callee, 'Effect', [
        'fn',
        'fnUntraced',
        'fnUntracedEager',
      ] satisfies ReadonlyArray<keyof typeof Effect>)
    );
  });
}

/**
 * Keep ambient dependencies in the R channel instead of capturing them and providing them back to an effect that runs
 * where they were yielded. Providing them to an effect that runs later, such as a service method, is how Effect keeps
 * requirements out of service interfaces, so a provide in a nested function or `Effect.fn` pipeline is not reported.
 */
export const noReprovideAmbientService = Rule.define({
  name: 'no-reprovide-ambient-service',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow re-providing an Effect service that was yielded from the environment in the same function.',
    messages: {
      reprovideAmbientService:
        '`{{service}}` was yielded from the environment in this function, so the enclosing effect already requires it. Remove this Effect.provideService and provide its layer once at the composition root. Provide locally only a genuinely different implementation, such as a client configured per tenant.',
    },
    url: 'https://github.com/K-Mistele/anti-slop/blob/main/src/rules/no-reprovide-ambient-service.ts',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    /**
     * The service a never-reassigned `const x = yield* Tag` binding holds, when `site` runs in the same execution as
     * that `yield*`.
     *
     * @param implementation Implementation argument of `provideService`.
     * @param site The `provideService` call.
     */
    function ambientService(
      implementation: ESTree.Expression,
      site: ESTree.CallExpression,
    ): Opt.Option<ESTree.Expression> {
      if (implementation.type !== 'Identifier' || isEffectFnStep(site, imports)) {
        return Opt.none();
      }

      const variable = lookupVariable(ctx.sourceCode, implementation, implementation.name);

      return soleDefinition(variable).pipe(
        Opt.flatMap(({ node }) => (node.type === 'VariableDeclarator' ? Opt.some(node) : Opt.none())),
        Opt.filter((declarator) => sameFunction(owningFunction(declarator), owningFunction(site))),
        Opt.flatMapNullishOr(({ init }) => init),
        Opt.filter(() =>
          Opt.exists(variable, ({ references }) =>
            Arr.every(references, (reference) => !reference.isWrite() || reference.init),
          ),
        ),
        Opt.flatMap((init) => yieldedService(init, imports)),
      );
    }

    /**
     * The binding the root of a tag expression names, such as `HttpClient` in `HttpClient.HttpClient`.
     *
     * @param tag Tag expression.
     */
    function rootVariable(tag: ESTree.Expression): Opt.Option<Variable> {
      return Opt.flatMap(staticPath(tag), (path) => lookupVariable(ctx.sourceCode, tag, Arr.headNonEmpty(path)));
    }

    return Visitor.on('CallExpression', (node) => {
      const provided = Opt.flatMap(provideServiceArguments(node, imports), ([tag, implementation]) => {
        const requested = unwrapExpression(tag);

        const service = ctx.sourceCode.getText(requested);

        // Same text through the same binding, so a block-local `Tag` that shadows the yielded one is a different service.
        return Opt.exists(
          ambientService(unwrapExpression(implementation), node),
          (yielded) =>
            ctx.sourceCode.getText(yielded) === service && sameVariable(rootVariable(yielded), rootVariable(requested)),
        )
          ? Opt.some(service)
          : Opt.none();
      });

      return Opt.match(provided, {
        onNone: () => Effect.void,
        onSome: (service) =>
          ctx.report(Diagnostic.fromId({ node, messageId: 'reprovideAmbientService', data: { service } })),
      });
    });
  },
});
