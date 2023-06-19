import { next } from './rules/next';
import { react } from './rules/react';
import { tailwind } from './rules/tailwind';
import { typescript } from './rules/typescript';
import { unicorn } from './rules/unicorn';
import { defineConfig } from './utils';

export default defineConfig({
  root: true,
  parserOptions: {
    sourceType: 'module',
    cacheLifetime: {
      glob: 'Infinity',
    },

    ...typescript.parserOptions,
  },
  extends: [
    'eslint:recommended',
    'turbo',

    ...next.extends,

    ...tailwind.extends,

    ...unicorn.extends,

    ...typescript.extends,

    ...react.extends,

    'prettier',
  ],
  parser: typescript.parser,
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
    ...react.settings,

    ...tailwind.settings,
  },
  rules: {
    ...typescript.rules,

    ...react.rules,

    ...unicorn.rules,

    ...tailwind.rules,

    'sort-imports': ['off'],
    'max-params': ['warn'],
  },
});
