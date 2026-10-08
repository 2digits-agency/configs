import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import * as McpSchema from 'effect/ai/McpSchema';
import * as McpServer from 'effect/ai/McpServer';

import { OrbitClient } from './OrbitClient.js';

export const OrbitToolsLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const upstream = yield* OrbitClient;

    const server = yield* McpServer.McpServer;

    // oxlint-disable-next-line unicorn/no-array-for-each
    yield* Effect.forEach(
      // oxlint-disable-next-line unicorn/no-array-method-this-argument
      upstream.tools,
      Effect.fn('OrbitProxyLive.tool')(function* (tool) {
        yield* server.addTool({
          tool,
          annotations: Context.empty(),
          handle: Effect.fn('handle')(
            function* (input) {
              return yield* Schema.decodeUnknownEffect(Schema.JsonObject)(input);
            },
            Effect.mapError((data) =>
              McpSchema.InvalidParams.make({ message: 'Tool arguments must be a JSON object.', data }),
            ),
            Effect.flatMap((args) =>
              upstream
                .callTool(tool.name, args)
                .pipe(Effect.mapError((error) => McpSchema.InternalError.make({ message: error.message }))),
            ),
          ),
        });
      }),
      { discard: true },
    );
  }),
);
