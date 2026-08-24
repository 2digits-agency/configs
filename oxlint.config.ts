import lint from '@2digits/oxlint-config';

export default lint({
  options: {
    reportUnusedDisableDirectives: 'allow',
  },
  ignorePatterns: ['packages/**/_fixtures/**', 'packages/eslint-config/src/types.gen.d.ts'],
});
