import { isPackageExists } from 'local-pkg';
import * as React from './rules/react';
import { typescript } from './rules/typescript';
import { unicorn } from './rules/unicorn';
import { defineConfig, tsconfigRootDir } from './utils';
import type { KnownExtensions } from 'eslint-define-config';

const isNextInProject = isPackageExists('next');

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
    isNextInProject && 'next',
    'plugin:unicorn/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:@typescript-eslint/strict',

    ...React.extendsConfig,

    'prettier',
  ].filter((a): a is KnownExtensions => !!a),
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
  },
  rules: {
    ...typescript,

    ...React.rules,

    ...unicorn,

    'sort-imports': ['off'],
  },
});
