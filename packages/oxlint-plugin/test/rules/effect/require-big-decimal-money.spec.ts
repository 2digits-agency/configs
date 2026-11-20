import { RuleTester } from 'oxlint/plugins-dev';

import { requireBigDecimalMoney } from '../../../src/rules/effect/require-big-decimal-money';
import { testRule } from '../../rule-tester';

const ruleName = 'require-big-decimal-money';

const schema = `import * as Schema from 'effect/Schema';`;

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });

const bigDecimal = 'Schema.BigDecimal (its JSON codec encodes a string)';

function money(name: string, schemaName: string, replacement = bigDecimal) {
  return { messageId: 'moneyNumber', data: { name, schema: schemaName, replacement } };
}

testRule(ruleName, requireBigDecimalMoney, {
  valid: `
    import * as Schema from 'effect/Schema'
    const Order = Schema.Struct({ price: Schema.BigDecimal })
  `,
  invalid: `
    import * as Schema from 'effect/Schema'
    const Order = Schema.Struct({ price: Schema.Number })
  `,
  messageId: 'moneyNumber',
  data: { name: 'price', schema: 'Number', replacement: bigDecimal },
});

tester.run(ruleName, requireBigDecimalMoney, {
  valid: [
    // Only files that use Effect are checked.
    `const Order = { price: Schema.Number };`,
    `${schema} const Order = Schema.Struct({ price: Schema.BigDecimal, totalPrice: Schema.BigDecimalFromString });`,
    // Money words that name something other than an amount.
    `${schema} const Order = Schema.Struct({ paymentId: Schema.Int, taxRate: Schema.Number, discountPercent: Schema.Number, totalCount: Schema.Int, refundedAt: Schema.Number, price_version: Schema.Int });`,
    // Amount and total as often count things: results, followers, tickets or pushes sent.
    `${schema} const Page = Schema.Struct({ items: Schema.Array(Item), total: Schema.Int, totalFollowers: Schema.Int });`,
    `${schema} class Ticket extends Schema.Class<Ticket>('Ticket')({ amount: Schema.Finite, recurring_amount: Schema.Finite, totalAmount: Schema.Int }) {}`,
    // Not money, or not a number schema.
    `${schema} const Item = Schema.Struct({ quantity: Schema.Int, weight: Schema.Number, priceLabel: Schema.String });`,
    `${schema} const prices = { price: 10 };`,
  ],
  invalid: [
    {
      code: `${schema} class Invoice extends Schema.Class<Invoice>('Invoice')({ unitPrice: Schema.Finite, subtotal: Schema.Number, service_fee: Schema.Int }) {}`,
      errors: [money('unitPrice', 'Finite'), money('subtotal', 'Number'), money('service_fee', 'Int')],
    },
    {
      // Wrapped, refined and piped number schemas still decode to a float.
      code: `${schema} const Account = Schema.Struct({ balance: Schema.Number.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))), discount: Schema.optional(Schema.Number), amountCents: Schema.NullOr(Schema.Int).pipe(Schema.optionalKey) });`,
      errors: [money('balance', 'Number'), money('discount', 'Number'), money('amountCents', 'Int')],
    },
    {
      code: `${schema} const Query = Schema.Struct({ maxPrice: Schema.NumberFromString, 'min-cost': Schema.FiniteFromString });`,
      errors: [
        money('maxPrice', 'NumberFromString', 'Schema.BigDecimalFromString'),
        money('min-cost', 'FiniteFromString', 'Schema.BigDecimalFromString'),
      ],
    },
  ],
});
