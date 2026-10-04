/* oxlint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
/* eslint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
import { RuleTester } from 'oxlint/plugins-dev';

import { noUppercaseHttpApiHeader } from '../../../src/rules/effect/no-uppercase-http-api-header';
import { testRule } from '../../rule-tester';

const ruleName = 'no-uppercase-http-api-header';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });

testRule(ruleName, noUppercaseHttpApiHeader, {
  valid: `
    import { HttpApiEndpoint } from 'effect/unstable/httpapi';
    HttpApiEndpoint.get('me', '/me', { headers: { 'x-api-key': Schema.String } });
  `,
  invalid: `
    import { HttpApiEndpoint } from 'effect/unstable/httpapi';
    HttpApiEndpoint.get('me', '/me', { headers: { 'X-Api-Key': Schema.String } });
  `,
  messageId: 'uppercase',
  output: null,
});

testRule(ruleName, noUppercaseHttpApiHeader, {
  valid: `import { HttpApiEndpoint } from 'effect/unstable/httpapi';
    HttpApiEndpoint.get('me', '/me', { headers: { 123: Schema.String, '123': Schema.Number, Foo: Schema.String } });`,
  invalid: `import { HttpApiEndpoint } from 'effect/unstable/httpapi';
    HttpApiEndpoint.get('me', '/me', { headers: { 123: Schema.String, Foo: Schema.String } });`,
  messageId: 'uppercase',
  output: null,
});

for (const method of ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']) {
  for (const [declaration, endpoint] of [
    ["import { HttpApiEndpoint as Endpoint } from 'effect/unstable/httpapi';", 'Endpoint'],
    ["import * as Api from 'effect/unstable/httpapi';", 'Api.HttpApiEndpoint'],
    ["import * as Endpoint from 'effect/unstable/httpapi/HttpApiEndpoint';", 'Endpoint'],
  ]) {
    testRule(ruleName, noUppercaseHttpApiHeader, {
      valid: `${declaration} ${endpoint}.${method}('me', '/me', { headers: { authorization: Schema.String } });`,
      invalid: `${declaration} ${endpoint}.${method}(endpointName, endpointPath, { headers: { Authorization: Schema.String } });`,
      messageId: 'uppercase',
      output: null,
    });
  }
}

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

tester.run(ruleName, noUppercaseHttpApiHeader, {
  valid: unrelatedBindings,
  invalid: [
    {
      code: `import { HttpApiEndpoint } from 'effect/unstable/httpapi';
      function local() { HttpApiEndpoint.get('me', '/me', { headers: { Foo: Schema.String } }); }`,
      errors: [{ messageId: 'uppercase' }],
      output: null,
    },
  ],
});

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

tester.run(ruleName, noUppercaseHttpApiHeader, {
  valid: ambiguousOptions.map(
    (options) => `import { HttpApiEndpoint } from 'effect/unstable/httpapi';
      HttpApiEndpoint.get('me', '/me', ${options});`,
  ),
  invalid: [
    {
      code: `import { HttpApiEndpoint } from 'effect/unstable/httpapi';
      HttpApiEndpoint.get('me', '/me', { headers: { Foo: Schema.String, foo: Schema.String } });`,
      errors: [{ messageId: 'uppercase' }],
      output: null,
    },
  ],
});

testRule(ruleName, noUppercaseHttpApiHeader, {
  valid: `
    import { HttpApiEndpoint } from 'effect/unstable/httpapi';
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
  invalid: `import { HttpApiEndpoint } from 'effect/unstable/httpapi';
    HttpApiEndpoint.post('me', '/me', { headers: { 'X-Api-Key': Schema.String }, payload: Schema.String });`,
  messageId: 'uppercase',
  output: null,
});

tester.run(ruleName, noUppercaseHttpApiHeader, {
  valid: [],
  invalid: [
    {
      code: `import { HttpApiEndpoint } from 'effect/unstable/httpapi';
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
