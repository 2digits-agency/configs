import { describe, expect, it } from '@effect/vitest';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import * as Struct from 'effect/Struct';
import * as McpClientError from 'effect/ai/McpClientError';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as TestClock from 'effect/testing/TestClock';

import { OrbitClient, OrbitClientLive } from '../src/mcp/OrbitClient.js';
import { OrbitAuth } from '../src/oauth/OrbitAuth.js';
import { OrbitAuthError } from '../src/oauth/session.js';

const Message = Schema.Struct({
  id: Schema.Finite.pipe(Schema.optionalKey),
  method: Schema.String,
  params: Schema.JsonObject.pipe(Schema.optionalKey),
});

const decodeJson = Schema.decodeUnknownEffect(Message.pipe(Schema.fromJsonString));

function decodeMessage(body: RequestInit['body']) {
  return decodeJson(body instanceof Uint8Array ? new TextDecoder().decode(body) : body).pipe(Effect.orDie);
}

// GetProject is exposed; DeleteProjectItem exists upstream but is not.
const upstreamTools = [
  {
    name: 'GetProject',
    description: 'Official description',
    inputSchema: { type: 'object', properties: { projectId: { type: 'string' } } },
    annotations: { readOnlyHint: true },
  },
  { name: 'DeleteProjectItem', inputSchema: { type: 'object' }, annotations: { destructiveHint: true } },
];

/**
 * Issues a new token per request, so tests can tell that each request fetched its own.
 */
function countingAuth() {
  let tokens = 0;

  return Layer.succeed(
    OrbitAuth,
    OrbitAuth.of({
      accessToken: Effect.sync(() => Redacted.make(`token-${++tokens}`)),
      login: Effect.void,
      logout: Effect.void,
    }),
  );
}

const auth = countingAuth();

interface Sent {
  readonly method: string;
  readonly authorization: string | undefined;
  readonly session: string | undefined;
  readonly redirect: RequestRedirect | undefined;
}

/**
 * Fake Orbit: completes the 2025-11-25 handshake and tool discovery; `onCall` answers tools/call.
 *
 * @param onCall
 */
function orbit(onCall: (id: number | undefined, init: RequestInit | undefined) => Effect.Effect<Response>) {
  const sent: Array<Sent> = [];

  const fetch: typeof globalThis.fetch = (_input, init) =>
    Effect.runPromise(
      Effect.gen(function* () {
        const message = yield* decodeMessage(init?.body);

        const headers = new Headers(init?.headers);

        sent.push({
          method: message.method,
          authorization: headers.get('authorization') ?? undefined,
          session: headers.get('mcp-session-id') ?? undefined,
          redirect: init?.redirect,
        });

        if (message.method === 'tools/call') {
          return yield* onCall(message.id, init);
        }

        if (message.method === 'notifications/initialized') {
          return new Response(undefined, { status: 202 });
        }

        const result =
          message.method === 'initialize'
            ? {
                protocolVersion: '2025-11-25',
                capabilities: { tools: {} },
                serverInfo: { name: 'Orbit', version: '1.0.0' },
                instructions: 'Official instructions',
              }
            : { tools: upstreamTools };

        return Response.json(
          { jsonrpc: '2.0', id: message.id, result },
          { headers: { 'mcp-session-id': 'orbit-session' } },
        );
      }),
    );

  return { sent, fetch };
}

function reply(body: unknown) {
  return Effect.succeed(
    new Response(`event: message\ndata: ${JSON.stringify(body)}\n\n`, {
      headers: { 'content-type': 'text/event-stream' },
    }),
  );
}

