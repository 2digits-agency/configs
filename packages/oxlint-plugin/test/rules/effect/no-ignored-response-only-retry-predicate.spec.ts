/* oxlint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
/* eslint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
import { RuleTester } from 'oxlint/plugins-dev';

import { noIgnoredResponseOnlyRetryPredicate } from '../../../src/rules/effect/no-ignored-response-only-retry-predicate';
import { testRule } from '../../rule-tester';

testRule('no-ignored-response-only-retry-predicate', noIgnoredResponseOnlyRetryPredicate, {
  valid: `
    import { HttpClient } from 'effect/unstable/http';
    HttpClient.retryTransient({ retryOn: 'errors-only', while: () => false });
  `,
  invalid: `
    import { HttpClient } from 'effect/unstable/http';
    HttpClient.retryTransient({ retryOn: 'response-only', while: () => false });
  `,
  messageId: 'ignoredWhile',
  output: null,
});

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' },
});
const clientImport = `import { HttpClient } from 'effect/unstable/http';`;
const ignoredOptions = `{ retryOn: 'response-only', while: predicate }`;

tester.run('no-ignored-response-only-retry-predicate safety boundaries', noIgnoredResponseOnlyRetryPredicate, {
  valid: [
    ...[
      `{ while: predicate }`,
      `{ retryOn: 'errors-only', while: predicate }`,
      `{ retryOn: 'errors-and-responses', while: predicate }`,
      `{ mode: 'response-only', while: predicate }`,
      `{ retryOn: 'response-only' }`,
      `{ retryOn: mode, while: predicate }`,
      '{ retryOn: `response-only`, while: predicate }',
      `{ retryOn: 'response-only', while: predicate, ...other }`,
      `{ ...other, retryOn: 'response-only', while: predicate }`,
      `{ retryOn: 'response-only', retryOn: 'errors-only', while: predicate }`,
      `{ retryOn: 'response-only', while: predicate, while: other }`,
      `{ retryOn: 'response-only', while: predicate, times: 1, times: 2 }`,
      `{ retryOn: 'response-only', while() { return false; }, while: other }`,
      `{ ['retryOn']: 'response-only', while: predicate }`,
      `{ retryOn: 'response-only', ['while']: predicate }`,
      `{ retryOn: 'response-only', ['while']() { return false; } }`,
      `{ retryOn: 'response-only', while: predicate, [key]: value }`,
      `{ get retryOn() { return 'response-only'; }, while: predicate }`,
      `options`,
    ].map((options) => `${clientImport} HttpClient.retryTransient(${options});`),
    `${clientImport} const options = ${ignoredOptions}; HttpClient.retryTransient(client, options);`,
    `${clientImport} HttpClient.retryTransient(${ignoredOptions}, options);`,
    `${clientImport} HttpClient.retryTransient(...clients, ${ignoredOptions});`,
    `${clientImport} HttpClient.retryTransient(client, ${ignoredOptions}, extra);`,
    `${clientImport} HttpClient.retryTransient();`,
    `${clientImport} function f(HttpClient) { HttpClient.retryTransient(${ignoredOptions}); }`,
    `${clientImport} { const HttpClient = custom; HttpClient.retryTransient(${ignoredOptions}); }`,
    `import * as H from 'effect/unstable/http/HttpClient'; function f(H) { H.retryTransient(${ignoredOptions}); }`,
    `import { retryTransient as retry } from 'effect/unstable/http/HttpClient'; function f(retry) { retry(${ignoredOptions}); }`,
    `import { HttpClient } from 'custom'; HttpClient.retryTransient(${ignoredOptions});`,
    `import { HttpClient } from '@effect/platform'; HttpClient.retryTransient(${ignoredOptions});`,
    `import * as HttpClient from '@effect/platform/HttpClient'; HttpClient.retryTransient(${ignoredOptions});`,
    `import { HttpClient } from 'effect'; HttpClient.retryTransient(${ignoredOptions});`,
    `import * as HttpClient from 'effect/other/HttpClient'; HttpClient.retryTransient(${ignoredOptions});`,
    `import type { HttpClient } from 'effect/unstable/http'; HttpClient.retryTransient(${ignoredOptions});`,
    `import { type HttpClient } from 'effect/unstable/http'; HttpClient.retryTransient(${ignoredOptions});`,
    `import { Effect } from 'effect'; Effect.retry(${ignoredOptions});`,
    `${clientImport} HttpClient.retry(${ignoredOptions});`,
    `${clientImport} HttpClient.catchAll(client, error => error.response.status === 401 ? refreshToken() : fail(error));`,
  ],
  invalid: [
    ...[
      [`import * as Http from 'effect/unstable/http';`, `Http.HttpClient.retryTransient(${ignoredOptions})`],
      [
        `import * as Client from 'effect/unstable/http/HttpClient';`,
        `Client.retryTransient(client, ${ignoredOptions})`,
      ],
      [`import { retryTransient as retry } from 'effect/unstable/http/HttpClient';`, `retry(${ignoredOptions})`],
      [`import { HttpClient as Client } from 'effect/http';`, `Client.retryTransient(${ignoredOptions})`],
      [`import * as Http from 'effect/http';`, `Http.HttpClient.retryTransient(client, ${ignoredOptions})`],
      [`import * as Client from 'effect/http/HttpClient';`, `Client.retryTransient(${ignoredOptions})`],
      [`import { retryTransient as retry } from 'effect/http/HttpClient';`, `retry(client, ${ignoredOptions})`],
      [clientImport, `HttpClient.retryTransient({ 'retryOn': 'response-only', 'while': predicate })`],
      [clientImport, `HttpClient.retryTransient({ retryOn: 'response-only', while() { return false; } })`],
    ].map(([imports, call]) => ({
      code: `${imports} ${call};`,
      errors: [{ messageId: 'ignoredWhile' }],
      output: null,
    })),
    {
      code: `${clientImport}\nHttpClient.retryTransient({ retryOn: 'response-only', while: predicate });`,
      errors: [{ messageId: 'ignoredWhile', line: 2, column: 54, endColumn: 70 }],
      output: null,
    },
  ],
});

testRule('no-ignored-response-only-retry-predicate', noIgnoredResponseOnlyRetryPredicate, {
  valid: `
    import { HttpClient as Client } from 'effect/unstable/http';
    Client.retryTransient({ retryOn: 'response-only', while: predicate }, { retryOn: 'errors-only' });
  `,
  invalid: `
    import { HttpClient as Client } from 'effect/unstable/http';
    Client.retryTransient(client, { retryOn: 'response-only', while: predicate });
  `,
  messageId: 'ignoredWhile',
  output: null,
});
