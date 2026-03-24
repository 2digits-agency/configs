import { withTwoDigits } from '@2digits/oxlint-config';

export default withTwoDigits({
  ignorePatterns: ['packages/*/fixtures/**', 'packages/*/_fixtures/**', 'packages/*/__snapshots__/**'],
});
