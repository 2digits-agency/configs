import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as McpSchema from 'effect/ai/McpSchema';
import * as McpServer from 'effect/ai/McpServer';

import { OrbitReadError } from '../composites/OrbitReadError.js';
import { CompositeTools, CompositeToolsLive } from '../composites/toolkit.js';
import { OrbitLive } from '../orbit/Orbit.js';
import { OrbitClient } from './OrbitClient.js';

const decodeUnknownJsonObject = Schema.decodeUnknownEffect(Schema.JsonObject);

const decodeReadError = Schema.decodeUnknownOption(OrbitReadError.pipe(Schema.fromJsonString));

/**
 * McpServer reduces InternalError to its message, so a rate limit becomes a tool error result whose _meta keeps Orbit's
 * Retry-After for clients that want to wait out the cooldown.
 *
 * @param retryAfter
 */
function rateLimited(retryAfter: string | undefined) {
  return McpSchema.CallToolResult.make({
    isError: true,
    content: [
      {
        type: 'text',
        text: `Orbit rate limited this call; retry after ${retryAfter ?? 'the server cooldown'}. Not replayed.`,
      },
    ],
    _meta: {
      'tlo-mcp/httpStatus': 429,
      ...(retryAfter === undefined ? {} : { 'tlo-mcp/retryAfter': retryAfter }),
    },
  });
}

/**
 * Composite failures arrive as an encoded `OrbitReadError`; report its message, and rate limits like forwarded tools.
 *
 * @param result
 */
function compositeResult(result: McpSchema.CallToolResult | McpSchema.InputRequired) {
  if (!('content' in result)) {
    return result;
  }

  const block = result.content[0];

  const error = result.isError === true && block?.type === 'text' ? decodeReadError(block.text) : Opt.none();

  if (Opt.isNone(error)) {
    return result;
  }

  return error.value.httpStatus === 429
    ? rateLimited(error.value.retryAfter)
    : McpSchema.CallToolResult.make({ isError: true, content: [{ type: 'text', text: error.value.message }] });
}

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
              return yield* decodeUnknownJsonObject(input);
            },
            Effect.mapError((data) =>
              McpSchema.InvalidParams.make({ message: 'Tool arguments must be a JSON object.', data }),
            ),
            Effect.flatMap((args) =>
              upstream.callTool(tool, args).pipe(
                Effect.catchReason('McpClientError', 'HttpError', ({ status, retryAfter }, error) =>
                  status === 429 ? Effect.succeed(rateLimited(retryAfter)) : Effect.fail(error),
                ),
                Effect.mapError((error) => McpSchema.InternalError.make({ message: error.message })),
              ),
            ),
          ),
        });
      }),
      { discard: true },
    );

    // Read-only composites next to the forwarded allowlist; they call Orbit through the same client.
    yield* McpServer.registerToolkit(CompositeTools).pipe(
      Effect.provideService(
        McpServer.McpServer,
        McpServer.McpServer.of({
          ...server,
          addTool: Effect.fn('OrbitProxyLive.composite')(function* (registration) {
            yield* server.addTool({
              ...registration,
              handle: (payload) => registration.handle(payload).pipe(Effect.map(compositeResult)),
            });
          }),
        }),
      ),
    );
  }),
).pipe(Layer.provide(Layer.provideMerge(CompositeToolsLive, OrbitLive)));
