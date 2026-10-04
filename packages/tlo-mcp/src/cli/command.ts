import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Command from 'effect/cli/Command';

import { TloConfigLive } from '../layers/TloConfigLive.js';
import { TloLive } from '../layers/TloLive.js';
// oxlint-disable-next-line 2digits/no-service-constructor-imports -- This composition root builds the owning server Layer, not a service instance.
import { makeMcpServerLayer } from '../mcp/server.js';

const NAME = 'tlo-mcp';

const VERSION = '0.0.0';

const tloMcpCommand = Command.make(
  NAME,
  {},
  Effect.fn('TloMcp.serve')(function* () {
    return yield* makeMcpServerLayer({ name: NAME, version: VERSION }).pipe(
      Layer.provide(TloLive),
      Layer.provide(TloConfigLive),
      Layer.launch,
    );
  }),
);

export const run = Effect.fn('TloMcp.run')(function* (_args: ReadonlyArray<string>) {
  return yield* Command.run(tloMcpCommand, { version: VERSION });
});
