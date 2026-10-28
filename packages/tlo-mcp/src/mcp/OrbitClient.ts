/**
 * @effect-diagnostics unstableApiUsage:off
 */
import * as Arr from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import * as Struct from 'effect/Struct';
import * as McpClient from 'effect/ai/McpClient';
import type * as McpClientError from 'effect/ai/McpClientError';
import * as McpProtocol from 'effect/ai/McpProtocol';
import type * as McpSchema from 'effect/ai/McpSchema';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientError from 'effect/http/HttpClientError';
import * as HttpClientRequest from 'effect/http/HttpClientRequest';

import { OrbitAuth } from '../oauth/OrbitAuth.js';
import { ORBIT_RESOURCE, OrbitAuthError } from '../oauth/session.js';
import { EXPOSED_TOOLS } from './tools.js';

export class OrbitMcpError extends Schema.TaggedError<OrbitMcpError, { readonly brand: unique symbol }>()(
  'OrbitMcpError',
  {
    message: Schema.String,
  },
) {}

const isOrbitAuthError = Schema.is(OrbitAuthError);

/**
 * Explain an upstream failure; McpClient never retries, so no request is replayed.
 *
 * @param error
 */
function orbitError(error: McpClientError.McpClientError) {
  const { reason } = error;

  if (reason._tag === 'HttpError') {
    if (reason.status === 401 || reason.status === 403) {
      return OrbitMcpError.make({
        message: `Orbit HTTP ${reason.status}: authorization rejected. Run tlo-mcp login; a 403 can also mean insufficient rights.`,
      });
    }

    if (reason.status === 429) {
      return OrbitMcpError.make({
        message: `Orbit rate limited. Retry after ${reason.retryAfter ?? 'the server cooldown'}; request not replayed.`,
      });
    }

    return OrbitMcpError.make({ message: `Orbit HTTP ${reason.status}. Request not replayed.` });
  }

  const authFailure =
    reason._tag === 'TransportError' && HttpClientError.isHttpClientError(reason.cause)
      ? reason.cause.reason.cause
      : undefined;

  return OrbitMcpError.make({
    message: isOrbitAuthError(authFailure) ? authFailure.message : `Orbit: ${reason.message}. Request not replayed.`,
  });
}

export interface OrbitClientShape {
  /**
   * Only the upstream tools listed in `EXPOSED_TOOLS`.
   */
  readonly tools: ReadonlyArray<McpSchema.Tool>;
  readonly instructions: string | undefined;
  readonly callTool: (
    tool: McpSchema.Tool,
    arguments_: Schema.JsonObject,
  ) => Effect.Effect<McpSchema.CallToolResult, OrbitMcpError>;
}

export class OrbitClient extends Context.Service<OrbitClient, OrbitClientShape>()('@2digits/tlo-mcp/mcp/OrbitClient') {}

/**
 * Fetch client that refreshes the Orbit bearer token per request and refuses redirects.
 */
const OrbitHttpClient = Layer.effect(
  HttpClient.HttpClient,
  Effect.gen(function* () {
    const auth = yield* OrbitAuth;

    return (yield* HttpClient.HttpClient).pipe(
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
  }),
).pipe(Layer.provide(FetchHttpClient.layer));

export const OrbitClientLive = Layer.effect(
  OrbitClient,
  Effect.gen(function* () {
    const transport = yield* McpClient.http({ protocol: McpProtocol.v2025_11_25, url: ORBIT_RESOURCE });

    const client = yield* McpClient.make({ name: '@2digits/tlo-mcp', version: '1.0.0' }).pipe(
      Effect.provideService(McpClient.Transport, transport),
    );

    const upstream = yield* client.listTools();

    const missing = Arr.difference(EXPOSED_TOOLS, Arr.map(upstream, Struct.get('name')));

    if (Arr.isReadonlyArrayNonEmpty(missing)) {
      yield* Effect.logWarning(`Orbit no longer offers these exposed tools: ${Arr.join(missing, ', ')}`);
    }

    return OrbitClient.of({
      tools: Arr.filter(upstream, (tool) => Arr.contains(EXPOSED_TOOLS, tool.name)),
      instructions: client.instructions,
      callTool: Effect.fn('OrbitClient.callTool')(function* (tool, args) {
        return yield* client.callTool({ tool, arguments: args }, { timeout: '120 seconds' });
      }, Effect.mapError(orbitError)),
    });
  }).pipe(Effect.mapError(orbitError)),
).pipe(Layer.provide(OrbitHttpClient));
