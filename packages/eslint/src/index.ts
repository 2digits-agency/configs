import { next } from './rules/next';
import * as React from './rules/react';
import { typescript } from './rules/typescript';
import { unicorn } from './rules/unicorn';
import { defineConfig, tsconfigRootDir } from './utils';

export default defineConfig({
  root: true,
  parserOptions: {
    sourceType: 'module',
    project: ['./tsconfig.json', './packages/*/tsconfig.json', './apps/*/tsconfig.json'],
    tsconfigRootDir,
    cacheLifetime: {
      glob: 'Infinity',
    },
  },
  extends: [
    'eslint:recommended',
    'turbo',

    ...next,

    'plugin:tailwindcss/recommended',

    'plugin:unicorn/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:@typescript-eslint/strict',

    ...React.extendsConfig,

    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  env: {
    es6: true,
    node: true,
  },
  ignorePatterns: [
    'node_modules',
    'dist',
    'build',
    'coverage',
    'public',
    'tmp',
    'tmp-build',
    '!.prettierrc.js',
    'templates',
  ],
  settings: {
    ...React.settings,

    tailwindcss: {
      callees: ['tv', 'classnames', 'clsx', 'cn', 'cnBase'],
    },
  },
  rules: {
    ...typescript,

    ...React.rules,

    ...unicorn,

    'tailwindcss/classnames-order': ['off'],

    'sort-imports': ['off'],
    'max-params': ['warn'],
  },
});
