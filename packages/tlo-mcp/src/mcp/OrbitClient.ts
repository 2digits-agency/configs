/**
 * @effect-diagnostics unstableApiUsage:off
 */
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Stream from 'effect/Stream';
import * as Struct from 'effect/Struct';
import * as McpProtocol from 'effect/ai/McpProtocol';
import * as McpSchema from 'effect/ai/McpSchema';
import * as Sse from 'effect/encoding/Sse';
import { FetchHttpClient, HttpClient, HttpClientRequest, HttpClientResponse } from 'effect/http';

import { OrbitAuth } from '../oauth/OrbitAuth.js';
import { ORBIT_RESOURCE } from '../oauth/session.js';

const Reply = Schema.Union([
  Schema.Struct({ jsonrpc: Schema.Literal('2.0'), id: McpSchema.RequestId, result: Schema.Unknown }),
  Schema.Struct({
    jsonrpc: Schema.Literal('2.0'),
    id: Schema.NullOr(McpSchema.RequestId),
    error: McpSchema.McpErrorBase,
  }),
  Schema.Struct({ jsonrpc: Schema.Literal('2.0'), method: Schema.String, params: Schema.optionalKey(Schema.Unknown) }),
]);

const ReplyJson = Schema.fromJsonString(Reply);

const PROTOCOL = McpProtocol.v2025_06_18.protocolVersion;

export class OrbitMcpError extends Schema.TaggedError<OrbitMcpError>()('OrbitMcpError', {
  message: Schema.String,
}) {}

export interface OrbitClientShape {
  readonly tools: ReadonlyArray<McpSchema.Tool>;
  readonly instructions: string | undefined;
  readonly callTool: (
    name: string,
    arguments_: Schema.JsonObject,
  ) => Effect.Effect<McpSchema.CallToolResult, OrbitMcpError>;
}

export class OrbitClient extends Context.Service<OrbitClient, OrbitClientShape>()('@2digits/tlo-mcp/mcp/OrbitClient') {}

/**
 * Streamable HTTP request/response transport; no retry of possibly committed tool calls.
 */
