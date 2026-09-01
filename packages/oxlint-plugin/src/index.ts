import { eslintCompatPlugin, type Plugin } from '@oxlint/plugins';

import { rules } from './rules';

export { rules } from './rules';

export type RuleName = keyof typeof rules;

export const recommendedRules = Object.fromEntries(
  Object.keys(rules).map((rule) => [`2digits/${rule}`, 'error'] as const),
) as Record<`2digits/${RuleName}`, 'error'>;

const plugin: Plugin = eslintCompatPlugin({
  meta: { name: '@2digits/oxlint-plugin' },
  rules,
});

export default plugin;
