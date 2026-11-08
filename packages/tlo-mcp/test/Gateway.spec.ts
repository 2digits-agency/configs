import { describe, expect, it } from '@effect/vitest';
import * as ConfigProvider from 'effect/ConfigProvider';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Layer from 'effect/Layer';
import * as P from 'effect/Predicate';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';
import * as McpClientError from 'effect/ai/McpClientError';
import * as McpSchema from 'effect/ai/McpSchema';
import * as HttpRouter from 'effect/http/HttpRouter';
import * as UserDirectories from 'effect/persistence/UserDirectories';

import { connectionPrompt } from '../src/cli/connect.js';
import { gatewayKeyFile, gatewayRoutes, loadGatewayKey } from '../src/http/gateway.js';
import { OrbitClient } from '../src/mcp/OrbitClient.js';
import { configDirectory, PlatformLive } from '../src/platform.js';

const key = Str.repeat(64)('a');

const encodeJson = Schema.encodeEffect(Schema.Unknown.pipe(Schema.fromJsonString));

const decodeJson = Schema.decodeEffect(Schema.Unknown.pipe(Schema.fromJsonString));

const calls: Array<string> = [];

class HttpRequestError extends Schema.TaggedError<HttpRequestError, { readonly brand: unique symbol }>()(
  'HttpRequestError',
  {
    cause: Schema.Unknown,
  },
) {}

const upstream = Layer.succeed(OrbitClient, {
  instructions: 'Official Orbit instructions',
  tools: [
    McpSchema.Tool.make({
      name: 'ReadProject',
      description: 'Official read tool',
      inputSchema: { type: 'object' },
      annotations: { readOnlyHint: true },
    }),
    McpSchema.Tool.make({ name: 'ListTickets', inputSchema: { type: 'object' }, annotations: { readOnlyHint: true } }),
  ],
  callTool: Effect.fn('OrbitClient.test.callTool')(function* (tool: McpSchema.Tool) {
    calls.push(tool.name);

    // ListTickets stands in for any call that Orbit rate limits.
    if (tool.name === 'ListTickets') {
      return yield* McpClientError.McpClientError.make({
        reason: McpClientError.HttpError.make({ status: 429, retryAfter: '17' }),
      });
    }

    return McpSchema.CallToolResult.make({
      content: [{ type: 'text', text: 'project' }],
      structuredContent: { project: true },
    });
  }),
});

const makeHandler = Effect.fn('Gateway.test.handler')(function* () {
  const handler = yield* Effect.acquireRelease(
    Effect.sync(() =>
      HttpRouter.toWebHandler(
        gatewayRoutes(Redacted.make(key)).pipe(Layer.provide(upstream), Layer.provide(PlatformLive)),
        { disableLogger: true },
      ),
    ),
    (handler) =>
      Effect.tryPromise({
        try: (_signal) => handler.dispose(),
        catch: (cause) => HttpRequestError.make({ cause }),
      }).pipe(Effect.orDie),
  );

  return handler.handler;
});

