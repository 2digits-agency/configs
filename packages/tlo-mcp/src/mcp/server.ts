import * as McpServer from '@effect/ai/McpServer';
import * as NodeSink from '@effect/platform-node/NodeSink';
import * as NodeStream from '@effect/platform-node/NodeStream';
import * as Layer from 'effect/Layer';
import * as Logger from 'effect/Logger';

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
        stdin: NodeStream.stdin,
        stdout: NodeSink.stdout,
      }),
    ),
    Layer.provide(Logger.add(Logger.prettyLogger({ stderr: true }))),
  );
}
