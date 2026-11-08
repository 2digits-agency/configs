import path from 'node:path';
import { fileURLToPath } from 'node:url';

import parser from '@typescript-eslint/parser';
import { run, type InvalidTestCase, type ValidTestCase, unindent as typescript } from 'eslint-vitest-rule-tester';
import { beforeAll, describe } from 'vite-plus/test';

import { noClientValueImportInServer, RULE_NAME } from '../../src/rules/no-client-value-import-in-server';

const fixtureDirectory = fileURLToPath(new URL('../fixtures/client-boundary/', import.meta.url));

const filename = path.join(fixtureDirectory, 'forms/actions.ts');

const parserOptions = {
  projectService: true,
  tsconfigRootDir: fixtureDirectory,
};

const valids: Array<ValidTestCase> = [
  typescript`
    'use server';

    import { ErrorMessage } from '@/constants/interfaces';
  `,
  typescript`
    'use server';

    import type { FormProps } from '@/components/Form';
    import { type FormProps as Props } from '../components/Form';
  `,
  // An interface has no runtime value, even without the type keyword.
  typescript`
    'use server';

    import { FormProps } from '@/components/Form';
  `,
  // Server components render client components; only 'use server' and 'server-only' modules are checked.
  typescript`
    import { ErrorMessage, Form } from '@/components/Form';
  `,
  typescript`
    import { Form } from '@/components/Form';

    export async function submit() {
      'use server';
    }
  `,
  typescript`
    'use server';

    import { validationSchema } from './fixed-schemas';
  `,
  typescript`
    'use server';

    import { Page } from './Page';
  `,
  typescript`
    import 'server-only';

    import type { validationSchema } from './schemas';
  `,
  // TypeScript erases an import of only an interface, so the schema module is never loaded.
  typescript`
    'use server';

    import { SchemaProps } from './schemas';
  `,
].map((code) => ({ code, filename }));

const invalids: Array<InvalidTestCase> = [
  {
    code: typescript`
      'use server';

      import { ErrorMessage } from '@/components/Form';
    `,
    errors: [{ messageId: 'clientValueImport', data: { name: 'ErrorMessage', source: '@/components/Form' } }],
  },
  {
    code: typescript`
      import 'server-only';

      import * as Client from '../components/Form';
    `,
    errors: [{ messageId: 'clientValueImport', data: { name: 'Client', source: '../components/Form' } }],
  },
  {
    code: typescript`
      'use server';

      import { ErrorMessage } from '@/components';
    `,
    errors: [{ messageId: 'clientValueImport', data: { name: 'ErrorMessage', source: '@/components' } }],
  },
  {
    code: typescript`
      'use server';

      import { Form, type FormProps, ErrorMessage as Message } from '@/components/Form';
    `,
    errors: [
      { messageId: 'clientValueImport', data: { name: 'Form', source: '@/components/Form' } },
      { messageId: 'clientValueImport', data: { name: 'Message', source: '@/components/Form' } },
    ],
  },
  {
    code: typescript`
      'use server';

      import { validationSchema } from './schemas';
    `,
    errors: [
      {
        messageId: 'indirectClientValueImport',
        data: { name: 'ErrorMessage', source: './schemas', clientSource: '@/components/Form' },
      },
    ],
  },
].map((testCase) => ({ ...testCase, filename }));

describe(RULE_NAME, () => {
  /**
   * The rule tester hardcodes a 10s timeout per valid case. The first type-aware parse builds the TypeScript program,
   * which can take longer than that on a busy CI runner, so build it up front with a longer timeout.
   */
  beforeAll(() => {
    parser.parseForESLint('', { ...parserOptions, filePath: filename });
  }, 60_000);

  void run({
    parser,
    parserOptions,
    name: RULE_NAME,
    rule: noClientValueImportInServer,
    valid: valids,
    invalid: invalids,
  });
});

describe(`${RULE_NAME} without type information`, () => {
  void run({
    name: RULE_NAME,
    rule: noClientValueImportInServer,
    valid: [
      {
        code: typescript`
          'use server';

          import { ErrorMessage } from './Form';
        `,
        filename: 'actions.js',
      },
    ],
  });
});
