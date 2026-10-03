import { twoDigitsPluginConfig } from '../../../src/configs/2digits.ts';

// Load the production config and its built-plugin resolver; isolate this rule from unrelated policies.
export default {
  ...twoDigitsPluginConfig,
  rules: Object.fromEntries(
    Object.keys(twoDigitsPluginConfig.rules).map((name) => [
      name,
      name === '2digits/no-uppercase-http-api-header' ? 'error' : 'off',
    ]),
  ),
};
