import * as NodeServices from '@effect/platform-node/NodeServices';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import * as McpSchema from 'effect/ai/McpSchema';
import { HttpRouter } from 'effect/http';

import { connectionPrompt } from '../src/cli/connect.js';
import { gatewayRoutes, loadGatewayKey } from '../src/http/gateway.js';
import { OrbitClient } from '../src/mcp/OrbitClient.js';

const key = 'a'.repeat(64);

const calls: Array<string> = [];

const upstream = Layer.succeed(OrbitClient, {
  instructions: 'Official Orbit instructions',
  tools: [
    McpSchema.Tool.make({
      name: 'ReadProject',
      description: 'Official read tool',
      inputSchema: { type: 'object' },
      annotations: { readOnlyHint: true },
    }),
  ],
  callTool: Effect.fn('OrbitClient.test.callTool')((name: string) =>
    Effect.sync(() => {
      calls.push(name);

      return McpSchema.CallToolResult.make({
        content: [{ type: 'text', text: 'project' }],
        structuredContent: { project: true },
      });
    }),
  ),
});

const makeHandler = Effect.fn('Gateway.test.handler')(function* () {
  const handler = yield* Effect.acquireRelease(
    Effect.sync(() =>
      HttpRouter.toWebHandler(gatewayRoutes(Redacted.make(key)).pipe(Layer.provide(upstream)), { disableLogger: true }),
    ),
    (handler) => Effect.tryPromise((_signal) => handler.dispose()).pipe(Effect.orDie),
  );

  return handler.handler;
});

describe('personal HTTP gateway', () => {
  it.effect('rejects missing, incorrect and query-string credentials before parsing any MCP request', () =>
    Effect.gen(function* () {
      const handle = yield* makeHandler();

      for (const method of ['POST', 'GET', 'DELETE']) {
        for (const authorization of [undefined, 'Bearer wrong', `Basic ${key}`]) {
          const response = yield* Effect.tryPromise((signal) =>
            handle(
              new Request(`https://gateway/mcp?key=${key}`, {
                method,
                signal,
                headers: authorization === undefined ? {} : { authorization },
                ...(method === 'POST' ? { body: 'not JSON' } : {}),
              }),
            ),
          );

          expect(response.status).toBe(401);

          expect(response.headers.get('www-authenticate')).toBe('Bearer');

          expect(response.headers.get('cache-control')).toBe('no-store');
        }
      }
    }),
  );

  it.effect('rejects browser origins even with the correct key', () =>
    Effect.gen(function* () {
      const handle = yield* makeHandler();

      const response = yield* Effect.tryPromise((signal) =>
        handle(
          new Request('https://gateway/mcp', {
            method: 'POST',
            signal,
            headers: { authorization: `Bearer ${key}`, origin: 'https://evil.example' },
            body: '{}',
          }),
        ),
      );

      expect(response.status).toBe(403);
    }),
  );

  it.effect('initializes, discovers official tools and forwards a read exactly once over HTTP', () =>
    Effect.gen(function* () {
      calls.length = 0;

      const handle = yield* makeHandler();

      let session: string | undefined;

      const send = Effect.fn('Gateway.test.send')(function* (method: string, params: unknown, id?: number) {
        const body = yield* Schema.encodeEffect(Schema.fromJsonString(Schema.Unknown))({
          jsonrpc: '2.0',
          method,
          params,
          ...(id === undefined ? {} : { id }),
        });

        const response = yield* Effect.tryPromise((signal) =>
          handle(
            new Request('https://gateway/mcp', {
              method: 'POST',
              signal,
              headers: {
                authorization: `Bearer ${key}`,
                'content-type': 'application/json',
                accept: 'application/json, text/event-stream',
                'mcp-protocol-version': '2025-06-18',
                ...(session === undefined ? {} : { 'mcp-session-id': session }),
              },
              body,
            }),
          ),
        );

        session = response.headers.get('mcp-session-id') ?? session;

        expect(response.headers.get('cache-control')).toBe('no-store');

        return { response, text: yield* Effect.tryPromise((_signal) => response.text()) };
      });

      const initialization = yield* send(
        'initialize',
        { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } },
        1,
      );

      expect(initialization.text).toContain('Official Orbit instructions');

      const notification = yield* send('notifications/initialized', {});

      expect([initialization.response.status, notification.response.status]).toStrictEqual([200, 202]);

      const tools = yield* send('tools/list', {}, 2);

      expect(tools.text).toMatch(/ReadProject.*readOnlyHint/s);

      const result = yield* send('tools/call', { name: 'ReadProject', arguments: {} }, 3);

      expect(result.text).toContain('structuredContent');

      expect(calls).toStrictEqual(['ReadProject']);
    }),
  );

  it.effect('persists a private key, reuses it, and rejects insecure or malformed files', () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;

      const directory = yield* fs.makeTempDirectoryScoped();

      const file = `${directory}/gateway.key`;

      const first = yield* loadGatewayKey(file);

      const second = yield* loadGatewayKey(file);

      expect(Redacted.value(first)).toMatch(/^[a-f0-9]{64}$/);

      expect(Redacted.value(second)).toBe(Redacted.value(first));

      expect((yield* fs.stat(file)).mode & 0o077).toBe(0);

      yield* fs.chmod(file, 0o644);

      expect(yield* loadGatewayKey(file).pipe(Effect.flip)).toHaveProperty('_tag', 'GatewayError');

      yield* fs.chmod(file, 0o600);

      yield* fs.writeFileString(file, 'invalid');

      expect(yield* loadGatewayKey(file).pipe(Effect.flip)).toHaveProperty('_tag', 'GatewayError');
    }).pipe(Effect.provide(NodeServices.layer)),
  );

  it('prints a connection prompt without secrets or an Orbit OAuth flow', () => {
    const prompt = connectionPrompt('https://tlo.example.opentunnel.xyz/mcp');

    expect(prompt).toContain('https://tlo.example.opentunnel.xyz/mcp');

    expect(prompt).toContain('secure credential handoff');

    expect(prompt).toContain('read-only');

    expect(prompt).not.toContain(key);
  });
});
