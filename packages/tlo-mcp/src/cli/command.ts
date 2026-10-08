import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import * as Command from 'effect/cli/Command';
import * as Flag from 'effect/cli/Flag';

import { OrbitAuth, OrbitAuthLive } from '../oauth/OrbitAuth.js';
import { connect } from './connect.js';

const NAME = 'tlo-mcp';

const VERSION = '1.0.0';

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

const tloMcpCommand = Command.make(
  NAME,
  {
    port: Flag.Int('port').pipe(
      Flag.withSchema(Schema.Int.check(Schema.isBetween({ minimum: 1024, maximum: 65_535 }))),
      Flag.withDefault(4790),
    ),
  },
  ({ port }) => connect(port),
).pipe(Command.withSubcommands([loginCommand, logoutCommand]));

export const run = Effect.fn('TloMcp.run')(function* (args: ReadonlyArray<string>) {
  return yield* Command.runWith(tloMcpCommand, { version: VERSION })(args);
});
