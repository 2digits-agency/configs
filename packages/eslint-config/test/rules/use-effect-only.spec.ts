import eslintReactKit from '@eslint-react/kit';
import parser from '@typescript-eslint/parser';
import { run, unindent as tsx } from 'eslint-vitest-rule-tester';

import { noUnnecessaryUseCallback } from '../../src/rules/react/no-unnecessary-use-callback';
import { noUnnecessaryUseMemo } from '../../src/rules/react/no-unnecessary-use-memo';

const { rules = {} } = eslintReactKit().use(noUnnecessaryUseCallback).use(noUnnecessaryUseMemo).getPlugin();

function onlyInOneEffect(name: string) {
  return {
    message: `${name} is only used inside 1 useEffect, which may be unnecessary. You can move the computation into useEffect directly and merge the dependency arrays.`,
  };
}

await runRule('no-unnecessary-use-callback', 'useCallback');

await runRule('no-unnecessary-use-memo', 'useMemo');

// The effect lookup walks up from every usage through non-call ancestors such as arrays, member expressions and JSX.
async function runRule(name: string, hook: string) {
  await run({
    parser,
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
    name,
    rule: rules[name],
    valid: [
      tsx(`
        export function Counter({ count }: { count: number }) {
          const value = ${hook}(() => count + 1, [count]);

          useEffect(() => {
            console.log([value]);
          }, [value]);

          return <div title={String(value)} />;
        }
      `),
    ],
    invalid: [
      {
        code: tsx(`
          export function Counter({ count }: { count: number }) {
            const value = ${hook}(() => count + 1, [count]);

            useEffect(() => {
              console.log([value].map(String));
            }, [value]);

            return <div />;
          }
        `),
        errors: [onlyInOneEffect('value')],
      },
    ],
  });
}
