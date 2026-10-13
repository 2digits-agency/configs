/**
 * @effect-diagnostics unstableApiUsage:off
 */
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Opt from 'effect/Option';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import * as Stream from 'effect/Stream';
import * as Struct from 'effect/Struct';
import * as McpProtocol from 'effect/ai/McpProtocol';
import * as McpSchema from 'effect/ai/McpSchema';
import * as Sse from 'effect/encoding/Sse';
import { FetchHttpClient, HttpClient, HttpClientRequest, HttpClientResponse } from 'effect/http';

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

/**
 * JSON-RPC codes that prove the gateway rejected the request before any tool ran.
 */
const NOT_DISPATCHED = new Set([-32_700, -32_600, -32_601, -32_602]);

export const DEFAULT_GATEWAY_URL = 'http://127.0.0.1:4790/mcp';

export class McpConnectError extends Schema.TaggedError<McpConnectError>()('McpConnectError', {
  message: Schema.String,
}) {}

/**
 * `delivery: 'unknown'` means the request may have reached Orbit: a write may have committed. Callers must read back
 * instead of retrying.
 */
export class McpCallError extends Schema.TaggedError<McpCallError>()('McpCallError', {
  tool: Schema.String,
  message: Schema.String,
  delivery: Schema.Literals(['not-sent', 'unknown']),
}) {}

export interface McpClientShape {
  readonly endpoint: string;
  readonly serverName: string;
  readonly tools: ReadonlyArray<McpSchema.Tool>;
  readonly callTool: (
    name: string,
    arguments_: Schema.JsonObject,
  ) => Effect.Effect<McpSchema.CallToolResult, McpCallError>;
}

export class McpClient extends Context.Service<McpClient, McpClientShape>()('@2digits/tlo-tui/mcp/McpClient') {}

export interface GatewayConnection {
  readonly url: string;
  readonly key: Redacted.Redacted;
  readonly callTimeout?: Duration.Input;
}

class SendFailure extends Schema.TaggedError<SendFailure>()('SendFailure', {
  message: Schema.String,
  dispatched: Schema.Boolean,
}) {}

/**
 * Streamable-HTTP MCP client for the local `tlo-mcp` gateway. It authenticates with the gateway key only; Orbit OAuth
 * and token refresh stay inside the gateway process. No request is ever retried.
 *
 * @param connection
 */
