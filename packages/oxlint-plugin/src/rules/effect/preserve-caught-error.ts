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
  isWrapperExpressionType,
  parentOf,
  staticPath,
  staticPropertyName,
  unwrapExpression,
  walkNodes,
  type FunctionNode,
} from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { callbackApi, functionProperty, functionResult } from './internal/callbacks';

const ErrorHandlerMethod = Schema.Literals([
  ...(['catch', 'catchCause', 'mapError'] satisfies ReadonlyArray<keyof typeof Effect>),
  // Effect v3 name, which the current Effect types no longer export.
  'catchAll',
]);

const isErrorHandlerMethod = Schema.is(ErrorHandlerMethod);

const tapCauseMethods = [
  'tapCause' satisfies keyof typeof Effect,
  // Effect v3 name, which the current Effect types no longer export.
  'tapErrorCause',
];

const tapFailureMethods = [...tapCauseMethods, 'tapError' satisfies keyof typeof Effect];

const passThroughMethods = ['as', 'asSome', 'asVoid', 'map', 'withSpan'] satisfies ReadonlyArray<keyof typeof Effect>;

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
 * The effect a tap handler always returns: its expression body, or the final `return` of a block whose other statements
 * only declare variables.
 *
 * @param handler Tap handler.
 */
function tapResult(handler: FunctionNode): Opt.Option<ESTree.Expression> {
  const body = handler.body;

  if (body?.type !== 'BlockStatement') {
    return functionResult(handler);
  }

  return Arr.matchRight(body.body, {
    onEmpty: () => Opt.none(),
    onNonEmpty: (setup, last) =>
      last.type === 'ReturnStatement' &&
      P.isNotNullish(last.argument) &&
      Arr.every(setup, (statement) => statement.type === 'VariableDeclaration')
        ? Opt.some(unwrapExpression(last.argument))
        : Opt.none(),
  });
}

/**
 * Whether a tap handler logs what it receives: `Effect.logError` itself, or a function that returns an `Effect.log*` or
 * `Console.*` effect with its parameter.
 *
 * @param node Tap handler.
 * @param imports Import bindings of the file.
 */
function logsInput(node: ESTree.Expression, imports: ImportBindings): boolean {
  const handler = unwrapExpression(node);

  return isFunctionNode(handler)
    ? Opt.exists(firstIdentifierParameter(handler), ({ name }) =>
        Opt.exists(
          tapResult(handler),
          (result) =>
            result.type === 'CallExpression' && isLogApi(result.callee, imports) && containsIdentifier(result, name),
        ),
      )
    : isLogApi(handler, imports);
}

/**
 * Whether a step logs the failures that reach it: `Effect.tapError(Effect.logError)` or its data-first form.
 *
 * @param node Pipe step or effect.
 * @param tapMethods Tap methods that see every failure the handler receives.
 * @param imports Import bindings of the file.
 */
function isLoggingTap(node: ESTree.Node, tapMethods: ReadonlyArray<string>, imports: ImportBindings): boolean {
  return (
    node.type === 'CallExpression' &&
    imports.isApi(node.callee, 'Effect', tapMethods) &&
    Opt.exists(Arr.last(node.arguments), (handler) => handler.type !== 'SpreadElement' && logsInput(handler, imports))
  );
}

function isPipeMethod(node: ESTree.Node): node is ESTree.MemberExpression {
  return node.type === 'MemberExpression' && Opt.contains(staticPropertyName(node), 'pipe');
}

function isPipeFunction(node: ESTree.Node, imports: ImportBindings): boolean {
  return imports.isApiPath(node, ['pipe']) || imports.isApiPath(node, ['Function', 'pipe']);
}

/**
 * The steps that build an effect, in order: the receiver and arguments of `.pipe(…)`, or the arguments of `pipe(…)`,
 * flattened.
 *
 * @param node Effect.
 * @param imports Import bindings of the file.
 */
