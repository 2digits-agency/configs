import { defu } from 'defu';
import { defineConfig, type OxlintConfig } from 'oxlint';

import { baseConfig } from './base';
import { typescriptConfig } from './typescript';

export const twoDigits = defineConfig(defu(baseConfig, typescriptConfig));

export function withTwoDigits(...configs: Array<OxlintConfig>) {
  return defineConfig(defu(twoDigits, ...configs));
}

export default twoDigits;