describe('personal HTTP gateway', () => {
  it.effect('rejects missing, incorrect and query-string credentials before parsing any MCP request', () =>
    Effect.gen(function* () {
      const handle = yield* makeHandler();

      for (const method of ['POST', 'GET', 'DELETE']) {
        for (const authorization of [undefined, 'Bearer wrong', `Basic ${key}`]) {
          const response = yield* Effect.tryPromise({
            try: (signal) =>
              handle(
                new Request(`https://gateway/mcp?key=${key}`, {
                  method,
                  signal,
                  headers: P.isUndefined(authorization) ? {} : { authorization },
                  ...(method === 'POST' ? { body: 'not JSON' } : {}),
                }),
              ),
            catch: (cause) => HttpRequestError.make({ cause }),
          });

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

      const response = yield* Effect.tryPromise({
        try: (signal) =>
          handle(
            new Request('https://gateway/mcp', {
              method: 'POST',
              signal,
              headers: { authorization: `Bearer ${key}`, origin: 'https://evil.example' },
              body: '{}',
            }),
          ),
        catch: (cause) => HttpRequestError.make({ cause }),
      });

      expect(response.status).toBe(403);
    }),
  );

  it.effect('initializes, discovers tools, forwards a read once and keeps Retry-After on rate limits over HTTP', () =>
    Effect.gen(function* () {
      calls.length = 0;

      const handle = yield* makeHandler();

      let session: string | undefined;

      const send = Effect.fn('Gateway.test.send')(function* (method: string, params: unknown, id?: number) {
        const body = yield* encodeJson({
          jsonrpc: '2.0',
          method,
          params,
          ...(P.isUndefined(id) ? {} : { id }),
        });

        const response = yield* Effect.tryPromise({
          try: (signal) =>
            handle(
              new Request('https://gateway/mcp', {
                method: 'POST',
                signal,
                headers: {
                  authorization: `Bearer ${key}`,
                  'content-type': 'application/json',
                  accept: 'application/json, text/event-stream',
                  'mcp-protocol-version': '2025-06-18',
                  ...(P.isUndefined(session) ? {} : { 'mcp-session-id': session }),
                },
                body,
              }),
            ),

          catch: (cause) => HttpRequestError.make({ cause }),
        });

        session = response.headers.get('mcp-session-id') ?? session;

        expect(response.headers.get('cache-control')).toBe('no-store');

        return {
          response,
          text: yield* Effect.tryPromise({
            try: (_signal) => response.text(),
            catch: (cause) => HttpRequestError.make({ cause }),
          }),
        };
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

      const limited = yield* send('tools/call', { name: 'ListTickets', arguments: {} }, 4);

      expect({ limited: yield* decodeJson(limited.text), calls }).toMatchObject({
        limited: {
          result: {
            isError: true,
            content: [{ type: 'text', text: 'Orbit rate limited this call; retry after 17. Not replayed.' }],
            _meta: { 'tlo-mcp/httpStatus': 429, 'tlo-mcp/retryAfter': '17' },
          },
        },
        calls: ['ReadProject', 'ListTickets'],
      });
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

      const insecureFailure = yield* loadGatewayKey(file).pipe(Effect.flip);

      expect(insecureFailure).toHaveProperty('_tag', 'GatewayError');

      yield* fs.chmod(file, 0o600);

      yield* fs.writeFileString(file, 'invalid');

      const malformedFailure = yield* loadGatewayKey(file).pipe(Effect.flip);

      expect(malformedFailure).toHaveProperty('_tag', 'GatewayError');
    }).pipe(Effect.provide(PlatformLive)),
  );

  it.effect('stores the key in the config directory and keeps using a legacy ~/.config key', () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;

      const home = yield* fs.makeTempDirectoryScoped();

      const current = `${home}/Library/Application Support/2digits/tlo-mcp/gateway.key`;

      const legacy = `${home}/.config/2digits/tlo-mcp/gateway.key`;

      const resolve = gatewayKeyFile.pipe(
        Effect.provide([
          UserDirectories.layerPlatform('darwin'),
          ConfigProvider.layer(ConfigProvider.fromUnknown({ HOME: home })),
        ]),
      );

      const fresh = yield* resolve;

      expect(fresh).toBe(current);

      yield* fs.makeDirectory(`${home}/.config/2digits/tlo-mcp`, { recursive: true });

      yield* fs.writeFileString(legacy, key);

      const fallback = yield* resolve;

      expect(fallback).toBe(legacy);

      yield* fs.makeDirectory(`${home}/Library/Application Support/2digits/tlo-mcp`, { recursive: true });

      yield* fs.writeFileString(current, key);

      const preferred = yield* resolve;

      expect(preferred).toBe(current);
    }).pipe(Effect.provide(PlatformLive), Effect.scoped),
  );

  it.effect('keeps a legacy ~/.config session when XDG_CONFIG_HOME points elsewhere', () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;

      const home = yield* fs.makeTempDirectoryScoped();

      const legacy = `${home}/.config/2digits/tlo-mcp`;

      const resolve = configDirectory('session.json').pipe(
        Effect.provide([
          UserDirectories.layerPlatform('linux'),
          ConfigProvider.layer(ConfigProvider.fromUnknown({ HOME: home, XDG_CONFIG_HOME: `${home}/xdg` })),
        ]),
      );

      const fresh = yield* resolve;

      expect(fresh).toBe(`${home}/xdg/2digits/tlo-mcp`);

      yield* fs.makeDirectory(legacy, { recursive: true });

      yield* fs.writeFileString(`${legacy}/session.json`, '{}');

      const fallback = yield* resolve;

      expect(fallback).toBe(legacy);
    }).pipe(Effect.provide(PlatformLive), Effect.scoped),
  );

  it('prints a connection prompt without secrets or an Orbit OAuth flow', () => {
    const prompt = connectionPrompt('https://tlo.example.opentunnel.xyz/mcp');

    expect(prompt).toContain('https://tlo.example.opentunnel.xyz/mcp');

    expect(prompt).toContain('secure credential handoff');

    expect(prompt).toContain('read-only');

    expect(prompt).not.toContain(key);
  });
});
