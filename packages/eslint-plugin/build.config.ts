import { MagicRegExpTransformPlugin } from 'magic-regexp/transform';
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['./src/index.ts'],

  declaration: true,

  rollup: {
    inlineDependencies: ['magic-regexp'],
  },

  hooks: {
    'rollup:options': (_ctx, config) => {
      config.plugins.push(MagicRegExpTransformPlugin.rollup());
    },
  },
});
