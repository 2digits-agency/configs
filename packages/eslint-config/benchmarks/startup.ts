import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { Linter } from 'eslint';

export interface Sample {
  importMs: number;
  configMs: number;
  totalMs: number;
  rssMB: number;
  configs: number;
  messages: number;
}

// Fresh Node processes: one warmup, five measured samples. Run after building.
// Accepts multiple built entry points so comparisons can alternate on the same machine.
const script = fileURLToPath(import.meta.url);
const modes = ['javascript', 'typescript', 'react', 'lint'];
const disabled = Object.fromEntries(
  [
    'css',
    'depend',
    'drizzle',
    'graphql',
    'next',
    'pnpm',
    'react',
    'storybook',
    'tailwind',
    'tanstackQuery',
    'tanstackRouter',
    'ts',
    'turbo',
    'vitest',
    'zod',
  ].map((name) => [name, false]),
);

if (process.argv[2] === '--worker') {
  const [entry, mode] = process.argv.slice(3);

  assert.ok(entry && mode, 'Expected an entry point and benchmark mode');
  const start = performance.now();
  const { twoDigits } = (await import(entry)) as typeof import('../src');
  const imported = performance.now();
  const configs = await twoDigits({
    ...disabled,
    ts: mode === 'typescript' || mode === 'react',
    react: mode === 'react',
  });
  const configured = performance.now();
  let messages = 0;

  if (mode === 'lint') {
    const { ESLint } = await import('eslint');
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: configs as Array<Linter.Config>,
    });
    const source = Array.from({ length: 500 }, (_, index) => `export const value${index} = ${index};`).join('\n');
    const results = await eslint.lintText(source, { filePath: 'benchmark.js' });

    messages = results.reduce((count, result) => count + result.messages.length, 0);
    assert.equal(messages, 0, 'Benchmark source must lint without diagnostics');
  }

  console.log(
    JSON.stringify({
      importMs: imported - start,
      configMs: configured - start,
      totalMs: performance.now() - start,
      rssMB: process.memoryUsage().rss / 1024 / 1024,
      configs: configs.length,
      messages,
    }),
  );
} else {
  const entries = (process.argv.length > 2 ? process.argv.slice(2) : ['dist/index.mjs']).map(
    (entry) => pathToFileURL(path.resolve(entry)).href,
  );

  console.log(`Node ${process.version}; one warmup + five samples; median; warm filesystem cache`);
  for (const mode of modes) {
    const samples = new Map<string, Array<Sample>>(entries.map((entry) => [entry, []]));

    for (let run = 0; run < 6; run++) {
      const orderedEntries = run % 2 ? entries.toReversed() : entries;

      for (const entry of orderedEntries) {
        const output = execFileSync(process.execPath, [script, '--worker', entry, mode], { encoding: 'utf8' });
        const result = JSON.parse(output.trim()) as Sample;

        if (run > 0) {
          samples.get(entry)?.push(result);
        }
      }
    }

    for (const [entry, results] of samples) {
      function median(key: keyof Sample) {
        return results.map((result) => result[key]).toSorted((a, b) => a - b)[2];
      }

      console.log(
        JSON.stringify({
          entry,
          mode,
          importMs: median('importMs'),
          configMs: median('configMs'),
          totalMs: median('totalMs'),
          rssMB: median('rssMB'),
          configs: results[0]?.configs,
        }),
      );
    }
  }
}
