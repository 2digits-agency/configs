import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { isGlobalIdentifier } from '../../internal/scope';
import { onRuntimeImport, packageName } from './internal/package-imports';

/**
 * Server-Sent Events clients, parsers and server helpers that `Sse` with `HttpClient`, `HttpServerResponse` or
 * `HttpApiSchema.StreamSse` replaces.
 */
const SsePackage = Schema.Literals([
  '@microsoft/fetch-event-source',
  'better-sse',
  'event-source-polyfill',
  'eventsource',
  'eventsource-client',
  'eventsource-parser',
  'extended-eventsource',
  'fetch-event-stream',
  'reconnecting-eventsource',
  'sse.js',
]);

const isSsePackage = Schema.is(SsePackage);

export const preferEffectSse = Rule.define({
  name: 'prefer-effect-sse',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer Effect Sse over Server-Sent Events libraries and `EventSource` in Effect projects.',
    messages: {
      library:
        'Use Sse from effect/encoding instead of {{source}}: Sse.decode, Sse.decodeSchema or Sse.makeParser parse event streams, and Sse.encode or HttpApiSchema.StreamSse write them.',
      eventSource:
        'Read the event stream with HttpClient and Sse.decode or Sse.decodeSchema, so events are schema-decoded and the stream is interruptible.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/encoding/Sse',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    return Visitor.merge(
      onRuntimeImport((source) =>
        isSsePackage(packageName(source.value))
          ? ctx.report(Diagnostic.fromId({ node: source, messageId: 'library', data: { source: source.value } }))
          : Effect.void,
      ),
      Visitor.on('NewExpression', (node) =>
        Effect.when(
          ctx.report(Diagnostic.fromId({ node, messageId: 'eventSource' })),
          isGlobalIdentifier(node.callee, 'EventSource'),
        ),
      ),
    );
  },
});
