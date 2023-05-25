import type { PrettierConfig } from '@ianvs/prettier-plugin-sort-imports';

export interface TailwindPluginOptions {
  tailwindConfig?: string;
  tailwindAttributes?: string[];
  tailwindFunctions?: string[];
}

export type PrettierConfigWithPlugins = PrettierConfig & TailwindPluginOptions;

export function defineConfig<const TConfig extends PrettierConfigWithPlugins>(
  config: TConfig,
): TConfig {
  return config;
}
