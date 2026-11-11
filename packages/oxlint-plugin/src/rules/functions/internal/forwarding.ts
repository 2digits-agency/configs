import type { ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import { isFunctionNode, walkNodes, type FunctionNode } from '../../../internal/ast';
import type { ImportBindings } from '../../../internal/imports';
import { functionResult } from '../../effect/internal/callbacks';

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

const isGuardName = Schema.is(Schema.String.check(Schema.isPattern(/^is\p{Lu}/u)));

function parameterName(parameter: ESTree.ParamPattern): Opt.Option<string> {
  if (parameter.type === 'Identifier') {
    return Opt.some(parameter.name);
  }

  return parameter.type === 'RestElement' && parameter.argument.type === 'Identifier'
    ? Opt.some(parameter.argument.name)
    : Opt.none();
}

function referencesAny(node: ESTree.Node, names: ReadonlyArray<string>): boolean {
  return walkNodes(
    node,
    (child) => child.type === 'ThisExpression' || (child.type === 'Identifier' && Arr.contains(names, child.name)),
  );
}

function restName(node: FunctionNode): Opt.Option<string> {
  return Opt.flatMap(Arr.last(node.params), (last) =>
    last.type === 'RestElement' && last.argument.type === 'Identifier' ? Opt.some(last.argument.name) : Opt.none(),
  );
}

// The parameter an argument passes on unchanged: `x` for parameter `x`, `...rest` for rest parameter `rest`.
function forwardedName(argument: ESTree.CallExpression['arguments'][number], node: FunctionNode): Opt.Option<string> {
  const rest = restName(node);

  if (argument.type === 'SpreadElement') {
    return Opt.filter(rest, (name) => argument.argument.type === 'Identifier' && argument.argument.name === name);
  }

  return argument.type === 'Identifier' && !Opt.contains(rest, argument.name) ? Opt.some(argument.name) : Opt.none();
}

/**
 * The parameters a call forwards unchanged, in order, or none when another argument depends on a parameter or is a
 * function itself, such as the callback of `Arr.map(values, (value) => …)`, which carries the logic.
 *
 * @param call Returned call.
 * @param node Function that returns it.
 * @param names Parameter names of the function.
 */
function forwardedNames(
  call: ESTree.CallExpression,
  node: FunctionNode,
  names: ReadonlyArray<string>,
): Opt.Option<ReadonlyArray<string>> {
  return Opt.all(
    Arr.flatMap(call.arguments, (argument) =>
      forwardedName(argument, node).pipe(
        Opt.filter((name) => Arr.contains(names, name)),
        Opt.match({
          onSome: (name) => [Opt.some(name)],
          onNone: () => (isFunctionNode(argument) || referencesAny(argument, names) ? [Opt.none<string>()] : []),
        }),
      ),
    ),
  );
}

/**
 * The call a function only forwards its parameters to: the function returns one call that receives every parameter
 * once, unchanged and in order, while its callee and other arguments do not depend on the parameters and are not
 * functions themselves.
 *
 * @param node Function to inspect.
 */
export function forwardedCall(node: FunctionNode): Opt.Option<Forwarding> {
  if (node.async || node.generator || node.typeParameters) {
    return Opt.none();
  }

  return Opt.zipWith(
    // The parameter names, or none when a parameter is destructured or has a default.
    Opt.filter(Opt.all(Arr.map(node.params, parameterName)), Arr.isReadonlyArrayNonEmpty),
    Opt.filter(
      functionResult(node),
      (expression): expression is ESTree.CallExpression => expression.type === 'CallExpression' && !expression.optional,
    ),
    (names, call) => ({ names, call }),
  ).pipe(
    Opt.flatMap(({ names, call }) =>
      call.callee.type === 'Super' || referencesAny(call.callee, names)
        ? Opt.none()
        : forwardedNames(call, node, names).pipe(
            Opt.filter((forwarded) => Arr.makeEquivalence<string>((a, b) => a === b)(forwarded, names)),
            Opt.map(() => ({ call, exact: call.arguments.length === names.length })),
          ),
    ),
  );
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
 * @param imports Import bindings of the file.
 */
export function isEffectGuard(callee: ESTree.Expression | ESTree.Super, imports: ImportBindings): boolean {
  const target = callee.type === 'CallExpression' ? callee.callee : callee;

  return Opt.exists(imports.path(target), (path) =>
    Arr.get(path, 1).pipe(
      Opt.filter(() => path.length === 2),
      Opt.exists((member) => (Opt.contains(Arr.head(path), 'Schema') ? member === 'is' : isGuardName(member))),
    ),
  );
}

/**
 * Whether a callee can be passed as a value without losing `this` or changing when it is built: a binding, an imported
 * module function, or an Effect API call that builds a function, such as `Schema.is(User)`. A call to any other factory
 * runs on every call of the wrapper, and only once after passing its result.
 *
 * @param node Callee of the forwarded call.
 * @param imports Import bindings of the file.
 */
export function isDetachableCallee(node: ESTree.Expression | ESTree.Super, imports: ImportBindings): boolean {
  if (node.type === 'Identifier') {
    return true;
  }

  if (node.type === 'MemberExpression') {
    return Opt.isSome(imports.path(node));
  }

  return (
    node.type === 'CallExpression' && node.callee.type !== 'Identifier' && isDetachableCallee(node.callee, imports)
  );
}
