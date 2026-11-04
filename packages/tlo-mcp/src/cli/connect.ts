// NodeHttpServer requires the native server constructor at this adapter boundary.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { createServer } from 'node:http';

import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer';
import { OpenTunnelClient } from '@opentunnel/client/effect';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Str from 'effect/String';
import * as HttpRouter from 'effect/http/HttpRouter';

import { GatewayError, gatewayKeyFile, gatewayRoutes, loadGatewayKey } from '../http/gateway.js';
import { openTunnel } from '../http/tunnel.js';
import { OrbitClientLive } from '../mcp/OrbitClient.js';
import { OrbitAuth, OrbitAuthLive } from '../oauth/OrbitAuth.js';
import { SessionStore, SessionStoreLive } from '../oauth/store.js';

export function connectionPrompt(endpoint: string): string {
  return `Connect my personal Teamleader Orbit MCP to Executor Cloud.
Endpoint: ${endpoint}
Transport: Streamable HTTP. Authentication: API key in Authorization: Bearer <key>.
Register an MCP integration named Teamleader Orbit (slug tlo_mcp) with a bearer-header API-key template, not OAuth.
Use a secure credential handoff so I enter the gateway key directly in Executor; never ask me to paste it into chat.
Create a personal connection, discover tools, and verify with one read-only tool. Do not change business data.
If this endpoint already exists, reuse its integration/connection instead of creating duplicates.
Orbit login and refresh are handled by the gateway; do not register another Orbit OAuth client.
`;
}

export const connect = Effect.fn('TloMcp.connect')(
  function* (port: number, publicUrl?: string) {
    const keyFile = yield* gatewayKeyFile;

    const key = yield* loadGatewayKey(keyFile);

    const store = yield* SessionStore;

    const auth = yield* OrbitAuth;

    if ((yield* store.load) === undefined) {
      // A server behind a public URL has no browser for the loopback OAuth callback.
      if (publicUrl !== undefined) {
        return yield* GatewayError.make({ message: 'No Orbit session. Run tlo-mcp login on a machine with a browser first.' });
      }

      yield* auth.login;
    }

    yield* Layer.build(
      HttpRouter.serve(gatewayRoutes(key), { disableLogger: true, disableListenLog: true }).pipe(
        Layer.provide(OrbitClientLive),
        Layer.provide(
          NodeHttpServer.layer(() => createServer({ maxHeaderSize: 8192, requestTimeout: 130_000 }), {
            host: publicUrl === undefined ? '127.0.0.1' : '0.0.0.0',
            port,
          }),
        ),
      ),
    );

    if (publicUrl !== undefined) {
      const endpoint = `${Str.replace(/\/$/, '')(publicUrl)}/mcp`;

      yield* Effect.sync(() => {
        process.stderr.write(`TLO gateway ready: ${endpoint}\nGateway key: ${keyFile} (private; not printed)\n`);
        process.stdout.write(connectionPrompt(endpoint));
      });

      return yield* Effect.never;
    }

    yield* Effect.sync(() =>
      process.stderr.write('Connecting OpenTunnel (first certificate may take a few minutes)...\n'),
    );

    const { endpoint, closed } = yield* openTunnel(port);

    yield* Effect.sync(() => {
      process.stderr.write(`TLO gateway ready: ${endpoint}\nGateway key: ${keyFile} (private; not printed)\n`);

      if (process.platform === 'darwin') {
        process.stderr.write(`Copy the key for Executor's secure credential form: pbcopy < "${keyFile}"\n`);
      }

      process.stderr.write(
        'Keep this process running and your Mac awake. Ctrl-C closes the gateway and tunnel.\n\nCopy this prompt to your agent:\n\n',
      );

      process.stdout.write(connectionPrompt(endpoint));
    });

    yield* closed;

    return yield* GatewayError.make({ message: 'The OpenTunnel connection stopped. Restart tlo-mcp.' });
  },
  Effect.scoped,
  Effect.provide([OrbitAuthLive, SessionStoreLive, OpenTunnelClient.layer()]),
);
