import { eslintCompatPlugin, type Plugin } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as Fn from 'effect/Function';
import * as R from 'effect/Record';

import { rules } from './rules';

export { rules } from './rules';

export type { PaddingLineOption } from './rules/padding-line-between-statements';

export type RuleName = keyof typeof rules;

const optInRules = new Set<RuleName>(['prefer-effect-filesystem', 'prefer-effect-path']);

export const recommendedRules = R.fromEntries(
  Fn.pipe(
    R.keys(rules) as Array<RuleName>,
    Arr.filter((rule) => !optInRules.has(rule)),
    Arr.map((rule) => [`2digits/${rule}`, 'error'] as const),
  ),
) as Partial<Record<`2digits/${RuleName}`, 'error'>>;

const plugin: Plugin = eslintCompatPlugin({
  meta: { name: '@2digits/oxlint-plugin' },
  rules,
});

export default plugin;
