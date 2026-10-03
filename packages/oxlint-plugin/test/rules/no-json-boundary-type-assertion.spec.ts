/* oxlint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
/* eslint-disable unicorn/no-null -- Keep RuleTester no-fix assertions and table cases explicit. */
import { RuleTester } from 'oxlint/plugins-dev';
import { describe, expect, it } from 'vite-plus/test';

import { recommendedRules, rules } from '../../src';
import { noJsonBoundaryTypeAssertion } from '../../src/rules/no-json-boundary-type-assertion';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });
const user = 'interface User { id: string }';
const error = { messageId: 'unchecked', suggestions: [] };

tester.run('no-json-boundary-type-assertion', noJsonBoundaryTypeAssertion, {
  valid: [
    `${user}; const value = JSON.parse(raw) as unknown`,
    `${user}; const value = typed as User`,
    'const value = JSON.parse(raw) as any',
    'const value = JSON.parse(raw) as void',
    'const value = JSON.parse(raw) as const',
    `${user}; const value = JSON.parse(raw) satisfies User`,
    `${user}; const value = Schema.decodeUnknownSync(schema)(JSON.parse(raw)) as User`,
    `${user}; const body: unknown = JSON.parse(raw); if (isUser(body)) { body as User }`,
    `${user}; const value = (JSON.parse(raw) satisfies User) as User`,
    'type Input = unknown; type Alias = Input; const value = JSON.parse(raw) as Alias',
    'type Input = any; const value = JSON.parse(raw) as Input',
    'type Input = void; const value = JSON.parse(raw) as Input',
    'const value = JSON.parse(raw) as MissingType',
    'const value = JSON.parse(raw) as MissingType[]',
    'const value = JSON.parse(raw) as MissingType | string',
    'type User<T> = { id: T }; const value = JSON.parse(raw) as User<MissingType>',
    'type Identity<T> = T; const value = JSON.parse(raw) as Identity<unknown>',
    'type Identity<T = unknown> = T; const value = JSON.parse(raw) as Identity',
    'type Identity<T> = T; const value = JSON.parse(raw) as Identity<Identity<unknown>>',
    'type Recursive<T> = Recursive<T[]>; const value = JSON.parse(raw) as Recursive<string>',
    'type A = B; type B = A; const value = JSON.parse(raw) as A',
    {
      code: 'declare const value: { body: typeof JSON.parse extends Function ? unknown : never }',
      filename: 'types.d.ts',
    },
  ],
  invalid: [
    { code: `${user}; const value = JSON.parse(raw) as User`, errors: [error], output: null },
    {
      code: `${user}; const value = JSON.parse(raw) as User`,
      languageOptions: { globals: { JSON: 'readonly' } },
      errors: [error],
      output: null,
    },
    { code: `${user}; const value = <User>JSON.parse(raw)`, errors: [error], output: null },
    { code: `${user}; const value = JSON.parse(raw) as unknown as User`, errors: [error], output: null },
    { code: `${user}; const value = (((JSON.parse(raw) as any)!) as never) as User`, errors: [error], output: null },
    { code: 'type User = { id: string }; const value = JSON.parse(raw) as User', errors: [error], output: null },
    { code: 'type User<T> = { id: T }; const value = JSON.parse(raw) as User<string>', errors: [error], output: null },
    { code: 'type User<T> = { id: T }; const value = JSON.parse(raw) as User<unknown>', errors: [error], output: null },
    { code: 'type Identity<T> = T; const value = JSON.parse(raw) as Identity<string>', errors: [error], output: null },
    {
      code: 'type Identity<T> = T; const value = JSON.parse(raw) as Identity<Identity<string>>',
      errors: [error],
      output: null,
    },
    {
      code: 'type User<T> = { id: T }; const value = JSON.parse(raw) as User<User<string>>',
      errors: [error],
      output: null,
    },
    { code: 'const value = JSON.parse(raw) as { id: string }', errors: [error], output: null },
    // A concrete assertion stops traversal: report its claim, not the downstream unrelated assertion.
    {
      code: `${user}; interface Admin { role: string }; const value = (JSON.parse(raw) as User) as Admin`,
      errors: [{ ...error, column: 80, endColumn: 103 }],
      output: null,
    },
  ],
});