export function makeMcpClientLayer(connection: GatewayConnection) {
  return Layer.effect(
    McpClient,
    Effect.gen(function* () {
      const http = (yield* HttpClient.HttpClient).pipe(HttpClient.withScope);

      let nextId = 0;

      let sessionId: string | undefined;

      const send = Effect.fn('McpClient.send')(
        function* (method: string, params: unknown, notification = false) {
          const id = ++nextId;

          const request = yield* HttpClientRequest.post(connection.url).pipe(
            HttpClientRequest.bearerToken(Redacted.value(connection.key)),
            HttpClientRequest.setHeader('accept', 'application/json, text/event-stream'),
            HttpClientRequest.setHeader('mcp-protocol-version', PROTOCOL),
            (request) =>
              sessionId === undefined ? request : HttpClientRequest.setHeader(request, 'mcp-session-id', sessionId),
            HttpClientRequest.bodyJson({ jsonrpc: '2.0', ...(notification ? {} : { id }), method, params }),
            Effect.mapError(() => SendFailure.make({ message: 'Cannot encode MCP request.', dispatched: false })),
          );

          const response = yield* http
            .execute(request)
            .pipe(
              Effect.mapError(() =>
                SendFailure.make({ message: 'Gateway not reachable or connection dropped.', dispatched: true }),
              ),
            );

          if (response.status === 401 || response.status === 403) {
            return yield* SendFailure.make({
              message: `Gateway rejected the key (HTTP ${response.status}). Check ~/.config/2digits/tlo-mcp/gateway.key.`,
              dispatched: false,
            });
          }

          if (response.status === 413) {
            return yield* SendFailure.make({ message: 'Request too large for the gateway.', dispatched: false });
          }

          if (response.status < 200 || response.status >= 300) {
            return yield* SendFailure.make({ message: `Gateway HTTP ${response.status}.`, dispatched: true });
          }

          if (method === 'initialize') {
            sessionId = response.headers['mcp-session-id'];
          }

          if (notification) {
            return undefined;
          }

          const reply = yield* (
            response.headers['content-type']?.startsWith('text/event-stream')
              ? response.stream.pipe(
                  Stream.decodeText(),
                  Stream.pipeThroughChannel(Sse.decode({ maxEventSize: 10 * 1024 * 1024 })),
                  Stream.filter((event) => event.event === 'message' || event.event === ''),
                  Stream.map(Struct.get('data')),
                  Stream.mapEffect((data) => Schema.decodeEffect(ReplyJson)(data)),
                  Stream.filter((reply) => 'id' in reply && reply.id === id),
                  Stream.runHead,
                  Effect.flatMap(Opt.match({ onNone: () => Effect.fail('ended'), onSome: Effect.succeed })),
                )
              : HttpClientResponse.schemaBodyJson(Reply)(response)
          ).pipe(
            Effect.mapError(() => SendFailure.make({ message: 'Unreadable gateway response.', dispatched: true })),
          );

          if (!('id' in reply) || reply.id !== id) {
            return yield* SendFailure.make({ message: 'Unexpected MCP response ID.', dispatched: true });
          }

          if ('error' in reply) {
            return yield* SendFailure.make({
              message: reply.error.message,
              dispatched: !NOT_DISPATCHED.has(reply.error.code),
            });
          }

          return reply.result;
        },
        Effect.scoped,
        Effect.provideService(FetchHttpClient.RequestInit, { redirect: 'error' }),
      );

      const connect = <A>(method: string, params: unknown, schema: Schema.Decoder<A>) =>
        send(method, params).pipe(
          Effect.timeout('20 seconds'),
          Effect.flatMap(Schema.decodeUnknownEffect(schema)),
          Effect.mapError((error) =>
            McpConnectError.make({
              message: Schema.is(SendFailure)(error)
                ? error.message
                : `Gateway ${connection.url} did not answer ${method} correctly.`,
            }),
          ),
        );

      const initialization = yield* connect(
        'initialize',
        {
          protocolVersion: PROTOCOL,
          capabilities: {},
          clientInfo: { name: '@2digits/tlo-tui', version: '0.0.0' },
        },
        McpSchema.InitializeResult,
      );

      yield* send('notifications/initialized', {}, true).pipe(
        Effect.mapError((error) => McpConnectError.make({ message: error.message })),
      );

      const tools: Array<McpSchema.Tool> = [];

      const cursors = new Set<string>();

      let cursor: string | undefined;

      do {
        const page = yield* connect('tools/list', cursor === undefined ? {} : { cursor }, McpSchema.ListToolsResult);

        tools.push(...page.tools);

        cursor = page.nextCursor;

        if (cursor !== undefined) {
          if (cursors.has(cursor)) {
            return yield* McpConnectError.make({ message: 'Gateway returned a repeated tools cursor.' });
          }

          cursors.add(cursor);
        }
      } while (cursor !== undefined);

      return McpClient.of({
        endpoint: connection.url,
        serverName: initialization.serverInfo.name,
        tools,
        callTool: Effect.fn('McpClient.callTool')(function* (name, args) {
          return yield* send('tools/call', { name, arguments: args }).pipe(
            Effect.timeoutOrElse({
              duration: connection.callTimeout ?? '90 seconds',
              orElse: () => SendFailure.make({ message: 'No answer in time.', dispatched: true }),
            }),
            Effect.flatMap(Schema.decodeUnknownEffect(McpSchema.CallToolResult)),
            Effect.mapError((error) =>
              McpCallError.make({
                tool: name,
                message: Schema.is(SendFailure)(error) ? error.message : 'Invalid tool result.',
                delivery: Schema.is(SendFailure)(error) && !error.dispatched ? 'not-sent' : 'unknown',
              }),
            ),
          );
        }),
      });
    }),
  ).pipe(Layer.provide(FetchHttpClient.layer));
}
