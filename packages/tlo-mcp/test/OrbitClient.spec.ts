import { describe, expect, it } from '@effect/vitest';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Fiber from 'effect/Fiber';
import * as Layer from 'effect/Layer';
import * as Match from 'effect/Match';
import * as Queue from 'effect/Queue';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import { FetchHttpClient } from 'effect/http';
import { TestClock } from 'effect/testing';

import { OrbitClient, OrbitClientLive, OrbitMcpError } from '../src/mcp/OrbitClient.js';
import { OrbitAuth } from '../src/oauth/OrbitAuth.js';

const Message = Schema.Struct({
  id: Schema.optionalKey(Schema.Finite),
  method: Schema.String,
  params: Schema.JsonObject,
});

const MessageJson = Schema.fromJsonString(Message);

const tool = {
  name: 'GetProject',
  description: 'Official description',
  inputSchema: { type: 'object', properties: { projectId: { type: 'string' } } },
  annotations: { readOnlyHint: true },
};

const auth = Layer.succeed(
  OrbitAuth,
  OrbitAuth.of({ accessToken: Effect.succeed(Redacted.make('test-token')), login: Effect.void, logout: Effect.void }),
);

// Complete the real startup handshake; tests control only subsequent tool replies.
function toolFetch(
  reply: (message: typeof Message.Type, init: RequestInit | undefined) => Promise<Response>,
): typeof fetch {
  return (_input, init) => {
    const body = init?.body instanceof Uint8Array ? new TextDecoder().decode(init.body) : init?.body;

    return Effect.runPromise(
      Schema.decodeUnknownEffect(MessageJson)(body).pipe(
        Effect.flatMap((message) => {
          if (message.method === 'tools/call') {
            return Effect.tryPromise((_signal) => reply(message, init));
          }

          if (message.method === 'notifications/initialized') {
            return Effect.succeed(new Response(undefined, { status: 202 }));
          }

          const result =
            message.method === 'initialize'
              ? {
                  protocolVersion: '2025-06-18',
                  capabilities: { tools: {} },
                  serverInfo: { name: 'Orbit', version: '1' },
                }
              : { tools: [tool] };

          return Effect.succeed(
            Response.json(
              { jsonrpc: '2.0', id: message.id, result },
              {
                headers: { 'mcp-session-id': 'test-session' },
              },
            ),
          );
        }),
      ),
    );
  };
}

