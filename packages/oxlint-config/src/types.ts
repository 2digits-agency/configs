import type { OxlintConfig, OxlintOverride } from 'oxlint';

import type { RuleOptions } from './types.gen';

export type { RuleName, RuleOptions } from './types.gen';

export type Rules = RuleOptions;

export interface TypedOxlintOverride extends Omit<OxlintOverride, 'rules'> {
  rules?: Rules;
}

export interface TypedOxlintConfig extends Omit<OxlintConfig, 'extends' | 'overrides' | 'rules'> {
  extends?: Array<TypedOxlintConfig>;
  overrides?: Array<TypedOxlintOverride>;
  rules?: Rules;
}

export function defineTypedConfig(config: TypedOxlintConfig) {
  return config;
}
