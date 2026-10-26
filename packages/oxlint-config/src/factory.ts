import { isPackageExists } from 'local-pkg';
import { defineConfig } from 'oxlint-flat-config';

import {
  ignores,
  imports,
  javascript,
  jsdoc,
  node,
  oxc,
  react,
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
  OptionsWithFiles,
  OptionsWithIgnores,
  OptionsWithVitest,
  OxlintConfig,
} from './types';

type SharedOptions<T = unknown> = T & {
  enable?: boolean;
};

interface Oxlint2DigitsOptions {
  ignores?: OptionsWithIgnores;
  js?: OptionsOverrides;
  ts?: SharedOptions<OptionsOverrides> | boolean;
  react?: SharedOptions<OptionsWithFiles> | boolean;
  vitest?: SharedOptions<OptionsWithVitest> | boolean;
  zod?: SharedOptions<OptionsOverrides> | boolean;
}

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
    node(),
    jsdoc(),
    unicorn(),
    imports(),
    oxc(),
    twoDigitsPlugin(),
  ];

  if (enabled(options.ts, isPackageExists('typescript'))) {
    configs.push(typescript(extractConfig(options.ts)));
  }

  if (enabled(options.react, isPackageExists('react'))) {
    configs.push(react(extractConfig(options.react)));
  }

  if (enabled(options.vitest, isPackageExists('vitest'))) {
    configs.push(vitest(extractConfig(options.vitest)));
  }

  if (enabled(options.zod, isPackageExists('zod'))) {
    configs.push(zod(extractConfig(options.zod)));
  }

  return defineConfig(configs, userConfig);
}
