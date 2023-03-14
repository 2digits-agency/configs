import { react } from './rules/react';
import { typescript } from './rules/typescript';
import { unicorn } from './rules/unicorn';
import { defineConfig, tsconfigRootDir } from './utils';

export default defineConfig({
  root: true,
  parserOptions: {
    sourceType: 'module',
    project: ['./packages/*/tsconfig.json', './apps/*/tsconfig.json'],
    tsconfigRootDir,
    cacheLifetime: {
      glob: 'Infinity',
    },
  },
  extends: [
    'eslint:recommended',
    'turbo',
    'plugin:unicorn/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:@typescript-eslint/strict',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
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
    react: {
      version: 'detect',
    },
  },
  rules: {
    ...typescript,

    ...react,

    ...unicorn,

    'sort-imports': ['off'],
  },
});
