import config from './oxlint.config.mjs';

export default {
  ...config,
  rules: { '2digits/require-managed-runtime-disposal': 'error' },
};
