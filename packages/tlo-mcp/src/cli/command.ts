import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Command from 'effect/cli/Command';

import { TloConfigLive } from '../layers/TloConfigLive.js';
import { TloLive } from '../layers/TloLive.js';
import { OrbitClientLive } from '../mcp/OrbitClient.js';
import { OrbitProxyLive } from '../mcp/proxy.js';
// oxlint-disable-next-line 2digits/no-service-constructor-imports -- This composition root builds the owning server Layer, not a service instance.
import { makeMcpServerLayer } from '../mcp/server.js';
import { OrbitAuth, OrbitAuthLive } from '../oauth/OrbitAuth.js';

const NAME = 'tlo-mcp';

const VERSION = '0.1.38';

const legacyCommand = Command.make(
  'legacy',
  {},
  Effect.fn('TloMcp.serve')(function* () {
    return yield* makeMcpServerLayer({ name: NAME, version: VERSION }).pipe(
      Layer.provide(TloLive),
      Layer.provide(TloConfigLive),
      Layer.launch,
    );
  }),
);

const loginCommand = Command.make(
  'login',
  {},
  Effect.fn('TloMcp.login')(
    function* () {
      const auth = yield* OrbitAuth;

      yield* auth.login;
    },
    Effect.provide(OrbitAuthLive),
    Effect.scoped,
  ),
);

const logoutCommand = Command.make(
  'logout',
  {},
  Effect.fn('TloMcp.logout')(
    function* () {
      const auth = yield* OrbitAuth;

      yield* auth.logout;
    },
    Effect.provide(OrbitAuthLive),
    Effect.scoped,
  ),
);

const tloMcpCommand = Command.make(NAME, {}, () =>
  OrbitProxyLive.pipe(Layer.provide(OrbitClientLive), Layer.provide(OrbitAuthLive), Layer.launch),
).pipe(Command.withSubcommands([loginCommand, logoutCommand, legacyCommand]));

export const run = Effect.fn('TloMcp.run')(function* (args: ReadonlyArray<string>) {
  return yield* Command.runWith(tloMcpCommand, { version: VERSION })(args);
});
