import { Diagnostic, Rule, RuleContext, Visitor, type ESTree, type OxlintSourceCode } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { isEqualityOperator } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

type Branch = ESTree.ConditionalExpression | ESTree.IfStatement;

function isStaticLiteral(node: ESTree.Node): boolean {
  return node.type === 'Literal' || (node.type === 'TemplateLiteral' && Arr.isReadonlyArrayEmpty(node.expressions));
}

/**
 * The source text of the expression a test compares against a literal, such as `kind` for `kind === 'a'`.
 *
 * @param test Branch test.
 * @param sourceCode Source of the file.
 */
function comparedValue(test: ESTree.Expression, sourceCode: OxlintSourceCode): Opt.Option<string> {
  if (test.type !== 'BinaryExpression' || !isEqualityOperator(test.operator)) {
    return Opt.none();
  }

  if (isStaticLiteral(test.left)) {
    return Opt.some(sourceCode.getText(test.right));
  }

  return isStaticLiteral(test.right) ? Opt.some(sourceCode.getText(test.left)) : Opt.none();
}

function isBranch(node: ESTree.Node | null): node is Branch {
  return node?.type === 'ConditionalExpression' || node?.type === 'IfStatement';
}

/**
 * How many tests of a ternary or `else if` chain compare `value` against a literal, or none when one does not.
 *
 * @param node Branch.
 * @param value Compared expression text.
 * @param sourceCode Source of the file.
 */
function comparisonCount(node: Branch, value: string, sourceCode: OxlintSourceCode): Opt.Option<number> {
  if (!Opt.contains(comparedValue(node.test, sourceCode), value)) {
    return Opt.none();
  }

  return isBranch(node.alternate)
    ? Opt.map(comparisonCount(node.alternate, value, sourceCode), (count) => count + 1)
    : Opt.some(1);
}

/**
 * Whether every test in a ternary or `else if` chain compares the same expression against a literal, at least twice.
 *
 * @param node Head of the chain.
 * @param sourceCode Source of the file.
 */
function isLiteralComparisonChain(node: Branch, sourceCode: OxlintSourceCode): boolean {
  return comparedValue(node.test, sourceCode).pipe(
    Opt.flatMap((value) => comparisonCount(node, value, sourceCode)),
    Opt.exists((count) => count > 1),
  );
}

/**
 * Prefer Match for switches and `else if` chains in Effect files, and for repeated literal ternary comparisons.
 */
export const preferEffectMatch = Rule.define({
  name: 'prefer-effect-match',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer Effect Match for composable and exhaustive branching in Effect projects.',
    messages: {
      effectMatch: 'Use Match.type, Match.value, or Match.tags with Match.exhaustive instead of switch.',
      preferMatch: 'Use Match from Effect instead of a chained literal ternary.',
      ifChain:
        'Use Match.type, Match.value, or Match.discriminators with Match.exhaustive instead of an `else if` chain comparing the same value against literals.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/Match',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    const ternaries = Visitor.on('ConditionalExpression', (node) =>
      node.parent.type !== 'ConditionalExpression' && isLiteralComparisonChain(node, ctx.sourceCode)
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'preferMatch' }))
        : Effect.void,
    );

    if (!imports.hasEffectImport) {
      return ternaries;
    }

    return Visitor.merge(
      ternaries,
      Visitor.on('SwitchStatement', (node) => ctx.report(Diagnostic.fromId({ node, messageId: 'effectMatch' }))),
      Visitor.on('IfStatement', (node) =>
        (node.parent.type !== 'IfStatement' || node.parent.alternate !== node) &&
        isLiteralComparisonChain(node, ctx.sourceCode)
          ? ctx.report(Diagnostic.fromId({ node, messageId: 'ifChain' }))
          : Effect.void,
      ),
    );
  },
});
