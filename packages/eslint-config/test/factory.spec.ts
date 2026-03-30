import { fileURLToPath } from 'node:url';

import type { Linter } from 'eslint';
import { describe, it, vi } from 'vite-plus/test';

import type { TypedFlatConfigItem } from '../src/types';
import { factoryConfigPresets } from './presets';

const workspaceRoot = fileURLToPath(new URL('../../..', import.meta.url));
const detectedPackages = new Set(['turbo', 'typescript']);

vi.mock('local-pkg', () => ({
  isPackageExists(name: string) {
    return detectedPackages.has(name);
  },
}));

vi.mock('pkg-types', () => ({
  async findWorkspaceDir() {
    await Promise.resolve();

    return workspaceRoot;
  },
}));

const { twoDigits } = await import('../src');

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

function serializeLanguageOptions(
  languageOptions: TypedFlatConfigItem['languageOptions'],
): SerializedConfig['languageOptions'] | undefined {
  if (!languageOptions) {
    return undefined;
  }

  const lo: SerializedConfig['languageOptions'] = {};
  const { parser, parserOptions, globals, ecmaVersion, sourceType } = languageOptions;

  if (parser && typeof parser === 'object' && 'meta' in parser) {
    lo.parser = (parser.meta as { name?: string }).name ?? 'unknown';
  }

  if (parserOptions) {
    const sanitized = { ...(parserOptions as Record<string, unknown>) };

    if ('tsconfigRootDir' in sanitized) {
      sanitized.tsconfigRootDir = '<cwd>';
    }

    lo.parserOptions = sanitized;
  }

  if (globals && Object.keys(globals).length > 0) {
    lo.globals = { _count: Object.keys(globals).length };
  }

  if (ecmaVersion) {
    lo.ecmaVersion = ecmaVersion;
  }

  if (sourceType) {
    lo.sourceType = sourceType;
  }

  return Object.keys(lo).length > 0 ? lo : undefined;
}

function serializeRules(rules: TypedFlatConfigItem['rules']): Array<string> | undefined {
  if (!rules) {
    return undefined;
  }

  return Object.entries(rules as Linter.RulesRecord)
    .toSorted(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => {
      const severity = Array.isArray(value) ? value[0] : value;

      return severity === 'off' || severity === 0 ? `- ${name}` : name;
    });
}

function serializeConfigs(configs: Array<TypedFlatConfigItem>): Array<SerializedConfig> {
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

function withDeterministicOptions(options: Record<string, boolean | undefined>): Record<string, unknown> {
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

describe('factory', () => {
  it.concurrent.for(factoryConfigPresets)(
    'preset: $name',
    { timeout: 30_000 },
    async ({ name, options }, { expect }) => {
      const config = await twoDigits(withDeterministicOptions(options));
      const serialized = serializeConfigs(config);

      await expect(JSON.stringify(serialized, undefined, 2)).toMatchFileSnapshot(
        `./__snapshots__/factory/${name}.snap.json`,
      );
    },
  );
});
