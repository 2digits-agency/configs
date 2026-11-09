import { Plugin } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as R from 'effect/Record';
import * as Struct from 'effect/Struct';

import { rules } from './rules';

export { rules } from './rules';

export type { NoManualTagComparisonOptions } from './rules/effect/no-manual-tag-comparison';

export type { PaddingLineOption } from './rules/padding-line-between-statements';

export type RuleName = keyof typeof rules;

const optInRules: ReadonlyArray<RuleName> = ['prefer-effect-filesystem', 'prefer-effect-path'];

/**
 * Recommended rules that warn instead of erroring: worth seeing, but they name well-known values rather than catch
 * defects.
 */
const warnRules: ReadonlyArray<RuleName> = ['prefer-effect-http-status'];

const recommendedRuleNames = Arr.filter(R.keys(rules), (name) => !Arr.contains(optInRules, name));

export const recommendedRules: Record<`2digits/${string}`, 'error' | 'warn'> = R.fromEntries(
  Arr.map(recommendedRuleNames, (name) => [
    `2digits/${name}` as const,
    Arr.contains(warnRules, name) ? ('warn' as const) : ('error' as const),
  ]),
);

const name = '@2digits/oxlint-plugin';

const defined = Plugin.define({ name, rules, recommended: { rules: recommendedRuleNames } });

// `Plugin.define` gives every recommended rule one severity, so the warning rules come from a second definition.
const warnings = Plugin.define({ name, rules, recommended: { rules: warnRules, severity: 'warn' } });

/**
 * The plugin, with `configs.recommended` and `configs.all` for loading it by its package name.
 */
const plugin: Plugin.DefinedPlugin<typeof rules> = Struct.assign(defined, {
  configs: Struct.assign(defined.configs, {
    recommended: Struct.assign(defined.configs.recommended, {
      rules: Struct.assign(defined.configs.recommended.rules, warnings.configs.recommended.rules),
    }),
  }),
});

export default plugin;
