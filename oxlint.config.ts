import { withTwoDigits } from '@2digits/oxlint-config';

export default withTwoDigits({
  options: {
    reportUnusedDisableDirectives: 'allow',
  },
  ignorePatterns: [
    'packages/*/fixtures/**',
    'packages/*/test/fixtures/**',
    'packages/*/_fixtures/**',
    'packages/*/__snapshots__/**',
    'packages/*/src/types.gen.d.ts',
  ],
});
