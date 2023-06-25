import typeParamNames from '../../src/rules/type-param-names';
import { getFixturesRootDir, RuleTester } from '../RuleTester';

/** Gives nice syntax highlighting */
const typescript = String.raw;

const ruleTester = new RuleTester({
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: getFixturesRootDir(),
    sourceType: 'module',
  },
});

ruleTester.run('type-param-names', typeParamNames, {
  valid: [
    {
      name: 'single type param with name "T"',
      code: typescript`
        type Foo<T> = T;
      `,
    },
    {
      name: 'single type param with prefix "T"',
      code: typescript`
        type Foo<TData> = TData;
      `,
    },
    {
      name: 'single type param with prefix "$"',
      code: typescript`
        type Foo<$Data> = $Data;
      `,
    },
    {
      name: 'multiple type params with prefix "T" are valid',
      code: typescript`
        type Foo<TData, TError> = TData | TError;
      `,
    },
    {
      name: 'multiple type params with prefix "$" are valid',
      code: typescript`
        type Foo<$Data, $Error> = $Data | $Error;
      `,
    },
  ],
  invalid: [
    {
      name: 'single type param with name "U"',
      code: typescript`
        type Foo<U> = U;
      `,
      errors: [{ messageId: 'prefix', data: { name: 'U' } }],
    },
    {
      name: 'single type param with name "$"',
      code: typescript`
        type Foo<$> = $;
      `,
      errors: [{ messageId: 'initial', data: { name: '$' } }],
    },
    {
      name: 'single type param with name "T" and prefix "U"',
      code: typescript`
        type Foo<TU> = TU;
      `,
      errors: [{ messageId: 'remainder', data: { name: 'TU' } }],
    },

    {
      name: 'single type param with name "t"',
      code: typescript`
        type Foo<t> = t;
      `,
      errors: [{ messageId: 'prefix', data: { name: 't' } }],
    },
    {
      name: 'single type param with name "t1"',
      code: typescript`
        type Foo<t1> = t1;
      `,
      errors: [{ messageId: 'prefix', data: { name: 't1' } }],
    },
    {
      name: 'single type param with name "T$"',
      code: typescript`
        type Foo<T$> = T$;
      `,
      errors: [{ messageId: 'initial', data: { name: 'T$' } }],
    },
    {
      name: 'single type param with name "$T"',
      code: typescript`
        type Foo<$T> = $T;
      `,
      errors: [{ messageId: 'remainder', data: { name: '$T' } }],
    },
    {
      name: 'single type param with name "T1$"',
      code: typescript`
        type Foo<T1$> = T1$;
      `,
      errors: [{ messageId: 'initial', data: { name: 'T1$' } }],
    },
    {
      name: 'single type param with name "$1T"',
      code: typescript`
        type Foo<$1T> = $1T;
      `,
      errors: [{ messageId: 'initial', data: { name: '$1T' } }],
    },
    {
      name: 'single type param with name "T_"',
      code: typescript`
        type Foo<T_> = T_;
      `,
      errors: [{ messageId: 'initial', data: { name: 'T_' } }],
    },
    {
      name: 'single type param with name "_T"',
      code: typescript`
        type Foo<_T> = _T;
      `,
      errors: [{ messageId: 'prefix', data: { name: '_T' } }],
    },
    {
      name: 'single type param with name "T1_"',
      code: typescript`
        type Foo<T1_> = T1_;
      `,
      errors: [{ messageId: 'initial', data: { name: 'T1_' } }],
    },
    {
      name: 'single type param with name "_T1"',
      code: typescript`
        type Foo<_T1> = _T1;
      `,
      errors: [{ messageId: 'prefix', data: { name: '_T1' } }],
    },
    {
      name: 'single type param with name "$_"',
      code: typescript`
        type Foo<$_> = $_;
      `,
      errors: [{ messageId: 'initial', data: { name: '$_' } }],
    },
    {
      name: 'single type param with name "_$"',
      code: typescript`
        type Foo<_$> = _$;
      `,
      errors: [{ messageId: 'prefix', data: { name: '_$' } }],
    },
    {
      name: 'single type param with name "$1_"',
      code: typescript`
        type Foo<$1_> = $1_;
      `,
      errors: [{ messageId: 'initial', data: { name: '$1_' } }],
    },
    {
      name: 'single type param with name "_$1"',
      code: typescript`
        type Foo<_$1> = _$1;
      `,
      errors: [{ messageId: 'prefix', data: { name: '_$1' } }],
    },
  ],
});
