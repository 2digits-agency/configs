import type { ESTree } from '@oxlint/plugins';
import * as Arr from 'effect/Array';

import {
  callbackCall,
  canonicalPath,
  isFunctionNode,
  propertyName,
  staticPath,
  unwrapExpression,
  type FileState,
  type FunctionNode,
} from '../../utils';

export function objectArgument(node: ESTree.CallExpression): ESTree.ObjectExpression | undefined {
  for (const argument of node.arguments) {
    if (argument.type === 'ObjectExpression') {
      return argument;
    }
  }

  return undefined;
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

export function promiseInitializer(node: ESTree.Expression): boolean {
  const expression = unwrapExpression(node);

  if (expression.type === 'NewExpression') {
    const callee = staticPath(expression.callee);

    return callee !== undefined && Arr.join(callee, '.') === 'Promise';
  }

  if (expression.type !== 'CallExpression') {
    return false;
  }

  const path = staticPath(expression.callee);

  return (
    (path !== undefined && Arr.join(path, '.') === 'fetch') ||
    (path?.[0] === 'Promise' && path[1] !== 'withResolvers') ||
    ['catch', 'finally', 'then'].includes(path?.at(-1) ?? '') ||
    (isFunctionNode(expression.callee) && expression.callee.async)
  );
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
