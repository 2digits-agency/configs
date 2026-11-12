import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';

import { staticPropertyName, walkNodes, type FunctionNode } from '../../internal/ast';
import { argumentText, namespaceImport } from '../../internal/fixes';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { functionResult } from '../effect/internal/callbacks';
import { isAnnotated, isDetachableCallee, isSettledCallee, unaryEffectCallback } from './internal/forwarding';

// `Fn.flow` has overloads for at most nine functions.
const maxFlowLength = 9;

// `Effect.runSync`, `DateTime.nowUnsafe` and similar run effects or read mutable state when they are called.
const impureMember = /^run|unsafe/iu;

/**
 * The functions a callback runs its parameter through, in order, and whether the pipeline uses a `.pipe` method.
 */
interface Pipeline {
  readonly functions: ReadonlyArray<ESTree.Expression>;
  readonly method: boolean;
}

// Whether an expression reads the parameter, or `this` and `arguments`, which belong to a function expression callback.
function readsCallback(node: ESTree.Node, name: string): boolean {
  return walkNodes(
    node,
    (child) =>
      child.type === 'ThisExpression' ||
      child.type === 'Super' ||
      (child.type === 'Identifier' && (child.name === name || child.name === 'arguments')),
  );
}

/**
 * The callees of nested one-argument calls on the parameter, innermost first: `[f, g]` for `g(f(x))`, and none for an
 * empty list when the expression is the parameter itself.
 *
 * @param node Expression the pipeline starts from.
 * @param name Parameter name.
 * @param imports Import bindings of the file.
 */
function parameterCalls(
  node: ESTree.Node,
  name: string,
  imports: ImportBindings,
): Opt.Option<ReadonlyArray<ESTree.Expression>> {
  if (node.type === 'Identifier') {
    return node.name === name ? Opt.some([]) : Opt.none();
  }

  if (node.type !== 'CallExpression' || node.optional || node.callee.type === 'Super') {
    return Opt.none();
  }

  const { callee } = node;

  return Arr.head(node.arguments).pipe(
    Opt.filter(
      (argument) =>
        node.arguments.length === 1 &&
        argument.type !== 'SpreadElement' &&
        !readsCallback(callee, name) &&
        isDetachableCallee(callee, imports),
    ),
    Opt.flatMap((argument) => parameterCalls(argument, name, imports)),
    Opt.map(Arr.append(callee)),
  );
}

function isPipeCall(node: ESTree.CallExpression, imports: ImportBindings): boolean {
  return imports.isApiPath(node.callee, ['pipe']) || imports.isApiPath(node.callee, ['Function', 'pipe']);
}

function isPipeMethod(callee: ESTree.CallExpression['callee']): callee is ESTree.MemberExpression {
  return (
    callee.type === 'MemberExpression' &&
    !callee.optional &&
    !callee.computed &&
    Opt.contains(staticPropertyName(callee), 'pipe')
  );
}

/**
 * The pipeline a callback with one parameter returns: `pipe(x, f, g)`, `x.pipe(f, g)`, `f(x).pipe(g)` or `g(f(x))`.
 *
 * @param node Callback.
 * @param imports Import bindings of the file.
 */
function pipeline(node: FunctionNode, imports: ImportBindings): Opt.Option<Pipeline> {
  const [parameter] = node.params;

  if (
    node.async ||
    node.generator ||
    node.typeParameters ||
    node.params.length !== 1 ||
    parameter?.type !== 'Identifier'
  ) {
    return Opt.none();
  }

  const { name } = parameter;

  return Opt.flatMap(functionResult(node), (result) => {
    const call = Opt.liftPredicate(
      result,
      (expression): expression is ESTree.CallExpression => expression.type === 'CallExpression' && !expression.optional,
    );

    const method = Opt.exists(call, (pipeCall) => !isPipeCall(pipeCall, imports) && isPipeMethod(pipeCall.callee));

    const [head, steps] = call.pipe(
      Opt.flatMap((pipeCall): Opt.Option<readonly [ESTree.Node, ESTree.CallExpression['arguments']]> => {
        // `Fn.pipe(x, …)` is a member call too, so the function form goes first.
        if (isPipeCall(pipeCall, imports)) {
          return Arr.matchLeft(pipeCall.arguments, {
            onEmpty: () => Opt.none(),
            onNonEmpty: (first, rest) => Opt.some([first, rest]),
          });
        }

        return isPipeMethod(pipeCall.callee) ? Opt.some([pipeCall.callee.object, pipeCall.arguments]) : Opt.none();
      }),
      Opt.getOrElse(() => [result, []] as const),
    );

    const pipedSteps = Opt.all(
      Arr.map(steps, (step) =>
        Opt.liftPredicate(
          step,
          (expression): expression is ESTree.Expression =>
            expression.type !== 'SpreadElement' && !readsCallback(expression, name),
        ),
      ),
    );

    return Opt.zipWith(parameterCalls(head, name, imports), pipedSteps, (calls, piped) => ({
      functions: Arr.appendAll(calls, piped),
      method,
    })).pipe(Opt.filter(({ functions }) => functions.length >= 2 && functions.length <= maxFlowLength));
  });
}

