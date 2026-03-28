import { defu } from 'defu';
import {
  defineConfig,
  type CustomGroupItemConfig,
  type OxfmtConfig,
  type SortGroupItemConfig,
  type SortImportsConfig,
} from 'oxfmt';

import { tailwindFunctions, ignorePatterns } from '@2digits/constants';

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
  internalPattern: ['@/', '~/', '#/'],
  newlinesBetween: true,
  order: 'asc',
  customGroups,
  groups,
};

export const twoDigits = defineConfig({
  printWidth: 120,
  trailingComma: 'all',
  bracketSameLine: true,
  singleQuote: true,
  embeddedLanguageFormatting: 'auto',
  sortPackageJson: { sortScripts: true },
  sortImports,
  sortTailwindcss: {
    functions: tailwindFunctions,
  },
  arrowParens: 'always',
  bracketSpacing: true,
  endOfLine: 'lf',
  htmlWhitespaceSensitivity: 'css',
  insertFinalNewline: true,
  jsdoc: {
    addDefaultToDescription: true,
    bracketSpacing: false,
    capitalizeDescriptions: true,
    commentLineStrategy: 'multiline',
    descriptionTag: false,
    descriptionWithDot: true,
    keepUnparsableExampleIndent: false,
    lineWrappingStyle: 'greedy',
    preferCodeFences: true,
    separateReturnsFromParam: true,
    separateTagGroups: false,
  },
  jsxSingleQuote: false,
  objectWrap: 'preserve',
  proseWrap: 'preserve',
  quoteProps: 'as-needed',
  semi: true,
  singleAttributePerLine: false,
  tabWidth: 2,
  useTabs: false,
  ignorePatterns,
} satisfies OxfmtConfig);

export function withTwoDigits(...configs: Array<OxfmtConfig>): OxfmtConfig {
  const [config, ...rest] = configs;

  return defu(config, ...rest, twoDigits);
}
