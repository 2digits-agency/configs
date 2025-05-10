import plugin, { configs } from 'eslint-plugin-jsonc';
import parser from 'jsonc-eslint-parser';

import { GLOB_JSON, GLOB_JSON5, GLOB_JSONC } from '../globs';
import type { TypedFlatConfigItem } from '../types';

export function jsonc(): Array<TypedFlatConfigItem> {
  return [
    ...configs['flat/base'].map((config) => ({ ...config, name: '2digits:jsonc/base' })),

    {
      name: '2digits:jsonc/json',
      files: [GLOB_JSON],
      ...SHARED_OPTIONS,
      rules: {
        ...collectRules(configs['flat/recommended-with-json']),
      },
    },
    {
      name: '2digits:jsonc/jsonc',
      files: [GLOB_JSONC],
      ...SHARED_OPTIONS,
      rules: {
        ...collectRules(configs['flat/recommended-with-jsonc']),
      },
    },
    {
      name: '2digits:jsonc/json5',
      files: [GLOB_JSON5],
      ...SHARED_OPTIONS,
      rules: {
        ...collectRules(configs['flat/recommended-with-json5']),
      },
    },

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
            order: [
              '$schema',
              'publisher',
              'name',
              'displayName',
              'version',
              'private',
              'description',
              'funding',
              'homepage',
              'repository',
              'bugs',
              'categories',
              'type',
              'main',
              'module',
              'types',
              'typesVersions',
              'bin',
              'files',
              'exports',
              'icon',
              'unpkg',
              'jsdelivr',
              'sideEffects',
              'activationEvents',
              'contributes',
              'scripts',
              'keywords',
              'author',
              'license',
              'workspaces',
              'dependencies',
              'devDependencies',
              'peerDependencies',
              'peerDependenciesMeta',
              'optionalDependencies',
              'packageManager',
              'engines',
              'pnpm',
              'overrides',
              'resolutions',
              'husky',
              'simple-git-hooks',
              'lint-staged',
              'eslintConfig',
              'prettier',
            ],
            pathPattern: '^$',
          },
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

type FlatConfigName = Extract<keyof typeof configs, `flat/${string}`>;

function collectRules(config: (typeof configs)[FlatConfigName]) {
  return Object.fromEntries(config.flatMap(({ rules }) => Object.entries(rules ?? {})));
}
