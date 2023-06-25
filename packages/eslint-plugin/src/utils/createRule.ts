import { ESLintUtils } from '@typescript-eslint/utils';

import { name, repository, version } from '../../package.json';

const createRule = ESLintUtils.RuleCreator(
  (rule) => `${repository.url}/blob/${name}@${version}/packages/eslint/src/rules/${rule}.ts`,
);

export { createRule };
