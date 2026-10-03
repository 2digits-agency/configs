import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import { HttpRouter, HttpServerResponse } from 'effect/http';
import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api';
import { describe, expect, it } from 'vite-plus/test';

type Route = readonly ['GET' | 'POST', HttpRouter.PathInput];

function build(first: Route, ...rest: Array<Route>) {
  const handler = Effect.succeed(HttpServerResponse.empty());

  return Effect.runPromiseExit(
    Effect.scoped(
      HttpRouter.toHttpEffect(
        Layer.mergeAll(
          HttpRouter.add(first[0], first[1], handler),
          ...rest.map(([method, path]) => HttpRouter.add(method, path, handler)),
        ),
      ),
    ),
  );
}

describe('effect 4.0.0 HTTP API runtime controls', () => {
  it('rejects duplicate GET routes when building a router', async () => {
    const exit = await build(['GET', '/users'], ['GET', '/users']);

    expect(exit).toMatchObject({ _tag: 'Failure' });
    expect(Exit.match(exit, { onFailure: Cause.pretty, onSuccess: () => 'unexpected success' })).toContain(
      "Method 'GET' already declared for route '/users'",
    );
  });

  it('builds GET and POST on the same path, including the intentional login slash', async () => {
    expect(Exit.isSuccess(await build(['GET', '/users'], ['POST', '/users']))).toBeTruthy();
    expect(Exit.isSuccess(await build(['GET', '/auth/login/'], ['POST', '/auth/login/']))).toBeTruthy();
  });

  it('builds independent routers with identical route literals', async () => {
    expect(Exit.isSuccess(await build(['GET', '/users']))).toBeTruthy();
    expect(Exit.isSuccess(await build(['GET', '/users']))).toBeTruthy();
  });

  it('overwrites repeated endpoint names and prefixes only existing group endpoints', () => {
    const group = HttpApiGroup.make('users')
      .add(HttpApiEndpoint.get('list', '/users'))
      // oxlint-disable-next-line 2digits/no-duplicate-http-api-endpoints -- Exercise Effect's name-overwrite behavior.
      .add(HttpApiEndpoint.post('list', '/other'))
      .prefix('/v1')
      .add(HttpApiEndpoint.get('later', '/users'));

    expect(Object.keys(group.endpoints)).toStrictEqual(['list', 'later']);
    expect(group.endpoints.list.path).toBe('/v1/other');
    expect(group.endpoints.later.path).toBe('/users');
  });
});
