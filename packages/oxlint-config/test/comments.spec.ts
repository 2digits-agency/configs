import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const oxlintBinary = fileURLToPath(new URL('../node_modules/oxlint/bin/oxlint', import.meta.url));

const presetUrl = new URL('../dist/index.mjs', import.meta.url).href;

// Run the package's native binary and config loader even when launched by `vp test`.
const nativeEnvironment = { ...process.env };

delete nativeEnvironment.VP_VERSION;

delete nativeEnvironment.NAPI_RS_NATIVE_LIBRARY_PATH;

// The isolated temporary project has no node_modules of its own.
nativeEnvironment.PATH = [fileURLToPath(new URL('../node_modules/.bin', import.meta.url)), nativeEnvironment.PATH].join(
  path.delimiter,
);

describe('shared comment capitalization autofix', () => {
  it('preserves Fallow directives and capitalized prose while fixing lowercase prose idempotently', () => {
    const directory = mkdtempSync(path.join(tmpdir(), '2digits-comments-'));

    const sources = {
      'next-line.ts': '// fallow-ignore-next-line unused-export\nexport const runtimeEntrypoint = true;\n',
      'file.ts': '// fallow-ignore-file\nexport const fileEntrypoint = true;\n',
      'prose.ts':
        '// ordinary prose mentioning fallow-ignore\nexport const first = true;\n\n// Already capitalized prose\nexport const second = false;\n',
      'lookalike.ts': '// fallow-ignoreish is ordinary prose\nexport const lookalike = true;\n',
    };

    const expectedProse =
      '// Ordinary prose mentioning fallow-ignore\nexport const first = true;\n\n// Already capitalized prose\nexport const second = false;\n';

    try {
      writeFileSync(
        path.join(directory, 'oxlint.config.mjs'),
        `import lint from '${presetUrl}';\nexport default lint();\n`,
      );

      for (const [filename, source] of Object.entries(sources)) {
        writeFileSync(path.join(directory, filename), source);
      }

      const reported = spawnSync(process.execPath, [oxlintBinary, '--config=oxlint.config.mjs', 'prose.ts'], {
        cwd: directory,
        encoding: 'utf8',
        env: nativeEnvironment,
      });

      expect(reported.status).toBe(1);

      expect(`${reported.stdout}${reported.stderr}`).toContain('capitalized-comments');

      for (const _pass of [1, 2]) {
        const fixed = spawnSync(
          process.execPath,
          [oxlintBinary, '--config=oxlint.config.mjs', '--fix', ...Object.keys(sources)],
          { cwd: directory, encoding: 'utf8', env: nativeEnvironment },
        );

        expect(fixed.status, `${fixed.stdout}${fixed.stderr}`).toBe(0);

        expect(readFileSync(path.join(directory, 'next-line.ts'), 'utf8')).toBe(sources['next-line.ts']);

        expect(readFileSync(path.join(directory, 'file.ts'), 'utf8')).toBe(sources['file.ts']);

        expect(readFileSync(path.join(directory, 'prose.ts'), 'utf8')).toBe(expectedProse);

        expect(readFileSync(path.join(directory, 'lookalike.ts'), 'utf8')).toBe(
          '// Fallow-ignoreish is ordinary prose\nexport const lookalike = true;\n',
        );
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
