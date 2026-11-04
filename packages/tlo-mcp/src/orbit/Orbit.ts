import * as Arr from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';
import * as McpClientError from 'effect/ai/McpClientError';

import { OrbitClient } from '../mcp/OrbitClient.js';
import type { OrbitTool } from './text.js';

/**
 * Orbit reports some failures as plain text with `isError: false`, e.g. "Error: '9087' is not a valid TICKET API ID".
 */
const TEXT_ERROR_PREFIX = 'Error: ';

const decodeSingleTextBlock = Schema.decodeUnknownEffect(
  Schema.Tuple([Schema.Struct({ type: Schema.Literal('text'), text: Schema.String })]),
);

type OrbitArgs = Schema.Top & { readonly Encoded: Schema.JsonObject; readonly EncodingServices: never };

type OrbitResult = Schema.Top & { readonly Encoded: string; readonly DecodingServices: never };

export interface OrbitShape {
  /**
   * Call a read-only Orbit tool and decode its text result. Never retried.
   */
  readonly call: <TArgs extends OrbitArgs, TResult extends OrbitResult>(
    tool: OrbitTool<TArgs, TResult>,
    args: TArgs['Type'],
  ) => Effect.Effect<TResult['Type'], McpClientError.McpClientError | Schema.SchemaError>;
}

export class Orbit extends Context.Service<Orbit, OrbitShape>()('@2digits/tlo-mcp/orbit/Orbit') {}

export const OrbitLive = Layer.effect(
  Orbit,
  Effect.gen(function* () {
    const upstream = yield* OrbitClient;

    function call<TArgs extends OrbitArgs, TResult extends OrbitResult>(
      tool: OrbitTool<TArgs, TResult>,
      args: TArgs['Type'],
    ) {
      return Effect.gen(function* () {
        const descriptor = Arr.findFirst(upstream.tools, ({ name }) => name === tool.name);

        if (Opt.isNone(descriptor)) {
          return yield* McpClientError.McpClientError.make({
            reason: McpClientError.UnsupportedError.make({ description: `Orbit does not offer ${tool.name}` }),
          });
        }

        const encoded = yield* Schema.encodeEffect(tool.args)(args);

        const result = yield* upstream.callTool(descriptor.value, encoded);

        const isTextError = Arr.some(
          result.content,
          (block) => block.type === 'text' && Str.startsWith(TEXT_ERROR_PREFIX)(block.text),
        );

        if (isTextError || result.isError === true) {
          return yield* McpClientError.McpClientError.make({ reason: McpClientError.ToolError.make({ result }) });
        }

        // Orbit answers with exactly one text block; anything else is a format change, not an empty result.
        const [{ text }] = yield* decodeSingleTextBlock(result.content);

        return yield* Schema.decodeEffect(tool.result)(text);
      }).pipe(Effect.withSpan(`Orbit.${tool.name}`));
    }

    return Orbit.of({ call });
  }),
);
