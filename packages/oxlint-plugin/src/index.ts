import { eslintCompatPlugin, type Plugin } from '@oxlint/plugins';
import * as R from 'effect/Record';

import { rules } from './rules';

export { rules } from './rules';

export type { PaddingLineOption } from './rules/padding-line-between-statements';

export type RuleName = keyof typeof rules;

const optInRules = new Set<RuleName>(['prefer-effect-filesystem', 'prefer-effect-path']);

export const recommendedRules = R.mapEntries(
  R.filter(rules, (_, key) => !optInRules.has(key as RuleName)),
  (_, key) => [`2digits/${key}`, 'error'] as const,
) satisfies Partial<Record<`2digits/${RuleName}`, 'error'>>;

const plugin: Plugin = eslintCompatPlugin({
  meta: { name: '@2digits/oxlint-plugin' },
  rules,
});

export default plugin;
