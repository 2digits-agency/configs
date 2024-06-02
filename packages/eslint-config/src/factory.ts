import type { FlatGitignoreOptions } from 'eslint-config-flat-gitignore';
import { FlatConfigComposer } from 'eslint-flat-config-utils';
import { isPackageExists } from 'local-pkg';

import {
  comments,
  ignores,
  javascript,
  jsdoc,
  next,
  node,
  prettier,
  react,
  storybook,
  tailwind,
  tanstack,
  turbo,
  typescript,
  unicorn,
} from './configs';
import { PluginNameMap } from './constants';
import type {
  ConfigNames,
  OptionsOverrides,
  OptionsTypeScriptWithTypes,
  OptionsWithFiles,
  OptionsWithStorybook,
  TypedFlatConfigItem,
} from './types';

type SharedOptions<T = unknown> = T & {
  enable?: boolean;
};

interface ESLint2DigitsOptions {
  ignores?: FlatGitignoreOptions;
  turbo?: SharedOptions<OptionsOverrides> | boolean;
  js?: OptionsOverrides;
  ts?: SharedOptions<OptionsTypeScriptWithTypes> | boolean;
  react?: SharedOptions<OptionsWithFiles> | boolean;
  next?: SharedOptions<OptionsWithFiles> | boolean;
  tailwind?: SharedOptions<OptionsOverrides> | boolean;
  storybook?: SharedOptions<OptionsWithStorybook> | boolean;
  tanstack?: SharedOptions<OptionsOverrides> | boolean;
}

function enabled<T extends SharedOptions>(
  options: T | boolean | undefined,
  defaults?: boolean | undefined,
): options is T {
  if (typeof options === 'boolean') return options;
  return options?.enable ?? defaults ?? false;
}

function config<T>(options: SharedOptions<T> | undefined | boolean): T {
  if (typeof options === 'boolean' || options === undefined) return {} as T;
  const { enable: _, ...rest } = options;
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
  );

  if (enabled(options.turbo, isPackageExists('turbo'))) {
    composer = composer.append(turbo(config(options.turbo)));
  }

  const { overrides: _, ...typescriptOptions } = config(options.ts);

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
      isPackageExists('react-query') ||
        isPackageExists('@tanstack/react-query') ||
        isPackageExists('@tanstack/react-query-devtools'),
    )
  ) {
    composer = composer.append(tanstack(config(options.tanstack)));
  }

  composer = composer.append(...userConfig);

  if (isPackageExists('prettier')) {
    composer = composer.append(prettier());
  }

  return composer.renamePlugins(PluginNameMap).toConfigs();
}