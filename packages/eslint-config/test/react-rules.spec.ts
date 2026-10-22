import eslintReactKit from '@eslint-react/kit';
import parser from '@typescript-eslint/parser';
import { Linter } from 'eslint';
import { describe, it } from 'vitest';

import { noUnnecessaryUseMemo } from '../src/rules/react/no-unnecessary-hook';
import { preferNamespaceImport } from '../src/rules/react/prefer-namespace-import';

const linter = new Linter();

const config: Array<Linter.Config> = [
  {
    files: ['**/*.tsx'],
    languageOptions: { parser },
    plugins: { react: eslintReactKit().use(noUnnecessaryUseMemo).use(preferNamespaceImport).getPlugin() },
    rules: {
      'react/no-unnecessary-use-memo': 'error',
      'react/prefer-namespace-import': 'error',
    },
  },
];

describe('prefer-namespace-import', () => {
  it.for([
    {
      name: 'default import',
      code: "import React from 'react';\n\nexport const Memo = React.memo;\n",
      output: "import * as React from 'react';\n\nexport const Memo = React.memo;\n",
    },
    {
      name: 'default and named imports',
      code: 'import React, { useState } from "react"\n\nexport const hooks = [React.useId, useState]\n',
      output:
        'import * as React from "react"\nimport { useState } from "react"\n\nexport const hooks = [React.useId, useState]\n',
    },
  ])('keeps the React binding when fixing a $name', ({ code, output }, { expect }) => {
    expect(linter.verifyAndFix(code, config, 'component.tsx').output).toBe(output);
  });
});

describe('no-unnecessary-use-memo', () => {
  it.for([
    { name: 'a call', factory: 'createStore()', expected: [] },
    { name: 'a constructor', factory: 'new Map()', expected: [] },
    {
      name: 'a constant',
      factory: '[1, 2, 3]',
      expected: ["An 'useMemo' with empty deps and no references to the component scope may be unnecessary."],
    },
  ])('checks empty deps memoizing $name', ({ factory, expected }, { expect }) => {
    const code = `import { useMemo } from 'react';\n\nexport function Component() {\n  const value = useMemo(() => ${factory}, []);\n\n  return value;\n}\n`;

    const messages = linter.verify(code, config, 'component.tsx').map(({ message }) => message);

    expect(messages).toStrictEqual(expected);
  });
});
