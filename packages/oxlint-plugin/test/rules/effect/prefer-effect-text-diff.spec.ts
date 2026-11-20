import * as Arr from 'effect/Array';
import { RuleTester } from 'oxlint/plugins-dev';

import { preferEffectTextDiff } from '../../../src/rules/effect/prefer-effect-text-diff';
import { testRule } from '../../rule-tester';

const ruleName = 'prefer-effect-text-diff';

const effect = `import * as Effect from 'effect/Effect';`;

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });

function invalid(code: string, ...errors: ReadonlyArray<readonly [api: string, replacement: string]>) {
  return {
    code: `${effect}\n${code}`,
    errors: Arr.map(errors, ([api, replacement]) => ({ messageId: 'textDiff', data: { api, replacement } })),
  };
}

testRule(ruleName, preferEffectTextDiff, {
  valid: `
    import * as Effect from 'effect/Effect'
    import { TextDiff } from 'effect'
    const patch = TextDiff.unified(TextDiff.lines(before, after))
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    import { diffLines } from 'diff'
  `,
  messageId: 'textDiff',
  data: { api: 'diff diffLines', replacement: 'TextDiff.lines' },
});

tester.run(ruleName, preferEffectTextDiff, {
  valid: [
    // Only files that use Effect are checked.
    `import { diffLines } from 'diff';`,
    `import fastDiff from 'fast-diff';`,
    // The jsdiff exports without a TextDiff counterpart stay allowed, by name and through a namespace.
    `${effect} import { diffWords, applyPatch, parsePatch } from 'diff';`,
    `${effect} import * as Diff from 'diff'; const words = Diff.diffWords(a, b); const result = Diff.applyPatch(text, patch);`,
    // Type-only imports pull in no runtime code.
    `${effect} import type { Change } from 'diff';`,
    `${effect} import { type StructuredPatch } from 'diff';`,
    `${effect} import { diff } from 'jest-diff';`,
  ],
  invalid: [
    invalid(
      `import { diffChars, structuredPatch, createTwoFilesPatch, diffWords } from 'diff';`,
      ['diff diffChars', 'TextDiff.codePoints'],
      ['diff structuredPatch', 'TextDiff.hunks'],
      ['diff createTwoFilesPatch', 'TextDiff.unified'],
    ),
    invalid(
      `import * as Diff from 'diff'; const patch = Diff.createPatch('a.txt', a, b); const words = Diff.diffWords(a, b); const items = Diff.diffArrays(xs, ys);`,
      ['diff createPatch', 'TextDiff.unified'],
      ['diff diffArrays', 'TextDiff.diff'],
    ),
    invalid(`import fastDiff from 'fast-diff';`, ['fast-diff', 'TextDiff.codePoints']),
    invalid(`import { diff } from 'diff-sequences';`, ['diff-sequences', 'TextDiff.diffWith']),
  ],
});
