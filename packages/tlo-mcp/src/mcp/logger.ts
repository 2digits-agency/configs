import * as Layer from 'effect/Layer';
import * as Logger from 'effect/Logger';

export const McpLoggerLayer = Layer.merge(
  Logger.layer([Logger.consolePretty()]),
  Layer.succeed(Logger.LogToStderr, true),
);
