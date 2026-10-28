import * as Arr from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Opt from 'effect/Option';
import type * as Schema from 'effect/Schema';
import * as Str from 'effect/String';
import * as McpClientError from 'effect/ai/McpClientError';
import type * as McpSchema from 'effect/ai/McpSchema';

import { OrbitClient } from '../mcp/OrbitClient.js';
import type { OrbitTool } from './text.js';

/**
 * Orbit reports some failures as plain text with `isError: false`, e.g. "Error: '9087' is not a valid TICKET API ID".
 */
const TEXT_ERROR_PREFIX = 'Error: ';

export interface OrbitShape {
  /**
   * Call a read-only Orbit tool and decode its text result. Never retried.
   */
  readonly call: <Args extends Schema.JsonObject, A>(
    tool: OrbitTool<Args, A>,
    args: Args,
  ) => Effect.Effect<A, McpClientError.McpClientError | Schema.SchemaError>;
}

export class Orbit extends Context.Service<Orbit, OrbitShape>()('@2digits/tlo-mcp/orbit/Orbit') {}

function textOf(result: McpSchema.CallToolResult) {
  return Arr.join(
    Arr.flatMap(result.content, (block) => (block.type === 'text' ? [block.text] : [])),
    '',
  );
}

export const OrbitLive = Layer.effect(
  Orbit,
  Effect.gen(function* () {
    const upstream = yield* OrbitClient;

    function call<Args extends Schema.JsonObject, A>(tool: OrbitTool<Args, A>, args: Args) {
      return Effect.gen(function* () {
        const descriptor = Arr.findFirst(upstream.tools, ({ name }) => name === tool.name);

        if (Opt.isNone(descriptor)) {
          return yield* McpClientError.McpClientError.make({
            reason: McpClientError.UnsupportedError.make({ description: `Orbit does not offer ${tool.name}` }),
          });
        }

        const result = yield* upstream.callTool(descriptor.value, args);

        const text = textOf(result);

        if (result.isError === true || Str.startsWith(TEXT_ERROR_PREFIX)(text)) {
          return yield* McpClientError.McpClientError.make({ reason: McpClientError.ToolError.make({ result }) });
        }

        return yield* tool.decode(text);
      }).pipe(Effect.withSpan(`Orbit.${tool.name}`));
    }

    return Orbit.of({ call });
  }),
);
