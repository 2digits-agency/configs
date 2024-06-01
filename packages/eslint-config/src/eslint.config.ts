import { FlatCompat } from '@eslint/eslintrc';
import eslint from '@eslint/js';
import { findWorkspaceDir } from '@pnpm/find-workspace-dir';
// import query from "@tanstack/eslint-plugin-query";
// import next from "eslint-config-next";
import tseslint from 'typescript-eslint';

import twoDigits from '@2digits/eslint-plugin';

import type { Rules, TypedFlatConfigItem } from './types';
import type { RuleOptions } from './types.gen';

const compat = new FlatCompat({
  recommendedConfig: eslint.configs.recommended,
  allConfig: eslint.configs.all,
});

const tanstack = compat.extends('plugin:@tanstack/eslint-plugin-query/recommended');
const prettier = compat.extends('prettier');

const workspaceRoot = findWorkspaceDir(process.cwd());

export interface MainConfig {
  rules?: RuleOptions;
  ignores?: string[];
}

export async function twoDigitsConfig(
  config: MainConfig = {},
  ...userConfigs: TypedFlatConfigItem[]
): Promise<TypedFlatConfigItem[]> {
  const rules: Rules = {
    'jsdoc/require-jsdoc': ['error', { require: { FunctionDeclaration: false } }],
    'jsdoc/tag-lines': ['off'],

    'unicorn/filename-case': ['off'],
    'unicorn/prefer-module': ['off'],
    'unicorn/prevent-abbreviations': ['off'],
    'unicorn/prefer-ternary': ['error', 'only-single-line'],
    'unicorn/no-useless-undefined': ['error', { checkArguments: false }],
    'unicorn/prefer-top-level-await': ['off'],

    'tailwindcss/classnames-order': ['off'],

    ...config.rules,
  };

  const configs = tseslint.config(
    ...tanstack,

    twoDigits.configs.recommended,

    {
      languageOptions: {
        parserOptions: {
          allowAutomaticSingleRunInference: true,
          tsconfigRootDir: await workspaceRoot,
          project: true,
        },
      },
    },

    { rules } as never,

    ...(userConfigs as []),

    ...prettier,
  );

  return configs as unknown as TypedFlatConfigItem[];
}
