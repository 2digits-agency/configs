import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Command from 'effect/unstable/cli/Command';

import { TloConfigLive } from '../layers/TloConfigLive.js';
import { TloLive } from '../layers/TloLive.js';
import { makeMcpServerLayer } from '../mcp/server.js';

const NAME = 'tlo-mcp';
const VERSION = '0.0.0';

const tloMcpCommand = Command.make(
  NAME,
  {},
  Effect.fn(function* () {
    return yield* makeMcpServerLayer({ name: NAME, version: VERSION }).pipe(
      Layer.provide(TloLive),
      Layer.provide(TloConfigLive),
      Layer.launch,
    );
  }),
);

export const run = Command.run(tloMcpCommand, { version: VERSION });