describe('orbit MCP client', () => {
  it.effect('exposes only allowlisted tools and authenticates every request without redirects', () => {
    const { sent, fetch } = orbit((id) =>
      reply({
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: 'RATE_LIMITED: retry later' }], isError: true },
      }),
    );

    return Effect.gen(function* () {
      const client = yield* OrbitClient;

      expect(Arr.map(client.tools, Struct.get('name'))).toStrictEqual(['GetProject']);

      expect(client.instructions).toBe('Official instructions');

      const [tool] = client.tools;

      if (tool === undefined) {
        return yield* Effect.die('Missing exposed tool');
      }

      // Tool-reported errors are results, forwarded unchanged.
      expect(yield* client.callTool(tool, { projectId: 'PR-example' })).toMatchObject({
        isError: true,
        content: [{ type: 'text', text: 'RATE_LIMITED: retry later' }],
      });

      expect(sent).toStrictEqual([
        { method: 'initialize', authorization: 'Bearer token-2', session: undefined, redirect: 'error' },
        {
          method: 'notifications/initialized',
          authorization: 'Bearer token-3',
          session: 'orbit-session',
          redirect: 'error',
        },
        { method: 'tools/list', authorization: 'Bearer token-4', session: 'orbit-session', redirect: 'error' },
        { method: 'tools/call', authorization: 'Bearer token-5', session: 'orbit-session', redirect: 'error' },
      ]);
    }).pipe(
      Effect.provide(OrbitClientLive.pipe(Layer.provide(countingAuth()))),
      Effect.provideService(FetchHttpClient.Fetch, fetch),
      Effect.scoped,
    );
  });

  it.effect('fails startup with the typed Orbit login error before sending anything', () => {
    const { sent, fetch } = orbit(() => Effect.die('Unexpected tool call'));

    const expired = Layer.succeed(
      OrbitAuth,
      OrbitAuth.of({
        accessToken: OrbitAuthError.make({ message: 'Orbit session expired. Run tlo-mcp login.' }),
        login: Effect.void,
        logout: Effect.void,
      }),
    );

    return Effect.gen(function* () {
      const error = yield* Layer.build(OrbitClientLive.pipe(Layer.provide(expired))).pipe(Effect.flip);

      expect(error).toBeInstanceOf(OrbitAuthError);

      expect(error.message).toBe('Orbit session expired. Run tlo-mcp login.');

      expect(sent).toStrictEqual([]);
    }).pipe(Effect.provideService(FetchHttpClient.Fetch, fetch), Effect.scoped);
  });

  for (const status of [401, 403, 429, 500]) {
    it.effect(`reports HTTP ${status} tool calls without replaying them`, () => {
      const { sent, fetch } = orbit(() =>
        Effect.succeed(new Response(undefined, { status, headers: { 'retry-after': '17' } })),
      );

      return Effect.gen(function* () {
        const client = yield* OrbitClient;

        const [tool] = client.tools;

        if (tool === undefined) {
          return yield* Effect.die('Missing exposed tool');
        }

        const error = yield* client.callTool(tool, {}).pipe(Effect.flip);

        expect(error.reason).toBeInstanceOf(McpClientError.HttpError);

        expect(error.reason).toMatchObject({ status, retryAfter: '17' });

        expect(Arr.filter(sent, (request) => request.method === 'tools/call')).toHaveLength(1);
      }).pipe(
        Effect.provide(OrbitClientLive.pipe(Layer.provide(auth))),
        Effect.provideService(FetchHttpClient.Fetch, fetch),
        Effect.scoped,
      );
    });
  }

  it.effect('times out a stalled tool call after 120 seconds and aborts it without replay', () => {
    let aborted = false;

    const { sent, fetch } = orbit((_id, init) =>
      Effect.callback<Response>((resume) => {
        init?.signal?.addEventListener(
          'abort',
          () => {
            aborted = true;

            resume(Effect.die('aborted'));
          },
          { once: true },
        );
      }),
    );

    return Effect.gen(function* () {
      const client = yield* OrbitClient;

      const [tool] = client.tools;

      if (tool === undefined) {
        return yield* Effect.die('Missing exposed tool');
      }

      const pending = yield* client.callTool(tool, {}).pipe(Effect.forkScoped);

      yield* TestClock.adjust('119 seconds');

      expect(pending.pollUnsafe()).toBeUndefined();

      yield* TestClock.adjust('1 second');

      const error = yield* Fiber.join(pending).pipe(Effect.flip);

      expect(error.reason).toBeInstanceOf(McpClientError.TimeoutError);

      expect(aborted).toBeTruthy();

      expect(Arr.filter(sent, (request) => request.method === 'tools/call')).toHaveLength(1);
    }).pipe(
      Effect.provide(OrbitClientLive.pipe(Layer.provide(auth))),
      Effect.provideService(FetchHttpClient.Fetch, fetch),
      Effect.scoped,
    );
  });
});
