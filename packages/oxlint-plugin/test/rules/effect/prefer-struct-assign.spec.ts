/* eslint-disable unicorn/no-null -- RuleTester requires null to assert that no fix or suggestion is offered. */
import { preferStructAssign } from '../../../src/rules/effect/prefer-struct-assign';
import { testRule } from '../../rule-tester';

const valid = `
  import * as Schema from 'effect/Schema'
  import * as Struct from 'effect/Struct'
  const merged = Struct.assign(defaults, overrides)
  const copy = { ...value }
  const built = { kind: 'user', ...payload }
  const withDefaults = { retries: 3, ...options, timeout }
  const mixed = { ...defaults, ...overrides, timeout }
  const conditional = { ...base, ...(enabled ? { flag: true } : {}) }
  const optional = { ...base, ...(flag && { flag }) }
  const inline = { ...{ a: 1 }, b: 2 }
  const fields = Schema.Struct({ ...Base.fields, name: Schema.String })
  const composed = Schema.Struct({ ...Base.fields, ...Audit.fields })
  const accessor = { ...base, get name() { return 'x' } }
  const method = { ...base, run() {} }
  const handler = { ...registration, handle: (payload) => run(payload) }
  const traced = { ...server, addTool: Effect.fn('addTool')(function* (registration) {}) }
  const literal = { ...meta, fixable: 'code' }
  const nested = { ...state, status: { kind: 'done', attempts: -1 } }
`;

const header = `
      import * as Effect from 'effect/Effect'
      import * as Struct from 'effect/Struct'
      const next = `;

for (const [invalid, messageId, suggestion] of [
  ['{ ...defaults, ...overrides }', 'merge', 'Struct.assign(defaults, overrides)'],
  ['{ ...user, name }', 'copy', 'Struct.assign(user, { name })'],
  ['{ ...user, name: Str.trim(name), }', 'copy', 'Struct.assign(user, { name: Str.trim(name) })'],
  ['{ ...this, version: this.version + 1 }', 'copy', 'Struct.assign(this, { version: this.version + 1 })'],
  ["{ ...state, ['key']: value }", 'copy', "Struct.assign(state, { ['key']: value })"],
  [
    '{ ...registration, handle: (payload: Payload) => run(payload) }',
    'copy',
    'Struct.assign(registration, { handle: (payload: Payload) => run(payload) })',
  ],
  ['{ ...(0, a), ...b }', 'merge', 'Struct.assign((0, a), b)'],
] as const) {
  testRule('prefer-struct-assign', preferStructAssign, {
    valid,
    invalid: `${header}${invalid}`,
    messageId,
    output: null,
    suggestions: [{ messageId: 'assign', output: `${header}${suggestion}` }],
  });
}

// Merges of three objects would nest calls, and a rewrite would drop the comment.
for (const invalid of ['{ ...a, ...b, ...c }', '{ ...a, /* wins */ ...b }']) {
  testRule('prefer-struct-assign', preferStructAssign, {
    valid,
    invalid: `${header}${invalid}`,
    messageId: 'merge',
    output: null,
    suggestions: null,
  });
}

testRule('prefer-struct-assign', preferStructAssign, {
  valid: 'const merged = { ...defaults, ...overrides }',
  invalid: `
    import * as Effect from 'effect/Effect'
    const evolve = (state, event) => ({ ...state, balance: state.balance + event.amount })
  `,
  messageId: 'copy',
  suggestions: [
    {
      messageId: 'assign',
      output: `
    import * as Struct from 'effect/Struct';
import * as Effect from 'effect/Effect'
    const evolve = (state, event) => (Struct.assign(state, { balance: state.balance + event.amount }))
  `,
    },
  ],
});
