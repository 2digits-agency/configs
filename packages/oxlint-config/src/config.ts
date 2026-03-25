import { defu } from 'defu';

import { baseConfig } from './base';
import { defineTypedConfig, type TypedOxlintConfig } from './types';
import { typescriptConfig } from './typescript';

export const twoDigits = defineTypedConfig(defu(baseConfig, typescriptConfig));

export function withTwoDigits(...configs: Array<TypedOxlintConfig>): TypedOxlintConfig {
  const [config, ...rest] = configs;

  return defineTypedConfig(defu(config, ...rest, twoDigits));
}
