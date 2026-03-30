import fs from 'node:fs/promises';
import path from 'node:path';

import ts from 'dedent';
import { exec } from 'tinyexec';
import { glob } from 'tinyglobby';

import type { TypedFlatConfigItem } from '../src/types';

interface SerializedConfig {
  name?: string;
  files?: Array<string>;
  ignores?: Array<string>;
  plugins?: Array<string>;
  languageOptions?: {
    parser?: string;
    parserOptions?: unknown;
    globals?: Record<string, unknown>;
    ecmaVersion?: number | string;
    sourceType?: string;
  };
  settings?: Record<string, unknown>;
  rules?: Array<string>;
}

interface AutofixFixtureResult {
  readonly changedFiles: Record<string, string>;
}

export function fixtureSnapshotPath(kind: string, name: string): string {
  return `./__snapshots__/${kind}/${name}.snap.json`;
}

export function snapshotJson(value: unknown): string {
  return `${JSON.stringify(value, undefined, 2)}\n`;
}

export function serializeConfigs(configs: Array<TypedFlatConfigItem>): Array<SerializedConfig> {
  return configs.map((config) => {
    const serialized: SerializedConfig = {};

    if (config.name) {
      serialized.name = config.name;
    }

    if (config.files) {
      serialized.files = config.files.flat();
    }

    if (config.ignores) {
      serialized.ignores = config.ignores;
    }

    if (config.plugins) {
      serialized.plugins = Object.keys(config.plugins).toSorted();
    }

    const languageOptions = serializeLanguageOptions(config.languageOptions);

    if (languageOptions) {
      serialized.languageOptions = languageOptions;
    }

    if (config.settings && Object.keys(config.settings).length > 0) {
      serialized.settings = config.settings;
    }

    const rules = serializeRules(config.rules);

    if (rules) {
      serialized.rules = rules;
    }

    return serialized;
  });
}

export function withDeterministicOptions(
  options: Record<string, boolean | undefined>,
  workspaceRoot: string,
): Record<string, unknown> {
  return {
    ...options,
    ignores: {
      gitIgnore: {
        cwd: workspaceRoot,
        files: ['.gitignore'],
      },
    },
  };
}

export async function runAutofixFixture({
  cwd,
  options,
  sourceDir,
}: {
  cwd: string;
  options: Record<string, boolean | undefined>;
  sourceDir: string;
}): Promise<AutofixFixtureResult> {
  await fs.rm(cwd, { recursive: true, force: true });
  await fs.cp(sourceDir, cwd, {
    recursive: true,
    filter(sourcePath) {
      return !sourcePath.includes('node_modules');
    },
  });

  await fs.writeFile(path.join(cwd, 'eslint.config.ts'), generateConfigContent(options));

  await exec('eslint', ['.', '--fix'], {
    nodeOptions: { cwd, stdio: 'pipe' },
    throwOnError: true,
  });

  const files = await glob('**/*', {
    cwd,
    ignore: ['node_modules', 'eslint.config.ts'],
  });
  const changedFiles: Record<string, string> = {};

  for (const file of files.toSorted()) {
    const [content, source] = await Promise.all([
      fs.readFile(path.join(cwd, file), 'utf8'),
      fs.readFile(path.join(sourceDir, file), 'utf8'),
    ]);

    if (content !== source) {
      changedFiles[file] = content;
    }
  }

  return { changedFiles };
}

function generateConfigContent(options: Record<string, boolean | undefined>): string {
  const optionsLines = Object.entries(options)
    .map(([key, value]) => `      ${key}: ${value},`)
    .join('\n');

  return ts`
    import { twoDigits } from '@2digits/eslint-config';

    export default twoDigits({
      ignores: {
        gitIgnore: {
          cwd: '.',
        },
      },
${optionsLines}
    });
  `;
}

function serializeLanguageOptions(
  languageOptions: TypedFlatConfigItem['languageOptions'],
): SerializedConfig['languageOptions'] | undefined {
  if (!languageOptions) {
    return undefined;
  }

  const serialized: NonNullable<SerializedConfig['languageOptions']> = {};
  const { parser, parserOptions, globals, ecmaVersion, sourceType } = languageOptions;

  if (parser && typeof parser === 'object' && 'meta' in parser) {
    serialized.parser = parser.meta?.name ?? 'unknown';
  }

  if (parserOptions && typeof parserOptions === 'object') {
    const sanitizedParserOptions: Record<string, unknown> = { ...parserOptions };

    if ('tsconfigRootDir' in sanitizedParserOptions) {
      sanitizedParserOptions.tsconfigRootDir = '<cwd>';
    }

    serialized.parserOptions = sanitizedParserOptions;
  }

  if (globals && Object.keys(globals).length > 0) {
    serialized.globals = { _count: Object.keys(globals).length };
  }

  if (ecmaVersion) {
    serialized.ecmaVersion = ecmaVersion;
  }

  if (sourceType) {
    serialized.sourceType = sourceType;
  }

  return Object.keys(serialized).length > 0 ? serialized : undefined;
}

function serializeRules(rules: TypedFlatConfigItem['rules']): Array<string> | undefined {
  if (!rules) {
    return undefined;
  }

  return Object.entries(rules)
    .toSorted(([leftName], [rightName]) => leftName.localeCompare(rightName))
    .map(([name, _value]) => {
      const value = _value as (typeof rules)[keyof typeof rules];
      const severity = Array.isArray(value) ? value[0] : value;

      return severity === 'off' || severity === 0 ? `- ${name}` : name;
    });
}
