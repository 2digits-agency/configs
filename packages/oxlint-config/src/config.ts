import { defineConfig, type OxlintConfig } from '@oxlint-types/define-config';
import { defu } from 'defu';

import { baseConfig } from './base';
import { typescriptConfig } from './typescript';

/**
 * Complete 2digits Oxlint configuration.
 */
export const twoDigits = defineConfig(defu(baseConfig, typescriptConfig));

/**
 * Extend the 2digits defaults with consumer configuration.
 *
 * Consumer configuration takes precedence over the defaults; later configs take precedence over earlier configs.
 *
 * @param configs Consumer configurations to merge into the defaults.
 */
export function withTwoDigits(...configs: Array<OxlintConfig>): OxlintConfig {
  let config: OxlintConfig = twoDigits;

  for (const overrides of configs) {
    config = defu(overrides, config);
  }

  return defineConfig(config);
}