/**
 * Whether evaluating an expression once, when `Fn.flow(…)` is built, gives the same result as evaluating it on every
 * call of the callback: functions, literals, bindings, module members and calls to pure Effect APIs.
 *
 * @param node Pipeline function or one of its arguments.
 * @param imports Import bindings of the file.
 */
function isStable(node: ESTree.Node, imports: ImportBindings): boolean {
  return Match.value(node).pipe(
    Match.discriminators('type')({
      // A regex literal is a fresh `RegExp` per call; a shared one keeps `lastIndex` between `/g` matches.
      Literal: (literal) => !('regex' in literal),
      Identifier: Fn.constTrue,
      ArrowFunctionExpression: Fn.constTrue,
      FunctionExpression: Fn.constTrue,
      TemplateLiteral: ({ expressions }) => Arr.every(expressions, (expression) => isStable(expression, imports)),
      // A property of a module, such as `Schema.String`; any other object may change between calls.
      MemberExpression: (member) => Opt.isSome(imports.path(member)),
      UnaryExpression: ({ argument, operator }) => operator !== 'delete' && isStable(argument, imports),
      ArrayExpression: ({ elements }) =>
        Arr.every(elements, (element) => P.isNotNull(element) && isStable(element, imports)),
      ObjectExpression: ({ properties }) =>
        Arr.every(
          properties,
          (property) => property.type === 'Property' && !property.computed && isStable(property.value, imports),
        ),
      CallExpression: (call) =>
        !call.optional &&
        (call.callee.type === 'CallExpression'
          ? isStable(call.callee, imports)
          : Opt.exists(imports.path(call.callee), (path) => !Arr.some(path, (part) => impureMember.test(part)))) &&
        Arr.every(call.arguments, (argument) => isStable(argument, imports)),
    }),
    Match.orElse(Fn.constFalse),
  );
}

/**
 * Report Effect callbacks that only run their parameter through a pipeline, such as `Effect.map((rows) =>
 * Arr.head(rows).pipe(Opt.map(toDto)))`, which `Fn.flow(Arr.head, Opt.map(toDto))` expresses.
 */
export const preferFlow = Rule.define({
  name: 'prefer-flow',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer `Fn.flow` over Effect callbacks that only pipe their parameter through functions.',
    messages: {
      preferFlow: 'This callback only runs its parameter through {{count}} functions. Use `Fn.flow` instead.',
      useFlow: 'Replace the callback with `Fn.flow(…)`.',
    },
    fixable: 'code',
    hasSuggestions: true,
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    const { sourceCode } = ctx;

    const report = Effect.fnUntraced(function* (node: FunctionNode, functions: ReadonlyArray<ESTree.Expression>) {
      const diagnostic = Diagnostic.fromId({
        node,
        messageId: 'preferFlow',
        data: { count: String(functions.length) },
      });

      // Passing the functions reads them when the callback is created rather than when it runs.
      if (
        Arr.isReadonlyArrayNonEmpty(sourceCode.getCommentsInside(node)) ||
        !Arr.every(functions, (expression) => isSettledCallee(sourceCode, expression, node))
      ) {
        return yield* ctx.report(diagnostic);
      }

      const imported = yield* namespaceImport(node, 'effect/Function', 'Fn');

      const args = Arr.join(
        Arr.map(functions, (expression) => argumentText(sourceCode, expression)),
        ', ',
      );

      const fix = Diagnostic.composeFixes(
        ...Opt.toArray(imported.fix),
        Diagnostic.replaceText(node, `${imported.name}.flow(${args})`),
      );

      return yield* ctx.report(
        !isAnnotated(node) && Arr.every(functions, (expression) => isStable(expression, imports))
          ? Diagnostic.withFix(diagnostic, fix)
          : Diagnostic.withSuggestions(diagnostic, [{ messageId: 'useFlow', fix }]),
      );
    });

    function check(node: FunctionNode) {
      return unaryEffectCallback(node, imports).pipe(
        Opt.flatMap(() => pipeline(node, imports)),
        // Values other than Effect's own can have a `.pipe` method, such as Node streams; one Effect API rules them out.
        Opt.filter(
          ({ functions, method }) =>
            !method ||
            Arr.some(functions, (expression) =>
              Opt.isSome(imports.path(expression.type === 'CallExpression' ? expression.callee : expression)),
            ),
        ),
        Opt.match({ onNone: () => Effect.void, onSome: ({ functions }) => report(node, functions) }),
      );
    }

    return Visitor.merge(Visitor.on('ArrowFunctionExpression', check), Visitor.on('FunctionExpression', check));
  },
});
