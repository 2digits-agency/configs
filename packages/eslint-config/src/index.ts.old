import { jsdoc } from './rules/jsdoc';
import { next } from './rules/next';
import { react } from './rules/react';
import { storybook } from './rules/storybook';
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
  plugins: [...typescript.plugins, ...storybook.plugins],
  extends: [
    'eslint:recommended',
    'turbo',
    'plugin:@tanstack/eslint-plugin-query/recommended',

    ...jsdoc.extends,

    ...next.extends,

    ...tailwind.extends,

    ...unicorn.extends,

    ...typescript.extends,

    'plugin:@2digits/recommended',

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
    ...jsdoc.rules,

    ...typescript.rules,

    ...react.rules,

    ...unicorn.rules,

    ...tailwind.rules,

    'sort-imports': ['off'],
    'max-params': ['warn'],
  },
  overrides: [...storybook.overrides],
});
