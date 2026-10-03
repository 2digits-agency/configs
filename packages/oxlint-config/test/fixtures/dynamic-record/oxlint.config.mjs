import withTwoDigits from '@2digits/oxlint-config';

export default withTwoDigits({
  env: { builtin: true },
  ignorePatterns: [],
  rules: { '2digits/no-unsafe-dynamic-record-key': 'error' },
});