export const OrbitClientLive = Layer.effect(
  OrbitClient,
  Effect.gen(function* () {
    const auth = yield* OrbitAuth;

    const http = (yield* HttpClient.HttpClient).pipe(
      HttpClient.withScope,
      HttpClient.transformResponse(
        Effect.flatMap(
          HttpClientResponse.matchStatus({
            '2xx': (response) => Effect.succeed(response),
            401: (response) =>
              OrbitMcpError.make({
                message: `Orbit HTTP ${response.status}: authorization rejected. Run tlo-mcp login; a 403 can also mean insufficient rights.`,
              }),
            403: (response) =>
              OrbitMcpError.make({
                message: `Orbit HTTP ${response.status}: authorization rejected. Run tlo-mcp login; a 403 can also mean insufficient rights.`,
              }),
            429: (response) =>
              OrbitMcpError.make({
                message: `Orbit rate limited. Retry after ${response.headers['retry-after'] ?? 'the server cooldown'}; request not replayed.`,
              }),
            orElse: (response) =>
              OrbitMcpError.make({ message: `Orbit HTTP ${response.status}. Request not replayed.` }),
          }),
        ),
      ),
    );

    let nextId = 0;

    let sessionId: string | undefined;

    const send = Effect.fn('OrbitClient.send')(
      function* (method: string, params: unknown, notification = false) {
        const id = ++nextId;

        const token = yield* auth.accessToken;

        const request = yield* HttpClientRequest.post(ORBIT_RESOURCE).pipe(
          HttpClientRequest.bearerToken(token),
          HttpClientRequest.setHeader('accept', 'application/json, text/event-stream'),
          HttpClientRequest.setHeader('mcp-protocol-version', PROTOCOL),
          (request) =>
            sessionId === undefined ? request : HttpClientRequest.setHeader(request, 'mcp-session-id', sessionId),
          HttpClientRequest.bodyJson({ jsonrpc: '2.0', ...(notification ? {} : { id }), method, params }),
        );

        const response = yield* http.execute(request);

        const receivedSessionId = response.headers['mcp-session-id'];

        if (method === 'initialize') {
          sessionId = receivedSessionId;
        }

        if (notification) {
          return;
        }

        const reply = response.headers['content-type']?.startsWith('text/event-stream')
          ? yield* response.stream.pipe(
              Stream.decodeText(),
              Stream.pipeThroughChannel(Sse.decode({ maxEventSize: 10 * 1024 * 1024 })),
              Stream.filter((event) => event.event === 'message' || event.event === ''),
              Stream.map(Struct.get('data')),
              Stream.mapEffect((data) => Schema.decodeEffect(ReplyJson)(data)),
              Stream.filter((reply) => 'id' in reply && reply.id === id),
              Stream.runHead,
              Effect.flatMap((reply) =>
                Opt.isSome(reply)
                  ? Effect.succeed(reply.value)
                  : OrbitMcpError.make({ message: 'Orbit stream ended before replying.' }),
              ),
            )
          : yield* HttpClientResponse.schemaBodyJson(Reply)(response);

        if (!('id' in reply) || reply.id !== id) {
          return yield* OrbitMcpError.make({ message: 'Unexpected Orbit response ID.' });
        }

        if ('error' in reply) {
          return yield* OrbitMcpError.make({ message: reply.error.message });
        }

        return reply.result;
      },
      Effect.timeout('120 seconds'),
      Effect.scoped,
      Effect.provideService(FetchHttpClient.RequestInit, { redirect: 'error' }),
      Effect.mapError((error) =>
        Schema.is(OrbitMcpError)(error)
          ? error
          : OrbitMcpError.make({ message: 'Orbit connection or response failed. Request not replayed.' }),
      ),
    );

    const initialization = yield* send('initialize', {
      protocolVersion: PROTOCOL,
      capabilities: {},
      clientInfo: { name: '@2digits/tlo-mcp', version: '0.1.38' },
    }).pipe(Effect.flatMap(Schema.decodeUnknownEffect(McpSchema.InitializeResult)));

    if (initialization.protocolVersion !== PROTOCOL) {
      return yield* OrbitMcpError.make({
        message: `Unsupported upstream MCP protocol: ${initialization.protocolVersion}.`,
      });
    }

    yield* send('notifications/initialized', {}, true);

    const cursors = new Set<string>();

    const tools = yield* Stream.paginate(
      undefined,
      Effect.fn('OrbitClient.listToolsPage')(function* (cursor: string | undefined) {
        const page = yield* send('tools/list', cursor === undefined ? {} : { cursor }).pipe(
          Effect.flatMap(Schema.decodeUnknownEffect(McpSchema.ListToolsResult)),
        );

        if (page.nextCursor !== undefined) {
          if (cursors.has(page.nextCursor)) {
            return yield* OrbitMcpError.make({ message: 'Orbit returned a repeated tools cursor.' });
          }

          cursors.add(page.nextCursor);
        }

        const next: readonly [ReadonlyArray<McpSchema.Tool>, Opt.Option<string | undefined>] = [
          page.tools,
          Opt.fromUndefinedOr(page.nextCursor),
        ];

        return next;
      }),
    ).pipe(Stream.runCollect);

    return OrbitClient.of({
      tools,
      instructions: initialization.instructions,
      callTool: Effect.fn('OrbitClient.callTool')(
        function* (name, args) {
          return yield* send('tools/call', { name, arguments: args });
        },
        Effect.flatMap(Schema.decodeUnknownEffect(McpSchema.CallToolResult)),
        Effect.catchTag('SchemaError', () =>
          OrbitMcpError.make({ message: 'Invalid Orbit tool result. Request not replayed.' }),
        ),
      ),
    });
  }),
).pipe(Layer.provide(FetchHttpClient.layer));
