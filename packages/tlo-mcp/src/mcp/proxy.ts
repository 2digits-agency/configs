import * as Arr from 'effect/Array';
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
 * The result of an Orbit 429, for forwarded tools and composites alike. McpServer keeps only the message of an
 * InternalError, so Orbit's Retry-After goes into `_meta` for clients that want to wait out the cooldown.
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
 * McpServer returns a composite's `OrbitReadError` as JSON text and has no hook for `_meta`. Show the message instead,
 * and a rate limit the same way as forwarded tools.
 *
 * @param result
 */
function readErrorResult(result: McpSchema.CallToolResult | McpSchema.InputRequired) {
  const [block] = 'content' in result && result.isError === true ? result.content : [];

  return Opt.match(block?.type === 'text' ? decodeReadError(block.text) : Opt.none(), {
    onNone: () => result,
    onSome: ({ message, status, retryAfter }) =>
      status === 429
        ? rateLimited(retryAfter)
        : McpSchema.CallToolResult.make({ isError: true, content: [{ type: 'text', text: message }] }),
  });
}

export const OrbitToolsLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const upstream = yield* OrbitClient;

    const server = yield* McpServer.McpServer;

    // oxlint-disable-next-line unicorn/no-array-for-each
    yield* Effect.forEach(
      // oxlint-disable-next-line unicorn/no-array-method-this-argument
      // A gateway tool with the same name replaces the forwarded one.
      Arr.filter(upstream.tools, ({ name }) => !(name in CompositeTools.tools)),
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

    // Gateway tools next to the forwarded allowlist; they call Orbit through the same client.
    yield* McpServer.registerToolkit(CompositeTools).pipe(
      Effect.provideService(
        McpServer.McpServer,
        McpServer.McpServer.of({
          ...server,
          addTool: Effect.fn('OrbitProxyLive.composite')(function* (registration) {
            yield* server.addTool({
              ...registration,
              handle: (payload) => registration.handle(payload).pipe(Effect.map(readErrorResult)),
            });
          }),
        }),
      ),
    );
  }),
).pipe(Layer.provide(Layer.provideMerge(CompositeToolsLive, OrbitLive)));
