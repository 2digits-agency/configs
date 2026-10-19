import * as findUp from 'empathic/find';
import { FlatConfigComposer } from 'eslint-flat-config-utils';
import { isPackageExists } from 'local-pkg';

import {
  antfu,
  boolean,
  comments,
  css,
  depend,
  drizzle,
  githubActions,
  graphql,
  ignores,
  javascript,
  jsdoc,
  jsonc,
  markdown,
  markdownDisables,
  next,
  node,
  pnpm,
  prettier,
  react,
  regexp,
  sonar,
  storybook,
  tailwind,
  tanstackQuery,
  tanstackRouter,
  toml,
  turbo,
  typescript,
  unicorn,
  vitest,
  yaml,
  zod,
} from './configs';
import { PluginNameMap, storybookPackages } from './constants';
import type {
  ConfigNames,
  OptionsCss,
  OptionsOverrides,
  OptionsTypeScriptWithTypes,
  OptionsWithDrizzle,
  OptionsWithFiles,
  OptionsWithIgnores,
  OptionsWithReact,
  OptionsWithStorybook,
  OptionsWithTailwind,
  OptionsWithVitest,
  TypedFlatConfigItem,
} from './types';

type SharedOptions<T = unknown> = T & {
  enable?: boolean;
};

interface ESLint2DigitsOptions {
  ignores?: OptionsWithIgnores;
  css?: SharedOptions<OptionsCss> | boolean;
  turbo?: SharedOptions<OptionsOverrides> | boolean;
  js?: OptionsOverrides;
  ts?: SharedOptions<OptionsTypeScriptWithTypes> | boolean;
  pnpm?: SharedOptions | boolean;
  graphql?: SharedOptions<OptionsWithFiles> | boolean;
  react?: SharedOptions<OptionsWithReact> | boolean;
  next?: SharedOptions<OptionsWithFiles> | boolean;
  tailwind?: SharedOptions<OptionsWithTailwind> | boolean;
  storybook?: SharedOptions<OptionsWithStorybook> | boolean;
  vitest?: SharedOptions<OptionsWithVitest> | boolean;
  tanstackQuery?: SharedOptions<OptionsOverrides> | boolean;
  tanstackRouter?: SharedOptions<OptionsOverrides> | boolean;
  drizzle?: SharedOptions<OptionsWithDrizzle> | boolean;
  depend?: SharedOptions | boolean;
  zod?: SharedOptions | boolean;
}

export function enabled<T extends SharedOptions>(options: T | boolean | undefined, defaults?: boolean): options is T {
  if (typeof options === 'boolean') {
    return options;
  }

  return options?.enable ?? defaults ?? false;
}

export function extractConfig<T>(options: SharedOptions<T> | undefined | boolean): T {
  if (typeof options === 'boolean' || options === undefined) {
    return {} as T;
  }

  const { enable: _, ...rest } = options;

  return rest as T;
}

function anyPackageExists(names: Array<string>): boolean {
  return names.some((name) => isPackageExists(name));
}

function optionalConfig<TOptions, TConfig>(
  options: SharedOptions<TOptions> | boolean | undefined,
  detected: boolean,
  config: (options: TOptions) => TConfig,
): TConfig | false {
  return enabled(options, detected) && config(extractConfig(options));
}

export async function twoDigits(
  options: ESLint2DigitsOptions = {},
  ...userConfig: Array<TypedFlatConfigItem>
): Promise<Array<TypedFlatConfigItem>> {
  const { overrides: _, ...typescriptOptions } = extractConfig(options.ts);

  return new FlatConfigComposer<TypedFlatConfigItem, ConfigNames>(
    ignores(options.ignores),
    javascript(options.js),
    boolean(),
    node(),
    comments(),
    jsdoc(),
    unicorn(),
    sonar(),
    regexp(),
    antfu(),
    jsonc(),
    toml(),
    yaml(),
    markdown(),
    githubActions(),
    optionalConfig(options.css, false, css),
    optionalConfig(options.depend, true, depend),
    optionalConfig(options.turbo, isPackageExists('turbo'), turbo),
    optionalConfig(options.ts, isPackageExists('typescript'), typescript),
    optionalConfig(options.react, isPackageExists('react'), (config) => react({ ...config, ...typescriptOptions })),
    optionalConfig(options.next, isPackageExists('next'), (config) => next({ ...config, ...typescriptOptions })),
    optionalConfig(options.storybook, anyPackageExists(storybookPackages), (config) =>
      storybook({ ...config, ...typescriptOptions }),
    ),
    optionalConfig(options.vitest, isPackageExists('vitest'), vitest),
    optionalConfig(options.tailwind, isPackageExists('tailwindcss'), tailwind),
    optionalConfig(
      options.tanstackQuery,
      anyPackageExists(['react-query', '@tanstack/react-query', '@tanstack/react-query-devtools']),
      tanstackQuery,
    ),
    optionalConfig(options.tanstackRouter, isPackageExists('@tanstack/react-router'), tanstackRouter),
    optionalConfig(options.drizzle, anyPackageExists(['drizzle-kit', 'drizzle-orm']), drizzle),
    optionalConfig(options.zod, isPackageExists('zod'), zod),
    optionalConfig(options.graphql, isPackageExists('graphql'), graphql),
    // The pnpm rules throw without a `pnpm-workspace.yaml`, so only a pnpm workspace enables them.
    optionalConfig(options.pnpm, findUp.file('pnpm-workspace.yaml') !== undefined, pnpm),
    ...userConfig,
    isPackageExists('prettier') && prettier(),
    markdownDisables(),
  )
    .renamePlugins(PluginNameMap)
    .toConfigs();
}
