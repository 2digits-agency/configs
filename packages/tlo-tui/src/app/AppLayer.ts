import * as NodeServices from '@effect/platform-node/NodeServices';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import * as Demo from '../demo/DemoMcp.js';
import type { LocalDate } from '../domain/time.js';
import * as ChangeRequest from '../flows/ChangeRequest.js';
import { loadGatewayKey } from '../mcp/GatewayKey.js';
import * as Mcp from '../mcp/McpClient.js';
import * as Orbit from '../orbit/Orbit.js';
import type { WriteMode } from '../orbit/Policy.js';

export interface AppConfig {
  readonly source: Orbit.DataSource;
  readonly url: string;
  readonly keyFile: string;
  readonly writeMode: WriteMode;
  readonly requestDirectory: string;
  readonly demoFault: 'timeout' | undefined;
  readonly today: LocalDate;
}

/**
 * Live: the local `tlo-mcp` gateway with its bearer key (no OAuth here). Demo: in-memory fictional data.
 *
 * @param config
 */
export function makeAppLayer(config: AppConfig) {
  const mcp =
    config.source === 'demo'
      ? Demo.makeDemoMcpLayer({ fault: config.demoFault, today: config.today })
      : Layer.unwrap(
          loadGatewayKey(config.keyFile).pipe(Effect.map((key) => Mcp.makeMcpClientLayer({ url: config.url, key }))),
        );

  return Layer.mergeAll(
    Orbit.makeOrbitLayer({ source: config.source, writeMode: config.writeMode }).pipe(Layer.provide(mcp)),
    ChangeRequest.makeChangeRequestStoreLayer({ directory: config.requestDirectory, source: config.source }),
  ).pipe(Layer.provide(NodeServices.layer));
}
