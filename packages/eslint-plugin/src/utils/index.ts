import { ESLintUtils } from '@typescript-eslint/utils';

const blobUrl = 'https://github.com/2digits-agency/configs/tree/main/packages/eslint-plugin/src/rules';

export const createRule = ESLintUtils.RuleCreator((name) => `${blobUrl}/${name}.ts`);
