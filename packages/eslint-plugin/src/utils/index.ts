import { ESLintUtils } from '@typescript-eslint/utils';
import type { ESLintConfig } from 'eslint-define-config';

import { name, repository, version } from '../../package.json';

export const createRule = ESLintUtils.RuleCreator(
  (rule) => `${repository.url}/blob/${name}@${version}/packages/eslint/src/rules/${rule}.ts`,
);

export function defineConfig<TConfig extends ESLintConfig>(config: TConfig): TConfig {
  return config;
}
