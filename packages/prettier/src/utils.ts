import type { PrettierConfig } from '@ianvs/prettier-plugin-sort-imports';
import { getPackageInfoSync } from 'local-pkg';

import { devDependencies } from '../package.json';

const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const localTypescriptVersion = devDependencies.typescript.replace(semverRegex, '');

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

export function getTypescriptVersion(): string {
  const ts = getPackageInfoSync('typescript');

  return ts?.version ?? localTypescriptVersion;
}
