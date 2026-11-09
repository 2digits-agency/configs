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
import * as Opt from 'effect/Option';

import { enclosingFunction, staticPropertyName, unwrapExpression } from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { callbackApi } from './internal/callbacks';

const comparisonOperators: Readonly<Record<ESTree.LogicalExpression['operator'], ReadonlyArray<string>>> = {
  '&&': ['===', '=='],
  '||': ['!==', '!='],
  '??': [],
};

function chainOperands(node: ESTree.Expression, operator: string): ReadonlyArray<ESTree.Expression> {
  const expression = unwrapExpression(node);

  return expression.type === 'LogicalExpression' && expression.operator === operator
    ? [...chainOperands(expression.left, operator), ...chainOperands(expression.right, operator)]
    : [expression];
}

/**
 * The objects `a.x === b.x` compares, ordered so `b.y === a.y` names the same pair.
 *
 * @param node Chain operand.
 * @param operators Accepted comparison operators.
 * @param sourceCode Source of the file.
 */
function comparedPair(
  node: ESTree.Expression,
  operators: ReadonlyArray<string>,
  sourceCode: OxlintSourceCode,
): Opt.Option<string> {
  if (
    node.type !== 'BinaryExpression' ||
    !Arr.contains(operators, node.operator) ||
    node.left.type === 'PrivateIdentifier'
  ) {
    return Opt.none();
  }

  const left = unwrapExpression(node.left);

  const right = unwrapExpression(node.right);

  if (left.type !== 'MemberExpression' || right.type !== 'MemberExpression') {
    return Opt.none();
  }

  const leftObject = sourceCode.getText(left.object);

  const rightObject = sourceCode.getText(right.object);

  return Opt.flatMap(staticPropertyName(left), (field) =>
    leftObject === rightObject || !Opt.contains(staticPropertyName(right), field)
      ? Opt.none()
      : Opt.some(leftObject < rightObject ? `${leftObject} and ${rightObject}` : `${rightObject} and ${leftObject}`),
  );
}

/**
 * The first object pair a chain compares field by field at least twice.
 *
 * @param node Outermost logical expression.
 * @param operators Accepted comparison operators.
 * @param sourceCode Source of the file.
 */
function repeatedPair(
  node: ESTree.LogicalExpression,
  operators: ReadonlyArray<string>,
  sourceCode: OxlintSourceCode,
): Opt.Option<string> {
  const pairs = Arr.getSomes(
    Arr.map(chainOperands(node, node.operator), (operand) => comparedPair(operand, operators, sourceCode)),
  );

  return Opt.map(
    Arr.findFirst(pairs, (pair, index) => Arr.contains(Arr.take(pairs, index), pair)),
    (pair) => pair,
  );
}

// `Equivalence.make((a, b) => a.x === b.x && a.y === b.y)` already is the Effect way to compare fields.
function isEquivalenceDefinition(node: ESTree.Node, imports: ImportBindings): boolean {
  return Opt.exists(
    Opt.flatMap(enclosingFunction(node), (callback) => callbackApi(callback, imports)),
    (api) => api.length === 2 && api[0] === 'Equivalence' && api[1] === 'make',
  );
}

/**
 * Prefer Equal or an Equivalence over comparing two values field by field.
 */
export const preferEqual: CreateRule = Rule.define({
  name: 'prefer-equal',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer Equal.equals or an Equivalence over field-by-field comparisons in Effect files.',
    messages: {
      preferEqual:
        'Compare {{pair}} with Equal.equals (Data and Schema classes implement Equal) or an Equivalence such as Equivalence.Struct instead of field by field.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/Equal',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    return Visitor.on('LogicalExpression', (node) => {
      const operators = comparisonOperators[node.operator];

      const parent = node.parent;

      if (
        Arr.isReadonlyArrayEmpty(operators) ||
        (parent.type === 'LogicalExpression' && parent.operator === node.operator)
      ) {
        return Effect.void;
      }

      return Opt.match(
        Opt.filter(repeatedPair(node, operators, ctx.sourceCode), () => !isEquivalenceDefinition(node, imports)),
        {
          onNone: () => Effect.void,
          onSome: (pair) => ctx.report(Diagnostic.fromId({ node, messageId: 'preferEqual', data: { pair } })),
        },
      );
    });
  },
});
