import * as Arr from 'effect/Array';

import { validDirective } from '../../../src/rules/react/valid-directive';
import { createRuleTester } from '../../rule-tester';

createRuleTester({ languageOptions: { parserOptions: { lang: 'tsx' }, sourceType: 'module' } }).run(
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
