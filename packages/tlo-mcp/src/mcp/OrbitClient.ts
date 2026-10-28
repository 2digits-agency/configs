/**
 * @effect-diagnostics unstableApiUsage:off
 */
import * as Arr from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import type * as Schema from 'effect/Schema';
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
 * Fetch client that refreshes the Orbit bearer token per request and refuses redirects.
 */
const OrbitHttpClient = Layer.effect(
  HttpClient.HttpClient,
  Effect.gen(function* () {
    const auth = yield* OrbitAuth;

    // Fail startup with the typed login error; later refresh failures surface as the transport error's cause.
    yield* auth.accessToken;

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
    const client = yield* McpClient.McpClient;

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
    }),
  ),
  Layer.provide(OrbitHttpClient),
);
