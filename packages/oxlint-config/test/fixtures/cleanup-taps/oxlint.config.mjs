import withTwoDigits from '@2digits/oxlint-config';

export default withTwoDigits({
  ignorePatterns: [],
  options: { typeAware: false },
  rules: {
    '2digits/no-interruption-unsafe-cleanup-taps': 'error',
  },
});
