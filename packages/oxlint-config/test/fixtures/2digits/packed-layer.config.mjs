import { recommendedRules } from '@2digits/oxlint-plugin';

export default {
  jsPlugins: [{ name: '2digits', specifier: import.meta.resolve('@2digits/oxlint-plugin') }],
  rules: {
    ...recommendedRules,
    ...(process.env.TEST_PACKED_OVERRIDE === '1' ? { '2digits/no-ignored-layer-override': 'error' } : {}),
  },
};
