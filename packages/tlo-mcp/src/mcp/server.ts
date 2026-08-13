import * as Layer from 'effect/Layer';
import * as Logger from 'effect/Logger';
import * as McpProtocol from 'effect/unstable/ai/McpProtocol';
import * as McpServer from 'effect/unstable/ai/McpServer';

import { TloToolkit, TloToolkitHandlers } from './handlers.js';

interface McpServerOptions {
  readonly name: string;
  readonly version: string;
}

export function makeMcpServerLayer(options: McpServerOptions) {
  return McpServer.toolkit(TloToolkit).pipe(
    Layer.provide(TloToolkitHandlers),
    Layer.provide(
      McpServer.layerStdio({
        ...options,
        protocols: [McpProtocol.v2025_06_18],
      }),
    ),
    Layer.provide(Logger.layer([Logger.consolePretty({ stderr: true })])),
  );
}
