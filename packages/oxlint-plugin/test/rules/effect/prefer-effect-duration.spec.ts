import { preferEffectDuration } from '../../../src/rules/effect/prefer-effect-duration';
import { testRule } from '../../rule-tester';

testRule('prefer-effect-duration', preferEffectDuration, {
  valid: `
    import * as Duration from 'effect/Duration'
    import * as Effect from 'effect/Effect'
    Effect.sleep(Duration.seconds(5))
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    Effect.sleep(5000)
  `,
  messageId: 'effectDuration',
});
