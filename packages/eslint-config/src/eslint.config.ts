import { cwd } from 'node:process';

import { FlatCompat } from '@eslint/eslintrc';
import eslint from '@eslint/js';
import { findWorkspaceDir } from '@pnpm/find-workspace-dir';
import type { ESLint, Linter } from 'eslint';
// import query from "@tanstack/eslint-plugin-query";
import jsdoc from 'eslint-plugin-jsdoc';
// @ts-expect-error Doesn't provide types
import storybook from 'eslint-plugin-storybook';
// import next from "eslint-config-next";
// @ts-expect-error Doesn't provide types
import tailwind from 'eslint-plugin-tailwindcss/lib/config/flat-recommended.js';
// @ts-expect-error Doesn't provide types
import unicorn from 'eslint-plugin-unicorn';
import { findUp } from 'find-up';
import tseslint from 'typescript-eslint';

import { tailwindFunctions } from '@2digits/constants';
import twoDigits from '@2digits/eslint-plugin';

import type { Rules, TypedFlatConfigItem } from './types';
import type { RuleOptions } from './types.gen';

const compat = new FlatCompat({
  recommendedConfig: eslint.configs.recommended,
  allConfig: eslint.configs.all,
});

const tanstack = compat.extends('plugin:@tanstack/eslint-plugin-query/recommended');
const prettier = compat.extends('prettier');

const tailwindConfig = findUp(['tailwind.config.ts', 'tailwind.config.js']);
const workspaceRoot = findWorkspaceDir(cwd());

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

    '@next/next/no-html-link-for-pages': ['off'],

    'tailwindcss/classnames-order': ['off'],


    ...config.rules,
  };

  const configs = tseslint.config(
    ...tanstack,

    {
      plugins: {
        storybook: storybook as ESLint.Plugin,
      },
      files: ['**/*.stories.tsx'],
      rules: {
        'storybook/await-interactions': 'error',
        'storybook/context-in-play-function': 'error',
        'storybook/default-exports': 'error',
        'storybook/hierarchy-separator': 'warn',
        'storybook/no-redundant-story-name': 'warn',
        'storybook/prefer-pascal-case': 'warn',
        'storybook/story-exports': 'error',
        'storybook/use-storybook-expect': 'error',
        'storybook/use-storybook-testing-library': 'error',
      } satisfies RuleOptions,
    },

    jsdoc.configs['flat/recommended-typescript-error'],





    ...(tailwind as Linter.FlatConfig[]),

    ((unicorn as ESLint.Plugin).configs as Exclude<ESLint.Plugin['configs'], undefined>)[
      'flat/recommended'
    ] as Linter.FlatConfig,

    twoDigits.configs.recommended,

    {
      languageOptions: {
        parserOptions: {
          allowAutomaticSingleRunInference: true,
          tsconfigRootDir: await workspaceRoot,
          project: true,
        },
      },
      settings: {
        tailwindcss: {
          callees: tailwindFunctions,
          config: await tailwindConfig,
        },
      },
    },

    { rules } as never,

    ...userConfigs,

    ...prettier,
  );

  return configs as unknown as TypedFlatConfigItem[];
}
