import type { PluginConfig } from '@trivago/prettier-plugin-sort-imports';
import type { Config } from 'prettier';

export function defineConfig<TConfig extends PluginConfig & Config>(config: TConfig): TConfig {
  return config;
}
