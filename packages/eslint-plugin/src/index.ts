import type { ESLint, Linter } from 'eslint';

import { version } from '../package.json';

import { recommended } from './configs/recommended';
import { rules } from './rules';

const plugin: ESLint.Plugin = {
  meta: {
    name: '@2digits',
    version,
  },
  rules,
  configs: {
    get recommended() {
      return {
        plugins: {
          '@2digits': plugin,
        },
        rules: recommended.rules,
      };
    },
  },
};

export default plugin;

type RuleDefinitions = (typeof plugin)['rules'];

export type RuleOptions = {
  [K in keyof RuleDefinitions]: RuleDefinitions[K]['defaultOptions'];
};

export type Rules = {
  [K in keyof RuleOptions]: Linter.RuleEntry<RuleOptions[K]>;
};
