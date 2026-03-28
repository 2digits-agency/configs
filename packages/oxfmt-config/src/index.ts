import {
  defineConfig,
  type CustomGroupItemConfig,
  type OxfmtConfig,
  type SortGroupItemConfig,
  type SortImportsConfig,
} from 'oxfmt';

import { tailwindFunctions } from '@2digits/constants';

const customGroups: Array<CustomGroupItemConfig> = [
  {
    groupName: 'react',
    elementNamePattern: ['react', 'react/**'],
  },
  {
    groupName: 'react-native',
    elementNamePattern: ['react-native', 'react-native/**'],
  },
  {
    groupName: 'next',
    elementNamePattern: ['next', 'next/**'],
  },
  {
    groupName: 'expo',
    elementNamePattern: ['expo', 'expo-*', '@expo/**'],
  },
  {
    groupName: 'two-digits',
    elementNamePattern: ['@2digits/**'],
  },
  {
    groupName: 'mod',
    elementNamePattern: ['@mod/**'],
  },
  {
    groupName: 'internal-alias',
    elementNamePattern: ['@/**'],
  },
  {
    groupName: 'scoped-alias',
    elementNamePattern: ['@[A-Z]*', '@[A-Z]*/**'],
  },
  {
    groupName: 'json',
    elementNamePattern: ['*.json', '**/*.json'],
  },
];

const groups: Array<SortGroupItemConfig> = [
  ['type-builtin', 'builtin'],
  'react',
  'react-native',
  'next',
  'expo',
  ['type-external', 'external', 'unknown'],
  ['two-digits', 'mod'],
  'internal-alias',
  'scoped-alias',
  'json',
  ['type-parent', 'type-sibling', 'type-index', 'parent', 'sibling', 'index'],
];

const sortImports: SortImportsConfig = {
  ignoreCase: false,
  partitionByComment: true,
  sortSideEffects: false,
  internalPattern: ['@/', '~/'],
  customGroups,
  groups,
};

export default defineConfig({
  printWidth: 120,
  trailingComma: 'all',
  bracketSameLine: true,
  singleQuote: true,
  embeddedLanguageFormatting: 'off',
  sortPackageJson: false,
  sortImports,
  sortTailwindcss: {
    functions: tailwindFunctions,
  },
} satisfies OxfmtConfig);
