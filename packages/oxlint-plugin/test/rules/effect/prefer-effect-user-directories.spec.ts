import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { preferEffectUserDirectories } from '../../../src/rules/effect/prefer-effect-user-directories';

RuleTester.describe = describe;

RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { lang: 'ts' },
    sourceType: 'module',
  },
});

const effect = "import * as Effect from 'effect/Effect'\nimport * as Config from 'effect/Config'\n";

tester.run('prefer-effect-user-directories', preferEffectUserDirectories, {
  valid: [
    "import { homedir } from 'node:os'\nconst home = homedir()",
    `${effect}import { tmpdir } from 'node:os'\nconst dir = tmpdir()`,
    `${effect}import * as os from 'node:os'\nconst cpus = os.cpus()`,
    `${effect}import os from 'node:os'\nfunction read(os) { return os.homedir() }`,
    `${effect}import { homedir } from './paths'\nconst home = homedir()`,
    `${effect}const url = process.env.API_URL`,
    `${effect}process.env.HOME = '/tmp/home'`,
    `${effect}const host = Config.String('HOST')`,
    `${effect}const mode = Config.succeed('HOME').pipe(Config.withDefault('HOME'))\nconst kind = Config.Literal('HOME', 'MODE')`,
    `${effect}function read(Config) { return Config.String('HOME') }`,
    `${effect}const env = { HOME: '/Users/ada', XDG_CONFIG_HOME: '/tmp/xdg' }`,
    `${effect}const process = { env: { HOME: '/tmp' } }\nconst home = process.env.HOME`,
  ],
  invalid: [
    {
      code: `${effect}import { homedir } from 'node:os'\nconst home = homedir()`,
      errors: [{ messageId: 'homedir' }],
    },
    {
      code: `${effect}import * as os from 'os'\nconst config = os.homedir() + '/.config/app'`,
      errors: [{ messageId: 'homedir' }],
    },
    {
      code: `${effect}import os from 'node:os'\nconst home = os.homedir()`,
      errors: [{ messageId: 'homedir' }],
    },
    {
      code: `${effect}const config = process.env.XDG_CONFIG_HOME ?? '~/.config'`,
      errors: [{ messageId: 'variable', data: { name: 'XDG_CONFIG_HOME' } }],
    },
    {
      code: `${effect}const home = process.env['USERPROFILE']`,
      errors: [{ messageId: 'variable', data: { name: 'USERPROFILE' } }],
    },
    {
      code: `${effect}const appData = Config.String('APPDATA')`,
      errors: [{ messageId: 'variable', data: { name: 'APPDATA' } }],
    },
    {
      code: `${effect}import envPaths from 'env-paths'`,
      errors: [{ messageId: 'library', data: { source: 'env-paths' } }],
    },
  ],
});
