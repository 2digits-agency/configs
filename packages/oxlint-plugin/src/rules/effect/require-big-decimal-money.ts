import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Str from 'effect/String';

import { propertyName } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { numberSchemaName } from './internal/number-schema';

/**
 * Words that name an amount of money in a field name, such as `price` in `unitPrice` or `fee` in `service_fee`.
 * `amount` and `total` are left out: they as often count things, as in `{ items, total }`, `totalFollowers` or a ticket
 * `amount`, so `totalAmount` is not reported and `totalPrice` is.
 */
const moneyWords: ReadonlySet<string> = new Set([
  'balance',
  'budget',
  'cash',
  'cents',
  'cost',
  'costs',
  'debit',
  'deposit',
  'discount',
  'earnings',
  'expense',
  'expenses',
  'fee',
  'fees',
  'income',
  'money',
  'payment',
  'payout',
  'price',
  'prices',
  'refund',
  'revenue',
  'salary',
  'subtotal',
  'tax',
  'vat',
  'wage',
  'wages',
  'withdrawal',
]);

/**
 * Last words that make a money-related name something else: `paymentId`, `taxRate`, `discountPercent`, `totalCount` and
 * `refundedAt` are not amounts.
 */
const nonAmountWords: ReadonlySet<string> = new Set([
  'at',
  'attempts',
  'code',
  'codes',
  'count',
  'date',
  'days',
  'decimals',
  'digits',
  'hours',
  'id',
  'ids',
  'index',
  'items',
  'length',
  'millis',
  'minutes',
  'ms',
  'number',
  'pages',
  'pct',
  'percent',
  'percentage',
  'precision',
  'qty',
  'quantity',
  'rate',
  'ratio',
  'results',
  'retries',
  'rows',
  'scale',
  'seconds',
  'size',
  'version',
]);

/**
 * The lowercase words of a camelCase, PascalCase, snake_case or kebab-case name.
 *
 * @param name Field name.
 */
function nameWords(name: string): ReadonlyArray<string> {
  const spaced = Str.replaceAll(/([a-z\d])([A-Z])/gu, '$1 $2')(name);

  return Arr.filter(Str.split(Str.toLowerCase(spaced), /[\s_-]+/u), Str.isNonEmpty);
}

function isMoneyName(name: string): boolean {
  const words = nameWords(name);

  return Opt.exists(
    Arr.last(words),
    (last) => !nonAmountWords.has(last) && Arr.some(words, (word) => moneyWords.has(word)),
  );
}

export const requireBigDecimalMoney = Rule.define({
  name: 'require-big-decimal-money',
  meta: ruleMeta({
    type: 'problem',
    description: 'Require Schema.BigDecimal for money fields in Effect schemas instead of plain number schemas.',
    messages: {
      moneyNumber:
        '{{name}} holds money but decodes to a floating-point number with Schema.{{schema}}, which cannot represent most decimal amounts exactly. Use {{replacement}} and calculate with BigDecimal from effect.',
    },
    url: 'https://effect.website/docs/v4/api/effect/BigDecimal',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    return Visitor.on('Property', (node) => {
      if (node.parent.type !== 'ObjectExpression') {
        return Effect.void;
      }

      const property = node as ESTree.ObjectProperty;

      return Opt.all([Opt.filter(propertyName(property), isMoneyName), numberSchemaName(property.value, imports)]).pipe(
        Opt.match({
          onNone: () => Effect.void,
          onSome: ([name, schema]) =>
            ctx.report(
              Diagnostic.fromId({
                node: property.value,
                messageId: 'moneyNumber',
                data: {
                  name,
                  schema,
                  // `Schema.BigDecimal` encodes to a JSON string; a string input needs the decoding variant.
                  replacement: Str.endsWith('FromString')(schema)
                    ? 'Schema.BigDecimalFromString'
                    : 'Schema.BigDecimal (its JSON codec encodes a string)',
                },
              }),
            ),
        }),
      );
    });
  },
});
