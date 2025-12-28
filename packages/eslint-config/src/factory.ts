import { FlatConfigComposer } from 'eslint-flat-config-utils';
import { isPackageExists } from 'local-pkg';
import { findWorkspaceDir } from 'pkg-types';

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
  turbo,
  typescript,
  unicorn,
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
  tailwind?: SharedOptions<OptionsOverrides> | boolean;
  storybook?: SharedOptions<OptionsWithStorybook> | boolean;
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

// eslint-disable-next-line sonar/cognitive-complexity
export async function twoDigits(
  options: ESLint2DigitsOptions = {},
  ...userConfig: Array<TypedFlatConfigItem>
): Promise<Array<TypedFlatConfigItem>> {
  let pnpmPromise;

  if (options.pnpm === undefined) {
    pnpmPromise = findWorkspaceDir();
  }

  let composer = new FlatConfigComposer<TypedFlatConfigItem, ConfigNames>(
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
    yaml(),
    markdown(),
    githubActions(),
  );

  if (enabled(options.css)) {
    composer = composer.append(css(extractConfig(options.css)));
  }

  if (enabled(options.depend, true)) {
    composer = composer.append(depend());
  }

  if (enabled(options.turbo, isPackageExists('turbo'))) {
    composer = composer.append(turbo(extractConfig(options.turbo)));
  }

  const { overrides, ...typescriptOptions } = extractConfig(options.ts);

  if (enabled(options.ts, isPackageExists('typescript'))) {
    composer = composer.append(typescript(extractConfig(options.ts)));
  }

  if (enabled(options.react, isPackageExists('react'))) {
    composer = composer.append(
      react({
        ...extractConfig(options.react),
        ...typescriptOptions,
      }),
    );
  }

  if (enabled(options.next, isPackageExists('next'))) {
    composer = composer.append(
      next({
        ...extractConfig(options.next),
        ...typescriptOptions,
      }),
    );
  }

  if (
    enabled(
      options.storybook,
      storybookPackages.some((pkg) => isPackageExists(pkg)),
    )
  ) {
    composer = composer.append(
      storybook({
        ...extractConfig(options.storybook),
        ...typescriptOptions,
      }),
    );
  }

  if (enabled(options.tailwind, isPackageExists('tailwindcss'))) {
    composer = composer.append(tailwind(extractConfig(options.tailwind)));
  }

  if (
    enabled(
      options.tanstackQuery,
      isPackageExists('react-query')
        || isPackageExists('@tanstack/react-query')
        || isPackageExists('@tanstack/react-query-devtools'),
    )
  ) {
    composer = composer.append(tanstackQuery(extractConfig(options.tanstackQuery)));
  }

  if (enabled(options.tanstackRouter, isPackageExists('@tanstack/react-router'))) {
    composer = composer.append(tanstackRouter(extractConfig(options.tanstackRouter)));
  }

  if (enabled(options.drizzle, isPackageExists('drizzle-kit') || isPackageExists('drizzle-orm'))) {
    composer = composer.append(drizzle(extractConfig(options.drizzle)));
  }

  if (enabled(options.zod, isPackageExists('zod'))) {
    composer = composer.append(zod(extractConfig(options.zod)));
  }

  if (enabled(options.graphql, isPackageExists('graphql'))) {
    composer = composer.append(graphql(extractConfig(options.graphql)));
  }

  if (enabled(options.pnpm, !!(await pnpmPromise))) {
    composer = composer.append(pnpm());
  }

  composer = composer.append(...userConfig);

  if (isPackageExists('prettier')) {
    composer = composer.append(prettier());
  }

  composer = composer.append(markdownDisables());

  return composer.renamePlugins(PluginNameMap).toConfigs();
}
