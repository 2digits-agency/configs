// Cases adapted from anti-slop's require-cause-when-narrowing (K-Mistele/anti-slop fork). See NOTICE.
import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import type * as Console from 'effect/Console';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import {
  callbackCall,
  containsIdentifier,
  containsSame,
  enclosingFunction,
  firstIdentifierParameter,
  isFunctionNode,
  isSomeSame,
  parentOf,
  staticPath,
  staticPropertyName,
  unwrapExpression,
  walkNodes,
  type FunctionNode,
} from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { callbackApi, functionProperty } from './internal/callbacks';

const ErrorHandlerMethod = Schema.Literals([
  ...(['catch', 'catchCause', 'mapError'] satisfies ReadonlyArray<keyof typeof Effect>),
  // Effect v3 name, which the current Effect types no longer export.
  'catchAll',
]);

const isErrorHandlerMethod = Schema.is(ErrorHandlerMethod);

const tapFailureMethods = [
  ...(['tapCause', 'tapError'] satisfies ReadonlyArray<keyof typeof Effect>),
  // Effect v3 name, which the current Effect types no longer export.
  'tapErrorCause',
];

const effectLogMethods = [
  'log',
  'logDebug',
  'logError',
  'logFatal',
  'logInfo',
  'logTrace',
  'logWarning',
] satisfies ReadonlyArray<keyof typeof Effect>;

const consoleLogMethods = ['debug', 'error', 'info', 'log', 'trace', 'warn'] satisfies ReadonlyArray<
  keyof typeof Console
>;

function isErrorHandler(node: FunctionNode, imports: ImportBindings): boolean {
  return (
    Opt.exists(
      callbackApi(node, imports),
      ([namespace, member]) => namespace === 'Effect' && isErrorHandlerMethod(member),
    ) ||
    Opt.exists(functionProperty(node, 'catch'), (call) =>
      imports.isApi(call.callee, 'Effect', ['try', 'tryPromise'] satisfies ReadonlyArray<keyof typeof Effect>),
    )
  );
}

function isLogApi(node: ESTree.Node, imports: ImportBindings): boolean {
  return imports.isApi(node, 'Effect', effectLogMethods) || imports.isApi(node, 'Console', consoleLogMethods);
}

/**
 * Whether a tap handler logs what it receives: `Effect.logError` itself, or a function that passes its parameter to
 * `Effect.log*` or `Console.*`.
 *
 * @param node Tap handler.
 * @param imports Import bindings of the file.
 */
function logsInput(node: ESTree.Expression, imports: ImportBindings): boolean {
  const handler = unwrapExpression(node);

  return isFunctionNode(handler)
    ? Opt.exists(
        firstIdentifierParameter(handler),
        ({ name }) =>
          P.isNotNullish(handler.body) &&
          walkNodes(
            handler.body,
            (child) =>
              child.type === 'CallExpression' && isLogApi(child.callee, imports) && containsIdentifier(child, name),
          ),
      )
    : isLogApi(handler, imports);
}

/**
 * Whether an effect or pipe step logs failures: `Effect.tapError(Effect.logError)`, its data-first form, or a
 * `.pipe(…)` or `pipe(…)` that contains such a step.
 *
 * @param node Effect or pipe step.
 * @param imports Import bindings of the file.
 */
function logsFailure(node: ESTree.Node, imports: ImportBindings): boolean {
  if (node.type !== 'CallExpression') {
    return false;
  }

  const callee = unwrapExpression(node.callee);

  if (imports.isApi(callee, 'Effect', tapFailureMethods)) {
    return Opt.exists(
      Arr.last(node.arguments),
      (handler) => handler.type !== 'SpreadElement' && logsInput(handler, imports),
    );
  }

  const isPipeMethod = callee.type === 'MemberExpression' && Opt.contains(staticPropertyName(callee), 'pipe');

  return (
    (isPipeMethod && logsFailure(callee.object, imports)) ||
    ((isPipeMethod || imports.isApiPath(callee, ['pipe']) || imports.isApiPath(callee, ['Function', 'pipe'])) &&
      Arr.some(node.arguments, (argument) => logsFailure(argument, imports)))
  );
}

/**
 * Whether the failure reaches the handler after a step that logs it: an earlier step of the same pipe or `Effect.fn`
 * pipeline, the receiver of `.pipe(…)`, or the source of a data-first call.
 *
 * @param node Error handler.
 * @param imports Import bindings of the file.
 */
