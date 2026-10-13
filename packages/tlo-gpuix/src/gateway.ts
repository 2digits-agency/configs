/**
 * Native-only module. Never import from App.tsx or browser.tsx.
 */
import { lstat, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv-provider.js';
import * as Effect from 'effect/Effect';

import { ReadError, readTools, type LiveReader, type ReadTool } from './reads';

const keyFile = path.join(homedir(), '.config/2digits/tlo-mcp/gateway.key');

const endpoint = new URL('http://127.0.0.1:4790/mcp');

/**
 * Public read boundary: deny unknown names even if callers bypass TypeScript.
 */
export const readTool = Effect.fn('Gateway.readTool')(function* (
  client: Client,
  name: ReadTool,
  args: Record<string, unknown>,
) {
  if (!Object.hasOwn(readTools, name)) {
    return yield* ReadError.make({ message: 'Tool valt buiten de read-allowlist.' });
  }

  if (JSON.stringify(args).includes('DEMO-')) {
    return yield* ReadError.make({ message: 'Demo-ID mag nooit naar Orbit.' });
  }

  let cursor: string | undefined;

  const seen = new Set<string>();

  do {
    const params = cursor ? { cursor } : {};

    const page = yield* Effect.tryPromise({
      try: (signal) => client.listTools(params, { signal }),
      catch: () => ReadError.make({ message: 'Tools-discovery mislukt.' }),
    });

    const tool = page.tools.find((item) => item.name === name);

    if (tool) {
      if (tool.annotations?.readOnlyHint !== true) {
        return yield* ReadError.make({ message: 'Tool is niet expliciet read-only geannoteerd. Fail closed.' });
      }

      const valid = yield* Effect.try({
        try: () =>
          new AjvJsonSchemaValidator().getValidator({ ...tool.inputSchema, additionalProperties: false })(args),
        catch: () => ReadError.make({ message: 'Onbekend of ongeldig inputcontract.' }),
      });

      if (!valid.valid) {
        return yield* ReadError.make({ message: 'Argumenten passen niet bij het actuele inputcontract.' });
      }

      const result = yield* Effect.tryPromise({
        try: (signal) => client.callTool({ name, arguments: args }, undefined, { signal }),
        catch: () => ReadError.make({ message: 'Read mislukt. Geen automatische retry.' }),
      });

      if (result.isError) {
        return yield* ReadError.make({ message: 'MCP-tool meldde een domeinfout.' });
      }

      return result;
    }

    cursor = page.nextCursor;

    if (cursor && seen.has(cursor)) {
      return yield* ReadError.make({ message: 'Herhaalde discoverycursor.' });
    }

    if (cursor) {
      seen.add(cursor);
    }
  } while (cursor);

  return yield* ReadError.make({ message: 'Tool ontbreekt in de actuele gateway.' });
});

/**
 * Each explicit read owns one scoped MCP connection; no auth provider, refresh, cache or retries.
 */
export function createGatewayReader(): LiveReader {
  return {
    read: Effect.fn('Gateway.read')(function* (name, args) {
      if (!Object.hasOwn(readTools, name)) {
        return yield* ReadError.make({ message: 'Geen writes toegestaan.' });
      }

      const key = yield* Effect.tryPromise({
        try: async (signal) => {
          const info = await lstat(keyFile);

          if (!info.isFile() || (info.mode & 0o077) !== 0 || (process.getuid && info.uid !== process.getuid())) {
            throw new Error('Private key file required');
          }

          const file = await readFile(keyFile, { encoding: 'utf8', signal });

          const value = file.trim();

          if (!/^[a-f0-9]{64}$/.test(value)) {
            throw new Error('Invalid key');
          }

          return value;
        },
        catch: () =>
          ReadError.make({ message: 'Geen geldig privé-sleutelbestand; gebruik de bestaande tlo-mcp daemon.' }),
      });

      const client = yield* Effect.acquireRelease(
        Effect.sync(() => new Client({ name: 'tlo-gpuix-readonly', version: '0.1.0' })),
        (value) =>
          Effect.tryPromise({
            try: (_signal) => value.close(),
            catch: () => ReadError.make({ message: 'MCP-verbinding kon niet sluiten.' }),
          }).pipe(Effect.ignore),
      );

      yield* Effect.tryPromise({
        try: (signal) =>
          client.connect(
            new StreamableHTTPClientTransport(endpoint, {
              requestInit: { headers: { authorization: `Bearer ${key}` }, redirect: 'error', signal },
              reconnectionOptions: {
                maxRetries: 0,
                initialReconnectionDelay: 1000,
                maxReconnectionDelay: 1000,
                reconnectionDelayGrowFactor: 1,
              },
            }),
            { signal },
          ),
        catch: () => ReadError.make({ message: 'Lokale gateway niet bereikbaar of authenticatie geweigerd.' }),
      });

      return yield* readTool(client, name, args);
    }, Effect.scoped),
  };
}
