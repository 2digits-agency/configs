import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const oxlintBinary = fileURLToPath(new URL('../node_modules/oxlint/bin/oxlint', import.meta.url));

export const presetUrl = new URL('../dist/index.mjs', import.meta.url).href;

// Run the package's native binary and config loader even when launched by `vp test`.
const nativeEnvironment = { ...process.env };

delete nativeEnvironment.VP_VERSION;

delete nativeEnvironment.NAPI_RS_NATIVE_LIBRARY_PATH;

// Isolated temporary projects have no node_modules of their own.
nativeEnvironment.PATH = [fileURLToPath(new URL('../node_modules/.bin', import.meta.url)), nativeEnvironment.PATH].join(
  path.delimiter,
);

/**
 * Run the Oxlint CLI with the `oxlint.config.mjs` in `cwd`.
 *
 * @param cwd Directory containing `oxlint.config.mjs`.
 * @param args Files and flags passed to Oxlint.
 */
export function runOxlint(cwd: string, ...args: Array<string>) {
  const result = spawnSync(process.execPath, [oxlintBinary, '--config=oxlint.config.mjs', ...args], {
    cwd,
    encoding: 'utf8',
    env: nativeEnvironment,
  });

  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

/**
 * Write `files` to a new temporary directory, run `test` in it, and remove the directory afterwards.
 *
 * @param files File contents keyed by path relative to the directory.
 * @param test Receives the directory path.
 */
export function withTemporaryProject(files: Record<string, string>, test: (directory: string) => void) {
  const directory = mkdtempSync(path.join(tmpdir(), '2digits-oxlint-config-'));

  try {
    for (const [file, contents] of Object.entries(files)) {
      writeFileSync(path.join(directory, file), contents);
    }

    test(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
