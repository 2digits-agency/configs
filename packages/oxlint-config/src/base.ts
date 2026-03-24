import { defu } from 'defu';
import { defineConfig } from 'oxlint';

import { importConfig } from './configs/import';
import { javascriptConfig } from './configs/javascript';
import { unicornConfig } from './configs/unicorn';
import { ignorePatterns } from './globs';

export const baseConfig = defineConfig(
  defu(javascriptConfig, importConfig, unicornConfig, { ignorePatterns: [...ignorePatterns] }),
);
