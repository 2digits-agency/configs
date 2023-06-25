import { findUpSync } from 'find-up';
import { dirname } from 'pathe';

import { defineConfig } from '../utils';

const workspaceRoot = findUpSync(['pnpm-workspace.yaml', 'pnpm-lock.yaml']);

const tsconfigRootDir = workspaceRoot && dirname(workspaceRoot);

export const typescript = defineConfig({
  parserOptions: {
    project: ['./tsconfig.json', './packages/*/tsconfig.json', './apps/*/tsconfig.json'],
    tsconfigRootDir,
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:@typescript-eslint/strict',
  ],
  parser: '@typescript-eslint/parser',
  rules: {
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
    '@typescript-eslint/no-misused-promises': 'off',
  },
});
