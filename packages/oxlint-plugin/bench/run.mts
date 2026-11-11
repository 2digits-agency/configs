/* eslint-disable turbo/no-undeclared-env-vars -- This standalone benchmark runs outside Turbo's cache. */
// @effect-diagnostics nodeBuiltinImport:off preferEffectArray:off preferEffectRecord:off preferEffectString:off asyncFunction:off globalConsole:off
// Use synchronous Node I/O at the benchmark boundary; measure the shipped CLI in fresh processes.
import assert from 'node:assert/strict';
import { spawnSync, type SpawnSyncOptionsWithStringEncoding } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { availableParallelism, cpus } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

interface CapturedCase {
  readonly rule: string;
  readonly code: string;
  readonly filename?: string;
  readonly options?: ReadonlyArray<unknown>;
  readonly languageOptions?: { readonly globals?: Readonly<Record<string, string>> };
}

interface Manifest {
  readonly baseRef: string;
  readonly node: string;
  readonly cpu: string;
  readonly cpus: number;
  readonly files: number;
  readonly snippets: number;
  readonly corpusHash: string;
  readonly rules: Array<string>;
  readonly overrides: Array<unknown>;
}

interface CliOutput {
  readonly diagnostics: Array<{ readonly severity: string; readonly [key: string]: unknown }>;
}

interface Sample {
  readonly wall: number;
  readonly runtime: number;
  readonly callbacks: number;
  readonly rules: Record<string, { readonly ms: number; readonly calls: number }>;
}

const root = fileURLToPath(new URL('../../../', import.meta.url));

const pkg = path.join(root, 'packages/oxlint-plugin');

const state = path.resolve(pkg, process.env.OXLINT_BENCH_DIR ?? '.cache/benchmark');

const cli = path.join(pkg, 'node_modules/oxlint/bin/oxlint');

const env = { ...process.env };

delete env.VP_VERSION;

delete env.NAPI_RS_NATIVE_LIBRARY_PATH;

function execute(
  command: string,
  args: Array<string>,
  cwd: string,
  extra: Partial<SpawnSyncOptionsWithStringEncoding> = {},
): string {
  const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...extra });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    let output = result.stdout;

    try {
      output = JSON.stringify(
        (JSON.parse(output) as CliOutput).diagnostics.filter((entry) => entry.severity === 'error'),
      );
    } catch {
      /* Non-JSON build or test failure. */
    }

    assert.fail(`${command} exited ${result.status}\n${output.slice(-5000)}\n${result.stderr}`);
  }

  return result.stdout;
}

function files(directory: string): Array<string> {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(directory, entry.name);

      return entry.isDirectory() ? files(full) : full;
    })
    .toSorted();
}

function digest(directory: string): string {
  const hash = createHash('sha256');

  for (const file of files(directory)) {
    hash.update(path.relative(directory, file));

    hash.update(readFileSync(file));
  }

  return hash.digest('hex');
}

async function freeze() {
  assert.ok(
    !existsSync(path.join(state, 'manifest.json')),
    'Baseline already exists; use a fresh checkout to reset it.',
  );

  mkdirSync(state, { recursive: true });

  execute('vpr', ['build'], pkg);

  cpSync(path.join(pkg, 'dist/index.mjs'), path.join(state, 'baseline.mjs'));

  const capture = path.join(state, 'cases.jsonl');

  writeFileSync(capture, '');

  execute('vpr', ['test'], pkg, { env: { ...env, OXLINT_BENCH_CORPUS: capture } });

  const cases = [...new Set(readFileSync(capture, 'utf8').trim().split('\n'))]
    .toSorted()
    .map((line) => JSON.parse(line) as CapturedCase);

  const source = path.join(state, 'corpus');

  mkdirSync(source);

  for (const repository of [root, ...process.argv.slice(3).map((directory) => path.resolve(directory))]) {
    const label = path.basename(repository);

    const tracked = execute('git', ['ls-files', '-z'], repository).split('\0').filter(Boolean);

    for (const filename of tracked) {
      if (!/\.[cm]?[jt]sx?$/.test(filename)) {
        continue;
      }

      const destination = path.join(source, label, filename);

      mkdirSync(path.dirname(destination), { recursive: true });

      cpSync(path.join(repository, filename), destination);
    }
  }

  const overrides: Manifest['overrides'] = [];

  for (const [index, testCase] of cases.entries()) {
    const filename = path.join('snippets', String(index), testCase.filename ?? 'snippet.tsx');

    const destination = path.join(source, filename);

    mkdirSync(path.dirname(destination), { recursive: true });

    writeFileSync(destination, `${testCase.code}\nexport {};\n`);

    overrides.push({
      files: [`**/${filename.replaceAll('\\', '/')}`],
      ...(testCase.languageOptions?.globals ? { globals: testCase.languageOptions.globals } : {}),
      rules: { [`2digits/${testCase.rule}`]: ['warn', ...(testCase.options ?? [])] },
    });
  }

  const { default: plugin } = (await import(
    pathToFileURL(path.join(state, 'baseline.mjs')).href
  )) as typeof import('../src');

  writeFileSync(
    path.join(state, 'manifest.json'),
    JSON.stringify(
      {
        baseRef: execute('git', ['rev-parse', 'HEAD'], root).trim(),
        node: process.version,
        cpu: cpus().at(0)?.model,
        cpus: availableParallelism(),
        files: files(source).length,
        snippets: cases.length,
        corpusHash: digest(source),
        rules: Object.keys(plugin.rules),
        overrides,
      },
      undefined,
      2,
    ),
  );
}

