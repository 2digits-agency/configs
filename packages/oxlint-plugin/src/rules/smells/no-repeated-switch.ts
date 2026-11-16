import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as R from 'effect/Record';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { isEqualityOperator, isWrapperExpressionType, unwrapExpression } from '../../internal/ast';
import { isTestFilename } from '../../internal/files';
import { ruleMeta } from '../../internal/meta';

/**
 * Places that branch on one value must share this many cases to count as the same switch: the same text, such as
 * `part.type`, can name unrelated unions in different functions.
 */
const minSharedCases = 2;

const maxExpressionLength = 60;

const isPascalCase = Schema.is(Schema.String.check(Schema.isPattern(/^\p{Lu}/u)));

interface Comparison {
  /**
   * Source text of the compared value, with whitespace collapsed.
   */
  readonly value: string;
  readonly cases: ReadonlyArray<string>;
}

interface Occurrence extends Comparison {
  readonly node: ESTree.Node;
}

/**
 * An `if` that compares one value against cases: the head of an `else if` chain, or a guard without `else`.
 */
interface IfComparison {
  readonly node: ESTree.IfStatement;
  readonly comparison: Comparison;
  readonly isChain: boolean;
}

/**
 * Whether an expression is a case label: a literal, a template without substitutions, or an enum-like member such as
 * `Kind.Ready`.
 *
 * @param node Expression.
 */
function isCaseValue(node: ESTree.Expression): boolean {
  const value = unwrapExpression(node);

  return (
    value.type === 'Literal' ||
    (value.type === 'TemplateLiteral' && Arr.isReadonlyArrayEmpty(value.expressions)) ||
    (value.type === 'MemberExpression' &&
      !value.computed &&
      value.object.type === 'Identifier' &&
      isPascalCase(value.object.name))
  );
}

/**
 * Report a value that one file branches on over the same cases in several places: switches, `else if` chains, ternary
 * chains and runs of guard `if`s.
 */
