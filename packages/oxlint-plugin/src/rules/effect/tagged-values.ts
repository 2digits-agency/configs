import type { ESTree } from '@oxlint/plugins';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';

import { callbackCall, enclosingFunction, isEqualityOperator, isStringLiteral, staticPropertyName } from '../../utils';

const isBroadEffectCatchCallee = Match.type<ESTree.Expression>().pipe(
  Match.when(
    {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'Effect' },
      property: { type: 'Identifier', name: Match.is('catch', 'catchAll', 'catchIf') },
    },
    Fn.constTrue,
  ),
  Match.orElse(Fn.constFalse),
);

const isMatchPatternCallee = Match.type<ESTree.Expression>().pipe(
  Match.when(
    {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'Match' },
      property: { type: 'Identifier', name: Match.is('when', 'not') },
    },
    Fn.constTrue,
  ),
  Match.orElse(Fn.constFalse),
);

/**
 * Recognize static `_tag` access, including bracket notation.
 *
 * @param node - Candidate syntax node.
 */
export const isTagMember = Match.type<ESTree.Node>().pipe(
  Match.when(
    { type: 'MemberExpression', computed: false, property: { type: 'Identifier', name: '_tag' } },
    Fn.constTrue,
  ),
  Match.when({ type: 'MemberExpression', computed: true, property: { type: 'Literal', value: '_tag' } }, Fn.constTrue),
  Match.orElse(Fn.constFalse),
) as (node: ESTree.Node) => node is ESTree.MemberExpression;

/**
 * Return the tag member in a literal equality or inequality comparison.
 *
 * @param node - Comparison to inspect.
 */
export function tagMemberFromComparison(node: ESTree.BinaryExpression): ESTree.MemberExpression | undefined {
  if (!isEqualityOperator(node.operator)) {
    return undefined;
  }

  if (isTagMember(node.left) && isStringLiteral(node.right)) {
    return node.left;
  }

  if (isTagMember(node.right) && isStringLiteral(node.left)) {
    return node.right;
  }

  return undefined;
}

/**
 * Match the nearest callback only; nested functions are not catch handlers.
 *
 * @param node - Node whose enclosing callback is inspected.
 */
export function isInsideBroadEffectHandler(node: ESTree.Node): boolean {
  const callback = enclosingFunction(node);

  const call = callback === undefined ? undefined : callbackCall(callback);

  return call !== undefined && isBroadEffectCatchCallee(call.callee);
}

/**
 * Distinguish nested error `reason._tag` from the outer error tag.
 *
 * @param node - Tag member to inspect.
 */
export function isReasonTagMember(node: ESTree.MemberExpression): boolean {
  return node.object.type === 'MemberExpression' && staticPropertyName(node.object) === 'reason';
}

/**
 * Literal objects passed directly to Match.when/not are patterns, not construction.
 *
 * @param node - Object whose direct call argument position is inspected.
 */
export function isMatchPatternObject(node: ESTree.ObjectExpression): boolean {
  const call = node.parent;

  return call.type === 'CallExpression' && call.arguments.includes(node) && isMatchPatternCallee(call.callee);
}
