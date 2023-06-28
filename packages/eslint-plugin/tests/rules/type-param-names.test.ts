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
    typescript`type Foo<T> = T;`,

    typescript`
interface Bar<TData> {
  baz: TData;
};
    `,

    typescript`
export function defineConfig<TConfig extends ESLintConfig>(config: TConfig): TConfig {
  return config;
}
    `,
    typescript`type Foo<TData, TError> = TData | TError;`,
    typescript`type Foo<$Data, $Error> = $Data | $Error;`,
  ],
  invalid: [
    {
      code: typescript`
        type Foo<U> = U;
      `,
      errors: [{ messageId: 'prefix', data: { name: 'U' } }],
    },
    {
      code: typescript`
        type Foo<$> = $;
      `,
      errors: [{ messageId: 'initial', data: { name: '$' } }],
    },
    {
      code: typescript`
        type Foo<TU> = TU;
      `,
      errors: [{ messageId: 'remainder', data: { name: 'TU' } }],
    },

    {
      code: typescript`
        type Foo<t> = t;
      `,
      errors: [{ messageId: 'prefix', data: { name: 't' } }],
    },
    {
      code: typescript`
        type Foo<t1> = t1;
      `,
      errors: [{ messageId: 'prefix', data: { name: 't1' } }],
    },
    {
      code: typescript`
        type Foo<T$> = T$;
      `,
      errors: [{ messageId: 'initial', data: { name: 'T$' } }],
    },
    {
      code: typescript`
        type Foo<$T> = $T;
      `,
      errors: [{ messageId: 'remainder', data: { name: '$T' } }],
    },
    {
      code: typescript`
        type Foo<T1$> = T1$;
      `,
      errors: [{ messageId: 'initial', data: { name: 'T1$' } }],
    },
    {
      code: typescript`
        type Foo<$1T> = $1T;
      `,
      errors: [{ messageId: 'initial', data: { name: '$1T' } }],
    },
    {
      code: typescript`
        type Foo<T_> = T_;
      `,
      errors: [{ messageId: 'initial', data: { name: 'T_' } }],
    },
    {
      code: typescript`
        type Foo<_T> = _T;
      `,
      errors: [{ messageId: 'prefix', data: { name: '_T' } }],
    },
    {
      code: typescript`
        type Foo<T1_> = T1_;
      `,
      errors: [{ messageId: 'initial', data: { name: 'T1_' } }],
    },
    {
      code: typescript`
        type Foo<_T1> = _T1;
      `,
      errors: [{ messageId: 'prefix', data: { name: '_T1' } }],
    },
    {
      code: typescript`
        type Foo<$_> = $_;
      `,
      errors: [{ messageId: 'initial', data: { name: '$_' } }],
    },
    {
      code: typescript`
        type Foo<_$> = _$;
      `,
      errors: [{ messageId: 'prefix', data: { name: '_$' } }],
    },
    {
      code: typescript`
        type Foo<$1_> = $1_;
      `,
      errors: [{ messageId: 'initial', data: { name: '$1_' } }],
    },
    {
      code: typescript`
        type Foo<_$1> = _$1;
      `,
      errors: [{ messageId: 'prefix', data: { name: '_$1' } }],
    },
  ],
});
