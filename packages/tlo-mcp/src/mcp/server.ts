import * as NodeStdio from '@effect/platform-node/NodeStdio';
import * as Layer from 'effect/Layer';
import * as Logger from 'effect/Logger';
import * as McpServer from 'effect/unstable/ai/McpServer';

import { TloToolkit, TloToolkitHandlers } from './handlers.js';

interface McpServerOptions {
  readonly name: string;
  readonly version: string;
}

export function makeMcpServerLayer(options: McpServerOptions) {
  return McpServer.toolkit(TloToolkit).pipe(
    Layer.provide(TloToolkitHandlers),
    Layer.provide(McpServer.layerStdio(options)),
    Layer.provide(NodeStdio.layer),
    Layer.provide(Layer.succeed(Logger.LogToStderr, true)),
  );
}
