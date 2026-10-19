import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { presetUrl, runOxlint, withTemporaryProject } from './oxlint';

describe('shared comment capitalization autofix', () => {
  it('preserves Fallow directives and capitalized prose while fixing lowercase prose idempotently', () => {
    const sources = {
      'next-line.ts': '// fallow-ignore-next-line unused-export\nexport const runtimeEntrypoint = true;\n',
      'file.ts': '// fallow-ignore-file\nexport const fileEntrypoint = true;\n',
      'prose.ts':
        '// ordinary prose mentioning fallow-ignore\nexport const first = true;\n\n// Already capitalized prose\nexport const second = false;\n',
      'lookalike.ts': '// fallow-ignoreish is ordinary prose\nexport const lookalike = true;\n',
    };

    const expectedProse =
      '// Ordinary prose mentioning fallow-ignore\nexport const first = true;\n\n// Already capitalized prose\nexport const second = false;\n';

    const config = { 'oxlint.config.mjs': `import lint from '${presetUrl}';\nexport default lint();\n` };

    withTemporaryProject({ ...config, ...sources }, (directory) => {
      const reported = runOxlint(directory, 'prose.ts');

      expect(reported.status).toBe(1);

      expect(reported.output).toContain('capitalized-comments');

      for (const _pass of [1, 2]) {
        const fixed = runOxlint(directory, '--fix', ...Object.keys(sources));

        expect(fixed.status, fixed.output).toBe(0);

        expect(readFileSync(path.join(directory, 'next-line.ts'), 'utf8')).toBe(sources['next-line.ts']);

        expect(readFileSync(path.join(directory, 'file.ts'), 'utf8')).toBe(sources['file.ts']);

        expect(readFileSync(path.join(directory, 'prose.ts'), 'utf8')).toBe(expectedProse);

        expect(readFileSync(path.join(directory, 'lookalike.ts'), 'utf8')).toBe(
          '// Fallow-ignoreish is ordinary prose\nexport const lookalike = true;\n',
        );
      }
    });
  });
});
