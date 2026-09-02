import { preferEffectEncoding } from '../../../src/rules/effect/prefer-effect-encoding';
import { testRule } from '../../rule-tester';

testRule('prefer-effect-encoding', preferEffectEncoding, {
  valid: `
    import * as Encoding from 'effect/Encoding'
    const encoded = Encoding.encodeBase64('hello')
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    const encoded = btoa('hello')
  `,
  messageId: 'effectEncoding',
});
