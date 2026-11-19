import * as Arr from 'effect/Array';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';
import * as McpClient from 'effect/ai/McpClient';
import type * as McpClientError from 'effect/ai/McpClientError';
import * as McpProtocol from 'effect/ai/McpProtocol';
import type * as McpSchema from 'effect/ai/McpSchema';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as Headers from 'effect/http/Headers';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientError from 'effect/http/HttpClientError';
import * as HttpClientRequest from 'effect/http/HttpClientRequest';
import type * as HttpClientResponse from 'effect/http/HttpClientResponse';

import { OrbitAuth } from '../oauth/OrbitAuth.js';
import { ORBIT_RESOURCE } from '../oauth/session.js';
import { EXPOSED_TOOLS } from './tools.js';

export interface OrbitClientShape {
  /**
   * Only the upstream tools listed in `EXPOSED_TOOLS`.
   */
  readonly tools: ReadonlyArray<McpSchema.Tool>;
  readonly instructions: string | undefined;
  readonly callTool: (
    tool: McpSchema.Tool,
    arguments_: Schema.JsonObject,
  ) => Effect.Effect<McpSchema.CallToolResult, McpClientError.McpClientError>;
}

export class OrbitClient extends Context.Service<OrbitClient, OrbitClientShape>()('@2digits/tlo-mcp/mcp/OrbitClient') {}

/**
 * Messages the gateway sends while starting. Orbit can rate limit them to one request per minute, so the gateway waits
 * out a 429 instead of failing to start; `tools/call` is never replayed.
 */
const STARTUP_METHODS: ReadonlySet<string> = new Set(['initialize', 'notifications/initialized', 'tools/list']);

/**
 * Bounds the startup handshake and tool discovery, including the Retry-After waits.
 */
const STARTUP_TIMEOUT = '10 minutes';

const decodeMethod = Schema.decodeUnknownOption(Schema.Struct({ method: Schema.String }).pipe(Schema.fromJsonString));

function startupMethod(request: HttpClientRequest.HttpClientRequest): string | undefined {
  if (request.body._tag !== 'Uint8Array') {
    return undefined;
  }

  const method = Opt.getOrUndefined(decodeMethod(new TextDecoder().decode(request.body.body)))?.method;

  return P.isNotUndefined(method) && STARTUP_METHODS.has(method) ? method : undefined;
}

/**
 * The wait a 429 asks for, as seconds or an HTTP date; one minute when Orbit omits it or sends something else.
 *
 * @param response
 * @param now
 */
function retryAfter(response: HttpClientResponse.HttpClientResponse, now: number): Duration.Duration {
  const parsed = Headers.parseRetryAfter(response.headers['retry-after'] ?? '');

  return Result.isSuccess(parsed) ? Headers.retryAfterDelay(parsed.success, now) : Duration.minutes(1);
}

/**
 * Fetch client that refreshes the Orbit bearer token per request and refuses redirects.
 */
const OrbitHttpClient = Layer.effect(
  HttpClient.HttpClient,
  Effect.gen(function* () {
    const auth = yield* OrbitAuth;

    // Fail startup with the typed login error; later refresh failures surface as the transport error's cause.
    yield* auth.accessToken;

    const authorized = (yield* HttpClient.HttpClient).pipe(
      HttpClient.mapRequestEffect((request) =>
        auth.accessToken.pipe(
          Effect.mapBoth({
            onSuccess: (token) => HttpClientRequest.bearerToken(request, token),
            onFailure: (cause) =>
              new HttpClientError.HttpClientError({
                reason: new HttpClientError.TransportError({ request, cause, description: cause.message }),
              }),
          }),
        ),
      ),
      HttpClient.transform(Effect.provideService(FetchHttpClient.RequestInit, { redirect: 'error' })),
    );

    const client: typeof authorized = authorized.pipe(
      HttpClient.transform((send, request) => {
        const method = startupMethod(request);

        if (P.isUndefined(method)) {
          return send;
        }

        return send.pipe(
          Effect.flatMap(
            Effect.fnUntraced(function* (response) {
              if (response.status !== 429) {
                return response;
              }

              const now = yield* Clock.currentTimeMillis;

              const delay = retryAfter(response, now);

              yield* Effect.logWarning(
                `Orbit rate limited ${method}; retrying in ${Duration.format(delay)} (Retry-After).`,
              );

              yield* Effect.sleep(delay);

              // Through the whole client, so the retry signs the request with a fresh token after a long wait.
              return yield* client.execute(request);
            }),
          ),
        );
      }),
    );

    return client;
  }),
).pipe(Layer.provide(FetchHttpClient.layer));

const containsMcpTool = Arr.containsWith<McpSchema.Tool | McpSchema.Tool['name']>((a, b) => {
  const left = P.isString(a) ? a : a.name;

  const right = P.isString(b) ? b : b.name;

  return left === right;
});

export const OrbitClientLive = Layer.effect(
  OrbitClient,
  Effect.gen(function* () {
    const client = yield* McpClient.McpClient;

    const tools = yield* client
      .listTools()
      .pipe(Effect.map(Arr.filter((tool) => containsMcpTool(EXPOSED_TOOLS, tool))));

    const missing = Arr.filter(EXPOSED_TOOLS, (name) => !containsMcpTool(tools, name));

    if (Arr.isReadonlyArrayNonEmpty(missing)) {
      yield* Effect.logWarning(`Orbit no longer offers these exposed tools: ${Arr.join(missing, ', ')}`);
    }

    return OrbitClient.of({
      tools,
      instructions: client.instructions,
      callTool: Effect.fn('OrbitClient.callTool')(function* (tool, args) {
        return yield* client.callTool({ tool, arguments: args }, { timeout: '120 seconds' });
      }),
    });
  }),
).pipe(
  Layer.provide(
    McpClient.layerHttp({
      name: '@2digits/tlo-mcp',
      version: '1.0.0',
      protocol: McpProtocol.v2025_11_25,
      url: ORBIT_RESOURCE,
      timeout: STARTUP_TIMEOUT,
    }),
  ),
  Layer.provide(OrbitHttpClient),
);
