import { preferEffectPath } from '../../../src/rules/effect/prefer-effect-path';
import { testRule } from '../../rule-tester';

testRule('prefer-effect-path', preferEffectPath, {
  valid: `
    import * as Effect from 'effect/Effect'
    import * as Path from 'effect/Path'
  `,
  invalid: `
    import path from 'node:path'
    import * as Effect from 'effect/Effect'
  `,
  messageId: 'effectPath',
});