function config(plugin: string): string {
  const filename = path.join(state, 'oxlint.config.json');

  writeFileSync(
    filename,
    JSON.stringify({
      categories: { correctness: 'off' },
      jsPlugins: [{ name: '2digits', specifier: plugin }],
      rules: Object.fromEntries(manifest.rules.map((name) => [`2digits/${name}`, 'warn'])),
      overrides: manifest.overrides,
    }),
  );

  return filename;
}

function lint(directory: string, configuration: string, flags: Array<string> = []): string {
  return execute(
    process.execPath,
    [
      cli,
      `--config=${configuration}`,
      '--threads=1',
      '--disable-nested-config',
      '--no-ignore',
      ...flags,
      ...files(directory).map((file) => path.relative(directory, file)),
    ],
    directory,
  );
}

function diagnostics(directory: string, configuration: string, fix = false): CliOutput['diagnostics'] {
  const result = JSON.parse(lint(directory, configuration, ['--format=json', ...(fix ? ['--fix'] : [])])) as CliOutput;

  assert.ok(
    result.diagnostics.every((entry) => entry.severity !== 'error'),
    'Corpus contains a parse or plugin error',
  );

  return result.diagnostics.toSorted((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

function median(values: Array<number>): number {
  const value = values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)];

  assert.ok(value !== undefined && Number.isFinite(value), 'Missing or non-finite timing measurement');

  return value;
}

function measure(plugin: string) {
  const configuration = config(plugin);

  const source = path.join(state, 'corpus');

  lint(source, configuration, ['--format=json']);

  const samples: Array<Sample> = [];

  for (let pass = 0; pass < repetitions; pass++) {
    const start = performance.now();

    const output = lint(source, configuration, ['--format=default', '--debug=timings']);

    samples.push({
      wall: performance.now() - start,
      runtime: Number(/Total:\s+([\d.]+)ms/.exec(output)?.[1]),
      callbacks: Number(/Rule callbacks:\s+([\d.]+)ms/.exec(output)?.[1]),
      rules: Object.fromEntries(
        output.matchAll(/^2digits\/(\S+)\s+([\d.]+)\s+[\d.]+%\s+(\d+)\s+js-plugin$/gm).map(([, name, ms, calls]) => {
          assert.ok(name);

          return [name, { ms: Number(ms), calls: Number(calls) }] as const;
        }),
      ),
    });
  }

  return {
    wall: median(samples.map((sample) => sample.wall)),
    runtime: median(samples.map((sample) => sample.runtime)),
    callbacks: median(samples.map((sample) => sample.callbacks)),
    rules: Object.fromEntries(
      manifest.rules.map((name) => {
        const timings = samples.map((sample) => {
          const timing = sample.rules[name];

          assert.ok(timing, `Missing timing for ${name}`);

          return timing;
        });

        return [name, { ms: median(timings.map((timing) => timing.ms)), calls: timings.at(0)?.calls }];
      }),
    ),
    samples,
  };
}

function differential(plugin: string, label: string) {
  const target = path.join(state, label);

  cpSync(path.join(state, 'corpus'), target, { recursive: true });

  const configuration = config(plugin);

  const before = diagnostics(target, configuration);

  const after = diagnostics(target, configuration, true);

  return { before, after, fixedHash: digest(target) };
}

if (process.argv[2] === 'freeze') {
  await freeze();
}

const manifest = JSON.parse(readFileSync(path.join(state, 'manifest.json'), 'utf8')) as Manifest;

assert.equal(digest(path.join(state, 'corpus')), manifest.corpusHash, 'Frozen corpus changed');

const baseline = path.join(state, 'baseline.mjs');

const candidate = path.join(pkg, 'dist/index.mjs');

const repetitions = Number(process.env.OXLINT_BENCH_RUNS ?? 7);

const oldResult = measure(baseline);

const newResult = measure(candidate);

const oldDiagnostics = differential(baseline, 'baseline-fixed');

const newDiagnostics = differential(candidate, 'candidate-fixed');

assert.deepEqual(newDiagnostics, oldDiagnostics, 'Diagnostics or fixed output changed');

const report = {
  ...manifest,
  overrides: undefined,
  repetitions,
  baseline: oldResult,
  candidate: newResult,
  reduction: 1 - newResult.runtime / oldResult.runtime,
  diagnostics: oldDiagnostics.before.length,
  fixedHash: oldDiagnostics.fixedHash,
};

writeFileSync(path.join(state, 'latest.json'), JSON.stringify(report, undefined, 2));

console.log(
  JSON.stringify(
    {
      files: report.files,
      snippets: report.snippets,
      diagnostics: report.diagnostics,
      baseline: oldResult.runtime,
      candidate: newResult.runtime,
      reduction: report.reduction,
      wallBefore: oldResult.wall,
      wallAfter: newResult.wall,
      differential: 'identical',
    },
    undefined,
    2,
  ),
);
