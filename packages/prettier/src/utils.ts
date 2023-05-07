import type { PrettierConfig } from '@trivago/prettier-plugin-sort-imports';

export function defineConfig<const TConfig extends PrettierConfig>(config: TConfig): TConfig {
  return config;
}
