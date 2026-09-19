/* oxlint-disable no-await-in-loop -- Benchmarks must run serially to avoid resource contention. */
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { build } from 'vite-plus/pack';

import type { Sample } from './startup';

// Runtime experiments only: omit type generation, package.json writes and validation hooks.
const variants = {
  external: {},
  unminified: { minify: false },
  unbundle: { unbundle: true },
  utilities: { deps: { alwaysBundle: ['eslint-flat-config-utils', 'local-pkg', 'pkg-types'], onlyBundle: false } },
  sonar: { deps: { alwaysBundle: ['eslint-plugin-sonarjs'], onlyBundle: false } },
  unicorn: { deps: { alwaysBundle: ['eslint-plugin-unicorn'], onlyBundle: false } },
  plugins: { deps: { alwaysBundle: [/^eslint-plugin-/, /^@eslint\//, '@stylistic/eslint-plugin'], onlyBundle: false } },
} satisfies Record<string, NonNullable<Parameters<typeof build>[0]>>;

await mkdir('.cache', { recursive: true });
const directory = await mkdtemp('.cache/pack-benchmark-');

try {
  for (const [name, overrides] of Object.entries(variants)) {
    if (process.argv.length > 2 && !process.argv.slice(2).includes(name)) {
      continue;
    }
    const outDir = path.join(directory, name);

    try {
      await build({
        config: false,
        entry: ['src/index.ts'],
        outDir,
        dts: false,
        exports: false,
        minify: true,
        shims: true,
        fixedExtension: true,
        ...overrides,
      });
      let bytes = 0;
      const files = await readdir(outDir, { recursive: true });

      for (const file of files) {
        const info = await stat(path.join(outDir, file));

        if (info.isFile()) {
          bytes += info.size;
        }
      }

      for (const mode of ['javascript', 'react']) {
        const samples: Array<Sample> = [];

        for (let run = 0; run < 4; run++) {
          const output = execFileSync(
            process.execPath,
            ['benchmarks/startup.ts', '--worker', pathToFileURL(path.join(outDir, 'index.mjs')).href, mode],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
          );

          if (run > 0) {
            samples.push(JSON.parse(output.trim()) as Sample);
          }
        }

        function median(key: keyof Sample) {
          return samples.map((sample) => sample[key]).toSorted((a, b) => a - b)[1];
        }

        console.log(JSON.stringify({ name, mode, bytes, configMs: median('configMs'), rssMB: median('rssMB') }));
      }
    } catch (error) {
      // Broken candidates are experimental results, not successful optimizations.
      console.error(`FAILED ${name}`, error);
    }
  }
} finally {
  await rm(directory, { recursive: true, force: true });
}
