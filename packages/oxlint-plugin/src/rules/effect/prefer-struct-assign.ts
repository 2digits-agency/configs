import type { ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';
import * as P from 'effect/Predicate';

import { defineEffectRule, isFunctionNode, ruleMeta, staticPropertyName, unwrapExpression } from '../../utils';

type ObjectMember = ESTree.ObjectExpression['properties'][number];

function isSpread(node: ObjectMember): node is ESTree.SpreadElement {
  return node.type === 'SpreadElement';
}

// Conditional spreads, inline literals and Schema `.fields` composition are object building, not a merge or copy.
function isMergeableSpread(node: ESTree.SpreadElement): boolean {
  const argument = unwrapExpression(node.argument);

  return (
    argument.type !== 'ConditionalExpression' &&
    argument.type !== 'LogicalExpression' &&
    argument.type !== 'ObjectExpression' &&
    (argument.type !== 'MemberExpression' || staticPropertyName(argument) !== 'fields')
  );
}

function hasUntypedParameter(node: ESTree.Node): boolean {
  return (
    isFunctionNode(node) &&
    Arr.some(
      node.params,
      (parameter) =>
        parameter.type !== 'AssignmentPattern' && parameter.type !== 'TSParameterProperty' && !parameter.typeAnnotation,
    )
  );
}

// Struct.assign's `that` parameter is a plain generic, so literal values widen (`'code'` becomes `string`).
function hasLiteralValue(node: ESTree.Expression | ESTree.SpreadElement | null): boolean {
  if (P.isNull(node) || node.type === 'SpreadElement') {
    return false;
  }

  const value = unwrapExpression(node);

  return Match.value(value).pipe(
    Match.when(
      { type: 'Literal' },
      ({ value: literal }) => P.isString(literal) || P.isNumber(literal) || P.isBoolean(literal),
    ),
    Match.when({ type: 'TemplateLiteral' }, ({ expressions }) => Arr.isReadonlyArrayEmpty(expressions)),
    Match.when({ type: 'UnaryExpression', operator: '-' }, ({ argument }) => hasLiteralValue(argument)),
    Match.when({ type: 'ArrayExpression' }, ({ elements }) => Arr.some(elements, hasLiteralValue)),
    Match.when({ type: 'ObjectExpression' }, ({ properties }) =>
      Arr.some(properties, (property) => property.type === 'Property' && hasLiteralValue(property.value)),
    ),
    Match.orElse(Fn.constFalse),
  );
}

// In `{ ...server, addTool: Effect.fn(function* (registration) {}) }`, the object's contextual type types `registration`.
// Struct.assign's generic `that` parameter does not pass that type on.
function needsContextualType(value: ESTree.Expression): boolean {
  return (
    hasUntypedParameter(value) ||
    (value.type === 'CallExpression' && Arr.some(value.arguments, (argument) => hasUntypedParameter(argument)))
  );
}

// An override Struct.assign can take over without changing its type.
const isAssignableOverride = Match.type<ObjectMember>().pipe(
  Match.when({ type: 'Property', kind: 'init', method: false }, (property) => {
    const value = unwrapExpression(property.value);

    return !needsContextualType(value) && !hasLiteralValue(value);
  }),
  Match.orElse(Fn.constFalse),
);

/**
 * Prefer Struct.assign over spreading objects into a merged or updated copy.
 */
export const preferStructAssign: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer Struct.assign over object spread merges and copies in Effect files.',
    {
      merge: 'Use Struct.assign(a, b) instead of merging objects with spreads.',
      copy: 'Use Struct.assign(value, { … }) instead of copying an object with spread overrides. Spreading a class instance drops its prototype; rebuild Schema and Data class instances with their constructor.',
    },
    'https://www.effect.website/docs/v4/api/effect/Struct#assign',
  ),
  (context, getState) => ({
    ObjectExpression(node) {
      if (!getState().hasEffectImport) {
        return;
      }

      const [first, ...rest] = node.properties;

      if (P.isUndefined(first) || !isSpread(first) || !isMergeableSpread(first)) {
        return;
      }

      if (
        Arr.isReadonlyArrayNonEmpty(rest) &&
        Arr.every(rest, (property) => isSpread(property) && isMergeableSpread(property))
      ) {
        context.report({ node, messageId: 'merge' });

        return;
      }

      if (Arr.isReadonlyArrayNonEmpty(rest) && Arr.every(rest, isAssignableOverride)) {
        context.report({ node, messageId: 'copy' });
      }
    },
  }),
);
