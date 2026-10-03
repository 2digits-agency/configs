/* oxlint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
/* eslint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
import { RuleTester } from 'oxlint/plugins-dev';
import { describe, it } from 'vite-plus/test';

import { rules } from '../../../src';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });
// RuleTester columns are zero-based; earlier-site message columns are human-readable (one-based).
const imports = `import { HttpApiGroup as G, HttpApiEndpoint as E } from 'effect/http-api';\n`;
// Constructor and add signatures verified against rc.108 and @effect/platform 0.97.2.
const rcImports = `import * as Api from 'effect/unstable/httpapi';\n`;
const platformImports = `import * as G from '@effect/platform/HttpApiGroup';\nimport { get as read, make as endpoint } from '@effect/platform/HttpApiEndpoint';\n`;

tester.run('no-duplicate-http-api-endpoints', rules['no-duplicate-http-api-endpoints'], {
  valid: [
    `${imports}G.make('users').add(E.get('list', '/users'), E.post('create', '/users'));`,
    `${imports}G.make('one').add(E.get('list', '/users')).prefix('/one'); G.make('two').add(E.get('list', '/users')).prefix('/two');`,
    `${imports}G.make('users').add(E.get('root', '/'), E.get('list', '/users'), E.get('slash', '/users/'), E.get('login', '/auth/login/'), E.post('loginPost', '/auth/login/'));`,
    `${imports}G.make('users').add(E.get('list', '/users')).prefix('/v1').add(E.get('copy', '/users'));`,
    `${imports}G.make('users').add(E.get('list', path), E.get('list', path));`,
    `${imports}G.make('users').add(E.get(name, '/users'), E.get(name, '/users'));`,
    `${imports}const factory = () => E.get('list', '/users'); G.make('users').add(factory(), factory());`,
    `${imports}let mutable = E.get('list', '/users'); mutable = E.get('other', '/other'); G.make('users').add(mutable, E.get('list', '/users'));`,
    `${imports}const mutable = E.get('list', '/users'); mutable = E.get('other', '/other'); G.make('users').add(mutable, E.get('list', '/users'));`,
    `${imports}function local(E) { G.make('users').add(E.get('list', '/users'), E.get('list', '/users')); }`,
    `${imports}function local(G) { G.make('users').add(E.get('list', '/users'), E.get('list', '/users')); }`,
    `${imports}const first = E.get('list', '/users'); function local(first) { G.make('users').add(first, E.get('list', '/users')); }`,
    `import { HttpApiGroup as G, HttpApiEndpoint as E } from 'unrelated'; G.make('users').add(E.get('list', '/users'), E.get('list', '/users'));`,
    `import type { HttpApiGroup as G, HttpApiEndpoint as E } from 'effect/http-api'; G.make('users').add(E.get('list', '/users'), E.get('list', '/users'));`,
    `${imports}import { first, second } from './endpoints'; G.make('users').add(first, second);`,
    `${imports}G.make('users').add(...endpoints);`,
    `${imports}builder.handle('list', handler).handle('list', handler); express.get('/users', first).get('/users', second);`,
    `${imports}G.make('users').add(E.get('list', '/users').prefix('/v1'), E.get('copy', '/users'));`,
    `${imports}G.make('users').add(E.get('list', '/users')).pipe(transform).add(E.get('copy', '/users'));`,
    `${platformImports}G.make('users').add(read('list', '/users'), read('copy', '/users'));`,
    `${platformImports}G.make('users').add(read('list')\`/users/\${Schema.String}\`).add(read('copy', '/users/:id'));`,
    `${imports}const item = E.get('list', '/users'); G.make('one').add(item); G.make('two').add(item);`,
    `${imports}const first = second; const second = first; G.make('users').add(first, second);`,
    `${imports}G.make('users').add(E.get('list', '/Users'), E.get('copy', '/users'));`,
    `${imports}G.make('users').add(E.get('list', '/users/:id'), E.get('copy', '/users/:name'));`,
    `${imports}G.make('users').add(E.get('list', '/users')).prefix(prefix).add(E.get('copy', '/users'));`,
    `${imports}G.make('users').add(E.get('list', '/users')).prefix('/v1').add(E.get('copy', '/v1/users'));`,
    `${imports}G.make('users').add(E.get('list', '/users'), E.get('copy', '/users').unknown());`,
    `${imports}G.make('users')?.add(E.get('list', '/users'), E.get('copy', '/users'));`,
    `${imports}G.make('users').add(E.get?.('list', '/users'), E.get('copy', '/users'));`,
    `${rcImports}Api.HttpApiGroup.make('users').add(Api.HttpApiEndpoint.query('list', '/users'), Api.HttpApiEndpoint.query('copy', '/users'));`,
    `${platformImports}G.make('users').add(endpoint('GET')('list', '/users', {})).add(read('copy', '/users'));`,
  ],
  invalid: [
    {
      code: `${imports}G.make('users')\n  .add(E.get('list', '/users'))\n  .add(E.get('copy', '/users'));`,
      errors: [
        { messageId: 'duplicateRoute', data: { method: 'GET', path: '/users', earlier: '3:8' }, line: 4, column: 7 },
      ],
      output: null,
    },
    {
      code: `${imports}const first = E.get('list', '/users').middleware(Auth);\nconst second = E.post('list', '/other').annotate(Tag, value);\nG.make('users').add(first, second);`,
      errors: [{ messageId: 'duplicateName', data: { name: 'list', earlier: '4:21' }, line: 4, column: 27 }],
      output: null,
    },
    {
      code: `${rcImports}Api.HttpApiGroup.make('users').add(Api.HttpApiEndpoint.delete('a', '/users'), Api.HttpApiEndpoint.make('DELETE')('b', '/users'));`,
      errors: [{ messageId: 'duplicateRoute' }],
      output: null,
    },
    {
      code: `${platformImports}G.make('users').add(read('list', '/users')).add(endpoint('GET')('copy', '/users'));`,
      errors: [{ messageId: 'duplicateRoute' }],
      output: null,
    },
    {
      code: `${imports}G.make('users').add(E.get('list', '/users')).prefix('/v1').add(E.post('list', '/other'));`,
      errors: [{ messageId: 'duplicateName' }],
      output: null,
    },
    {
      code: `${imports}G.make('users').add(E.get('list', '/users')).annotate(Tag, value).middleware(Auth).add(E.get('copy', '/users'));`,
      errors: [{ messageId: 'duplicateRoute' }],
      output: null,
    },
    {
      code: `import * as G from 'effect/http-api/HttpApiGroup';\nimport { get as read } from 'effect/http-api/HttpApiEndpoint';\nG.make('users').add(read('list', '/users'), read('copy', '/users'));`,
      errors: [{ messageId: 'duplicateRoute' }],
      output: null,
    },
    {
      code: `import * as G from 'effect/unstable/httpapi/HttpApiGroup';\nimport * as E from 'effect/unstable/httpapi/HttpApiEndpoint';\nG.make('users').add(E.get('list', '/users'), E.get('copy', '/users'));`,
      errors: [{ messageId: 'duplicateRoute' }],
      output: null,
    },
    {
      code: `${imports}G.make('users')\n  .add(E.get('list', '/users'), E.get('list', '/users'));`,
      errors: [
        { messageId: 'duplicateName', data: { name: 'list', earlier: '3:8' }, line: 3, column: 32 },
        { messageId: 'duplicateRoute', data: { method: 'GET', path: '/users', earlier: '3:8' }, line: 3, column: 32 },
      ],
      output: null,
    },
    {
      code: `${imports}G.make('users').add(E.get('list', '/users'), ...unknown, E.get('copy', '/users'));`,
      errors: [{ messageId: 'duplicateRoute' }],
      output: null,
    },
    {
      code: `${imports}const first = E.get('list', '/users'); { const first = E.get('other', '/other'); G.make('users').add(first, E.get('copy', '/other')); }`,
      errors: [{ messageId: 'duplicateRoute' }],
      output: null,
    },
    {
      code: `${imports}G.make('users').add(E.query('list', '/users'), E.make('QUERY')('copy', '/users'));`,
      errors: [{ messageId: 'duplicateRoute' }],
      output: null,
    },
    {
      code: `${imports}const first = E.get('list', '/users'); const alias = first; const second = E.get('copy', '/users'); G.make('users').add(alias, second);`,
      errors: [{ messageId: 'duplicateRoute' }],
      output: null,
    },
    {
      code: `import { HttpApiGroup as G, HttpApiEndpoint as E } from '@effect/platform'; G.make('users').add(E.del('list', '/users')).add(E.make('DELETE')('copy', '/users'));`,
      errors: [{ messageId: 'duplicateRoute' }],
      output: null,
    },
  ],
});
