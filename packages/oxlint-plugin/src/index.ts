import { Plugin } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as R from 'effect/Record';

import { rules } from './rules';

export { rules } from './rules';

export type { NoManualTagComparisonOptions } from './rules/effect/no-manual-tag-comparison';

export type { PaddingLineOption } from './rules/padding-line-between-statements';

export type RuleName = keyof typeof rules;

const optInRules: ReadonlyArray<RuleName> = [
  'prefer-effect-filesystem',
  'prefer-effect-http-status',
  'prefer-effect-path',
];

const recommendedRuleNames = Arr.filter(R.keys(rules), (name) => !Arr.contains(optInRules, name));

export const recommendedRules: Record<`2digits/${string}`, 'error'> = R.fromEntries(
  Arr.map(recommendedRuleNames, (name) => [`2digits/${name}` as const, 'error' as const]),
);

/**
 * The plugin, with `configs.recommended` and `configs.all` for loading it by its package name.
 */
const plugin: Plugin.DefinedPlugin<typeof rules> = Plugin.define({
  name: '@2digits/oxlint-plugin',
  rules,
  recommended: { rules: recommendedRuleNames },
});

export default plugin;
