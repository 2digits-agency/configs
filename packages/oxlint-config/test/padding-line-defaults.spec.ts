import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'dedent';
import { describe, expect, it } from 'vite-plus/test';

const oxlintBinary = fileURLToPath(new URL('../node_modules/oxlint/bin/oxlint', import.meta.url));

const presetUrl = new URL('../dist/index.mjs', import.meta.url).href;

const nativeEnvironment = { ...process.env };

delete nativeEnvironment.VP_VERSION;

delete nativeEnvironment.NAPI_RS_NATIVE_LIBRARY_PATH;

nativeEnvironment.PATH = [fileURLToPath(new URL('../node_modules/.bin', import.meta.url)), nativeEnvironment.PATH].join(
  path.delimiter,
);

const source = ts`
  import type { Input } from './input.js';
  import type { Output } from './output.js';
  export function filename(value: Input): Output {
    const fullPath = value.path;
    // Keep this comment with the next declaration.
    const name = fullPath.trim();
    return name;
  }
  export const defaultName = filename({ path: ' example ' });
`;

const expectedSource = ts`
  import type { Input } from './input.js';
  import type { Output } from './output.js';

  export function filename(value: Input): Output {
    const fullPath = value.path;

    // Keep this comment with the next declaration.
    const name = fullPath.trim();

    return name;
  }

  export const defaultName = filename({ path: ' example ' });
`;

describe('default statement spacing', () => {
  it('reports and fixes missing blank lines through the built default preset idempotently', () => {
    const directory = mkdtempSync(path.join(tmpdir(), '2digits-padding-'));

    try {
      writeFileSync(
        path.join(directory, 'oxlint.config.mjs'),
        ts`
          import lint from '${presetUrl}';

          export default lint();
        `,
      );

      writeFileSync(path.join(directory, 'source.ts'), source);

      writeFileSync(path.join(directory, 'input.ts'), ts`export type Input = { readonly path: string };`);

      writeFileSync(path.join(directory, 'output.ts'), ts`export type Output = string;`);

      const reported = spawnSync(process.execPath, [oxlintBinary, '--config=oxlint.config.mjs', 'source.ts'], {
        cwd: directory,
        encoding: 'utf8',
        env: nativeEnvironment,
      });

      expect(reported.status, `${reported.stdout}${reported.stderr}`).toBe(1);

      expect(`${reported.stdout}${reported.stderr}`).toContain('padding-line-between-statements');

      for (const _pass of [1, 2]) {
        const fixed = spawnSync(process.execPath, [oxlintBinary, '--config=oxlint.config.mjs', '--fix', 'source.ts'], {
          cwd: directory,
          encoding: 'utf8',
          env: nativeEnvironment,
        });

        expect(fixed.status, `${fixed.stdout}${fixed.stderr}`).toBe(0);

        expect(readFileSync(path.join(directory, 'source.ts'), 'utf8')).toBe(expectedSource);
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it.for(["'off'", "['error', { blankLine: 'any', prev: '*', next: '*' }]"])(
    'honors consumer rule configuration: %s',
    (rule) => {
      const directory = mkdtempSync(path.join(tmpdir(), '2digits-padding-override-'));

      try {
        writeFileSync(
          path.join(directory, 'oxlint.config.mjs'),
          ts`
            import lint from '${presetUrl}';

            export default lint({
              rules: {
                '2digits/padding-line-between-statements': ${rule},
              },
            });
          `,
        );

        writeFileSync(path.join(directory, 'source.ts'), source);

        writeFileSync(path.join(directory, 'input.ts'), ts`export type Input = { readonly path: string };`);

        writeFileSync(path.join(directory, 'output.ts'), ts`export type Output = string;`);

        const result = spawnSync(process.execPath, [oxlintBinary, '--config=oxlint.config.mjs', '--fix', 'source.ts'], {
          cwd: directory,
          encoding: 'utf8',
          env: nativeEnvironment,
        });

        expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);

        expect(readFileSync(path.join(directory, 'source.ts'), 'utf8')).toBe(source);
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    },
  );
});
