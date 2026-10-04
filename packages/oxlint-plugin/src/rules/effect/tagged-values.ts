import type { ESTree } from '@oxlint/plugins';

import { staticPropertyName } from '../../utils';

const equalityOperators = new Set(['==', '===', '!=', '!==']);
const broadEffectCatchMethods = new Set(['catch', 'catchAll', 'catchIf']);

/**
 * Recognize string literals, not dynamic tags or templates.
 *
 * @param node - Candidate syntax node.
 */
export function isStringLiteral(node: ESTree.Node): node is ESTree.StringLiteral {
  return node.type === 'Literal' && typeof node.value === 'string';
}

/**
 * Recognize static `_tag` access, including bracket notation.
 *
 * @param node - Candidate syntax node.
 */
export function isTagMember(node: ESTree.Node): node is ESTree.MemberExpression {
  return node.type === 'MemberExpression' && staticPropertyName(node) === '_tag';
}

/**
 * Return the tag member in a literal equality or inequality comparison.
 *
 * @param node - Comparison to inspect.
 */
export function tagMemberFromComparison(node: ESTree.BinaryExpression): ESTree.MemberExpression | undefined {
  if (!equalityOperators.has(node.operator)) {
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
  let current = node.parent;

  while (current) {
    if (current.type === 'ArrowFunctionExpression' || current.type === 'FunctionExpression') {
      const call = current.parent;

      return (
        call.type === 'CallExpression' &&
        call.arguments.includes(current) &&
        call.callee.type === 'MemberExpression' &&
        call.callee.object.type === 'Identifier' &&
        call.callee.object.name === 'Effect' &&
        !call.callee.computed &&
        call.callee.property.type === 'Identifier' &&
        broadEffectCatchMethods.has(call.callee.property.name)
      );
    }
    current = current.parent;
  }

  return false;
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

  return (
    call.type === 'CallExpression' &&
    call.arguments.includes(node) &&
    call.callee.type === 'MemberExpression' &&
    call.callee.object.type === 'Identifier' &&
    call.callee.object.name === 'Match' &&
    !call.callee.computed &&
    call.callee.property.type === 'Identifier' &&
    (call.callee.property.name === 'when' || call.callee.property.name === 'not')
  );
}
