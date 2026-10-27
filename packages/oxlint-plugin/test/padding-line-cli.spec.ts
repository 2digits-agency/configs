import { fileURLToPath } from 'node:url';

import * as NodeServices from '@effect/platform-node/NodeServices';
import { describe, expect, it } from '@effect/vitest';
import ts from 'dedent';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Path from 'effect/Path';
import * as R from 'effect/Record';
import * as Schema from 'effect/Schema';
import * as Stream from 'effect/Stream';
import * as ChildProcess from 'effect/process/ChildProcess';

const oxlintBinary = fileURLToPath(new URL('../node_modules/oxlint/bin/oxlint', import.meta.url));

const pluginUrl = new URL('../dist/index.mjs', import.meta.url).href;

const nativeEnvironment = { ...process.env };

delete nativeEnvironment.VP_VERSION;

delete nativeEnvironment.NAPI_RS_NATIVE_LIBRARY_PATH;

const encodeOption = Schema.encodeEffect(Schema.Unknown.pipe(Schema.fromJsonString));

const runOxlint = Effect.fn('PaddingLineCli.runOxlint')(function* (directory: string, args: ReadonlyArray<string>) {
  const child = yield* ChildProcess.make(process.execPath, [oxlintBinary, ...args], {
    cwd: directory,
    env: nativeEnvironment,
  });

  const { exitCode, stdout, stderr } = yield* Effect.all(
    {
      exitCode: child.exitCode,
      stdout: child.stdout.pipe(Stream.decodeText(), Stream.mkString),
      stderr: child.stderr.pipe(Stream.decodeText(), Stream.mkString),
    },
    { concurrency: 'unbounded' },
  );

  return { status: exitCode, stdout, stderr };
});

describe('statement spacing CLI', () => {
  it.effect(
    'loads the published plugin, isolates files and fixes spacing idempotently',
    () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const path = yield* Path.Path;

        const directory = yield* fs.makeTempDirectoryScoped({ prefix: '2digits-padding-' });

        const sources = {
          'a.ts': {
            source: ts`
            foo();
            bar();
          `,
            fixed: ts`
            foo();

            bar();
          `,
          },
          'b.ts': {
            source: ts`
            const b = 1;
            foo(b);
          `,
            fixed: ts`
            const b = 1;

            foo(b);
          `,
          },
        };

        yield* fs.writeFileString(
          path.join(directory, 'oxlint.config.mjs'),
          ts`
          export default {
            categories: { correctness: 'off' },
            jsPlugins: [{ name: '2digits', specifier: '${pluginUrl}' }],
            rules: {
              '2digits/padding-line-between-statements': [
                'error',
                { blankLine: 'always', prev: '*', next: { selector: ':statement' } },
              ],
            },
          };
        `,
        );

        for (const [filename, { source }] of R.toEntries(sources)) {
          yield* fs.writeFileString(path.join(directory, filename), source);
        }

        function run(flags: Array<string>) {
          return runOxlint(directory, ['--config=oxlint.config.mjs', ...flags, ...R.keys(sources)]);
        }

        const reported = yield* run([]);

        expect(reported.status, `${reported.stdout}${reported.stderr}`).toBe(1);

        expect(reported.stdout).toContain('padding-line-between-statements');

        for (const _pass of [1, 2]) {
          const fixed = yield* run(['--fix']);

          expect(fixed.status, `${fixed.stdout}${fixed.stderr}`).toBe(0);

          for (const [filename, { fixed: expected }] of R.toEntries(sources)) {
            expect(yield* fs.readFileString(path.join(directory, filename))).toBe(expected);
          }
        }
      }).pipe(Effect.provide(NodeServices.layer), Effect.scoped),
    // Three sequential CLI startups need headroom on contended CI runners.
    15_000,
  );

  const malformedOptions = [
    { blankLine: 'sometimes', prev: '*', next: '*' },
    { blankLine: 'always', prev: 'unknown', next: '*' },
    { blankLine: 'always', prev: [], next: '*' },
    { blankLine: 'always', prev: { selector: 'ExpressionStatement', lineMode: 'unknown' }, next: '*' },
    { blankLine: 'always', prev: '*', next: '*', extra: true },
  ];

  for (const [index, option] of malformedOptions.entries()) {
    it.effect(`rejects malformed configuration ${index + 1}`, () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const path = yield* Path.Path;

        const directory = yield* fs.makeTempDirectoryScoped({ prefix: '2digits-padding-options-' });

        yield* fs.writeFileString(
          path.join(directory, 'a.ts'),
          ts`
          foo();
          bar();
        `,
        );

        const encodedOption = yield* encodeOption(option);

        yield* fs.writeFileString(
          path.join(directory, 'oxlint.config.mjs'),
          ts`
          export default {
            categories: { correctness: 'off' },
            jsPlugins: [{ name: '2digits', specifier: '${pluginUrl}' }],
            rules: {
              '2digits/padding-line-between-statements': ['error', ${encodedOption}],
            },
          };
        `,
        );

        const result = yield* runOxlint(directory, ['--config=oxlint.config.mjs', 'a.ts']);

        expect(result.status).not.toBe(0);

        expect(`${result.stdout}${result.stderr}`).toContain('padding');
      }).pipe(Effect.provide(NodeServices.layer), Effect.scoped),
    );
  }
});
