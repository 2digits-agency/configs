import type { ESLintConfig } from 'eslint-define-config';

export function defineConfig<const TConfig extends ESLintConfig>(config: TConfig): TConfig {
  return config;
}
