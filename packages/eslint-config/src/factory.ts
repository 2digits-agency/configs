import { FlatConfigComposer } from 'eslint-flat-config-utils';
import { isPackageExists } from 'local-pkg';

import {
  antfu,
  comments,
  graphql,
  ignores,
  javascript,
  jsdoc,
  jsonc,
  next,
  node,
  prettier,
  react,
  regexp,
  sonar,
  storybook,
  tailwind,
  tanstack,
  turbo,
  typescript,
  unicorn,
} from './configs';
import { drizzle } from './configs/drizzle';
import { PluginNameMap } from './constants';
import type {
  ConfigNames,
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
  turbo?: SharedOptions<OptionsOverrides> | boolean;
  js?: OptionsOverrides;
  ts?: SharedOptions<OptionsTypeScriptWithTypes> | boolean;
  graphql?: SharedOptions<OptionsWithFiles> | boolean;
  react?: SharedOptions<OptionsWithReact> | boolean;
  next?: SharedOptions<OptionsWithFiles> | boolean;
  tailwind?: SharedOptions<OptionsOverrides> | boolean;
  storybook?: SharedOptions<OptionsWithStorybook> | boolean;
  tanstack?: SharedOptions<OptionsOverrides> | boolean;
  drizzle?: SharedOptions<OptionsWithDrizzle> | boolean;
}

function enabled<T extends SharedOptions>(options: T | boolean | undefined, defaults?: boolean): options is T {
  if (typeof options === 'boolean') {
    return options;
  }

  return options?.enable ?? defaults ?? false;
}

function config<T>(options: SharedOptions<T> | undefined | boolean): T {
  if (typeof options === 'boolean' || options === undefined) {
    return {} as T;
  }

  const { enable, ...rest } = options;
  return rest as T;
}

export function twoDigits(
  options: ESLint2DigitsOptions = {},
  ...userConfig: TypedFlatConfigItem[]
): Promise<TypedFlatConfigItem[]> {
  let composer = new FlatConfigComposer<TypedFlatConfigItem, ConfigNames>(
    ignores(options.ignores),
    javascript(options.js),
    node(),
    comments(),
    jsdoc(),
    unicorn(),
    sonar(),
    regexp(),
    antfu(),
    jsonc(),
  );

  if (enabled(options.turbo, isPackageExists('turbo'))) {
    composer = composer.append(turbo(config(options.turbo)));
  }

  const { overrides, ...typescriptOptions } = config(options.ts);

  if (enabled(options.ts, isPackageExists('typescript'))) {
    composer = composer.append(typescript(config(options.ts)));
  }

  if (enabled(options.react, isPackageExists('react'))) {
    composer = composer.append(
      react({
        ...config(options.react),
        ...typescriptOptions,
      }),
    );
  }

  if (enabled(options.next, isPackageExists('next'))) {
    composer = composer.append(
      next({
        ...config(options.next),
        ...typescriptOptions,
      }),
    );
  }

  if (enabled(options.storybook, isPackageExists('storybook'))) {
    composer = composer.append(
      storybook({
        ...config(options.storybook),
        ...typescriptOptions,
      }),
    );
  }

  if (enabled(options.tailwind, isPackageExists('tailwindcss'))) {
    composer = composer.append(tailwind(config(options.tailwind)));
  }

  if (
    enabled(
      options.tanstack,
      isPackageExists('react-query')
        || isPackageExists('@tanstack/react-query')
        || isPackageExists('@tanstack/react-query-devtools'),
    )
  ) {
    composer = composer.append(tanstack(config(options.tanstack)));
  }

  if (enabled(options.drizzle, isPackageExists('drizzle-kit') || isPackageExists('drizzle-orm'))) {
    composer = composer.append(drizzle(config(options.drizzle)));
  }

  if (enabled(options.graphql, isPackageExists('graphql'))) {
    composer = composer.append(graphql(config(options.graphql)));
  }

  composer = composer.append(...userConfig);

  if (isPackageExists('prettier')) {
    composer = composer.append(prettier());
  }

  return composer.renamePlugins(PluginNameMap).toConfigs();
}
