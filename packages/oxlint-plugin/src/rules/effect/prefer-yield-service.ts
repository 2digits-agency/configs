import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import type * as Layer from 'effect/Layer';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';

import { isWrapperExpressionType, parentOf, parentOfType, unwrapExpression } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import type { ImportBindings } from '../../schemas/imports';

const effectProvides = ['provide', 'provideContext'] satisfies ReadonlyArray<keyof typeof Effect>;

const layerProvides = ['provide', 'succeedContext'] satisfies ReadonlyArray<keyof typeof Layer>;

/**
 * Whether `init` is `yield* Effect.context()`.
 *
 * @param init Variable initializer.
 * @param imports Import bindings of the file.
 */
function isYieldedContext(init: ESTree.Expression, imports: ImportBindings): boolean {
  const value = unwrapExpression(init);

  if (value.type !== 'YieldExpression' || !value.delegate || P.isNullish(value.argument)) {
    return false;
  }

  const yielded = unwrapExpression(value.argument);

  return (
    yielded.type === 'CallExpression' &&
    imports.isApi(yielded.callee, 'Effect', 'context' satisfies keyof typeof Effect)
  );
}

/**
 * The outermost parenthesis or type assertion around `node`, or `node` itself.
 *
 * @param node Reference.
 */
function outermostWrapper(node: ESTree.Node): ESTree.Node {
  return Opt.match(parentOf(node), {
    onNone: () => node,
    onSome: (parent) => (isWrapperExpressionType(parent.type) ? outermostWrapper(parent) : node),
  });
}

/**
 * The `Effect.provide`, `Effect.provideContext`, `Layer.provide` or `Layer.succeedContext` call that receives
 * `identifier` as an argument.
 *
 * @param identifier Reference to the captured context.
 * @param imports Import bindings of the file.
 */
function providingCall(identifier: ESTree.Node, imports: ImportBindings): Opt.Option<ESTree.CallExpression> {
  // A reference that is not an argument is the callee itself, which then is not a provide API.
  return Opt.filter(
    parentOfType(outermostWrapper(identifier), 'CallExpression'),
    ({ callee }) => imports.isApi(callee, 'Effect', effectProvides) || imports.isApi(callee, 'Layer', layerProvides),
  );
}

/**
 * Reject capturing the whole context only to provide it back to a nested effect or layer.
 */
export const preferYieldService = Rule.define({
  name: 'prefer-yield-service',
  meta: ruleMeta({
    type: 'problem',
    description:
      'Disallow `yield* Effect.context()` results that are passed back to Effect.provide, Effect.provideContext, Layer.provide or Layer.succeedContext.',
    messages: {
      reprovidedContext:
        'Do not capture the context with `Effect.context` and provide it back with {{provide}}. `yield*` each service the operation uses (`const store = yield* Store`) and let the nested effect require it, or provide it with Effect.provideService where the requirement must not leak, such as a service method.',
    },
    url: 'https://github.com/K-Mistele/anti-slop/blob/main/src/effect/rules/prefer-yield-service.ts',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('VariableDeclarator', (node) => {
      if (node.id.type !== 'Identifier' || P.isNullish(node.init) || !isYieldedContext(node.init, imports)) {
        return Effect.void;
      }

      // A binding that is reassigned may hold an independently built context by the time it is provided.
      const call = Arr.findFirst(ctx.sourceCode.getDeclaredVariables(node), ({ references }) =>
        Arr.some(references, (reference) => reference.isWrite() && !reference.init)
          ? Opt.none()
          : Arr.findFirst(references, ({ identifier }) => providingCall(identifier, imports)),
      );

      return Opt.match(call, {
        onNone: () => Effect.void,
        onSome: ({ callee }) =>
          ctx.report(
            Diagnostic.fromId({
              node,
              messageId: 'reprovidedContext',
              data: { provide: ctx.sourceCode.getText(unwrapExpression(callee)) },
            }),
          ),
      });
    });
  },
});
