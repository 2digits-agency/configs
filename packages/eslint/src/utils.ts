import type { ESLintConfig } from 'eslint-define-config';
import { findUpSync } from 'find-up';
import { dirname } from 'pathe';

export function defineConfig<const TConfig extends ESLintConfig>(config: TConfig): TConfig {
  return config;
}

const workspaceRoot = findUpSync(['pnpm-workspace.yaml', 'pnpm-lock.yaml']);

export const tsconfigRootDir = workspaceRoot && dirname(workspaceRoot);
