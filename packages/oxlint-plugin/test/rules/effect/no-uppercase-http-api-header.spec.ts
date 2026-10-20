/* oxlint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
/* eslint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
import * as Arr from 'effect/Array';

import { testRule } from '../../rule-tester';

const endpointImport = `import { HttpApiEndpoint } from 'effect/unstable/httpapi';`;

const endpointCalls = Arr.cartesian(['get', 'post', 'put', 'patch', 'delete', 'head', 'options'], [
  ["import { HttpApiEndpoint as Endpoint } from 'effect/unstable/httpapi';", 'Endpoint'],
  ["import * as Api from 'effect/unstable/httpapi';", 'Api.HttpApiEndpoint'],
  ["import * as Endpoint from 'effect/unstable/httpapi/HttpApiEndpoint';", 'Endpoint'],
] as const);

const unrelatedBindings = [
  `import { HttpApiEndpoint } from 'effect/unstable/httpapi';
   function local(HttpApiEndpoint) { HttpApiEndpoint.get('me', '/me', { headers: { Foo: Schema.String } }); }`,
  `import { HttpApiEndpoint as Endpoint } from 'effect/unstable/httpapi';
   { const Endpoint = other; Endpoint.get('me', '/me', { headers: { Foo: Schema.String } }); }`,
  `import * as Api from 'effect/unstable/httpapi';
   function local(Api) { Api.HttpApiEndpoint.get('me', '/me', { headers: { Foo: Schema.String } }); }`,
  `const HttpApiEndpoint = other; HttpApiEndpoint.get('me', '/me', { headers: { Foo: Schema.String } });`,
  `import { HttpApiEndpoint } from '@effect/platform';
   HttpApiEndpoint.get('me', '/me', { headers: { Foo: Schema.String } });`,
  `import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint';
   HttpApiEndpoint.get('me', '/me', { headers: { Foo: Schema.String } });`,
  `import { HttpApiEndpoint } from 'unrelated';
   HttpApiEndpoint.get('me', '/me', { headers: { Foo: Schema.String } });`,
  `import type { HttpApiEndpoint } from 'effect/unstable/httpapi';
   HttpApiEndpoint.get('me', '/me', { headers: { Foo: Schema.String } });`,
];

const ambiguousOptions = [
  `{ headers: { ['Foo']: Schema.String } }`,
  `{ headers: { Foo: Schema.String, [key]: schema } }`,
  `{ headers: { Foo: Schema.String, ...fields } }`,
  `{ headers: { ...fields, Foo: Schema.String } }`,
  `{ headers: { Foo: Schema.String, 'Foo': Schema.Number } }`,
  `{ headers: fields }`,
  `{ headers: Schema.Struct({ Foo: Schema.String }) }`,
  `{ headers }`,
  `{ headers: { get Foo() { return Schema.String; } } }`,
  `{ headers: { Foo() {} } }`,
  `{ headers: { Foo: Schema.String }, ...options }`,
  `{ ...options, headers: { Foo: Schema.String } }`,
  `{ headers: { Foo: Schema.String }, headers: {} }`,
  `{ ['headers']: { Foo: Schema.String } }`,
  `{ headers: { Foo: Schema.String }, [key]: value }`,
  `{ get headers() { return { Foo: Schema.String }; } }`,
  `options`,
  `{ headers: { 'É': Schema.String, 'ß': Schema.String } }`,
];

function uppercase(code: string) {
  return { code, errors: [{ messageId: 'uppercase' }], output: null };
}

testRule('no-uppercase-http-api-header', {
  valid: [
    `
    ${endpointImport}
    HttpApiEndpoint.get('me', '/me', { headers: { 'x-api-key': Schema.String } });
  `,
    `${endpointImport}
    HttpApiEndpoint.get('me', '/me', { headers: { 123: Schema.String, '123': Schema.Number, Foo: Schema.String } });`,
    ...Arr.map(
      endpointCalls,
      ([method, [declaration, endpoint]]) =>
        `${declaration} ${endpoint}.${method}('me', '/me', { headers: { authorization: Schema.String } });`,
    ),
    ...unrelatedBindings,
    ...Arr.map(
      ambiguousOptions,
      (options) => `${endpointImport}
    HttpApiEndpoint.get('me', '/me', ${options});`,
    ),
    `
    ${endpointImport}
    HttpApiEndpoint.make('GET')('me', '/me', { headers: { Foo: Schema.String } });
    HttpApiEndpoint.del('me', '/me', { headers: { Foo: Schema.String } });
    HttpApiEndpoint.get('me', '/me').setHeaders(Schema.Struct({ Foo: Schema.String }));
    HttpApiEndpoint.get('me', { headers: { Foo: Schema.String } });
    HttpApiEndpoint.get(...args, { headers: { Foo: Schema.String } });
    new Headers({ 'X-Api-Key': 'present' }).get('X-Api-Key');
    new Headers({ 'X-Api-Key': 'present' }).has('X-Api-Key');
    fetch('/me', { headers: { 'X-Api-Key': 'present' } });
    new Request('/me', { headers: { 'X-Api-Key': 'present' } });
    new Response(null, { headers: { 'X-Api-Key': 'present' } });
    response.setHeader('X-Api-Key', 'present');
    const unrelated = { headers: { Foo: schema } };
  `,
  ],
  invalid: [
    uppercase(`
    ${endpointImport}
    HttpApiEndpoint.get('me', '/me', { headers: { 'X-Api-Key': Schema.String } });
  `),
    uppercase(`${endpointImport}
    HttpApiEndpoint.get('me', '/me', { headers: { 123: Schema.String, Foo: Schema.String } });`),
    ...Arr.map(endpointCalls, ([method, [declaration, endpoint]]) =>
      uppercase(
        `${declaration} ${endpoint}.${method}(endpointName, endpointPath, { headers: { Authorization: Schema.String } });`,
      ),
    ),
    uppercase(`${endpointImport}
      function local() { HttpApiEndpoint.get('me', '/me', { headers: { Foo: Schema.String } }); }`),
    uppercase(`${endpointImport}
      HttpApiEndpoint.get('me', '/me', { headers: { Foo: Schema.String, foo: Schema.String } });`),
    uppercase(`${endpointImport}
    HttpApiEndpoint.post('me', '/me', { headers: { 'X-Api-Key': Schema.String }, payload: Schema.String });`),
    {
      code: `${endpointImport}
HttpApiEndpoint.get('me', '/me', { headers: {
  Foo: Schema.String,
  'x-API-key': Schema.String,
  lowercase: Schema.String,
} });`,
      errors: [
        { messageId: 'uppercase', data: { name: 'Foo' }, line: 3, column: 2, endColumn: 5 },
        { messageId: 'uppercase', data: { name: 'x-API-key' }, line: 4, column: 2, endColumn: 13 },
      ],
      output: null,
    },
  ],
});

/* eslint-enable unicorn/no-null */
