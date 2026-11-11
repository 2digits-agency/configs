import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';

import { staticPropertyName, unwrapExpression } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

const StatusName = Schema.Literals(['status', 'statusCode']);

const isStatusName = Schema.is(StatusName);

type Bound = 'lower' | 'upper';

/**
 * One side of a 2xx range check: the status read it tests and which bound it is, as the check reads when the status is
 * in range. `status >= 200` and `status < 200` are both the lower bound; `status < 300`, `status <= 299` and `status >=
 * 300` are the upper bound.
 */
interface RangeSide {
  readonly bound: Bound;
  readonly inRange: boolean;
  readonly status: string;
}

const flipped: Readonly<Record<string, string>> = { '<': '>', '<=': '>=', '>': '<', '>=': '<=' };

// A private `#field in object` check parses as a BinaryExpression whose left side is a PrivateIdentifier.
type Operand = ESTree.Expression | ESTree.PrivateIdentifier;

function unwrapOperand(node: Operand): ESTree.Node {
  return node.type === 'PrivateIdentifier' ? node : unwrapExpression(node);
}

/**
 * Whether an expression reads the status of a response: `response.status` or `error.response.statusCode`. A bare
 * `status` is usually a fixture or protocol field rather than a response.
 *
 * @param node Expression.
 */
function isStatusRead(node: Operand): boolean {
  const target = unwrapOperand(node);

  return target.type === 'MemberExpression' && Opt.exists(staticPropertyName(target), isStatusName);
}

function numericValue(node: Operand): Opt.Option<number> {
  const target = unwrapOperand(node);

  return target.type === 'Literal' && P.isNumber(target.value) ? Opt.some(target.value) : Opt.none();
}

/**
 * Normalize `200 <= status` to `status >= 200` and classify the comparison as a 2xx bound.
 *
 * @param node Comparison.
 * @param text Source text of the status read.
 */
function rangeSide(node: Operand, text: (node: ESTree.Node) => string): Opt.Option<RangeSide> {
  const comparison = unwrapOperand(node);

  if (comparison.type !== 'BinaryExpression' || !(comparison.operator in flipped)) {
    return Opt.none();
  }

  const statusOnLeft = isStatusRead(comparison.left);

  const [status, limit, operator] = statusOnLeft
    ? [comparison.left, comparison.right, comparison.operator]
    : [comparison.right, comparison.left, flipped[comparison.operator] ?? comparison.operator];

  if (!isStatusRead(status)) {
    return Opt.none();
  }

  return Opt.flatMap(numericValue(limit), (value): Opt.Option<RangeSide> => {
    const read = text(status);

    if ((value === 200 && operator === '>=') || (value === 199 && operator === '>')) {
      return Opt.some({ bound: 'lower', inRange: true, status: read });
    }

    if ((value === 200 && operator === '<') || (value === 199 && operator === '<=')) {
      return Opt.some({ bound: 'lower', inRange: false, status: read });
    }

    if ((value === 300 && operator === '<') || (value === 299 && operator === '<=')) {
      return Opt.some({ bound: 'upper', inRange: true, status: read });
    }

    if ((value === 300 && operator === '>=') || (value === 299 && operator === '>')) {
      return Opt.some({ bound: 'upper', inRange: false, status: read });
    }

    return Opt.none();
  });
}

export const preferEffectMatchStatus = Rule.define({
  name: 'prefer-effect-match-status',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer HttpClientResponse.filterStatusOk or matchStatus over hand-written 2xx status range checks.',
    messages: {
      matchStatus:
        "Use HttpClientResponse.filterStatusOk, or HttpClientResponse.matchStatus with a '2xx' case, instead of checking the 2xx range by hand. On a native fetch Response, read response.ok.",
    },
    url: 'https://www.effect.website/docs/v4/api/effect/http/HttpClientResponse',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    function text(node: ESTree.Node) {
      return ctx.sourceCode.getText(node);
    }

    return Visitor.on('LogicalExpression', (node) => {
      // `status >= 200 && status < 300` tests the range; `status < 200 || status >= 300` tests its complement.
      const inRange = node.operator === '&&';

      const isRangeCheck =
        node.operator !== '??' &&
        Opt.exists(
          Opt.all([rangeSide(node.left, text), rangeSide(node.right, text)]),
          ([left, right]) =>
            left.status === right.status &&
            left.bound !== right.bound &&
            left.inRange === inRange &&
            right.inRange === inRange,
        );

      return isRangeCheck ? ctx.report(Diagnostic.fromId({ node, messageId: 'matchStatus' })) : Effect.void;
    });
  },
});
