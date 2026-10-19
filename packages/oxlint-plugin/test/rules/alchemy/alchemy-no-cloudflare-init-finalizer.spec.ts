import { testRule } from '../../rule-tester';

testRule('alchemy-no-cloudflare-init-finalizer', {
  valid: [
    `
    import * as Cloudflare from 'alchemy/Cloudflare'
    import * as Effect from 'effect/Effect'
    Cloudflare.Worker('Worker', {}, Effect.gen(function* () {
      return { fetch: Effect.gen(function* () { yield* Effect.addFinalizer(cleanup); return new Response() }) }
    }))
  `,
  ],
  invalid: [
    {
      code: `
    import * as Cloudflare from 'alchemy/Cloudflare'
    import * as Effect from 'effect/Effect'
    Cloudflare.Worker('Worker', {}, Effect.gen(function* () {
      yield* Effect.addFinalizer(cleanup)
      return { fetch: Effect.succeed(new Response()) }
    }))
  `,
      errors: [{ messageId: 'finalizer' }],
    },
  ],
});
