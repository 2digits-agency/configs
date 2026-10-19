import type { ESTree } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';

import {
  callbackCall,
  canonicalPath,
  isFunctionNode,
  objectProperty,
  propertyName,
  staticPath,
  unwrapExpression,
  type FileState,
  type FunctionNode,
} from '../../utils';

export function objectArgument(node: ESTree.CallExpression): ESTree.ObjectExpression | undefined {
  return Opt.getOrUndefined(
    Arr.findFirst(
      node.arguments,
      (argument): argument is ESTree.ObjectExpression => argument.type === 'ObjectExpression',
    ),
  );
}

export function functionProperty(node: FunctionNode, name: string): ESTree.CallExpression | undefined {
  const property = node.parent;

  if (property.type !== 'Property' || propertyName(property as ESTree.ObjectProperty) !== name) {
    return undefined;
  }

  const object = property.parent;

  const call = object.parent;

  return object.type === 'ObjectExpression' && call?.type === 'CallExpression' ? call : undefined;
}

export function callbackApi(node: FunctionNode, state: FileState): ReadonlyArray<string> | undefined {
  const call = callbackCall(node);

  return call === undefined ? undefined : canonicalPath(call.callee, state);
}

const promiseChainMethods: ReadonlySet<string> = new Set(['catch', 'finally', 'then']);

function isPromiseConstruction(node: ESTree.NewExpression): boolean {
  const path = staticPath(node.callee);

  return path !== undefined && Arr.join(path, '.') === 'Promise';
}

function isPromiseCall(node: ESTree.CallExpression): boolean {
  const path = staticPath(node.callee);

  return (
    (path !== undefined && Arr.join(path, '.') === 'fetch') ||
    (path?.[0] === 'Promise' && path[1] !== 'withResolvers') ||
    promiseChainMethods.has(path?.at(-1) ?? '') ||
    (isFunctionNode(node.callee) && node.callee.async)
  );
}

const promiseExpression = Match.type<ESTree.Expression>().pipe(
  Match.discriminators('type')({
    CallExpression: isPromiseCall,
    NewExpression: isPromiseConstruction,
  }),
  Match.orElse(Fn.constFalse),
);

export function promiseInitializer(node: ESTree.Expression): boolean {
  return promiseExpression(unwrapExpression(node));
}

export function functionResult(node: FunctionNode): ESTree.Expression | undefined {
  if (!node.body) {
    return undefined;
  }

  if (node.body.type !== 'BlockStatement') {
    return unwrapExpression(node.body);
  }

  if (node.body.body.length !== 1 || node.body.body[0]?.type !== 'ReturnStatement' || !node.body.body[0].argument) {
    return undefined;
  }

  return unwrapExpression(node.body.body[0].argument);
}

/**
 * The thunk passed to `Effect.promise` or `Effect.tryPromise`, either directly or as the `try` option.
 *
 * @param node First call argument.
 */
export function promiseThunkArgument(node: ESTree.Expression | undefined): FunctionNode | undefined {
  const thunk = node?.type === 'ObjectExpression' ? objectProperty(node, 'try')?.value : node;

  return isFunctionNode(thunk) ? thunk : undefined;
}
