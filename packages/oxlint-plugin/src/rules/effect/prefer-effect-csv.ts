import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import {
  isCellDelimiter,
  isLineValue,
  isNewlineSeparator,
  isPerLineCallback,
  joinCall,
  joinedValues,
  mapsEachTo,
  splitCall,
  type ElementMapping,
  type LineContext,
} from './internal/lines';

export const preferEffectCsv = Rule.define({
  name: 'prefer-effect-csv',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer Effect Csv over splitting lines into cells or joining cells and rows by hand.',
    messages: {
      decode:
        'Use Csv.decodeString or Csv.decodeSchemaString from effect/encoding instead of splitting each line on a delimiter: quoted cells may contain the delimiter, quotes and line breaks.',
      encode:
        'Use Csv.encodeString or Csv.encodeSchemaString from effect/encoding instead of joining cells and rows: joined cells are not quoted when they contain the delimiter, quotes or line breaks.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/encoding/Csv',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    const context: LineContext = { imports, sourceCode: ctx.sourceCode };

    const joinCells: ElementMapping = {
      mapper: (node) => Opt.exists(joinCall(node, isCellDelimiter, imports), Opt.isNone),
      element: (node) => Opt.isSome(joinCall(node, isCellDelimiter, imports)),
    };

    // `line.split(',')` on one line of split text, or a data-last `Str.split(',')` mapped over the lines.
    function isLineSplit(node: ESTree.CallExpression): boolean {
      return Opt.exists(splitCall(node, isCellDelimiter, imports), (subject) =>
        Opt.match(subject, {
          onNone: () => isPerLineCallback(node, context),
          onSome: (line) => isLineValue(line, context),
        }),
      );
    }

    // `rows.map((row) => row.join(',')).join('\n')` and its pipeline forms.
    function isRowsJoin(node: ESTree.CallExpression): boolean {
      return Opt.exists(joinCall(node, isNewlineSeparator, imports), (subject) =>
        mapsEachTo(joinedValues(node, subject, imports), joinCells, context),
      );
    }

    return Visitor.on('CallExpression', (node) => {
      if (isLineSplit(node)) {
        return ctx.report(Diagnostic.fromId({ node, messageId: 'decode' }));
      }

      return isRowsJoin(node) ? ctx.report(Diagnostic.fromId({ node, messageId: 'encode' })) : Effect.void;
    });
  },
});