describe('orbit MCP transport', () => {
  it.effect('initializes, follows pagination and preserves JSON/SSE results', () => {
    const methods: Array<string> = [];

    const fetchMock: typeof globalThis.fetch = (_input, init) => {
      const bodyText = Match.value(init?.body).pipe(
        Match.when(Match.instanceOf(Uint8Array), (body) => new TextDecoder().decode(body)),
        Match.when(Match.string, (body) => body),
        Match.orElse(() => ''),
      );

      return Effect.runPromise(
        Schema.decodeEffect(MessageJson)(bodyText).pipe(
          Effect.map((message) => {
            const headers = new Headers(init?.headers);

            methods.push(message.method);

            expect({
              authorization: headers.get('authorization'),
              redirect: init?.redirect,
              sessionId: headers.get('mcp-session-id'),
            }).toMatchObject({
              authorization: 'Bearer test-token',
              redirect: 'error',
              ...(message.method === 'initialize' ? {} : { sessionId: 'test-session' }),
            });

            if (message.method === 'notifications/initialized') {
              return new Response(undefined, { status: 202 });
            }

            const result = Match.value(message.method).pipe(
              Match.when('initialize', () => ({
                protocolVersion: '2025-06-18',
                capabilities: { tools: {} },
                serverInfo: { name: 'Orbit', version: '1' },
                instructions: 'Official instructions',
              })),
              Match.when('tools/list', () =>
                message.params.cursor === undefined ? { tools: [tool], nextCursor: 'page-2' } : { tools: [] },
              ),
              Match.orElse(() => ({ content: [{ type: 'text', text: 'RATE_LIMITED: retry later' }], isError: true })),
            );

            const body = JSON.stringify({ jsonrpc: '2.0', id: message.id, result });

            return message.method === 'tools/call'
              ? new Response(`event: message\ndata: ${body}\n\n`, { headers: { 'content-type': 'text/event-stream' } })
              : new Response(body, {
                  headers: { 'content-type': 'application/json', 'mcp-session-id': 'test-session' },
                });
          }),
        ),
      );
    };

    return Effect.gen(function* () {
      const client = yield* OrbitClient;

      expect({ tool: client.tools[0], instructions: client.instructions }).toMatchObject({
        tool: { name: 'GetProject', annotations: { readOnlyHint: true } },
        instructions: 'Official instructions',
      });

      const result = yield* client.callTool('GetProject', { projectId: 'PR-example' });

      expect(result).toMatchObject({ isError: true, content: [{ type: 'text', text: 'RATE_LIMITED: retry later' }] });

      expect(methods).toStrictEqual([
        'initialize',
        'notifications/initialized',
        'tools/list',
        'tools/list',
        'tools/call',
      ]);
    }).pipe(
      Effect.provide(OrbitClientLive.pipe(Layer.provide(auth))),
      Effect.provideService(FetchHttpClient.Fetch, fetchMock),
      Effect.scoped,
    );
  });

  it.effect('reports authorization failures without replaying requests', () => {
    let requests = 0;

    const fetchMock: typeof globalThis.fetch = () => {
      requests++;

      return Promise.resolve(new Response(undefined, { status: 403 }));
    };

    return Effect.gen(function* () {
      const error = yield* Layer.build(OrbitClientLive.pipe(Layer.provide(auth))).pipe(Effect.flip);

      expect(error.message).toContain('403');

      expect(requests).toBe(1);
    }).pipe(Effect.provideService(FetchHttpClient.Fetch, fetchMock), Effect.scoped);
  });

  for (const status of [401, 403, 429, 500]) {
    it.effect(`does not replay HTTP ${status} tool calls after successful startup`, () => {
      let calls = 0;

      const fetchMock = toolFetch(() => {
        calls++;

        return Promise.resolve(
          new Response(undefined, {
            status,
            headers: { 'retry-after': '17' },
          }),
        );
      });

      return Effect.gen(function* () {
        const client = yield* OrbitClient;

        const error = yield* client.callTool('GetProject', {}).pipe(Effect.flip);

        expect(error._tag).toBe('OrbitMcpError');

        expect(error.message).toContain(status === 429 ? '17' : String(status));

        expect(calls).toBe(1);
      }).pipe(
        Effect.provide(OrbitClientLive.pipe(Layer.provide(auth))),
        Effect.provideService(FetchHttpClient.Fetch, fetchMock),
        Effect.scoped,
      );
    });
  }

  const malformedReplies: Array<[string, string, string]> = [
    ['malformed JSON', '{', 'application/json'],
    ['invalid envelope', '{"jsonrpc":"2.0","id":4}', 'application/json'],
    ['wrong JSON ID', '{"jsonrpc":"2.0","id":999,"result":{"content":[]}}', 'application/json'],
    ['invalid tool result', '{"jsonrpc":"2.0","id":4,"result":{"content":"bad"}}', 'application/json'],
    ['malformed SSE data', 'event: message\ndata: {\n\n', 'text/event-stream'],
    [
      'SSE without matching reply',
      'event: message\ndata: {"jsonrpc":"2.0","id":999,"result":{}}\n\n',
      'text/event-stream',
    ],
  ];

  for (const [name, body, contentType] of malformedReplies) {
    it.effect(`rejects ${name} without replay`, () => {
      let calls = 0;

      const fetchMock = toolFetch(() => {
        calls++;

        return Promise.resolve(new Response(body, { headers: { 'content-type': contentType } }));
      });

      return Effect.gen(function* () {
        const client = yield* OrbitClient;

        const error = yield* client.callTool('GetProject', {}).pipe(Effect.flip);

        expect(error._tag).toBe('OrbitMcpError');

        expect(calls).toBe(1);
      }).pipe(
        Effect.provide(OrbitClientLive.pipe(Layer.provide(auth))),
        Effect.provideService(FetchHttpClient.Fetch, fetchMock),
        Effect.scoped,
      );
    });
  }

  for (const cancel of ['timeout', 'interrupt']) {
    it.effect(`aborts a pending tool request on ${cancel} without replay`, () =>
      Effect.gen(function* () {
        const context = yield* Effect.context();

        const started = yield* Queue.make<undefined>();

        const aborted = yield* Deferred.make<boolean>();

        let calls = 0;

        const fetchMock = toolFetch((_message, init) =>
          Effect.runPromiseWith(context)(
            Effect.callback<Response, OrbitMcpError>((resume) => {
              calls++;

              init?.signal?.addEventListener(
                'abort',
                () => {
                  Deferred.doneUnsafe(aborted, Effect.succeed(true));

                  resume(OrbitMcpError.make({ message: 'aborted' }));
                },
                { once: true },
              );

              Queue.offerUnsafe(started, undefined);
            }),
          ),
        );

        yield* Effect.gen(function* () {
          const client = yield* OrbitClient;

          const pending = yield* client.callTool('GetProject', {}).pipe(Effect.forkScoped);

          yield* Queue.take(started);

          if (cancel === 'timeout') {
            yield* TestClock.adjust('120 seconds');

            const error = yield* Fiber.join(pending).pipe(Effect.flip);

            expect(error._tag).toBe('OrbitMcpError');
          } else {
            yield* Fiber.interrupt(pending);

            const exit = yield* Fiber.await(pending);

            expect(Exit.hasInterrupts(exit)).toBeTruthy();
          }

          yield* Deferred.await(aborted);

          expect(calls).toBe(1);
        }).pipe(
          Effect.provide(OrbitClientLive.pipe(Layer.provide(auth))),
          Effect.provideService(FetchHttpClient.Fetch, fetchMock),
        );
      }).pipe(Effect.scoped),
    );
  }

  it.effect('assigns distinct concurrent IDs and matches out-of-order replies', () =>
    Effect.gen(function* () {
      const context = yield* Effect.context();

      const requests = yield* Queue.make<{
        readonly message: typeof Message.Type;
        readonly reply: Deferred.Deferred<Response>;
      }>();

      const fetchMock = toolFetch((message) =>
        Effect.runPromiseWith(context)(
          Effect.gen(function* () {
            const reply = yield* Deferred.make<Response>();

            yield* Queue.offer(requests, { message, reply });

            return yield* Deferred.await(reply);
          }),
        ),
      );

      yield* Effect.gen(function* () {
        const client = yield* OrbitClient;

        const first = yield* client.callTool('GetProject', { projectId: 'first' }).pipe(Effect.forkScoped);

        const second = yield* client.callTool('GetProject', { projectId: 'second' }).pipe(Effect.forkScoped);

        const a = yield* Queue.take(requests);

        const b = yield* Queue.take(requests);

        expect(a.message.id).toBeDefined();

        expect(b.message.id).toBeDefined();

        expect(a.message.id).not.toBe(b.message.id);

        for (const request of [b, a]) {
          yield* Deferred.succeed(
            request.reply,
            Response.json({
              jsonrpc: '2.0',
              id: request.message.id,
              result: {
                content: [],
                structuredContent: request.message.params,
              },
            }),
          );
        }

        expect(yield* Fiber.join(first)).toMatchObject({
          structuredContent: { arguments: { projectId: 'first' } },
        });

        expect(yield* Fiber.join(second)).toMatchObject({
          structuredContent: { arguments: { projectId: 'second' } },
        });
      }).pipe(
        Effect.provide(OrbitClientLive.pipe(Layer.provide(auth))),
        Effect.provideService(FetchHttpClient.Fetch, fetchMock),
      );
    }).pipe(Effect.scoped),
  );
});
