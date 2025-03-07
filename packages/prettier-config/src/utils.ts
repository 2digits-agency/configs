import type { PrettierConfig as ImportOrderConfig } from '@ianvs/prettier-plugin-sort-imports';
import { getPackageInfoSync } from 'local-pkg';
import type { Options } from 'prettier';
import type { PluginEmbedOptions } from 'prettier-plugin-embed';
import type { ShParserOptions } from 'prettier-plugin-sh';
import type { SqlFormatOptions } from 'prettier-plugin-sql';
import type { PluginOptions } from 'prettier-plugin-tailwindcss';
import type { PrettierTaploOptions } from 'prettier-plugin-toml';

import { devDependencies } from '../package.json';

const semverRegex = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;
const localTypescriptVersion = devDependencies.typescript.replace(semverRegex, '');

type PrettierConfigWithPlugins = Options
  & ImportOrderConfig
  & PluginOptions
  & SqlFormatOptions
  & PrettierTaploOptions
  & PluginEmbedOptions
  & Partial<ShParserOptions>;

/**
 * Define a Prettier configuration with plugins.
 *
 * @template TConfig The Prettier configuration with plugins.
 * @param config The Prettier configuration with plugins.
 * @returns The Prettier configuration with plugins.
 */
export function defineConfig<TConfig extends PrettierConfigWithPlugins>(config: TConfig): TConfig {
  return config;
}

/**
 * Get the version of the locally installed TypeScript.
 *
 * @returns The local TypeScript version, or the version specified in this [package.json](../package.json) file if
 *   TypeScript is not installed locally.
 */
export function getTypescriptVersion(): string {
  const ts = getPackageInfoSync('typescript');

  return ts?.version ?? localTypescriptVersion;
}
