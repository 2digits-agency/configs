import { cwd } from 'node:process';

import { fixupConfigRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import eslint from '@eslint/js';
import { findWorkspaceDir } from '@pnpm/find-workspace-dir';
import type { ESLint, Linter } from 'eslint';
// import turbo from "eslint-config-turbo";
// import query from "@tanstack/eslint-plugin-query";
import jsdoc from 'eslint-plugin-jsdoc';
// @ts-expect-error Doesn't provide types
import storybook from 'eslint-plugin-storybook';
// import next from "eslint-config-next";
// import tailwind from "eslint-plugin-tailwindcss";
// @ts-expect-error Doesn't provide types
import unicorn from 'eslint-plugin-unicorn';
import { findUp } from 'find-up';
import tseslint from 'typescript-eslint';

import { tailwindFunctions } from '@2digits/constants';
import twoDigits from '@2digits/eslint-plugin';

import type { RuleOptions } from './types.gen';

const compat = new FlatCompat({
  recommendedConfig: eslint.configs.recommended, // optional unless you're using "eslint:recommended"
  allConfig: eslint.configs.all, // optional unless you're using "eslint:all"
});

const turbo = compat.extends('turbo');
const tanstack = compat.extends('plugin:@tanstack/eslint-plugin-query/recommended');
const next = compat.extends('plugin:@next/next/recommended');
const tailwind = compat.extends('plugin:tailwindcss/recommended');
const react = compat.extends('plugin:react/recommended', 'plugin:react-hooks/recommended');
const prettier = compat.extends('prettier');

const tailwindConfig = findUp(['tailwind.config.ts', 'tailwind.config.js']);
const workspaceRoot = findWorkspaceDir(cwd());

export interface MainConfig {
  rules?: RuleOptions;
  ignores?: string[];
}

type RulesRecord = Linter.RulesRecord & RuleOptions;

export interface TypedFlatConfig extends Linter.FlatConfig<RulesRecord> {}

export async function twoDigitsConfig(
  config: MainConfig = {},
  ...userConfigs: TypedFlatConfig[]
): Promise<TypedFlatConfig[]> {
  const rules: RuleOptions = {
    'jsdoc/require-jsdoc': ['error', { require: { FunctionDeclaration: false } }],
    'jsdoc/tag-lines': ['off'],

    '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': 'allow-with-description' }],
    '@typescript-eslint/consistent-type-exports': ['error'],
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        disallowTypeAnnotations: false,
        fixStyle: 'inline-type-imports',
      },
    ],
    '@typescript-eslint/no-empty-interface': ['error', { allowSingleExtends: true }],
    '@typescript-eslint/no-explicit-any': ['warn'],
    '@typescript-eslint/no-import-type-side-effects': ['error'],
    '@typescript-eslint/no-misused-promises': ['off'],
    '@typescript-eslint/no-confusing-void-expression': [
      'error',
      { ignoreArrowShorthand: true, ignoreVoidOperator: true },
    ],

    'unicorn/filename-case': ['off'],
    'unicorn/prefer-module': ['off'],
    'unicorn/prevent-abbreviations': ['off'],
    'unicorn/prefer-ternary': ['error', 'only-single-line'],
    'unicorn/no-useless-undefined': ['error', { checkArguments: false }],
    'unicorn/prefer-top-level-await': ['off'],

    '@next/next/no-html-link-for-pages': ['off'],

    'tailwindcss/classnames-order': ['off'],

    'react/prop-types': ['off'],
    'react/react-in-jsx-scope': ['off'],
    'react/jsx-curly-newline': ['off'],
    'react/jsx-newline': ['error', { prevent: false }],

    ...config.rules,
  };

  const configs = tseslint.config(
    eslint.configs.recommended,

    ...turbo,

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

    ...(fixupConfigRules(react as never) as never[]),

    ...(fixupConfigRules(next as never) as never[]),

    ...tailwind,

    ...tseslint.configs['strictTypeChecked'],

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

    { rules: rules as RulesRecord },

    {
      ignores: ['**/dist', '**/coverage', '**/.next', ...(config.ignores || [])],
    },

    ...userConfigs,

    ...prettier,
  );

  return configs as Linter.FlatConfig<RuleOptions & Linter.RulesRecord>[];
}
