import { OpenTunnelClient } from '@opentunnel/client/effect';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import * as Stream from 'effect/Stream';

import { GatewayError } from './gateway.js';

const TunnelHostname = Schema.String.check(Schema.isPattern(/^[a-z0-9]+\.opentunnel\.xyz$/));

/**
 * One scoped SDK connection; no CLI, daemon or routes from other profiles.
 */
export const openTunnel = Effect.fn('Gateway.openTunnel')(
  function* (port: number) {
    const client = yield* OpenTunnelClient;

    const connection = yield* client.tunnel.connect({
      profile: 'tlo-mcp',
      routes: { tlo: `127.0.0.1:${port}` },
    });

    const hostname = yield* Schema.decodeEffect(TunnelHostname)(connection.tunnel.hostname);

    yield* connection.events.pipe(
      Stream.runForEach((event) =>
        event.type === 'reconnecting'
          ? Effect.sync(() => process.stderr.write('OpenTunnel reconnecting...\n'))
          : Effect.void,
      ),
      Effect.forkScoped,
    );

    return {
      endpoint: `https://tlo.${hostname}/mcp`,
      closed: connection.closed.pipe(
        Effect.mapError(() => GatewayError.make({ message: 'OpenTunnel stopped unexpectedly. Restart tlo-mcp.' })),
      ),
    };
  },
  Effect.timeout('180 seconds'),
  Effect.mapError(() =>
    GatewayError.make({
      message: 'Could not connect OpenTunnel. Check network access and retry; existing tunnel identity is preserved.',
    }),
  ),
);
