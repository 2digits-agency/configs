import { defu } from 'defu';
import { defineConfig, type OxlintConfig } from 'oxlint';

import { baseConfig } from './base';
import { typescriptConfig } from './typescript';

/**
 * Complete 2digits Oxlint configuration.
 */
export const twoDigits = defineConfig(defu(baseConfig, typescriptConfig));

/**
 * An Oxlint configuration that may enable plugins registered by a binary patch.
 *
 * Oxlint's generated `plugins` union only lists the plugins compiled into the published binary. `effect-tsgo patch
 * --oxlint` adds `effecttsgo` to the binary and rewrites those declarations, so this type keeps such configs authorable
 * from packages whose own Oxlint install is unpatched.
 */
export interface TwoDigitsConfig extends Omit<OxlintConfig, 'extends' | 'plugins'> {
  extends?: Array<TwoDigitsConfig>;
  plugins?: Array<'effecttsgo' | NonNullable<OxlintConfig['plugins']>[number]>;
}

type Overrides = NonNullable<TwoDigitsConfig['overrides']>;

/**
 * Extend the 2digits defaults with consumer configuration.
 *
 * Consumer configuration takes precedence over the defaults; later configs take precedence over earlier configs.
 *
 * @param configs Consumer configurations to merge into the defaults.
 */
export function withTwoDigits(...configs: Array<TwoDigitsConfig>): TwoDigitsConfig {
  let config: TwoDigitsConfig = twoDigits;

  /**
   * Oxlint applies `overrides` in array order, so the last matching entry wins. Merging them with `defu` would prepend
   * each config's entries and hand precedence to the earliest config, so they are collected separately.
   */
  const extraOverrides: Overrides = [];

  for (const { overrides = [], ...rest } of configs) {
    config = defu(rest, config);
    extraOverrides.push(...overrides);
  }

  return { ...config, overrides: [...(config.overrides ?? []), ...extraOverrides] };
}
