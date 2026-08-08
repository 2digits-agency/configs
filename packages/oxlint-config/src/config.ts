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

/**
 * Extend the 2digits defaults with consumer configuration.
 *
 * Consumer configuration takes precedence over the defaults; later configs take precedence over earlier configs.
 *
 * @param configs Consumer configurations to merge into the defaults.
 */
export function withTwoDigits(...configs: Array<TwoDigitsConfig>): OxlintConfig {
  let config: TwoDigitsConfig = twoDigits;

  for (const overrides of configs) {
    config = defu(overrides, config);
  }

  return config as never as OxlintConfig;
}
