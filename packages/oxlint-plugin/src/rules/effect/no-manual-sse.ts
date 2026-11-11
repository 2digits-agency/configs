import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import { argumentAt, isStringLiteral, parentOf, staticPropertyName, unwrapExpression } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

/**
 * Stands in for an interpolated value, which never contains a line break.
 */
const hole = '\0';

/**
 * Text that starts an SSE field line (`data:`, `event:`, `id:` or `retry:`) and ends with the blank line that
 * dispatches the event. A comment frame such as `: ping\n\n` has no field, and `Sse.encoder` cannot write it.
 */
const SseFrame = Schema.String.check(Schema.isPattern(/(?:^|[\n\r])(?:data|event|id|retry):.*(?:\r?\n){2}$/su));

const isSseFrame = Schema.is(SseFrame);

/**
 * Field prefixes a hand-written parser tests lines against. `data:` without a space is left out because it also starts
 * data URLs.
 */
const SseFieldPrefix = Schema.Literals(['data: ', 'event: ', 'id: ', 'retry: ']);

const isSseFieldPrefix = Schema.is(SseFieldPrefix);

/**
 * The static text of a string expression, with each interpolation replaced by `hole`.
 *
 * @param node String literal, template literal or `+` concatenation.
 */
function staticText(node: ESTree.Expression | ESTree.PrivateIdentifier): string {
  if (node.type === 'PrivateIdentifier') {
    return hole;
  }

  const expression = unwrapExpression(node);

  if (isStringLiteral(expression)) {
    return expression.value;
  }

  if (expression.type === 'TemplateLiteral') {
    return Arr.join(
      Arr.map(expression.quasis, ({ value }) => value.cooked ?? value.raw),
      hole,
    );
  }

  return expression.type === 'BinaryExpression' && expression.operator === '+'
    ? staticText(expression.left) + staticText(expression.right)
    : hole;
}

function isConcatenation(node: ESTree.Node): boolean {
  return node.type === 'BinaryExpression' && node.operator === '+';
}

export const noManualSse = Rule.define({
  name: 'no-manual-sse',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Disallow writing or parsing Server-Sent Events text by hand in Effect projects.',
    messages: {
      frame:
        'Write events with Sse.encoder.write, Sse.encode or HttpApiSchema.StreamSse: a hand-written frame breaks on a line break in `data` and lets `id` or `event` inject fields.',
      parse:
        'Parse events with Sse.decode, Sse.decodeSchema or Sse.makeParser: matching `{{prefix}}` by hand misses fields without a space, multi-line data, comments and CR line endings.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/encoding/Sse',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    function isStartsWithCall({ callee }: ESTree.CallExpression) {
      return (
        imports.isApi(callee, 'String', 'startsWith') ||
        (callee.type === 'MemberExpression' && Opt.contains(staticPropertyName(callee), 'startsWith'))
      );
    }

    // Only the outermost part of a concatenation is checked, so the frame is checked once as a whole.
    function checkText(node: ESTree.Expression) {
      return !Opt.exists(parentOf(node), isConcatenation) && isSseFrame(staticText(node))
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'frame' }))
        : Effect.void;
    }

    return Visitor.merge(
      Visitor.on('Literal', (node) => (isStringLiteral(node) ? checkText(node) : Effect.void)),
      Visitor.on('TemplateLiteral', checkText),
      Visitor.on('BinaryExpression', (node) => (isConcatenation(node) ? checkText(node) : Effect.void)),
      Visitor.on('CallExpression', (node) =>
        argumentAt(node, 0).pipe(
          Opt.filter(isStringLiteral),
          Opt.match({
            onNone: () => Effect.void,
            onSome: ({ value }) =>
              isSseFieldPrefix(value) && isStartsWithCall(node)
                ? ctx.report(Diagnostic.fromId({ node, messageId: 'parse', data: { prefix: value } }))
                : Effect.void,
          }),
        ),
      ),
    );
  },
});
