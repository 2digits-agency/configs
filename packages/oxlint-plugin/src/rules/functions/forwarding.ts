import type { ESTree } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as P from 'effect/Predicate';

import { canonicalPath, isFunctionNode, walkNodes, type FileState, type FunctionNode } from '../../utils';
import { functionResult } from '../effect/utils';

export interface Forwarding {
  /**
   * The call the function returns.
   */
  readonly call: ESTree.CallExpression;
  /**
   * Whether the call receives only the parameters, so the callee could replace the function as is.
   */
  readonly exact: boolean;
}

// The parameter names, or `undefined` when a parameter is destructured or has a default.
function parameterNames(node: FunctionNode): ReadonlyArray<string> | undefined {
  const names: Array<string> = [];

  for (const parameter of node.params) {
    if (parameter.type === 'Identifier') {
      names.push(parameter.name);
    } else if (parameter.type === 'RestElement' && parameter.argument.type === 'Identifier') {
      names.push(parameter.argument.name);
    } else {
      return undefined;
    }
  }

  return names;
}

function referencesAny(node: ESTree.Node, names: ReadonlySet<string>): boolean {
  return walkNodes(
    node,
    (child) => child.type === 'ThisExpression' || (child.type === 'Identifier' && names.has(child.name)),
  );
}

// The parameter an argument passes on unchanged: `x` for parameter `x`, `...rest` for rest parameter `rest`.
function forwardedName(argument: ESTree.CallExpression['arguments'][number], node: FunctionNode): string | undefined {
  const last = node.params.at(-1);

  if (argument.type === 'SpreadElement') {
    return last?.type === 'RestElement' &&
      last.argument.type === 'Identifier' &&
      argument.argument.type === 'Identifier' &&
      argument.argument.name === last.argument.name
      ? last.argument.name
      : undefined;
  }

  const restName = last?.type === 'RestElement' && last.argument.type === 'Identifier' ? last.argument.name : undefined;

  return argument.type === 'Identifier' && argument.name !== restName ? argument.name : undefined;
}

/**
 * The call a function only forwards its parameters to: the function returns one call that receives every parameter
 * once, unchanged and in order, while its callee and other arguments do not depend on the parameters and are not
 * functions themselves.
 *
 * @param node Function to inspect.
 */
export function forwardedCall(node: FunctionNode): Forwarding | undefined {
  const names = parameterNames(node);

  const expression = functionResult(node);

  if (
    P.isUndefined(names) ||
    node.async ||
    node.generator ||
    node.typeParameters ||
    !Arr.isReadonlyArrayNonEmpty(names) ||
    expression?.type !== 'CallExpression' ||
    expression.optional
  ) {
    return undefined;
  }

  const nameSet = new Set(names);

  if (expression.callee.type === 'Super' || referencesAny(expression.callee, nameSet)) {
    return undefined;
  }

  const forwarded: Array<string> = [];

  for (const argument of expression.arguments) {
    const name = forwardedName(argument, node);

    if (P.isNotUndefined(name) && nameSet.has(name)) {
      forwarded.push(name);
    } else if (isFunctionNode(argument) || referencesAny(argument, nameSet)) {
      // A function argument, such as the callback of `Arr.map(values, (value) => …)`, carries the logic itself.
      return undefined;
    }
  }

  if (forwarded.length !== names.length || !Arr.every(forwarded, (name, index) => name === names[index])) {
    return undefined;
  }

  return { call: expression, exact: expression.arguments.length === names.length };
}

/**
 * Whether a function declares a type predicate, such as `node is FunctionNode`, which its body may not provide.
 *
 * @param node Function to inspect.
 */
export function isTypeGuard(node: FunctionNode): boolean {
  return node.returnType?.typeAnnotation.type === 'TSTypePredicate';
}

/**
 * Whether a callee is already an Effect guard, such as `Schema.is(User)` or `P.isString`, so a type predicate wrapped
 * around it adds nothing.
 *
 * @param callee Callee of the forwarded call.
 * @param state Import bindings of the file.
 */
export function isEffectGuard(callee: ESTree.Expression | ESTree.Super, state: FileState): boolean {
  const target = callee.type === 'CallExpression' ? callee.callee : callee;

  const path = canonicalPath(target, state);

  return path?.length === 2 && (path[0] === 'Schema' ? path[1] === 'is' : /^is\p{Lu}/u.test(path[1] ?? ''));
}

/**
 * Whether a callee can be passed as a value without losing `this` or changing when it is built: a binding, an imported
 * module function, or an Effect API call that builds a function, such as `Schema.is(User)`. A call to any other factory
 * runs on every call of the wrapper, and only once after passing its result.
 *
 * @param node Callee of the forwarded call.
 * @param state Import bindings of the file.
 */
export function isDetachableCallee(node: ESTree.Expression | ESTree.Super, state: FileState): boolean {
  if (node.type === 'Identifier') {
    return true;
  }

  if (node.type === 'MemberExpression') {
    return P.isNotUndefined(canonicalPath(node, state));
  }

  return node.type === 'CallExpression' && node.callee.type !== 'Identifier' && isDetachableCallee(node.callee, state);
}
