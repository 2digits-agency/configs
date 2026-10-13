import * as NodeServices from '@effect/platform-node/NodeServices';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { makeDemoMcpLayer } from '../demo/DemoMcp.js';
import { makeChangeRequestStoreLayer } from '../flows/ChangeRequest.js';
import { loadGatewayKey } from '../mcp/GatewayKey.js';
import { makeMcpClientLayer } from '../mcp/McpClient.js';
import { type DataSource, makeOrbitLayer } from '../orbit/Orbit.js';
import type { WriteMode } from '../orbit/Policy.js';

export interface AppConfig {
  readonly source: DataSource;
  readonly url: string;
  readonly keyFile: string;
  readonly writeMode: WriteMode;
  readonly requestDirectory: string;
  readonly demoFault: 'timeout' | undefined;
}

/**
 * Live: the local `tlo-mcp` gateway with its bearer key (no OAuth here). Demo: in-memory fictional data.
 *
 * @param config
 */
export function makeAppLayer(config: AppConfig) {
  const mcp =
    config.source === 'demo'
      ? makeDemoMcpLayer({ fault: config.demoFault })
      : Layer.unwrap(
          loadGatewayKey(config.keyFile).pipe(Effect.map((key) => makeMcpClientLayer({ url: config.url, key }))),
        );

  return Layer.mergeAll(
    makeOrbitLayer({ source: config.source, writeMode: config.writeMode }).pipe(Layer.provide(mcp)),
    makeChangeRequestStoreLayer({ directory: config.requestDirectory, source: config.source }),
  ).pipe(Layer.provide(NodeServices.layer));
}
