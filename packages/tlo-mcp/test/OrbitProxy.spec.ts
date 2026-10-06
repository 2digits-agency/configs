import * as NodeServices from '@effect/platform-node/NodeServices';
import { describe, expect, it } from '@effect/vitest';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Logger from 'effect/Logger';
import * as McpSchema from 'effect/ai/McpSchema';
import * as McpServer from 'effect/ai/McpServer';
import { afterEach, vi } from 'vite-plus/test';

import { OrbitClient, OrbitMcpError, type OrbitClientShape } from '../src/mcp/OrbitClient.js';
import { McpLoggerLayer } from '../src/mcp/logger.js';
import { OrbitProxyLive } from '../src/mcp/proxy.js';

vi.mock(import('effect/ai/McpServer'), (importOriginal) =>
  importOriginal().then((original) => ({ ...original, layerStdio: vi.fn<typeof McpServer.layerStdio>() })),
);

type Registration = Parameters<Context.Service.Shape<typeof McpServer.McpServer>['addTool']>[0];

const tool = McpSchema.Tool.make({
  name: 'UpdateProject',
  title: 'Update project',
  description: 'Official description',
  inputSchema: {
    type: 'object',
    properties: { projectId: { type: 'string' } },
    required: ['projectId'],
    additionalProperties: false,
  },
  outputSchema: { type: 'object', properties: { updated: { type: 'boolean' } } },
  annotations: { title: 'Official title', readOnlyHint: false, destructiveHint: true, idempotentHint: false },
  _meta: { upstream: 'Orbit' },
});

const register = Effect.fn('OrbitProxy.test.register')(function* (callTool: OrbitClientShape['callTool']) {
  const registrations: Array<Registration> = [];

  const transport = Layer.merge(
    Layer.effect(
      McpServer.McpServer,
      Effect.gen(function* () {
        const server = yield* McpServer.McpServer.make;

        return McpServer.McpServer.of({
          ...server,
          addTool: Effect.fn('OrbitProxy.test.addTool')(function* (registration) {
            registrations.push(registration);

            yield* server.addTool(registration);
          }),
        });
      }),
    ),
    Layer.succeed(McpSchema.McpServerClient, {
      clientId: 1,
      protocolVersion: '2025-06-18',
      clientCapabilities: {},
      clientInfo: { name: 'test', version: '1' },
      initializePayload: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'test', version: '1' },
      },
      getClient: Effect.die('Unexpected reverse request'),
    }),
  );

  const stdio = vi.mocked(McpServer.layerStdio).mockReturnValue(transport);

  yield* Layer.build(
    OrbitProxyLive.pipe(
      Layer.provide(Layer.succeed(OrbitClient, { tools: [tool], instructions: 'Official instructions', callTool })),
      Layer.provide(NodeServices.layer),
    ),
  );

  const registration = registrations[0];

  if (registration === undefined) {
    return yield* Effect.die('Missing proxy registration');
  }

  return { registration, registrations, stdio };
});

const requestContext = Layer.succeed(McpSchema.McpRequestContext, {
  clientId: 1,
  protocolVersion: '2025-06-18',
  clientCapabilities: {},
});

describe('orbit MCP proxy', () => {
  afterEach(() => vi.restoreAllMocks());

  it.effect('preserves upstream metadata, instructions, content and error results without replay', () =>
    Effect.gen(function* () {
      const result = McpSchema.CallToolResult.make({
        content: [
          { type: 'text', text: 'RATE_LIMITED: retry later' },
          { type: 'image', data: new TextEncoder().encode('image'), mimeType: 'image/png' },
        ],
        structuredContent: { updated: false },
        isError: true,
        _meta: { upstream: 'Orbit' },
      });

      const calls: Array<{ readonly name: string; readonly args: unknown }> = [];

      const { registration, registrations, stdio } = yield* register((name, args) => {
        calls.push({ name, args });

        return Effect.succeed(result);
      });

      expect(stdio).toHaveBeenCalledWith(expect.objectContaining({ instructions: 'Official instructions' }));

      expect(registrations).toHaveLength(1);

      expect(registration.tool).toBe(tool);

      expect(yield* registration.handle({ projectId: 'PR-example' })).toBe(result);

      expect(calls).toStrictEqual([{ name: tool.name, args: { projectId: 'PR-example' } }]);
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );

  it.effect('rejects non-object arguments with native InvalidParams before calling upstream', () =>
    Effect.gen(function* () {
      const callTool = vi.fn<OrbitClientShape['callTool']>(() => Effect.die('Unexpected upstream call'));

      const { registration } = yield* register(callTool);

      for (const input of [undefined, [], 'invalid', 42]) {
        const error = yield* registration.handle(input).pipe(Effect.flip);

        expect(error).toBeInstanceOf(McpSchema.InvalidParams);

        expect(error.message).toBe('Tool arguments must be a JSON object.');
      }

      expect(callTool).not.toHaveBeenCalled();
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );

  it.effect('maps upstream failures directly to native InternalError without replay', () =>
    Effect.gen(function* () {
      const callTool = vi.fn<OrbitClientShape['callTool']>(() =>
        Effect.fail(OrbitMcpError.make({ message: 'Orbit HTTP 403: request not replayed.' })),
      );

      const { registration } = yield* register(callTool);

      const error = yield* registration.handle({ projectId: 'PR-example' }).pipe(Effect.flip);

      expect(error).toBeInstanceOf(McpSchema.InternalError);

      expect(error.message).toBe('Orbit HTTP 403: request not replayed.');

      expect(callTool).toHaveBeenCalledExactlyOnceWith(tool.name, { projectId: 'PR-example' });
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );

  it.effect('routes runtime logging to stderr, not the MCP stdout transport', () =>
    Effect.gen(function* () {
      const context = yield* Layer.build(McpLoggerLayer);

      expect(Context.get(context, Logger.LogToStderr)).toBeTruthy();
    }).pipe(Effect.scoped),
  );
});
