import type { PrettierConfig } from '@ianvs/prettier-plugin-sort-imports';

export function defineConfig<TConfig extends PrettierConfig>(config: TConfig): TConfig {
  return config;
}
