import { defu } from 'defu';
import { defineConfig, type OxlintConfig } from 'oxlint';

import { baseConfig } from './base';
import { typescriptConfig } from './typescript';

export const twoDigits = defineConfig(defu(baseConfig, typescriptConfig));

export function withTwoDigits(...configs: Array<OxlintConfig>) {
  const [config, ...rest] = configs;

  return defineConfig(defu(config, ...rest, twoDigits));
}
