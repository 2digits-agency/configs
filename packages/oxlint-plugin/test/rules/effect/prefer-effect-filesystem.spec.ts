import { preferEffectFileSystem } from '../../../src/rules/effect/prefer-effect-filesystem';
import { testRule } from '../../rule-tester';

testRule('prefer-effect-filesystem', preferEffectFileSystem, {
  valid: `
    import * as Effect from 'effect/Effect'
    import * as FileSystem from 'effect/FileSystem'
  `,
  invalid: `
    import { readFile } from 'node:fs/promises'
    import * as Effect from 'effect/Effect'
  `,
  messageId: 'effectFileSystem',
});
