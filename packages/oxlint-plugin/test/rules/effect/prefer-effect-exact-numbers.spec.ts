import * as Arr from 'effect/Array';
import { RuleTester } from 'oxlint/plugins-dev';

import { preferEffectExactNumbers } from '../../../src/rules/effect/prefer-effect-exact-numbers';
import { testRule } from '../../rule-tester';

const ruleName = 'prefer-effect-exact-numbers';

const effect = `import * as Effect from 'effect/Effect';`;

const str = `import * as Str from 'effect/String';`;

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });

function invalid(code: string, ...messageIds: ReadonlyArray<string>) {
  return { code: `${effect}\n${code}`, errors: Arr.map(messageIds, (messageId) => ({ messageId })) };
}

testRule(ruleName, preferEffectExactNumbers, {
  valid: `
    import * as Effect from 'effect/Effect'
    import * as BigDecimal from 'effect/BigDecimal'
    const total = BigDecimal.sum(price, tax)
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    import Decimal from 'decimal.js'
  `,
  messageId: 'decimalLibrary',
  data: { source: 'decimal.js' },
});

tester.run(ruleName, preferEffectExactNumbers, {
  valid: [
    // Only files that use Effect are checked.
    `import Big from 'big.js'; const n = parseFloat(x.toFixed(2));`,
    `${effect} import type { BigNumber } from 'bignumber.js';`,
    // Formatting with toFixed for display, and parsing text that is not toFixed output.
    `${effect} const label = price.toFixed(2); const n = parseFloat(input); const m = Number(x.toString());`,
    // Effect's Number module is not the global Number.
    `${effect} import { Number } from 'effect'; const rounded = Number(x.toFixed(2));`,
    // Dotted text that is not a number: versions, hosts and string values.
    `${effect} const [major, minor] = version.split('.'); const parts = String(host).split('.'); const p = name.toString().split('.');`,
    `${effect} ${str} const labels = Str.split(hostname, '.');`,
    // Slashes that are not fractions.
    `${effect} const [year, month, day] = date.split('/'); const segments = path.split('/');`,
  ],
  invalid: [
    invalid(
      `import BigNumber from 'bignumber.js'; import Fraction from 'fraction.js'; import JSBI from 'jsbi';`,
      'decimalLibrary',
      'rationalLibrary',
      'bigIntLibrary',
    ),
    invalid(`const Big = (await import('big.js')).default;`, 'decimalLibrary'),
    invalid(
      `const a = parseFloat(x.toFixed(2)); const b = Number(total.toFixed(2)); const c = +amount.toFixed(2); const d = Number.parseFloat((x * y).toFixed(4));`,
      'toFixedRoundTrip',
      'toFixedRoundTrip',
      'toFixedRoundTrip',
      'toFixedRoundTrip',
    ),
    invalid(
      `const [whole, fraction] = price.toFixed(2).split('.'); const decimals = (String(amount * 100).split('.')[1] ?? '').length;`,
      'decimalSplit',
      'decimalSplit',
    ),
    invalid(
      `${str} const parts = Str.split(\`\${a / b}\`, '.'); const p = (x - y).toString().split('.');`,
      'decimalSplit',
      'decimalSplit',
    ),
    invalid(
      `const [numerator, denominator] = ratio.split('/'); const [num, den] = text.split('/').map(Number);`,
      'fractionSplit',
      'fractionSplit',
    ),
  ],
});
