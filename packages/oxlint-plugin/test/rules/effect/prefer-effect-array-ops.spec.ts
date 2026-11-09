import { preferEffectArrayOps } from '../../../src/rules/effect/prefer-effect-array-ops';
import { testRule } from '../../rule-tester';

const valid = `
  import * as Arr from 'effect/Array'
  import * as Struct from 'effect/Struct'
  const unique = Arr.dedupe(values)
  const merged = [...new Set(values), extra]
  const copied = Array.from(new Set(values), String)
  const first = Arr.head(values)
  const second = items[1]
  const before = (node) => node.range[0] <= other.range[0] && other.range[1] <= node.range[1]
  values[0] = next
  const empty = Arr.isReadonlyArrayEmpty(values)
  const short = values.length === 1
  const total = values.length > 1
  const names = Arr.map(users, Struct.get('name'))
  const optional = users.map((user) => user?.name)
  const nested = users.map((user) => user.profile.name)
  const other = users.map((user) => team.name)
  const filtered = users.filter((user) => user.active)
`;

for (const [invalid, messageId] of [
  ['[...new Set(values)]', 'dedupe'],
  ['Array.from(new Set(values))', 'dedupe'],
  ['values[0]', 'head'],
  ['values.length === 0', 'empty'],
  ['0 == values.length', 'empty'],
  ['values.length !== 0', 'nonEmpty'],
  ['values.length > 0', 'nonEmpty'],
  ['0 < values.length', 'nonEmpty'],
  ['users.map((user) => user.name)', 'structGet'],
  ['Arr.map(users, (user) => user.name)', 'structGet'],
  ['Option.map(user => user["name"])', 'structGet'],
] as const) {
  testRule('prefer-effect-array-ops', preferEffectArrayOps, {
    valid,
    invalid: `
      import * as Effect from 'effect/Effect'
      ${invalid}
    `,
    messageId,
  });
}

testRule('prefer-effect-array-ops', preferEffectArrayOps, {
  valid: 'const unique = [...new Set(values)]; const first = values[0]',
  invalid: `
    import * as Effect from 'effect/Effect'
    const names = users.map((user) => user.name)
  `,
  messageId: 'structGet',
  data: { key: 'name' },
});
