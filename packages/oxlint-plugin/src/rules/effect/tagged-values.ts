import type { ESTree } from '@oxlint/plugins';
import type * as Effect from 'effect/Effect';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';
import * as P from 'effect/Predicate';

import { callbackCall, enclosingFunction, isEqualityOperator, isStringLiteral, staticPropertyName } from '../../utils';

const isBroadEffectCatchCallee = Match.type<ESTree.Expression>().pipe(
  Match.when(
    {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'Effect' },
      property: {
        type: 'Identifier',
        // `catchAll` is the Effect v3 name, which the current Effect types no longer export.
        name: Match.is('catch' satisfies keyof typeof Effect, 'catchAll', 'catchIf' satisfies keyof typeof Effect),
      },
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
      property: {
        type: 'Identifier',
        name: Match.is(...(['when', 'not'] as const satisfies ReadonlyArray<keyof typeof Match>)),
      },
    },
    Fn.constTrue,
  ),
  Match.orElse(Fn.constFalse),
);

const tagDiscriminant: ReadonlySet<string> = new Set(['_tag']);

/**
 * Recognize static access to a discriminant such as `_tag`, including bracket notation.
 *
 * @param node - Candidate syntax node.
 * @param discriminants - Accepted property names.
 */
export function isDiscriminantMember(
  node: ESTree.Node,
  discriminants: ReadonlySet<string> = tagDiscriminant,
): node is ESTree.MemberExpression {
  if (node.type !== 'MemberExpression') {
    return false;
  }

  const name = staticPropertyName(node);

  return name !== undefined && discriminants.has(name);
}

/**
 * Return the discriminant member in a literal equality or inequality comparison.
 *
 * @param node - Comparison to inspect.
 * @param discriminants - Accepted property names.
 */
export function discriminantFromComparison(
  node: ESTree.BinaryExpression,
  discriminants: ReadonlySet<string> = tagDiscriminant,
): ESTree.MemberExpression | undefined {
  if (!isEqualityOperator(node.operator)) {
    return undefined;
  }

  if (isDiscriminantMember(node.left, discriminants) && isStringLiteral(node.right)) {
    return node.left;
  }

  if (isDiscriminantMember(node.right, discriminants) && isStringLiteral(node.left)) {
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

  const call = P.isUndefined(callback) ? undefined : callbackCall(callback);

  return P.isNotUndefined(call) && isBroadEffectCatchCallee(call.callee);
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
