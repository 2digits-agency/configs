import { preferEffectUrl } from '../../../src/rules/effect/prefer-effect-url';
import { testRule } from '../../rule-tester';

testRule('prefer-effect-url', preferEffectUrl, {
  valid: `
    import { Url } from 'effect/unstable/http'
    const parsed = Url.fromString('https://example.com')
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    const parsed = new URL('https://example.com')
  `,
  messageId: 'effectUrl',
});

// Globals from `env` or `globals` config resolve to variables without definitions.
testRule('prefer-effect-url', preferEffectUrl, {
  valid: `
    import * as Effect from 'effect/Effect'
    import { URL } from 'node:url'
    const parsed = new URL('https://example.com')
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    const parsed = new URL('https://example.com')
  `,
  messageId: 'effectUrl',
  globals: { URL: 'readonly' },
});