function isLoggedBefore(node: FunctionNode, imports: ImportBindings): boolean {
  return Opt.exists(callbackCall(node), (handlerCall) => {
    if (handlerCall.arguments.length > 1) {
      return Opt.exists(Arr.head(handlerCall.arguments), (source) => logsFailure(source, imports));
    }

    const pipeline = handlerCall.parent;

    if (pipeline.type !== 'CallExpression' || !containsSame<ESTree.Node>(pipeline.arguments, handlerCall)) {
      return false;
    }

    const callee = unwrapExpression(pipeline.callee);

    return (
      Arr.some(
        Arr.takeWhile(pipeline.arguments, (argument) => argument !== handlerCall),
        (step) => logsFailure(step, imports),
      ) ||
      (callee.type === 'MemberExpression' &&
        Opt.contains(staticPropertyName(callee), 'pipe') &&
        logsFailure(callee.object, imports))
    );
  });
}

/**
 * The class of `new X(…)` or `X.make(…)`.
 *
 * @param node Expression.
 */
function constructedClass(node: ESTree.Node): Opt.Option<ESTree.Node> {
  if (node.type === 'NewExpression') {
    return Opt.some(node.callee);
  }

  const callee = node.type === 'CallExpression' ? unwrapExpression(node.callee) : undefined;

  return callee?.type === 'MemberExpression' && Opt.contains(staticPropertyName(callee), 'make')
    ? Opt.some(callee.object)
    : Opt.none();
}

/**
 * Whether the handler fails with `node`: a value it returns, the argument of `Effect.fail`, or a `yield*` operand.
 *
 * @param node Construction inside the handler.
 * @param handler Error handler.
 * @param imports Import bindings of the file.
 */
function isFailureValue(node: ESTree.Node, handler: FunctionNode, imports: ImportBindings): boolean {
  return (
    handler.body === node ||
    Opt.exists(
      parentOf(node),
      (parent) =>
        (parent.type === 'ReturnStatement' && isSomeSame(enclosingFunction(parent), handler)) ||
        (parent.type === 'YieldExpression' && parent.delegate) ||
        (parent.type === 'CallExpression' &&
          imports.isApi(parent.callee, 'Effect', 'fail' satisfies keyof typeof Effect) &&
          isSomeSame<ESTree.Node>(Arr.head(parent.arguments), node)),
    )
  );
}

/**
 * Whether `node` constructs an error: a class named `*Error` anywhere, or a PascalCase class the handler fails with.
 * Classes from Effect imports, such as `SchemaIssue.InvalidValue` or `Ref.make(0)`, only count by name.
 *
 * @param node Node inside the handler.
 * @param handler Error handler.
 * @param imports Import bindings of the file.
 */
function constructsError(node: ESTree.Node, handler: FunctionNode, imports: ImportBindings): boolean {
  return Opt.exists(constructedClass(node), (errorClass) =>
    Opt.exists(
      Opt.flatMap(staticPath(errorClass), Arr.last),
      (name) =>
        Str.endsWith('Error')(name) ||
        (/^\p{Lu}/u.test(name) && Opt.isNone(imports.path(errorClass)) && isFailureValue(node, handler, imports)),
    ),
  );
}

export const preserveCaughtError = Rule.define({
  name: 'preserve-caught-error',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Preserve the underlying cause when wrapping an Effect failure.',
    messages: {
      droppedCause:
        'This handler constructs a new error but drops the caught failure. Accept it as a parameter and attach it as cause, or log it first with `Effect.tapError(Effect.logError)`.',
    },
    url: 'https://github.com/Effect-TS/tsgo/issues/490',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    function check(node: FunctionNode) {
      const parameter = firstIdentifierParameter(node);

      return P.isNotNullish(node.body) &&
        isErrorHandler(node, imports) &&
        walkNodes(
          node.body,
          (child) =>
            constructsError(child, node, imports) &&
            !Opt.exists(parameter, ({ name }) => containsIdentifier(child, name)),
        ) &&
        !isLoggedBefore(node, imports)
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'droppedCause' }))
        : Effect.void;
    }

    return Visitor.merge(Visitor.on('ArrowFunctionExpression', check), Visitor.on('FunctionExpression', check));
  },
});
