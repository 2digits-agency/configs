import config from './oxlint.config.mjs';

export default {
  ...config,
  rules: {
    ...config.rules,
    '2digits/no-eager-effect-mutation': 'error',
  },
};
