import { defineConfig } from 'oxlint-flat-config';

import { twoDigitsPlugin } from '../../../src/configs/2digits.ts';

const [config] = twoDigitsPlugin();

// Load the production config and its built-plugin resolver; isolate this rule from unrelated policies.
export default defineConfig({
  ...config,
  rules: Object.fromEntries(
    Object.keys(config.rules).map((name) => [name, name === '2digits/no-uppercase-http-api-header' ? 'error' : 'off']),
  ),
});
