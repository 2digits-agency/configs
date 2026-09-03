import { alchemyNoCloudflareInitFinalizer } from '../../../src/rules/alchemy/alchemy-no-cloudflare-init-finalizer';
import { testRule } from '../../rule-tester';

testRule('alchemy-no-cloudflare-init-finalizer', alchemyNoCloudflareInitFinalizer, {
  valid: `
    import * as Cloudflare from 'alchemy/Cloudflare'
    import * as Effect from 'effect/Effect'
    Cloudflare.Worker('Worker', {}, Effect.gen(function* () {
      return { fetch: Effect.gen(function* () { yield* Effect.addFinalizer(cleanup); return new Response() }) }
    }))
  `,
  invalid: `
    import * as Cloudflare from 'alchemy/Cloudflare'
    import * as Effect from 'effect/Effect'
    Cloudflare.Worker('Worker', {}, Effect.gen(function* () {
      yield* Effect.addFinalizer(cleanup)
      return { fetch: Effect.succeed(new Response()) }
    }))
  `,
  messageId: 'finalizer',
});
