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

for (const [invalid, messageId] of [
  ['{ ...defaults, ...overrides }', 'merge'],
  ['{ ...a, ...b, ...c }', 'merge'],
  ['{ ...user, name }', 'copy'],
  ['{ ...user, name: Str.trim(name) }', 'copy'],
  ['{ ...this, version: this.version + 1 }', 'copy'],
  ["{ ...state, ['key']: value }", 'copy'],
  ['{ ...registration, handle: (payload: Payload) => run(payload) }', 'copy'],
] as const) {
  testRule('prefer-struct-assign', preferStructAssign, {
    valid,
    invalid: `
      import * as Effect from 'effect/Effect'
      const next = ${invalid}
    `,
    messageId,
  });
}

testRule('prefer-struct-assign', preferStructAssign, {
  valid: 'const merged = { ...defaults, ...overrides }',
  invalid: `
    import * as Effect from 'effect/Effect'
    const evolve = (state, event) => ({ ...state, balance: state.balance + event.amount })
  `,
  messageId: 'copy',
});
