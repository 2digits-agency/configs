import {
  Diagnostic,
  Rule,
  RuleContext,
  Visitor,
  type CreateRule,
  type ESTree,
  type OxlintSourceCode,
} from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Str from 'effect/String';
import * as Tuple from 'effect/Tuple';

import { isFunctionNode, staticPropertyName, unwrapExpression } from '../../internal/ast';
import { argumentText, replaceWithNamespace } from '../../internal/fixes';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

type ObjectMember = ESTree.ObjectExpression['properties'][number];

function isSpread(node: ObjectMember): node is ESTree.SpreadElement {
  return node.type === 'SpreadElement';
}

// Conditional spreads, inline literals and Schema `.fields` composition are object building, not a merge or copy.
function isMergeableSpread(node: ObjectMember): boolean {
  if (!isSpread(node)) {
    return false;
  }

  const argument = unwrapExpression(node.argument);

  return (
    argument.type !== 'ConditionalExpression' &&
    argument.type !== 'LogicalExpression' &&
    argument.type !== 'ObjectExpression' &&
    (argument.type !== 'MemberExpression' || !Opt.contains(staticPropertyName(argument), 'fields'))
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

  return Match.value(unwrapExpression(node)).pipe(
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
 * `merge` for `{ ...a, ...b }`, `copy` for `{ ...a, x: y }`, none for anything else.
 *
 * @param node Object literal.
 */
function spreadKind(node: ESTree.ObjectExpression): Opt.Option<'merge' | 'copy'> {
  const [first, ...rest] = node.properties;

  if (P.isUndefined(first) || !isMergeableSpread(first) || Arr.isReadonlyArrayEmpty(rest)) {
    return Opt.none();
  }

  if (Arr.every(rest, isMergeableSpread)) {
    return Opt.some('merge');
  }

  return Arr.every(rest, isAssignableOverride) ? Opt.some('copy') : Opt.none();
}

/**
 * The `Struct.assign` arguments for `{ ...a, ...b }` or `{ ...a, x: y }`, or none for merges of more than two objects.
 *
 * @param node Object literal that `spreadKind` accepts.
 * @param sourceCode Source of the file.
 */
function assignArguments(node: ESTree.ObjectExpression, sourceCode: OxlintSourceCode): Opt.Option<string> {
  const [first, ...rest] = node.properties;

  if (!first || !isSpread(first) || !Arr.isReadonlyArrayNonEmpty(rest)) {
    return Opt.none();
  }

  const self = argumentText(sourceCode, first.argument);

  const second = Arr.headNonEmpty(rest);

  if (!Arr.every(rest, isSpread)) {
    const overrides = Str.slice(Tuple.get(second.range, 0), Tuple.get(Arr.lastNonEmpty(rest).range, 1))(sourceCode.text);

    return Opt.some(`${self}, { ${overrides} }`);
  }

  return rest.length === 1 && isSpread(second)
    ? Opt.some(`${self}, ${argumentText(sourceCode, second.argument)}`)
    : Opt.none();
}

/**
 * Prefer Struct.assign over spreading objects into a merged or updated copy.
 */
export const preferStructAssign: CreateRule = Rule.define({
  name: 'prefer-struct-assign',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer Struct.assign over object spread merges and copies in Effect files.',
    messages: {
      merge: 'Use Struct.assign(a, b) instead of merging objects with spreads.',
      copy: 'Use Struct.assign(value, { … }) instead of copying an object with spread overrides. Spreading a class instance drops its prototype; rebuild Schema and Data class instances with their constructor.',
      assign: 'Replace with Struct.assign.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/Struct#assign',
    hasSuggestions: true,
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    /*
     * Only a suggestion: the result is the same object, but Struct.assign types it from its generic parameters, so an
     * override can lose its contextual type and a spread of a possibly undefined value stops type-checking.
     */
    const report = Effect.fnUntraced(function* (node: ESTree.ObjectExpression, messageId: 'merge' | 'copy') {
      const diagnostic = Diagnostic.fromId({ node, messageId });

      const assigned = Opt.filter(assignArguments(node, ctx.sourceCode), () =>
        Arr.isReadonlyArrayEmpty(ctx.sourceCode.getCommentsInside(node)),
      );

      if (Opt.isNone(assigned)) {
        return yield* ctx.report(diagnostic);
      }

      const fix = yield* replaceWithNamespace(
        node,
        'effect/Struct',
        'Struct',
        (namespace) => `${namespace}.assign(${assigned.value})`,
      );

      return yield* ctx.report(Diagnostic.withSuggestions(diagnostic, [{ messageId: 'assign', fix }]));
    });

    return Visitor.on('ObjectExpression', (node) =>
      Opt.match(spreadKind(node), {
        onNone: () => Effect.void,
        onSome: (messageId) => report(node, messageId),
      }),
    );
  },
});
