import { preferEffectDateTime } from '../../../src/rules/effect/prefer-effect-datetime';
import { testRule } from '../../rule-tester';

testRule('prefer-effect-datetime', preferEffectDateTime, {
  valid: `
    import * as DateTime from 'effect/DateTime'
    const formatted = DateTime.formatIso(DateTime.makeUnsafe('2026-09-01'))
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    declare const date: Date
    const formatted = date.toISOString()
  `,
  messageId: 'effectDateTime',
});
