import { describe, it } from '@effect/vitest';
import * as Arr from 'effect/Array';
import { RuleTester } from 'oxlint/plugins-dev';

import { validDirective } from '../../../src/rules/react/valid-directive';

RuleTester.describe = describe;

RuleTester.it = it;

new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' }, sourceType: 'module' } }).run(
  'valid-directive',
  validDirective,
  {
    valid: [
      `'use client';`,
      `"use server";`,
      `'use cache: remote';`,
      `'use strict'; 'use client';`,
      `export async function action() { 'use server'; }`,
      `import { a } from 'a';\n'use Client';`,
      `const directive = 'use Client';`,
    ],
    invalid: Arr.map(
      [
        `'use Client';\nimport type { ReactNode } from 'react';`,
        `"use  server";`,
        `' use client ';`,
        `'useClient';`,
        `'use cache:remote';`,
        `export async function action() { 'USE SERVER'; }`,
      ],
      (code) => ({ code, errors: [{ messageId: 'invalidDirective' }] }),
    ),
  },
);
