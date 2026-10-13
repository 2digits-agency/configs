import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, type Tool } from '@modelcontextprotocol/sdk/types.js';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vite-plus/test';

import { createGatewayReader, readTool } from '../src/gateway';
import type { ReadTool } from '../src/reads';

async function fixture<T>(run: (client: Client, executed: Array<string>) => Promise<T>, readOnly = true) {
  // Low-level Server is required to implement discovery pagination, not provided by McpServer.
  // oxlint-disable-next-line typescript/no-deprecated
  const server = new Server({ name: 'disposable-orbit-fixture', version: '1' }, { capabilities: { tools: {} } });

  const client = new Client({ name: 'readonly-test', version: '1' });

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  const tool: Tool = {
    name: 'GetTimesheetWeek',
    inputSchema: { type: 'object', required: ['date'], properties: { date: { type: 'string' } } },
    annotations: { readOnlyHint: readOnly },
  };

  const executed: Array<string> = [];

  server.setRequestHandler(ListToolsRequestSchema, (request) =>
    request.params?.cursor === 'second'
      ? { tools: [tool] }
      : { tools: [{ name: 'DeleteTimeEntry', inputSchema: { type: 'object' } }], nextCursor: 'second' },
  );

  server.setRequestHandler(CallToolRequestSchema, (request) => {
    executed.push(request.params.name);

    return {
      content: [{ type: 'text', text: 'Raw Orbit output is not a typed timesheet' }],
      structuredContent: { arbitrary: 37 },
    };
  });

  try {
    await server.connect(serverTransport);

    await client.connect(clientTransport);

    return await run(client, executed);
  } finally {
    await client.close();

    await server.close();
  }
}

describe('read-only MCP boundary with a write-capable server', () => {
  it('discovers paginated tools and preserves the unnormalized output envelope', async () => {
    await fixture(async (client, executed) => {
      await expect(
        Effect.runPromise(readTool(client, 'GetTimesheetWeek', { date: '2026-10-13' })),
      ).resolves.toStrictEqual({
        content: [{ type: 'text', text: 'Raw Orbit output is not a typed timesheet' }],
        structuredContent: { arbitrary: 37 },
      });

      expect(executed).toStrictEqual(['GetTimesheetWeek']);
    });
  });

  it.for(['CreateTimeEntry', 'UpdateTimeEntry', 'DeleteTimeEntry', 'ReplyToTicket', 'MoveTodo', 'toString'])(
    'never executes %s',
    async (name) => {
      await fixture(async (client, executed) => {
        await expect(Effect.runPromise(readTool(client, name as ReadTool, {}))).rejects.toThrow(/allowlist/);

        expect(executed).toStrictEqual([]);
      });
    },
  );

  it.for([
    [{ date: 13 }, /inputcontract/],
    [{ date: '2026-10-13', unexpected: true }, /inputcontract/],
    [{ date: 'DEMO-E1' }, /Demo-ID/],
  ] as Array<[Record<string, unknown>, RegExp]>)('fails closed on %j', async ([args, message]) => {
    await fixture(async (client, executed) => {
      await expect(Effect.runPromise(readTool(client, 'GetTimesheetWeek', args))).rejects.toThrow(message);

      expect(executed).toStrictEqual([]);
    });
  });

  it('requires a current explicit read-only annotation', async () => {
    await fixture(async (client, executed) => {
      await expect(Effect.runPromise(readTool(client, 'GetTimesheetWeek', { date: '2026-10-13' }))).rejects.toThrow(
        /read-only/,
      );

      expect(executed).toStrictEqual([]);
    }, false);
  });

  it('rejects a write before reading credentials or connecting to the local daemon', async () => {
    await expect(Effect.runPromise(createGatewayReader().read('ReplyToTicket' as ReadTool, {}))).rejects.toThrow(
      /writes/,
    );
  });
});
