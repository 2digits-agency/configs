import type { Linter } from 'eslint';
import { describe, it } from 'vitest';

import { twoDigits } from '../src';
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

const CONFIG_PRESETS = {
  default: {},
  minimal: {
    css: false,
    depend: false,
    drizzle: false,
    graphql: false,
    next: false,
    pnpm: false,
    react: false,
    storybook: false,
    tailwind: false,
    tanstackQuery: false,
    tanstackRouter: false,
    ts: true,
    turbo: false,
    zod: false,
  },
  full: {
    css: true,
    depend: true,
    drizzle: true,
    graphql: true,
    next: true,
    pnpm: false,
    react: true,
    storybook: true,
    tailwind: true,
    tanstackQuery: true,
    tanstackRouter: true,
    ts: true,
    turbo: true,
    zod: true,
  },
  'react-only': {
    css: false,
    depend: true,
    drizzle: false,
    graphql: false,
    next: false,
    pnpm: false,
    react: true,
    storybook: false,
    tailwind: false,
    tanstackQuery: false,
    tanstackRouter: false,
    ts: true,
    turbo: false,
    zod: false,
  },
  'next-stack': {
    css: false,
    depend: true,
    drizzle: false,
    graphql: false,
    next: true,
    pnpm: false,
    react: true,
    storybook: false,
    tailwind: true,
    tanstackQuery: true,
    tanstackRouter: false,
    ts: true,
    turbo: false,
    zod: false,
  },
} as const;

describe('factory', () => {
  for (const [name, options] of Object.entries(CONFIG_PRESETS)) {
    it.concurrent(`preset: ${name}`, { timeout: 30_000 }, async ({ expect }) => {
      const config = await twoDigits(options);
      const serialized = serializeConfigs(config);

      await expect(JSON.stringify(serialized, undefined, 2)).toMatchFileSnapshot(
        `./__snapshots__/factory/${name}.snap.json`,
      );
    });
  }
});