function pipelineSteps(node: ESTree.Node, imports: ImportBindings): ReadonlyArray<ESTree.Node> {
  if (node.type !== 'CallExpression') {
    return [node];
  }

  const callee = unwrapExpression(node.callee);

  if (isPipeMethod(callee)) {
    return [...pipelineSteps(callee.object, imports), ...node.arguments];
  }

  return isPipeFunction(callee, imports)
    ? Arr.match(node.arguments, {
        onEmpty: () => [node],
        onNonEmpty: ([source, ...steps]) => [...pipelineSteps(source, imports), ...steps],
      })
    : [node];
}

/**
 * The steps a failure passes through before it reaches the handler call, in order: earlier steps of the same pipe or
 * `Effect.fn` pipeline and the receiver of `.pipe(…)`, or the source of a data-first call.
 *
 * @param handlerCall Call that receives the handler.
 * @param imports Import bindings of the file.
 */
function stepsBefore(handlerCall: ESTree.CallExpression, imports: ImportBindings): ReadonlyArray<ESTree.Node> {
  if (handlerCall.arguments.length > 1) {
    return Opt.match(Arr.head(handlerCall.arguments), {
      onNone: () => [],
      onSome: (source) => pipelineSteps(source, imports),
    });
  }

  const pipeline = handlerCall.parent;

  if (pipeline.type !== 'CallExpression' || !containsSame<ESTree.Node>(pipeline.arguments, handlerCall)) {
    return [];
  }

  const callee = unwrapExpression(pipeline.callee);

  const earlier = Arr.takeWhile(pipeline.arguments, (argument) => argument !== handlerCall);

  if (isPipeMethod(callee)) {
    return [...pipelineSteps(callee.object, imports), ...earlier];
  }

  return isPipeFunction(callee, imports)
    ? Arr.match(earlier, {
        onEmpty: () => [],
        onNonEmpty: ([source, ...steps]) => [...pipelineSteps(source, imports), ...steps],
      })
    : earlier;
}

/**
 * Whether the failure was logged right before the handler: the nearest earlier step that can change failures is a
 * logging tap. A step such as `Effect.flatMap` in between can add a failure the tap never saw.
 *
 * @param node Error handler.
 * @param imports Import bindings of the file.
 */
function isLoggedBefore(node: FunctionNode, imports: ImportBindings): boolean {
  return Opt.exists(callbackCall(node), (handlerCall) =>
    Opt.exists(
      Arr.findLast(
        stepsBefore(handlerCall, imports),
        (step) =>
          // Steps such as `Effect.map(f)` or `Effect.asVoid` pass failures through unchanged.
          !imports.isApi(step.type === 'CallExpression' ? step.callee : step, 'Effect', passThroughMethods),
      ),
      (step) =>
        isLoggingTap(
          step,
          // `Effect.tapError` does not see the defects and interruptions an `Effect.catchCause` handler receives.
          imports.isApi(handlerCall.callee, 'Effect', 'catchCause' satisfies keyof typeof Effect)
            ? tapCauseMethods
            : tapFailureMethods,
          imports,
        ),
    ),
  );
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
 * The outermost type assertion, `satisfies` or parentheses around a node, or the node itself.
 *
 * @param node Expression.
 */
function outermostWrapper(node: ESTree.Node): ESTree.Node {
  return Opt.match(
    Opt.filter(parentOf(node), (parent) => isWrapperExpressionType(parent.type)),
    { onNone: () => node, onSome: outermostWrapper },
  );
}

/**
 * Whether the handler fails with `node`: a value it returns, the argument of `Effect.fail`, or a `yield*` operand.
 *
 * @param node Construction inside the handler.
 * @param handler Error handler.
 * @param imports Import bindings of the file.
 */
function isFailureValue(node: ESTree.Node, handler: FunctionNode, imports: ImportBindings): boolean {
  const value = outermostWrapper(node);

  return (
    handler.body === value ||
    Opt.exists(
      parentOf(value),
      (parent) =>
        (parent.type === 'ReturnStatement' && isSomeSame(enclosingFunction(parent), handler)) ||
        (parent.type === 'YieldExpression' && parent.delegate) ||
        (parent.type === 'CallExpression' &&
          imports.isApi(parent.callee, 'Effect', 'fail' satisfies keyof typeof Effect) &&
          isSomeSame<ESTree.Node>(Arr.head(parent.arguments), value)),
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
