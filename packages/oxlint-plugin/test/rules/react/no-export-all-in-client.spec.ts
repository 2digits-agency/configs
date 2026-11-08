import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { noExportAllInClient } from '../../../src/rules/react/no-export-all-in-client';

RuleTester.describe = describe;

RuleTester.it = it;

new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' }, sourceType: 'module' } }).run(
  'no-export-all-in-client',
  noExportAllInClient,
  {
    valid: [
      `export * from './InputRadioItem';`,
      `'use server';\nexport * from './actions';`,
      `'use client';\nexport { InputRadioItem } from './InputRadioItem';`,
      `'use client';\nexport type * from './types';`,
      `function f() { 'use client'; }\nexport * from './InputRadioItem';`,
    ],
    invalid: [
      {
        code: `'use client';\nimport { forwardRef } from 'react';\nexport * from './InputRadioItem';\nexport * as Item from './Item';`,
        errors: [
          { messageId: 'exportAll', line: 3 },
          { messageId: 'exportAll', line: 4 },
        ],
      },
    ],
  },
);
