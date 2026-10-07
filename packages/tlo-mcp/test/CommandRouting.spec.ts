import * as NodeServices from '@effect/platform-node/NodeServices';
import { describe, expect, it } from '@effect/vitest';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import * as Stdio from 'effect/Stdio';
import { vi } from 'vite-plus/test';

import { run } from '../src/cli/command.js';

const routing = vi.hoisted((): { routes: Array<string> } => ({ routes: [] }));

vi.mock(import('../src/layers/TloConfigLive.js'), () =>
  Promise.all([
    import('effect/Layer'),
    import('effect/Redacted'),
    import('effect/http/Cookies'),
    import('../src/services/TloConfig.js'),
  ]).then(([Layer, Redacted, Cookies, { TloConfig }]) => ({
    TloConfigLive: Layer.mock(TloConfig, {
      baseUrl: 'https://teamleader.test',
      sessionToken: Redacted.make('routing-test'),
      cookies: Cookies.empty,
    }),
  })),
);

vi.mock(import('../src/layers/TloLive.js'), () =>
  Promise.all([
    import('effect/Layer'),
    import('../src/services/TimeService.js'),
    import('../src/services/BoardService.js'),
  ]).then(([Layer, { TimeService }, { BoardService }]) => ({
    TloLive: Layer.merge(Layer.mock(TimeService, {}), Layer.mock(BoardService, {})),
  })),
);

vi.mock(import('../src/mcp/OrbitClient.js'), (importOriginal) =>
  Promise.all([importOriginal(), import('effect/Layer')]).then(([original, Layer]) => ({
    ...original,
    OrbitClientLive: Layer.mock(original.OrbitClient, { tools: [], instructions: undefined }),
  })),
);

vi.mock(import('../src/mcp/proxy.js'), () =>
  Promise.all([import('effect/Effect'), import('effect/Layer')]).then(([Effect, Layer]) => ({
    OrbitProxyLive: Layer.effectDiscard(
      Effect.sync(() => {
        routing.routes.push('stdio');
      }).pipe(Effect.andThen(Effect.die('server stopped'))),
    ),
  })),
);

vi.mock(import('../src/mcp/server.js'), () =>
  Promise.all([import('effect/Effect'), import('effect/Layer')]).then(([Effect, Layer]) => ({
    makeMcpServerLayer: () =>
      Layer.effectDiscard(
        Effect.sync(() => {
          routing.routes.push('legacy');
        }).pipe(Effect.andThen(Effect.die('server stopped'))),
      ),
  })),
);

vi.mock(import('../src/oauth/OrbitAuth.js'), (importOriginal) =>
  Promise.all([importOriginal(), import('effect/Effect'), import('effect/Layer')]).then(
    ([original, Effect, Layer]) => ({
      ...original,
      OrbitAuthLive: Layer.succeed(
        original.OrbitAuth,
        original.OrbitAuth.of({
          accessToken: Effect.die('routing must not request credentials'),
          login: Effect.sync(() => {
            routing.routes.push('login');
          }),
          logout: Effect.sync(() => {
            routing.routes.push('logout');
          }),
        }),
      ),
    }),
  ),
);

describe('command routing', () => {
  for (const { args, route } of [
    { args: [], route: 'stdio' },
    { args: ['login'], route: 'login' },
    { args: ['logout'], route: 'logout' },
    { args: ['legacy'], route: 'legacy' },
  ]) {
    it.effect(`routes explicit arguments to ${route}, not Stdio arguments`, () =>
      Effect.gen(function* () {
        routing.routes.length = 0;

        const exit = yield* run(args).pipe(Effect.exit);

        expect(routing.routes).toStrictEqual([route]);

        if (route === 'stdio' || route === 'legacy') {
          expect(Exit.isFailure(exit)).toBeTruthy();

          if (Exit.isFailure(exit)) {
            expect(Cause.squash(exit.cause)).toBe('server stopped');
          }
        } else {
          expect(Exit.isSuccess(exit)).toBeTruthy();
        }
      }).pipe(
        Effect.provide(
          Layer.merge(NodeServices.layer, Stdio.layerTest({ args: Effect.succeed(['unknown-stdio-command']) })),
        ),
      ),
    );
  }

  it.effect('rejects unknown commands without starting any handler', () =>
    Effect.gen(function* () {
      routing.routes.length = 0;

      const exit = yield* run(['unknown-command']).pipe(Effect.exit);

      expect(Exit.isFailure(exit)).toBeTruthy();

      expect(routing.routes).toStrictEqual([]);
    }).pipe(Effect.provide(Layer.merge(NodeServices.layer, Stdio.layerTest({})))),
  );
});
