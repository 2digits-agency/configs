import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Command from 'effect/cli/Command';
import * as Flag from 'effect/cli/Flag';

import { OrbitAuth, OrbitAuthLive } from '../oauth/OrbitAuth.js';
import { connect } from './connect.js';

const NAME = 'tlo-mcp';

const VERSION = '1.0.0';

function authCommand(name: 'login' | 'logout') {
  return Command.make(
    name,
    {},
    Effect.fn(`TloMcp.${name}`)(
      function* () {
        const auth = yield* OrbitAuth;

        yield* auth[name];
      },
      Effect.provide(OrbitAuthLive),
      Effect.scoped,
    ),
  );
}

const tloMcpCommand = Command.make(
  NAME,
  {
    port: Flag.Int('port').pipe(
      Flag.withSchema(Schema.Int.check(Schema.isBetween({ minimum: 1024, maximum: 65_535 }))),
      Flag.withDefault(4790),
    ),
    publicUrl: Flag.String('public-url').pipe(
      Flag.withSchema(
        Schema.String.check(
          Schema.isPattern(/^https:\/\/[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?::\d{1,5})?\/?$/i),
          // The pattern fixes the shape; URL parsing also rejects what it cannot express, such as ports above 65535.
          Schema.makeFilter((value: string) => URL.canParse(value) || 'Expected a valid HTTPS origin'),
        ),
      ),
      Flag.withDescription('Serve on 0.0.0.0 behind this HTTPS origin instead of opening OpenTunnel'),
      Flag.optional,
    ),
  },
  ({ port, publicUrl }) => connect(port, Option.getOrUndefined(publicUrl)),
).pipe(Command.withSubcommands([authCommand('login'), authCommand('logout')]));

export const run = Effect.fn('TloMcp.run')(function* (args: ReadonlyArray<string>) {
  return yield* Command.runWith(tloMcpCommand, { version: VERSION })(args);
});
