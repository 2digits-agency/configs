import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Match from 'effect/Match';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import { FetchHttpClient } from 'effect/http';

import { OrbitClient, OrbitClientLive, OrbitMcpError } from '../src/mcp/OrbitClient.js';
import { OrbitAuth } from '../src/oauth/OrbitAuth.js';

const Message = Schema.Struct({
  id: Schema.optionalKey(Schema.Finite),
  method: Schema.String,
  params: Schema.JsonObject,
});

const MessageJson = Schema.fromJsonString(Message);

const TOOLS_LIST = 'tools/list';

const auth = Layer.succeed(
  OrbitAuth,
  OrbitAuth.of({ accessToken: Effect.succeed(Redacted.make('test-token')), login: Effect.void, logout: Effect.void }),
);

function tool(name: string) {
  return { name, inputSchema: { type: 'object', properties: {} } };
}

function transport(pages: ReadonlyArray<Schema.JsonObject>) {
  const messages: Array<typeof Message.Type> = [];

  let pageIndex = 0;

  const fetchMock: typeof globalThis.fetch = (_input, init) => {
    const bodyText = Match.value(init?.body).pipe(
      Match.when(Match.instanceOf(Uint8Array), (body) => new TextDecoder().decode(body)),
      Match.when(Match.string, (body) => body),
      Match.orElse(() => ''),
    );

    return Effect.runPromise(
      Schema.decodeEffect(MessageJson)(bodyText).pipe(
        Effect.flatMap((message) =>
          Effect.gen(function* () {
            messages.push(message);

            if (message.method === 'notifications/initialized') {
              return new Response(undefined, { status: 202 });
            }

            let result: Schema.JsonObject;

            if (message.method === 'initialize') {
              result = {
                protocolVersion: '2025-06-18',
                capabilities: { tools: {} },
                serverInfo: { name: 'Orbit', version: '1' },
                instructions: 'Startup instructions',
              };
            } else if (message.method === TOOLS_LIST) {
              const page = pages[pageIndex++];

              if (page === undefined) {
                return yield* OrbitMcpError.make({ message: 'Unexpected tools/list request' });
              }

              result = page;
            } else {
              result = { content: [{ type: 'text', text: 'ok' }] };
            }

            return Response.json({ jsonrpc: '2.0', id: message.id, result });
          }),
        ),
      ),
    );
  };

  return { fetchMock, messages };
}

describe('orbit tools pagination', () => {
  it.effect('collects every page in order, follows empty pages and keeps the startup snapshot', () => {
    const { fetchMock, messages } = transport([
      { tools: [tool('First'), tool('Second')], nextCursor: '' },
      { tools: [], nextCursor: 'last-page' },
      { tools: [tool('Third')] },
    ]);

    return Effect.gen(function* () {
      const client = yield* OrbitClient;

      expect({ tools: client.tools.map((entry) => entry.name), instructions: client.instructions }).toStrictEqual({
        tools: ['First', 'Second', 'Third'],
        instructions: 'Startup instructions',
      });

      expect(messages.map((message) => message.method)).toStrictEqual([
        'initialize',
        'notifications/initialized',
        TOOLS_LIST,
        TOOLS_LIST,
        TOOLS_LIST,
      ]);

      expect(
        messages.filter((message) => message.method === TOOLS_LIST).map((message) => message.params),
      ).toStrictEqual([{}, { cursor: '' }, { cursor: 'last-page' }]);

      const snapshot = client.tools;

      yield* client.callTool('First', {});

      yield* client.callTool('Third', {});

      expect(client.tools).toBe(snapshot);

      expect(messages.filter((message) => message.method === TOOLS_LIST)).toHaveLength(3);
    }).pipe(
      Effect.provide(OrbitClientLive.pipe(Layer.provide(auth))),
      Effect.provideService(FetchHttpClient.Fetch, fetchMock),
      Effect.scoped,
    );
  });

  it.effect('accepts an empty terminal page without making another request', () => {
    const { fetchMock, messages } = transport([{ tools: [] }]);

    return Effect.gen(function* () {
      const client = yield* OrbitClient;

      expect(client.tools).toStrictEqual([]);

      expect(messages.filter((message) => message.method === TOOLS_LIST)).toHaveLength(1);
    }).pipe(
      Effect.provide(OrbitClientLive.pipe(Layer.provide(auth))),
      Effect.provideService(FetchHttpClient.Fetch, fetchMock),
      Effect.scoped,
    );
  });

  for (const cursors of [
    ['repeat', 'repeat'],
    ['first', 'second', 'first'],
    ['', ''],
  ]) {
    it.effect(`rejects repeated cursor sequence ${JSON.stringify(cursors)} during startup`, () => {
      const { fetchMock, messages } = transport(
        cursors.map((nextCursor) => ({ tools: [tool('Unpublished')], nextCursor })),
      );

      return Effect.gen(function* () {
        const error = yield* Layer.build(OrbitClientLive.pipe(Layer.provide(auth))).pipe(Effect.flip);

        expect(error._tag).toBe('OrbitMcpError');

        expect(error.message).toBe('Orbit returned a repeated tools cursor.');

        expect(messages.filter((message) => message.method === TOOLS_LIST)).toHaveLength(cursors.length);

        expect(messages.some((message) => message.method === 'tools/call')).toBeFalsy();
      }).pipe(Effect.provideService(FetchHttpClient.Fetch, fetchMock), Effect.scoped);
    });
  }
});
