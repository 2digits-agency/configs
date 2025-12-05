import type { TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function pnpm(): Promise<Array<TypedFlatConfigItem>> {
  const pnpm = await interopDefault(import('eslint-plugin-pnpm'));

  return [
    {
      name: '2digits:pnpm/package-json',
      files: ['package.json', '**/package.json'],
      languageOptions: {
        parser: await interopDefault(import('jsonc-eslint-parser')),
      },
      plugins: {
        pnpm,
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
        parser: await interopDefault(import('yaml-eslint-parser')),
      },
      plugins: {
        pnpm,
      },
      rules: {
        'pnpm/yaml-no-duplicate-catalog-item': 'error',
        'pnpm/yaml-no-unused-catalog-item': 'error',
        'pnpm/yaml-valid-packages': 'error',
        'pnpm/yaml-enforce-settings': [
          'error',
          {
            autofix: true,
            settings: {
              catalogMode: 'strict',
              savePrefix: '',
              preferWorkspacePackages: true,
              cleanupUnusedCatalogs: true,
            },
          },
        ],
      },
    },
  ];
}
