import { isPackageExists } from 'local-pkg';
import { defineConfig } from 'oxlint-flat-config';

import {
  antfu,
  boolean,
  depend,
  drizzle,
  ignores,
  imports,
  javascript,
  jsdoc,
  next,
  node,
  oxc,
  react,
  regexp,
  sonar,
  storybook,
  tailwind,
  tanstackQuery,
  tanstackRouter,
  turbo,
  twoDigitsPlugin,
  typescript,
  unicorn,
  vitest,
  zod,
} from './configs';
import type {
  ConfigInput,
  FlatConfigItem,
  OptionsOverrides,
  OptionsWithDrizzle,
  OptionsWithFiles,
  OptionsWithIgnores,
  OptionsWithStorybook,
  OptionsWithTailwind,
  OptionsWithVitest,
  OxlintConfig,
} from './types';

type SharedOptions<T = unknown> = T & {
  enable?: boolean;
};

interface Oxlint2DigitsOptions {
  ignores?: OptionsWithIgnores;
  turbo?: SharedOptions<OptionsOverrides> | boolean;
  js?: OptionsOverrides;
  ts?: SharedOptions<OptionsOverrides> | boolean;
  react?: SharedOptions<OptionsWithFiles> | boolean;
  next?: SharedOptions<OptionsWithFiles> | boolean;
  tailwind?: SharedOptions<OptionsWithTailwind> | boolean;
  storybook?: SharedOptions<OptionsWithStorybook> | boolean;
  vitest?: SharedOptions<OptionsWithVitest> | boolean;
  tanstackQuery?: SharedOptions<OptionsOverrides> | boolean;
  tanstackRouter?: SharedOptions<OptionsOverrides> | boolean;
  drizzle?: SharedOptions<OptionsWithDrizzle> | boolean;
  depend?: SharedOptions | boolean;
  zod?: SharedOptions<OptionsOverrides> | boolean;
}

const storybookPackages = [
  'storybook',
  '@storybook/nextjs',
  '@storybook/nextjs-vite',
  '@storybook/react-vite',
  '@storybook/react-webpack5',
  '@storybook/react-native-web-vite',
];

function enabled<T extends SharedOptions>(options: T | boolean | undefined, defaults?: boolean): options is T {
  if (typeof options === 'boolean') {
    return options;
  }

  return options?.enable ?? defaults ?? false;
}

function extractConfig<T>(options: SharedOptions<T> | undefined | boolean): T {
  if (typeof options === 'boolean' || options === undefined) {
    return {} as T;
  }

  const { enable: _, ...rest } = options;

  return rest as T;
}

/**
 * Build the 2digits Oxlint config, followed by consumer flat config objects.
 *
 * @param options Toggles and rule overrides for the built-in configs; integrations default to whether their package is
 *   installed.
 * @param userConfig Flat config objects applied after the built-in configs, so later objects win.
 */
export function twoDigits(options: Oxlint2DigitsOptions = {}, ...userConfig: Array<ConfigInput>): OxlintConfig {
  const configs: Array<Array<FlatConfigItem>> = [
    ignores(options.ignores),
    javascript(options.js),
    boolean(),
    node(),
    jsdoc(),
    unicorn(),
    sonar(),
    regexp(),
    antfu(),
    imports(),
    oxc(),
    twoDigitsPlugin(),
  ];

  if (enabled(options.depend, true)) {
    configs.push(depend());
  }

  if (enabled(options.turbo, isPackageExists('turbo'))) {
    configs.push(turbo(extractConfig(options.turbo)));
  }

  if (enabled(options.ts, isPackageExists('typescript'))) {
    configs.push(typescript(extractConfig(options.ts)));
  }

  if (enabled(options.react, isPackageExists('react'))) {
    configs.push(react(extractConfig(options.react)));
  }

  if (enabled(options.next, isPackageExists('next'))) {
    configs.push(next(extractConfig(options.next)));
  }

  if (
    enabled(
      options.storybook,
      storybookPackages.some((pkg) => isPackageExists(pkg)),
    )
  ) {
    configs.push(storybook(extractConfig(options.storybook)));
  }

  if (enabled(options.vitest, isPackageExists('vitest'))) {
    configs.push(vitest(extractConfig(options.vitest)));
  }

  if (enabled(options.tailwind, isPackageExists('tailwindcss'))) {
    configs.push(tailwind(extractConfig(options.tailwind)));
  }

  if (
    enabled(
      options.tanstackQuery,
      isPackageExists('react-query') ||
        isPackageExists('@tanstack/react-query') ||
        isPackageExists('@tanstack/react-query-devtools'),
    )
  ) {
    configs.push(tanstackQuery(extractConfig(options.tanstackQuery)));
  }

  if (enabled(options.tanstackRouter, isPackageExists('@tanstack/react-router'))) {
    configs.push(tanstackRouter(extractConfig(options.tanstackRouter)));
  }

  if (enabled(options.drizzle, isPackageExists('drizzle-kit') || isPackageExists('drizzle-orm'))) {
    configs.push(drizzle(extractConfig(options.drizzle)));
  }

  if (enabled(options.zod, isPackageExists('zod'))) {
    configs.push(zod(extractConfig(options.zod)));
  }

  return defineConfig(configs, userConfig);
}
