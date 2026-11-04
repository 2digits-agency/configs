import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { alchemyDomainPureDecide } from '../../../src/rules/alchemy/alchemy-domain-pure-decide';

RuleTester.describe = describe;

RuleTester.it = it;

const header = `
  import * as Domain from '@alchemy.run/domain'
  import * as Clock from 'effect/Clock'
  import * as DateTime from 'effect/DateTime'
  import * as Effect from 'effect/Effect'
`;

function aggregate(decide: string, evolve = 'Opened: (s) => s'): string {
  return `${header}
    export class Account extends Domain.Aggregate('Account', {
      id: AccountId,
      decide: { Open: ${decide} },
      evolve: { ${evolve} },
    }) {}
  `;
}

new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } }).run(
  'alchemy-domain-pure-decide',
  alchemyDomainPureDecide,
  {
    valid: [
      aggregate('(s, cmd, { now }) => [new Opened({ at: now, due: new Date(cmd.due) })]'),
      aggregate('(s) => [new Opened({})]', 'Opened: (s) => ({ ...s, seenAt: Date.now() })'),
      `import { Digest } from 'effect/crypto'\n${aggregate(
        'Effect.fn(function* (s, cmd) { const digest = yield* Digest.Digest; return [new Opened({ key: yield* digest.digest(Digest.sha256, cmd.body) })] })',
      )}`,
      aggregate('(s) => { const Date = { now: () => 0 }; return [new Opened({ at: Date.now() })] }'),
      `${header}
        export class Account extends Other.Aggregate('Account', { decide: { Open: () => [Date.now()] } }) {}
      `,
      `${header}
        export const Live = Policy.toLayer(Effect.gen(function* () {
          const at = yield* Clock.currentTimeMillis
          return Effect.fn(function* () { yield* Effect.tryPromise(() => fetch(String(at))) })
        }))
      `,
    ],
    invalid: [
      { code: aggregate('(s) => [new Opened({ at: Date.now() })]'), errors: [{ messageId: 'time' }] },
      { code: aggregate('(s) => [new Opened({ at: new Date() })]'), errors: [{ messageId: 'time' }] },
      {
        code: aggregate(
          'Effect.fn(function* (s) { const at = yield* Clock.currentTimeMillis; return [new Opened({ at })] })',
        ),
        errors: [{ messageId: 'time', data: { api: 'Clock.currentTimeMillis' } }],
      },
      {
        code: aggregate('Effect.fn(function* (s) { const at = yield* DateTime.now; return [new Opened({ at })] })'),
        errors: [{ messageId: 'time' }],
      },
      { code: aggregate('(s) => [new Opened({ id: crypto.randomUUID() })]'), errors: [{ messageId: 'random' }] },
      {
        code: `import { SecureRandom } from 'effect/crypto'\n${aggregate(
          'Effect.fn(function* (s) { const random = yield* SecureRandom.SecureRandom; return [new Opened({ id: yield* random.uuidV4 })] })',
        )}`,
        errors: [{ messageId: 'random', data: { api: 'SecureRandom.SecureRandom' } }],
      },
      {
        code: `import * as Jose from 'effect/jose'\n${aggregate(
          'Effect.fn(function* (s, cmd) { const { claims } = yield* Jose.Jwt.verify(Claims, cmd.token, key); return [new Opened(claims)] })',
        )}`,
        errors: [{ messageId: 'time', data: { api: 'Jwt.verify' } }],
      },
      {
        code: aggregate('Effect.fn(function* (s) { yield* Effect.tryPromise(() => fetch("/score")); return [] })'),
        errors: [
          { messageId: 'io', data: { api: 'Effect.tryPromise' } },
          { messageId: 'io', data: { api: 'fetch()' } },
        ],
      },
      {
        code: `
          import { Aggregate } from '@alchemy.run/domain'
          export class Account extends Aggregate('Account', { decide: { Open: (s) => [new Opened({ id: Math.random() })] } }) {}
        `,
        errors: [{ messageId: 'random' }],
      },
    ],
  },
);
