import type { ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import {
  callbackCall,
  containsSame,
  isFunctionNode,
  objectProperty,
  parentOf,
  propertyName,
  staticPath,
  unwrapExpression,
  type FunctionNode,
} from '../../../internal/ast';
import type { ImportBindings } from '../../../internal/imports';

/**
 * The call whose options object holds `node` as the property `name`, such as `Effect.tryPromise({ try: node })`.
 *
 * @param node Option function.
 * @param name Option name.
 */
export function functionProperty(node: FunctionNode, name: string): Opt.Option<ESTree.CallExpression> {
  return Match.value(node.parent).pipe(
    Match.withReturnType<Opt.Option<ESTree.CallExpression>>(),
    Match.when(
      {
        type: 'Property',
        parent: { type: 'ObjectExpression', parent: { type: 'CallExpression' } },
      },
      (property) =>
        Opt.contains(propertyName(property as ESTree.ObjectProperty), name)
          ? Opt.some(property.parent.parent as ESTree.CallExpression)
          : Opt.none(),
    ),
    Match.orElse(() => Opt.none()),
  );
}

/**
 * The module path of the call that receives `node` as a direct argument, such as `['Effect', 'map']`.
 *
 * @param node Callback.
 * @param imports Import bindings of the file.
 */
export function callbackApi(node: FunctionNode, imports: ImportBindings): Opt.Option<ReadonlyArray<string>> {
  return Opt.flatMap(callbackCall(node), (call) => imports.path(call.callee));
}

function callHost(node: FunctionNode): Opt.Option<ESTree.CallExpression | ESTree.NewExpression> {
  const argument: ESTree.Node =
    node.parent.type === 'Property' && node.parent.value === node ? node.parent.parent : node;

  return Opt.filter(
    parentOf(argument),
    (call): call is ESTree.CallExpression | ESTree.NewExpression =>
      (call.type === 'CallExpression' || call.type === 'NewExpression') &&
      containsSame<ESTree.Node>(call.arguments, argument),
  );
}

function rootCallee(node: ESTree.Node): ESTree.Node {
  return node.type === 'CallExpression' ? rootCallee(node.callee) : node;
}

/**
 * Whether a function is a callback whose signature a non-Effect API dictates: passed to a call or constructor, directly
 * or as an option property, whose callee does not resolve to an Effect or Alchemy import (`setTimeout`, `xs.map`,
 * `sdk.retry({ onRetry })`). Callbacks of Effect APIs, such as `Effect.fn(...)` or `Effect.map`, are not foreign.
 *
 * @param node Function to inspect.
 * @param imports Import bindings of the file.
 */
export function isForeignCallback(node: FunctionNode, imports: ImportBindings): boolean {
  return Opt.exists(callHost(node), (call) => Opt.isNone(imports.path(rootCallee(call.callee))));
}

const PromiseChainMethod = Schema.Literals(['catch', 'finally', 'then']);

const isPromiseChainMethod = Schema.is(PromiseChainMethod);

function isPromiseCall(node: ESTree.CallExpression): boolean {
  const path = staticPath(node.callee);

  return (
    Opt.exists(path, (parts) => Arr.join(parts, '.') === 'fetch') ||
    Opt.exists(path, ([first, second]) => first === 'Promise' && second !== 'withResolvers') ||
    Opt.exists(path, (parts) => isPromiseChainMethod(Arr.lastNonEmpty(parts))) ||
    (isFunctionNode(node.callee) && node.callee.async)
  );
}

const promiseExpression = Match.type<ESTree.Expression>().pipe(
  Match.discriminators('type')({
    CallExpression: isPromiseCall,
    NewExpression: ({ callee }) => Opt.exists(staticPath(callee), (path) => Arr.join(path, '.') === 'Promise'),
  }),
  Match.orElse(Fn.constFalse),
);

/**
 * Whether an expression evaluates to an already started promise: `fetch(…)`, `Promise.*`, `.then/.catch/.finally`, `new
 * Promise(…)` or an async IIFE.
 *
 * @param node Expression.
 */
export function promiseInitializer(node: ESTree.Expression): boolean {
  return promiseExpression(unwrapExpression(node));
}

/**
 * The value a function returns when its body is one expression or one `return` statement.
 *
 * @param node Function.
 */
export function functionResult(node: FunctionNode): Opt.Option<ESTree.Expression> {
  return Opt.flatMap(Opt.fromNullishOr(node.body), (body) =>
    body.type === 'BlockStatement'
      ? Opt.map(
          Opt.flatMapNullishOr(
            Opt.filter(Arr.head(body.body), () => body.body.length === 1),
            (statement) => (statement.type === 'ReturnStatement' ? statement.argument : undefined),
          ),
          unwrapExpression,
        )
      : Opt.some(unwrapExpression(body)),
  );
}

/**
 * The thunk passed to `Effect.promise` or `Effect.tryPromise`, either directly or as the `try` option.
 *
 * @param node First call argument.
 */
export function promiseThunkArgument(node: Opt.Option<ESTree.Expression>): Opt.Option<FunctionNode> {
  return Opt.filter(
    Opt.flatMap(node, (argument) =>
      argument.type === 'ObjectExpression'
        ? Opt.map(objectProperty(argument, 'try'), ({ value }) => value)
        : Opt.some<ESTree.Node>(argument),
    ),
    isFunctionNode,
  );
}
