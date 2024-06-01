import type { FlatConfig } from '@typescript-eslint/utils/ts-eslint';
import type { ESLint, Linter } from 'eslint';

import { version } from '../package.json';

import { recommended } from './configs/recommended';
import { rules } from './rules';

const plugin = {
  meta: {
    name: '@2digits',
    version,
  },
  rules,
  configs: {
    recommended: {
      plugins: {
        get '@2digits'(): ESLint.Plugin {
          return plugin;
        },
        set '@2digits'(_) {},
      },
      rules: recommended.rules,
    },
  },
} satisfies FlatConfig.Plugin;

export default plugin;

type RuleDefinitions = (typeof plugin)['rules'];

export type RuleOptions = {
  [K in keyof RuleDefinitions]: RuleDefinitions[K]['defaultOptions'];
};

export type Rules = {
  [K in keyof RuleOptions]: Linter.RuleEntry<RuleOptions[K]>;
};
