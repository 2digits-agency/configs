# Vitest rules

The preset expects test files named `*.spec.ts`; `vitest/consistent-test-filename` reports `*.test.ts` as a warning,
which fails the run because warnings are denied.

## Structure

- `vitest/require-top-level-describe`: wrap tests and hooks in a `describe`. Its title must start lowercase
  (`vitest/prefer-lowercase-title`): `describe('product importer', ...)`.
- `vitest/max-expects` (5 per test): assert one object instead of five fields,
  `expect(result).toStrictEqual({ status: 200, body: 'ok' })`, or split by behaviour.
- `vitest/no-conditional-in-test`, `vitest/no-conditional-expect`: move branching into a helper or a table
  (`it.for([...])`, which `vitest/consistent-each-for` prefers over `it.each`).
- `vitest/no-standalone-expect`: `it`, `it.effect` and `it.scoped` count as test blocks; `it.live` and Alchemy's
  `Vitest.make()` `test` do not. Add them in the project config rather than disabling per file:

  ```ts
  import withTwoDigits from '@2digits/oxlint-config';

  export default withTwoDigits({
    overrides: [
      {
        files: ['**/*.spec.ts'],
        rules: {
          'vitest/no-standalone-expect': [
            'error',
            { additionalTestBlockFunctions: ['it', 'it.effect', 'it.scoped', 'it.live', 'test'] },
          ],
        },
      },
    ],
  });
  ```

  In a helper that runs outside any test, use `assert.strictEqual(...)` instead of `expect`.

## Matchers

- `vitest/prefer-strict-equal`: `toStrictEqual` also compares prototypes, so a mass `toEqual` to `toStrictEqual`
  rewrite fails on `Schema.Class` and `Data` instances compared with plain objects. Build the expected value with the
  class (`ExactReceipt.make({...})`); if a suite compares many such instances, turn the rule off for test files in the
  project config.
- `vitest/prefer-to-be`: `toBe` for primitives. `vitest/prefer-to-be-truthy`: `toBeTruthy()` instead of `toBe(true)`.
- `vitest/require-to-throw-message`: `toThrow('message')`.
