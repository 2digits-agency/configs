import { requireDualTypeArguments } from '../../../src/rules/effect/require-dual-type-arguments';
import { testRule } from '../../rule-tester';

const valid = `
  import * as Fn from 'effect/Function'
  import { dual } from 'effect/Function'
  import * as BigDecimal from 'effect/BigDecimal'
  const add = Fn.dual<(that: number) => (self: number) => number, (self: number, that: number) => number>(
    2,
    (self, that) => self + that,
  )
  const divide = dual<
    (that: BigDecimal.BigDecimal) => (self: BigDecimal.BigDecimal) => BigDecimal.BigDecimal,
    (self: BigDecimal.BigDecimal, that: BigDecimal.BigDecimal) => BigDecimal.BigDecimal
  >(2, BigDecimal.divideUnsafe)
  const local = { dual: (arity, body) => body }
  local.dual(2, (self: number, that: number) => self + that)
  type Dual = (arity: number, body: unknown) => unknown
  function shadowed(dual: Dual, Fn: { dual: Dual }) {
    dual(2, (self: number, that: number) => self + that)
    Fn.dual(2, (self: number, that: number) => self + that)
  }
`;

testRule('require-dual-type-arguments', requireDualTypeArguments, {
  valid: `
    import * as Fn from 'effect/Function'
    export const add = Fn.dual(2, (self, that) => self + that)
  `,
  validFilename: 'valid.js',
  invalid: `
    import * as Fn from 'effect/Function'
    export const add = Fn.dual(2, (self, that) => self + that)
  `,
  invalidFilename: 'invalid.mts',
  messageId: 'missingTypeArguments',
});

for (const invalid of [
  `
    import * as Fn from 'effect/Function'
    const add: {
      (that: number): (self: number) => number
      (self: number, that: number): number
    } = Fn.dual(2, (self: number, that: number): number => self + that)
  `,
  `
    import { dual } from 'effect/Function'
    const add = dual(2, (self: number, that: number) => self + that)
  `,
  `
    import { Function } from 'effect'
    const add = Function.dual((args) => args.length === 2, (self: number, that: number) => self + that)
  `,
  `
    import * as Fn from 'effect/Function'
    import * as BigDecimal from 'effect/BigDecimal'
    const divide = Fn.dual(2, BigDecimal.divideUnsafe)
  `,
]) {
  testRule('require-dual-type-arguments', requireDualTypeArguments, {
    valid,
    invalid,
    messageId: 'missingTypeArguments',
  });
}
