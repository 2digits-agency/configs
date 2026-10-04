import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const oxlintBinary = fileURLToPath(new URL('../node_modules/oxlint/bin/oxlint', import.meta.url));
const pluginUrl = new URL('../dist/index.mjs', import.meta.url).href;
const nativeEnvironment = { ...process.env };

delete nativeEnvironment.VP_VERSION;
delete nativeEnvironment.NAPI_RS_NATIVE_LIBRARY_PATH;

describe('statement spacing CLI', () => {
  it('loads the published plugin, isolates files and fixes spacing idempotently', () => {
    const directory = mkdtempSync(path.join(tmpdir(), '2digits-padding-'));
    const sources = { 'a.ts': 'foo();\nbar();\n', 'b.ts': 'const b = 1;\nfoo(b);\n' };

    try {
      writeFileSync(
        path.join(directory, 'oxlint.config.mjs'),
        `
      export default {
        categories: { correctness: 'off' },
        jsPlugins: [{ name: '2digits', specifier: '${pluginUrl}' }],
        rules: { '2digits/padding-line-between-statements': ['error',
          { blankLine: 'always', prev: '*', next: { selector: ':statement' } }
        ] }
      };
    `,
      );
      for (const [filename, source] of Object.entries(sources)) {
        writeFileSync(path.join(directory, filename), source);
      }
      function run(flags: Array<string>) {
        return spawnSync(
          process.execPath,
          [oxlintBinary, '--config=oxlint.config.mjs', ...flags, ...Object.keys(sources)],
          { cwd: directory, encoding: 'utf8', env: nativeEnvironment },
        );
      }
      const reported = run([]);

      expect(reported.status, `${reported.stdout}${reported.stderr}`).toBe(1);
      expect(reported.stdout).toContain('padding-line-between-statements');
      for (const _pass of [1, 2]) {
        const fixed = run(['--fix']);

        expect(fixed.status, `${fixed.stdout}${fixed.stderr}`).toBe(0);
        for (const [filename, source] of Object.entries(sources)) {
          expect(readFileSync(path.join(directory, filename), 'utf8')).toBe(source.replace('\n', '\n\n'));
        }
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it.for([
    { blankLine: 'sometimes', prev: '*', next: '*' },
    { blankLine: 'always', prev: 'unknown', next: '*' },
    { blankLine: 'always', prev: [], next: '*' },
    { blankLine: 'always', prev: { selector: 'ExpressionStatement', lineMode: 'unknown' }, next: '*' },
    { blankLine: 'always', prev: '*', next: '*', extra: true },
  ])('rejects malformed configuration %j', (option) => {
    const directory = mkdtempSync(path.join(tmpdir(), '2digits-padding-options-'));

    try {
      writeFileSync(path.join(directory, 'a.ts'), 'foo();\nbar();\n');
      writeFileSync(
        path.join(directory, 'oxlint.config.mjs'),
        `export default {
      categories: { correctness: 'off' },
      jsPlugins: [{ name: '2digits', specifier: '${pluginUrl}' }],
      rules: { '2digits/padding-line-between-statements': ['error', ${JSON.stringify(option)}] }
    };`,
      );
      const result = spawnSync(process.execPath, [oxlintBinary, '--config=oxlint.config.mjs', 'a.ts'], {
        cwd: directory,
        encoding: 'utf8',
        env: nativeEnvironment,
      });

      expect(result.status).not.toBe(0);
      expect(`${result.stdout}${result.stderr}`).toContain('padding');
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
