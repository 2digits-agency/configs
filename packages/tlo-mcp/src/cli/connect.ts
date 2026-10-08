// NodeHttpServer requires the native server constructor at this adapter boundary.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { createServer } from 'node:http';

import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer';
import { OpenTunnelClient } from '@opentunnel/client/effect';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { HttpRouter } from 'effect/http';

import { GatewayError, gatewayRoutes, KEY_FILE, loadGatewayKey } from '../http/gateway.js';
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
Orbit login and refresh are handled on my Mac; do not register another Orbit OAuth client.
`;
}

export const connect = Effect.fn('TloMcp.connect')(
  function* (port: number) {
    const key = yield* loadGatewayKey(KEY_FILE);

    const store = yield* SessionStore;

    const auth = yield* OrbitAuth;

    if ((yield* store.load) === undefined) {
      yield* auth.login;
    }

    yield* Layer.build(
      HttpRouter.serve(gatewayRoutes(key), { disableLogger: true, disableListenLog: true }).pipe(
        Layer.provide(OrbitClientLive),
        Layer.provide(
          NodeHttpServer.layer(() => createServer({ maxHeaderSize: 8192, requestTimeout: 130_000 }), {
            host: '127.0.0.1',
            port,
          }),
        ),
      ),
    );

    yield* Effect.sync(() =>
      process.stderr.write('Connecting OpenTunnel (first certificate may take a few minutes)...\n'),
    );

    const { endpoint, closed } = yield* openTunnel(port);

    yield* Effect.sync(() => {
      process.stderr.write(`TLO gateway ready: ${endpoint}\nGateway key: ${KEY_FILE} (private; not printed)\n`);

      if (process.platform === 'darwin') {
        process.stderr.write(`Copy the key for Executor's secure credential form: pbcopy < "${KEY_FILE}"\n`);
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
  Effect.provide(Layer.mergeAll(OrbitAuthLive, SessionStoreLive, OpenTunnelClient.layer())),
);
