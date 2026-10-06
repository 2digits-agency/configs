import { defu } from 'defu';
import { defineConfig, type OxlintConfig } from 'oxlint';

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

  /**
   * Oxlint applies `overrides` in array order, so the last matching entry wins. Merging them with `defu` would prepend
   * each config's entries and hand precedence to the earliest config, so they are collected separately.
   */
  const extraOverrides = [];

  for (const { overrides = [], ...rest } of configs) {
    config = defu(rest, config);

    extraOverrides.push(...overrides);
  }

  return { ...config, overrides: [...(config.overrides ?? []), ...extraOverrides] };
}
