import { Rule, RuleContext, Visitor } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Str from 'effect/String';

import { ruleMeta } from '../internal/meta';

const matchNonAscii = Str.matchAll(/\P{ASCII}/gu);

export const noNonAscii = Rule.define({
  name: 'no-non-ascii',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Flag literal non-ASCII characters and prefer UI components over text glyphs for interface elements.',
    docs: { recommended: false },
    messages: {
      nonAscii:
        'Unexpected non-ASCII character (U+{{codePoint}}). If this glyph stands in for an icon, control, or visual indicator, use a real UI component instead. Do not replace it with an escape, HTML entity, or ASCII art.',
    },
  }),
  *create() {
    const ctx = yield* RuleContext;

    const { sourceCode } = ctx;

    return Visitor.on(
      'Program',
      Effect.fnUntraced(function* () {
        for (const { 0: character, index } of matchNonAscii(sourceCode.text)) {
          const codePoint = Str.codePointAt(character, 0);

          if (P.isUndefined(index) || Opt.isNone(codePoint)) {
            continue;
          }

          yield* ctx.report({
            messageId: 'nonAscii',
            data: { codePoint: Str.padStart(4, '0')(Str.toUpperCase(codePoint.value.toString(16))) },
            loc: {
              start: sourceCode.getLocFromIndex(index),
              end: sourceCode.getLocFromIndex(index + character.length),
            },
          });
        }
      }),
    );
  },
});
