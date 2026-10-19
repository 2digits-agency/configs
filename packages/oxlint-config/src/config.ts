import { createDefu, defu } from 'defu';
import { defineConfig, type OxlintConfig } from 'oxlint';

import { baseConfig } from './base';
import { typescriptConfig } from './typescript';

/**
 * Complete 2digits Oxlint configuration.
 */
export const twoDigits = defineConfig(defu(baseConfig, typescriptConfig));

/**
 * `defu` with Oxlint precedence; earlier arguments take precedence over later ones.
 *
 * Oxlint applies `extends` and `overrides` in array order, so the last matching entry wins: entries from preferred
 * configs are appended, where `defu` would prepend them. A rule entry is replaced as a whole, because concatenating two
 * `[severity, ...options]` tuples corrupts both.
 */
const mergeConfig = createDefu((config: Record<PropertyKey, unknown>, key, value: unknown, namespace) => {
  if (namespace === 'rules') {
    config[key] = value;

    return true;
  }

  if (namespace === '' && (key === 'extends' || key === 'overrides')) {
    config[key] = [config[key] ?? [], value].flat();

    return true;
  }

  return false;
});

/**
 * Extend the 2digits defaults with consumer configuration.
 *
 * Consumer configuration takes precedence over the defaults; later configs take precedence over earlier configs.
 *
 * @param configs Consumer configurations to merge into the defaults.
 */
export function withTwoDigits(...configs: Array<OxlintConfig>): OxlintConfig {
  return mergeConfig({ overrides: [] }, ...configs.toReversed(), twoDigits);
}