export const noRepeatedSwitch = Rule.define({
  name: 'no-repeated-switch',
  meta: ruleMeta({
    type: 'suggestion',
    description:
      'Disallow switching on the same value over the same cases in several places of one file, with `switch`, `if`/`else` or ternary chains.',
    messages: {
      repeated:
        'This file branches on `{{expression}}` over the same cases in {{count}} places, so a new case means editing each one. Handle the cases in one place: a lookup table, one exhaustive `Match` (`Match.type` or `Match.tags` with `Match.exhaustive`), a `Data.TaggedEnum` with `$match`, or behavior on each variant.',
    },
    url: 'https://github.com/K-Mistele/anti-slop/blob/main/src/martinfowler/rules/repeated-switches.ts',
  }),
  *create() {
    const ctx = yield* RuleContext;

    if (isTestFilename(ctx.filename)) {
      return {};
    }

    const occurrences: Array<Occurrence> = [];

    function text(node: ESTree.Node) {
      return Str.replaceAll(/\s+/gu, ' ')(ctx.sourceCode.getText(node));
    }

    /**
     * The value and cases a test compares, such as `kind` and `'a'`, `'b'` for `kind === 'a' || kind === 'b'`.
     *
     * @param node Test.
     */
    function compare(node: ESTree.Expression): Opt.Option<Comparison> {
      const test = unwrapExpression(node);

      if (test.type === 'LogicalExpression' && test.operator === '||') {
        return Opt.flatMap(Opt.all([compare(test.left), compare(test.right)]), ([left, right]) =>
          left.value === right.value
            ? Opt.some({ value: left.value, cases: Arr.appendAll(left.cases, right.cases) })
            : Opt.none(),
        );
      }

      if (
        test.type !== 'BinaryExpression' ||
        !isEqualityOperator(test.operator) ||
        test.left.type === 'PrivateIdentifier'
      ) {
        return Opt.none();
      }

      if (isCaseValue(test.right) !== isCaseValue(test.left)) {
        const [value, label] = isCaseValue(test.right) ? [test.left, test.right] : [test.right, test.left];

        return Opt.some({ value: text(value), cases: [text(label)] });
      }

      return Opt.none();
    }

    /**
     * The comparisons of an `else if` or ternary chain over the value its first test compares, stopping at the first
     * test that compares something else.
     *
     * @param head First branch.
     * @param next The next branch of a chain.
     */
    function chain<TNode extends ESTree.ConditionalExpression | ESTree.IfStatement>(
      head: TNode,
      next: (node: TNode) => Opt.Option<TNode>,
    ): Opt.Option<{ readonly comparison: Comparison; readonly length: number }> {
      return Opt.map(compare(head.test), (first) => {
        const rest = Arr.unfold(next(head), (node) =>
          Opt.flatMap(node, (current) =>
            Opt.map(
              Opt.filter(compare(current.test), ({ value }) => value === first.value),
              (comparison) => [comparison, next(current)] as const,
            ),
          ),
        );

        return {
          comparison: { value: first.value, cases: Arr.flatMap([first, ...rest], ({ cases }) => cases) },
          length: rest.length + 1,
        };
      });
    }

    function nextIf(node: ESTree.IfStatement): Opt.Option<ESTree.IfStatement> {
      return node.alternate?.type === 'IfStatement' ? Opt.some(node.alternate) : Opt.none();
    }

    function nextTernary(node: ESTree.ConditionalExpression): Opt.Option<ESTree.ConditionalExpression> {
      const alternate = unwrapExpression(node.alternate);

      return alternate.type === 'ConditionalExpression' ? Opt.some(alternate) : Opt.none();
    }

    function record(node: ESTree.Node, { value, cases }: Comparison) {
      occurrences.push({ node, value, cases });
    }

    function ifComparison(statement: ESTree.Node): Opt.Option<IfComparison> {
      if (statement.type !== 'IfStatement') {
        return Opt.none();
      }

      return Opt.flatMap(chain(statement, nextIf), ({ comparison, length }) => {
        if (length > 1) {
          return Opt.some({ node: statement, comparison, isChain: true });
        }

        return statement.alternate ? Opt.none() : Opt.some({ node: statement, comparison, isChain: false });
      });
    }

    function isGuardOn(entry: Opt.Option<IfComparison>, value: string) {
      return Opt.exists(entry, ({ isChain, comparison }) => !isChain && comparison.value === value);
    }

    /**
     * Record each `else if` chain over one value, and each run of adjacent guard `if`s over one value.
     *
     * @param statements Statements of a block.
     */
    function recordIfRuns(statements: ReadonlyArray<ESTree.Node>) {
      if (!Arr.isReadonlyArrayNonEmpty(statements)) {
        return Effect.void;
      }

      const groups = Arr.groupWith(Arr.map(statements, ifComparison), (left, right) =>
        Opt.exists(left, ({ isChain, comparison }) => !isChain && isGuardOn(right, comparison.value)),
      );

      for (const group of groups) {
        const entries = Arr.getSomes(group);

        Opt.map(Arr.head(entries), ({ node, comparison, isChain }) => {
          if (isChain) {
            record(node, comparison);
          } else if (entries.length > 1) {
            record(node, { value: comparison.value, cases: Arr.flatMap(entries, (entry) => entry.comparison.cases) });
          }
        });
      }

      return Effect.void;
    }

    function report() {
      const repeated = Arr.flatMap(R.values(Arr.groupBy(occurrences, ({ value }) => value)), (entries) => {
        const shared = Arr.filter(entries, (entry) =>
          Arr.some(
            entries,
            (other) => other !== entry && Arr.intersection(entry.cases, other.cases).length >= minSharedCases,
          ),
        );

        return shared.length > 1 ? Arr.map(shared, (entry) => ({ entry, count: shared.length })) : [];
      });

      // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
      return Effect.forEach(
        repeated,
        ({ entry, count }) =>
          ctx.report(
            Diagnostic.fromId({
              node: entry.node,
              messageId: 'repeated',
              data: {
                expression:
                  entry.value.length <= maxExpressionLength
                    ? entry.value
                    : `${Str.slice(0, maxExpressionLength - 1)(entry.value)}…`,
                count: String(count),
              },
            }),
          ),
        { concurrency: 1, discard: true },
      );
    }

    return Visitor.merge(
      Visitor.on('SwitchStatement', (node) => {
        const discriminant = unwrapExpression(node.discriminant);

        if (discriminant.type !== 'Literal') {
          record(node, {
            value: text(discriminant),
            cases: Arr.flatMap(node.cases, ({ test }) => (test ? [text(test)] : [])),
          });
        }

        return Effect.void;
      }),
      Visitor.on('ConditionalExpression', (node) => {
        const ternary = chain(node, nextTernary);

        // A ternary in another ternary belongs to the outer chain.
        if (outerParent(node)?.type !== 'ConditionalExpression' && Opt.isSome(ternary) && ternary.value.length > 1) {
          record(node, ternary.value.comparison);
        }

        return Effect.void;
      }),
      Visitor.on('Program', (node) => recordIfRuns(node.body)),
      Visitor.on('BlockStatement', (node) => recordIfRuns(node.body)),
      Visitor.on('SwitchCase', (node) => recordIfRuns(node.consequent)),
      Visitor.onExit('Program', report),
    );
  },
});

/**
 * The parent of a node above any parentheses and type assertions.
 *
 * @param node Expression.
 */
function outerParent(node: ESTree.Node): ESTree.Node | null {
  const parent = node.parent as ESTree.Node | null;

  return parent && isWrapperExpressionType(parent.type) ? outerParent(parent) : parent;
}
