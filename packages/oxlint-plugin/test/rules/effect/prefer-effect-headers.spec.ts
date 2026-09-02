import { preferEffectHeaders } from '../../../src/rules/effect/prefer-effect-headers';
import { testRule } from '../../rule-tester';

testRule('prefer-effect-headers', preferEffectHeaders, {
  valid: `
    import { Headers } from 'effect/unstable/http'
    const headers = Headers.fromInput({ authorization: 'secret' })
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    const headers = new Headers({ authorization: 'secret' })
  `,
  messageId: 'effectHeaders',
});
