import { defu } from 'defu';
import type { OxlintConfig } from 'oxlint';

import { baseConfig } from './base';
import { defineTypedConfig, type TypedOxlintConfig } from './types';
import { typescriptConfig } from './typescript';

export const twoDigits = defineTypedConfig(defu(baseConfig, typescriptConfig)) as OxlintConfig;

export function withTwoDigits(...configs: Array<TypedOxlintConfig>): OxlintConfig {
  const [config, ...rest] = configs;

  return defineTypedConfig(defu(config, ...rest, twoDigits)) as OxlintConfig;
}
