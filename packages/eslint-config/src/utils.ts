import type { ParserOptions } from '@typescript-eslint/parser';
import type { Linter } from 'eslint';
import { type Awaitable, renamePluginsInRules } from 'eslint-flat-config-utils';

import { PluginNameMap } from './constants';
import type { TypedFlatConfigItem } from './types';

export async function interopDefault<T>(m: Awaitable<T>): Promise<T extends { default: infer U } ? U : T> {
  const resolved = await m;

  return ((resolved as Record<string, unknown>).default ?? resolved) as never;
}

export function mergeRules(configs: ReadonlyArray<{ readonly rules?: object }>): Linter.RulesRecord {
  return Object.fromEntries(configs.flatMap(({ rules }) => Object.entries(rules ?? {})));
}

export function renameRules(rules: object = {}): Linter.RulesRecord {
  return renamePluginsInRules(rules as Linter.RulesRecord, PluginNameMap);
}

export async function typeAwareLanguageOptions(
  parserOptions?: Partial<ParserOptions>,
): Promise<NonNullable<TypedFlatConfigItem['languageOptions']>> {
  return {
    parser: await interopDefault(import('@typescript-eslint/parser')),
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
      projectService: true,
      ...parserOptions,
    },
    sourceType: 'module',
  };
}
