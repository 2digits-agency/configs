import type { FlatConfig } from '@typescript-eslint/utils/ts-eslint';
import type { Linter } from 'eslint';

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
      plugins: { '@2digits': {} as FlatConfig.Plugin },
      rules: recommended.rules,
    },
  },
};

plugin.configs.recommended.plugins['@2digits'] = plugin;

export default plugin;

type RuleDefinitions = (typeof plugin)['rules'];

export type RuleOptions = {
  [K in keyof RuleDefinitions]: Exclude<RuleDefinitions[K]['defaultOptions'], undefined>;
};

export type Rules = {
  [K in keyof RuleOptions]: Linter.RuleEntry<RuleOptions[K]>;
};
