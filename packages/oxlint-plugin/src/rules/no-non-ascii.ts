import { Rule, RuleContext, Visitor } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Str from 'effect/String';

import { ruleMeta } from '../internal/meta';

/**
 * A keycap, a flag, or one non-ASCII symbol or emoji with the modifiers, tags and joined emoji that render as one
 * glyph. Letters, currency signs and punctuation are text, unless a variation selector asks for their emoji form; the
 * bullets, middle dot and ellipsis are punctuation in Unicode but are added because they are drawn as separators and
 * indicators.
 */
const matchGlyphs = Str.matchAll(
  /[0-9#*]\u{FE0F}?\u{20E3}|\p{Regional_Indicator}{2}|(?:\p{Extended_Pictographic}\u{FE0F}|(?![\p{ASCII}\p{Sc}©®™°])[\p{S}·•‣‧⁃…])(?:[\u{FE0F}\p{Emoji_Modifier}\u{E0020}-\u{E007F}]|\u{200D}\p{Extended_Pictographic})*/gu,
);

export const noNonAscii = Rule.define({
  name: 'no-non-ascii',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Flag literal symbols and emoji and prefer UI components over text glyphs for interface elements.',
    docs: { recommended: false },
    messages: {
      glyph:
        'Unexpected symbol or emoji (U+{{codePoint}}). If this glyph stands in for an icon, control, separator, or visual indicator, use a real UI component instead. Do not replace it with an escape, HTML entity, or ASCII art.',
    },
  }),
  *create() {
    const ctx = yield* RuleContext;

    const { sourceCode } = ctx;

    return Visitor.on(
      'Program',
      Effect.fnUntraced(function* () {
        for (const { 0: glyph, index } of matchGlyphs(sourceCode.text)) {
          const codePoint = Str.codePointAt(glyph, 0);

          if (P.isUndefined(index) || Opt.isNone(codePoint)) {
            continue;
          }

          yield* ctx.report({
            messageId: 'glyph',
            data: { codePoint: Str.padStart(4, '0')(Str.toUpperCase(codePoint.value.toString(16))) },
            loc: {
              start: sourceCode.getLocFromIndex(index),
              end: sourceCode.getLocFromIndex(index + glyph.length),
            },
          });
        }
      }),
    );
  },
});
