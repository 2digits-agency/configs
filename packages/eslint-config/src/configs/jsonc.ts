import plugin, { configs } from 'eslint-plugin-jsonc';
import * as parser from 'jsonc-eslint-parser';

import { GLOB_JSON, GLOB_JSON5, GLOB_JSONC } from '../globs';
import type { TypedFlatConfigItem } from '../types';
import { mergeRules } from '../utils';

export function jsonc(): Array<TypedFlatConfigItem> {
  return [
    ...configs['flat/base'].map((config) => ({ ...config, name: '2digits:jsonc/base' })),

    ...(
      [
        ['json', GLOB_JSON],
        ['jsonc', GLOB_JSONC],
        ['json5', GLOB_JSON5],
      ] as const
    ).map(([format, glob]) => ({
      name: `2digits:jsonc/${format}`,
      files: [glob],
      ...SHARED_OPTIONS,
      rules: mergeRules(configs[`flat/recommended-with-${format}`]),
    })),

    {
      name: '2digits:jsonc/package.json',
      ...SHARED_OPTIONS,
      files: ['**/package.json'],
      rules: {
        'jsonc/sort-array-values': [
          'error',
          {
            order: { type: 'asc' },
            pathPattern: '^files$',
          },
        ],
        'jsonc/sort-keys': [
          'error',
          {
            order: { type: 'asc' },
            pathPattern: '^(?:dev|peer|optional|bundled)?[Dd]ependencies(Meta)?$',
          },
          {
            order: ['types', 'import', 'module', 'require', 'default'],
            pathPattern: '^exports.*$',
          },
        ],
      },
    },

    {
      name: '2digits:jsonc/tsconfig.json',
      ...SHARED_OPTIONS,
      files: [
        '**/tsconfig.json',
        '**/tsconfig.*.json',
        '**/tsconfig-*.json',
        '**/jsconfig.json',
        '**/jsconfig.*.json',
        '**/jsconfig-*.json',
      ],
      rules: {
        'jsonc/sort-keys': [
          'error',
          {
            order: ['$schema', 'extends', 'compilerOptions', 'references', 'files', 'include', 'exclude'],
            pathPattern: '^$',
          },
          {
            order: [
              /* Projects */
              'incremental',
              'composite',
              'tsBuildInfoFile',
              'disableSourceOfProjectReferenceRedirect',
              'disableSolutionSearching',
              'disableReferencedProjectLoad',
              /* Language and Environment */
              'target',
              'lib',
              'jsx',
              'experimentalDecorators',
              'emitDecoratorMetadata',
              'jsxFactory',
              'jsxFragmentFactory',
              'jsxImportSource',
              'reactNamespace',
              'noLib',
              'useDefineForClassFields',
              'moduleDetection',
              /* Modules */
              'module',
              'rootDir',
              'moduleResolution',
              'baseUrl',
              'paths',
              'rootDirs',
              'typeRoots',
              'types',
              'allowUmdGlobalAccess',
              'moduleSuffixes',
              'allowImportingTsExtensions',
              'resolvePackageJsonExports',
              'resolvePackageJsonImports',
              'customConditions',
              'resolveJsonModule',
              'allowArbitraryExtensions',
              'noResolve',
              /* JavaScript Support */
              'allowJs',
              'checkJs',
              'maxNodeModuleJsDepth',
              /* Emit */
              'declaration',
              'declarationMap',
              'emitDeclarationOnly',
              'sourceMap',
              'inlineSourceMap',
              'outFile',
              'outDir',
              'removeComments',
              'noEmit',
              'importHelpers',
              'importsNotUsedAsValues',
              'downlevelIteration',
              'sourceRoot',
              'mapRoot',
              'inlineSources',
              'emitBOM',
              'newLine',
              'stripInternal',
              'noEmitHelpers',
              'noEmitOnError',
              'preserveConstEnums',
              'declarationDir',
              'preserveValueImports',
              /* Interop Constraints */
              'isolatedModules',
              'verbatimModuleSyntax',
              'allowSyntheticDefaultImports',
              'esModuleInterop',
              'preserveSymlinks',
              'forceConsistentCasingInFileNames',
              /* Type Checking */
              'strict',
              'strictBindCallApply',
              'strictFunctionTypes',
              'strictNullChecks',
              'strictPropertyInitialization',
              'allowUnreachableCode',
              'allowUnusedLabels',
              'alwaysStrict',
              'exactOptionalPropertyTypes',
              'noFallthroughCasesInSwitch',
              'noImplicitAny',
              'noImplicitOverride',
              'noImplicitReturns',
              'noImplicitThis',
              'noPropertyAccessFromIndexSignature',
              'noUncheckedIndexedAccess',
              'noUnusedLocals',
              'noUnusedParameters',
              'useUnknownInCatchVariables',
              /* Completeness */
              'skipDefaultLibCheck',
              'skipLibCheck',
            ],
            pathPattern: '^compilerOptions$',
          },
        ],
      },
    },

    ...configs['flat/prettier'].map((config) => ({ ...config, name: '2digits:jsonc/prettier' })),
  ];
}

const SHARED_OPTIONS = {
  languageOptions: {
    parser,
  },
  plugins: {
    jsonc: plugin,
  },
} satisfies Pick<TypedFlatConfigItem, 'plugins' | 'languageOptions'>;
