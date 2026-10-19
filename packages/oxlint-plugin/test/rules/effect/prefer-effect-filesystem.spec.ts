import { testRule } from '../../rule-tester';

testRule('prefer-effect-filesystem', {
  valid: [
    `
    import * as Effect from 'effect/Effect'
    import * as FileSystem from 'effect/FileSystem'
  `,
  ],
  invalid: [
    {
      code: `
    import { readFile } from 'node:fs/promises'
    import * as Effect from 'effect/Effect'
  `,
      errors: [{ messageId: 'effectFileSystem' }],
    },
  ],
});
