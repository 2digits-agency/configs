import { preferEffectHttpStatus } from '../../../src/rules/effect/prefer-effect-http-status';
import { createRuleTester, testRule } from '../../rule-tester';

const valid = `
  import { HttpApiSchema } from 'effect/http-api'
  import { HttpServerResponse, HttpStatus } from 'effect/http'
  const error = HttpApiSchema.status('NotFound')
  const created = HttpServerResponse.empty({ status: HttpStatus.fromLiteral('Created') })
  const fake = { status: 404 }
  const failed = response.status === 500
  const unknown = { httpApiStatus: 299 }
  const other = client.status(404)
  const body = HttpServerResponse.json({ status: 200 })
`;

createRuleTester().run('prefer-effect-http-status', preferEffectHttpStatus, {
  valid: [
    'const schema = { httpApiStatus: 404 }',
    `import * as HttpApiSchema from 'other-library'; HttpApiSchema.status(404)`,
    `import type * as Api from 'effect/http-api/HttpApiSchema'; Api.status(404)`,
    `import { type status } from 'effect/http-api/HttpApiSchema'; status(404)`,
    `import * as Api from 'effect/http-api/HttpApiSchema'; function custom(Api: Client) { Api.status(404) }`,
    `import { status as setStatus } from 'effect/http-api/HttpApiSchema'; function custom(setStatus: Setter) { setStatus(404) }`,
  ],
  invalid: [
    {
      code: `import * as Api from 'effect/http-api/HttpApiSchema'; Api['status'](404)`,
      errors: [{ messageId: 'statusName', data: { code: '404', literal: 'NotFound' } }],
    },
    {
      code: `import { status as setStatus } from 'effect/http-api/HttpApiSchema'; setStatus(201)`,
      errors: [{ messageId: 'statusName', data: { code: '201', literal: 'Created' } }],
    },
    {
      code: `import * as Http from 'effect/http'; Http.HttpServerResponse.empty({ status: 204 })`,
      errors: [{ messageId: 'httpStatus', data: { code: '204', literal: 'NoContent' } }],
    },
    {
      code: `import type { Schema } from 'effect'; const schema = { httpApiStatus: 418 }`,
      errors: [{ messageId: 'httpStatus', data: { code: '418', literal: 'ImATeapot' } }],
    },
  ],
});

testRule('prefer-effect-http-status', preferEffectHttpStatus, {
  valid,
  invalid: `
    import { HttpApiSchema } from 'effect/http-api'
    const error = HttpApiSchema.status(404)
  `,
  messageId: 'statusName',
  data: { code: '404', literal: 'NotFound' },
});

for (const [invalid, code, literal] of [
  // The status option comes after the body; the body's own `status` field is not a response status.
  ['HttpServerResponse.json({ status: 404 }, { status: 200 })', '200', 'OK'],
  ['HttpServerResponse.empty({ status: 204 })', '204', 'NoContent'],
  ['HttpServerResponse.setStatus(response, 429)', '429', 'TooManyRequests'],
  ['response.pipe(HttpServerResponse.setStatus(503))', '503', 'ServiceUnavailable'],
  ['HttpApiSchema.Empty(202)', '202', 'Accepted'],
  [
    "class Unauthorized extends Schema.TaggedErrorClass<Unauthorized>()('Unauthorized', {}, { httpApiStatus: 401 }) {}",
    '401',
    'Unauthorized',
  ],
] as const) {
  testRule('prefer-effect-http-status', preferEffectHttpStatus, {
    valid,
    invalid: `
      import * as Schema from 'effect/Schema'
      import { HttpApiSchema } from 'effect/http-api'
      import * as HttpServerResponse from 'effect/http/HttpServerResponse'
      ${invalid}
    `,
    messageId: 'httpStatus',
    data: { code, literal },
  });
}
