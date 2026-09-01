import { alchemyNoRuntimeConfig } from '../../../src/rules/alchemy/alchemy-no-runtime-config';
import { testRule } from '../../rule-tester';

testRule('alchemy-no-runtime-config', alchemyNoRuntimeConfig, {
  valid: `
    import * as Cloudflare from 'alchemy/Cloudflare'
    import * as Config from 'effect/Config'
    import * as Effect from 'effect/Effect'
    Cloudflare.Worker('Worker', {}, Effect.gen(function* () {
      const secret = yield* Config.redacted('API_KEY')
      return { fetch: Effect.succeed(new Response(String(secret))) }
    }))
  `,
  invalid: `
    import * as Cloudflare from 'alchemy/Cloudflare'
    import * as Config from 'effect/Config'
    import * as Effect from 'effect/Effect'
    Cloudflare.Worker('Worker', {}, Effect.gen(function* () {
      return { fetch: Effect.gen(function* () {
        const secret = yield* Config.redacted('API_KEY')
        return new Response(String(secret))
      }) }
    }))
  `,
  messageId: 'runtime',
});
