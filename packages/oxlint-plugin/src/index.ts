import { eslintCompatPlugin, type Plugin } from '@oxlint/plugins';

import { rules } from './rules';

export { rules } from './rules';

export type { PaddingLineOption } from './rules/padding-line-between-statements';

export type RuleName = keyof typeof rules;

const optInRules = new Set<RuleName>(['prefer-effect-filesystem', 'prefer-effect-path']);

export const recommendedRules = Object.fromEntries(
  (Object.keys(rules) as Array<RuleName>)
    .filter((rule) => !optInRules.has(rule))
    .map((rule) => [`2digits/${rule}`, 'error'] as const),
) as Partial<Record<`2digits/${RuleName}`, 'error'>>;

const plugin: Plugin = eslintCompatPlugin({
  meta: { name: '@2digits/oxlint-plugin' },
  rules,
});

export default plugin;
