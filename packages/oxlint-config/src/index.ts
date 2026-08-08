import type { DummyRuleMap } from 'oxlint';

import './rule-options';

export type { DummyRuleMap, DummyRuleMap as RuleMap, OxlintConfig, OxlintOverride } from 'oxlint';
export type RuleName = keyof DummyRuleMap;

export { twoDigits, type TwoDigitsConfig, withTwoDigits as default, withTwoDigits } from './config';
