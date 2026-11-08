import { preferEqual } from '../../../src/rules/effect/prefer-equal';
import { testRule } from '../../rule-tester';

const valid = `
  import * as Equal from 'effect/Equal'
  import * as Equivalence from 'effect/Equivalence'
  const same = Equal.equals(a, b)
  const one = a.id === b.id
  const mixed = a.id === b.id && a.name === c.name
  const crossed = a.id === b.key && a.name === b.label
  const self = a.id === a.id && a.name === a.name
  const either = a.id === b.id || a.name === b.name
  const literal = a.id === 'x' && b.id === 'y'
  const optional = a?.id === b?.id && a?.name === b?.name
  const byFields = Equivalence.make((x, y) => x.id === y.id && x.name === y.name)
`;

for (const [invalid, pair] of [
  ['a.id === b.id && a.name === b.name', 'a and b'],
  ['ready && a.id === b.id && b.name === a.name', 'a and b'],
  ['a.id !== b.id || a.name != b.name', 'a and b'],
  ['this.id === that.id && this.version === that.version', 'that and this'],
  ['left.meta.id === right.meta.id && left.meta.rev === right.meta.rev', 'left.meta and right.meta'],
] as const) {
  testRule('prefer-equal', preferEqual, {
    valid,
    invalid: `
      import * as Effect from 'effect/Effect'
      const same = ${invalid}
    `,
    messageId: 'preferEqual',
    data: { pair },
  });
}

testRule('prefer-equal', preferEqual, {
  valid: 'const same = a.id === b.id && a.name === b.name',
  invalid: `
    import * as Effect from 'effect/Effect'
    const same = (a.id === b.id && a.name === b.name) && a.rev === b.rev
  `,
  messageId: 'preferEqual',
  data: { pair: 'a and b' },
});