describe('rule registration', () => {
  it('offers neither fixes nor suggestions', () => {
    expect(noJsonBoundaryTypeAssertion.meta?.fixable).toBeUndefined();
    expect(noJsonBoundaryTypeAssertion.meta?.hasSuggestions).not.toBeTruthy();
  });

  it('registers the rule without enabling it by default', () => {
    expect(rules).toHaveProperty('no-json-boundary-type-assertion', noJsonBoundaryTypeAssertion);
    expect(recommendedRules).not.toHaveProperty('2digits/no-json-boundary-type-assertion');
    expect(noJsonBoundaryTypeAssertion.meta?.docs?.recommended).toBeFalsy();
  });
});

tester.run('annotated Web JSON readers', noJsonBoundaryTypeAssertion, {
  valid: [
    `${user}; async function read(response) { return (await response.json()) as User }`,
    `${user}; const response = await fetch(url); const value = (await response.json()) as User`,
    `${user}; const value = (await missing.json()) as User`,
    `${user}; async function read(response: Client) { return (await response.json()) as User }`,
    `${user}; type WebResponse = Response; async function read(response: WebResponse) { return (await response.json()) as User }`,
    `${user}; async function read(response: Response) { return response.json() as User }`,
    `${user}; async function read(response: Response) { return (await response.json()) as unknown }`,
    `${user}; async function read(response: Response) { return decode(await response.json()) as User }`,
    `${user}; async function read(response: Response) { response = other; return (await response.json()) as User }`,
    `${user}; let response: Response = source; ({ response } = other); const value = (await response.json()) as User`,
    `${user}; let response: Response = source; function replace() { response = other }; const value = (await response.json()) as User`,
  ],
  invalid: [
    {
      code: 'async function json<T>(response: Response): Promise<T> { return (await response.json()) as T }',
      errors: [error],
      output: null,
    },
    {
      code: `${user}; async function read(request: Request) { return (await request.json()) as User }`,
      errors: [error],
      output: null,
    },
    {
      code: `${user}; const response: Response = source; const value = (await response.json()) as User`,
      errors: [error],
      output: null,
    },
    {
      code: `${user}; async function read(response: Response = source) { return (await response.json()) as unknown as User }`,
      errors: [error],
      output: null,
    },
  ],
});

// Every shadowing case has a nearby unshadowed positive in the same file.
tester.run('value and type namespace shadowing', noJsonBoundaryTypeAssertion, {
  valid: [],
  invalid: [
    ...['Response', 'Request'].flatMap((name) =>
      [
        `interface ${name} { json(): Promise<unknown> }`,
        `type ${name} = { json(): Promise<unknown> }`,
        `class ${name} { async json() { return {} } }`,
      ].map((shadow) => ({
        code: `${user}; { ${shadow}; async function custom(r: ${name}) { return (await r.json()) as User } }
          async function builtin(r: ${name}) { return (await r.json()) as User }`,
        errors: [error],
        output: null,
      })),
    ),
    ...['Response', 'Request'].map((name) => ({
      code: `${user}; namespace Custom { namespace ${name} { export const value = true }
        async function custom(r: ${name}) { return (await r.json()) as User } }
        async function builtin(r: ${name}) { return (await r.json()) as User }`,
      errors: [error],
      output: null,
    })),
    ...['Response', 'Request'].map((name) => ({
      code: `${user}; async function custom<${name}>(r: ${name}) { return (await r.json()) as User }
        async function builtin(r: ${name}) { return (await r.json()) as User }`,
      errors: [error],
      output: null,
    })),
    ...['Response', 'Request'].map((name) => ({
      code: `${user}; import type { ${name} } from 'custom';
        async function custom(r: ${name}) { return (await r.json()) as User }; JSON.parse(raw) as User`,
      errors: [error],
      output: null,
    })),
    {
      code: `${user}; { const JSON = custom; JSON.parse(raw) as User }; JSON.parse(raw) as User`,
      errors: [error],
      output: null,
    },
    {
      code: `${user}; import JSON from 'custom'; JSON.parse(raw) as User;
        async function builtin(r: Response) { return (await r.json()) as User }`,
      errors: [error],
      output: null,
    },
    {
      code: `${user}; async function read(r: Response) {
        { const r = custom; (await r.json()) as User }; return (await r.json()) as User }`,
      errors: [error],
      output: null,
    },
  ],
});
