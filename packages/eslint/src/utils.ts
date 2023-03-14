import type { ESLintConfig } from 'eslint-define-config';
import { findUpSync } from 'find-up';
import { dirname } from 'node:path';

export function defineConfig<TConfig extends ESLintConfig>(config: TConfig): TConfig {
  return config;
}

const workspaceRoot = findUpSync('pnpm-workspace.yaml');

export const tsconfigRootDir = workspaceRoot ? dirname(workspaceRoot) : undefined;
