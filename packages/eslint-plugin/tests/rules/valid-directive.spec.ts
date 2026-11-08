import parser from '@typescript-eslint/parser';
import { run, type InvalidTestCase, type ValidTestCase, unindent as typescript } from 'eslint-vitest-rule-tester';
import { expect } from 'vite-plus/test';

import { RULE_NAME, validDirective } from '../../src/rules/valid-directive';

const valids: Array<ValidTestCase> = [
  typescript`'use client';`,
  typescript`"use server";`,
  typescript`'use cache';`,
  typescript`'use cache: remote';`,
  typescript`'use strict'; 'use client';`,
  typescript`
    export async function action() {
      'use server';
    }
  `,
  // Not in the directive prologue, so not a directive at all.
  typescript`
    import { a } from 'a';

    'use Client';
  `,
  typescript`const directive = 'use Client';`,
  typescript`'user client';`,
];

// Each case pairs the code with the quoted directive its suggestion writes, or `undefined` when there is no safe fix.
const invalids: Array<InvalidTestCase> = (
  [
    [
      typescript`
        'use Client';

        import type { PropsWithChildren } from 'react';
      `,
      `'use client'`,
    ],
    [typescript`"use  server";`, `"use server"`],
    [typescript`' use client ';`, `'use client'`],
    [typescript`'useClient';`, `'use client'`],
    [typescript`'use client;';`, `'use client'`],
    [typescript`'use cache:remote';`, `'use cache: remote'`],
    [
      typescript`
        export async function action() {
          'USE SERVER';
        }
      `,
      `'use server'`,
    ],
    [typescript`'use client and more';`, undefined],
  ] as const
).map(([code, replacement]) => ({
  code,
  errors(errors) {
    // oxlint-disable-next-line vitest/no-standalone-expect -- The rule tester runs this callback inside its own test.
    expect(
      errors.map(({ messageId, suggestions }) => [messageId, suggestions?.map(({ fix }) => fix.text)]),
    ).toStrictEqual([['invalidDirective', replacement === undefined ? undefined : [replacement]]]);
  },
}));

await run({
  parser,
  name: RULE_NAME,
  rule: validDirective,
  valid: valids,
  invalid: invalids,
});
