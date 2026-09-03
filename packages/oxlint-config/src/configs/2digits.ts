import { defineConfig } from 'oxlint';

import { recommendedRules } from '@2digits/oxlint-plugin';

export const twoDigitsPluginConfig = defineConfig({
  jsPlugins: [
    {
      name: '2digits',
      specifier: import.meta.resolve('@2digits/oxlint-plugin'),
    },
  ],
  rules: recommendedRules,
});
