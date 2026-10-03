import withTwoDigits from '@2digits/oxlint-config';

export default {
  lint: withTwoDigits({
    options: { typeAware: false, typeCheck: false },
    rules: { '2digits/no-stale-struct-evolve-keys': 'error' },
  }),
};
