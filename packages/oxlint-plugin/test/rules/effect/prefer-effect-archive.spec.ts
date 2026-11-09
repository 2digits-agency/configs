import * as Arr from 'effect/Array';
import { RuleTester } from 'oxlint/plugins-dev';

import { preferEffectArchive } from '../../../src/rules/effect/prefer-effect-archive';
import { testRule } from '../../rule-tester';

const ruleName = 'prefer-effect-archive';

const effect = `import * as Effect from 'effect/Effect';`;

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });

testRule(ruleName, preferEffectArchive, {
  valid: `
    import * as Effect from 'effect/Effect'
    import { Zip } from 'effect/encoding'
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    import JSZip from 'jszip'
  `,
  messageId: 'archive',
  data: { module: 'Zip', source: 'jszip' },
});

tester.run(ruleName, preferEffectArchive, {
  valid: [
    // Only files that use Effect are checked.
    `import JSZip from 'jszip';`,
    // Type-only imports pull in no runtime code.
    `${effect} import type JSZip from 'jszip';`,
    `${effect} import { type Zippable, gzipSync } from 'fflate';`,
    // The gzip, zlib and deflate codecs of fflate have no Zip counterpart.
    `${effect} import { gzipSync, inflate } from 'fflate';`,
    `${effect} import * as fflate from 'fflate';`,
    // Disk extraction keeps its path-traversal guards.
    `${effect} import * as tar from 'tar';`,
    `${effect} import extract from 'extract-zip';`,
  ],
  invalid: [
    ...Arr.map(
      [
        [`${effect} import tar from 'tar-stream';`, 'tar-stream', 'Tar'],
        [`${effect} import archiver from 'archiver';`, 'archiver', 'Zip or Tar'],
        [`${effect} import { ZipReader } from '@zip.js/zip.js';`, '@zip.js/zip.js', 'Zip'],
        [`${effect} const { default: AdmZip } = await import('adm-zip');`, 'adm-zip', 'Zip'],
      ] as const,
      ([code, source, module]) => ({ code, errors: [{ messageId: 'archive', data: { module, source } }] }),
    ),
    // Each zip export of fflate is reported; its gzip export is not.
    {
      code: `${effect} import { gzipSync, unzipSync, zipSync as zip } from 'fflate';`,
      errors: [
        { messageId: 'archive', data: { module: 'Zip', source: 'fflate' }, column: 60 },
        { messageId: 'archive', data: { module: 'Zip', source: 'fflate' }, column: 71 },
      ],
    },
  ],
});
