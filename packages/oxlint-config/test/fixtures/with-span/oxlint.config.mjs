import { recommendedRules } from '@2digits/oxlint-plugin';

export default {
  categories: { correctness: 'off' },
  jsPlugins: [{ name: '2digits', specifier: import.meta.resolve('@2digits/oxlint-plugin') }],
  rules: { '2digits/prefer-with-span': recommendedRules['2digits/prefer-with-span'] },
};
