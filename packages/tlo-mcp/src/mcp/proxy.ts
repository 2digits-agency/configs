import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import * as McpProtocol from 'effect/ai/McpProtocol';
import * as McpSchema from 'effect/ai/McpSchema';
import * as McpServer from 'effect/ai/McpServer';

import { OrbitClient } from './OrbitClient.js';
import { McpLoggerLayer } from './server.js';

export const OrbitProxyLive = Layer.unwrap(
  Effect.gen(function* () {
    const upstream = yield* OrbitClient;

    return Layer.effectDiscard(
      Effect.gen(function* () {
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
    ).pipe(
      Layer.provide(
        McpServer.layerStdio({
          name: 'tlo-mcp',
          version: '0.1.38',
          instructions: upstream.instructions,
          protocols: [McpProtocol.v2025_11_25, McpProtocol.v2025_06_18, McpProtocol.v2025_03_26],
        }),
      ),
      Layer.provide(McpLoggerLayer),
    );
  }),
);
