import jsoncParser from 'jsonc-eslint-parser';
import yamlParser from 'yaml-eslint-parser';

import type { TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function pnpm(): Promise<TypedFlatConfigItem[]> {
  const plugin = await interopDefault(import('eslint-plugin-pnpm'));

  return [
    {
      name: '2digits:pnpm/package-json',
      files: ['**/package.json'],
      languageOptions: {
        parser: jsoncParser,
      },
      plugins: {
        pnpm: plugin,
      },
      rules: {
        'pnpm/json-enforce-catalog': 'error',
        'pnpm/json-prefer-workspace-settings': 'error',
        'pnpm/json-valid-catalog': 'error',
      },
    },
    {
      name: '2digits:pnpm/pnpm-workspace-yaml',
      files: ['pnpm-workspace.yaml'],
      languageOptions: {
        parser: yamlParser,
      },
      plugins: {
        pnpm: plugin,
      },
      rules: {
        'pnpm/yaml-no-duplicate-catalog-item': 'error',
        'pnpm/yaml-no-unused-catalog-item': 'error',
      },
    },
  ];
}
