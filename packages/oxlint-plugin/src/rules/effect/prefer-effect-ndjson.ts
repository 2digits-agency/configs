import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { argumentAt } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import {
  isGlobalJson,
  isLineValue,
  isNewlineSeparator,
  isPerLineCallback,
  joinCall,
  joinedValues,
  mapsEachTo,
  type ElementMapping,
  type LineContext,
} from './internal/lines';

export const preferEffectNdjson = Rule.define({
  name: 'prefer-effect-ndjson',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer Effect Ndjson over splitting lines and parsing or stringifying each one as JSON.',
    messages: {
      decode:
        'Use Ndjson.decodeString or Ndjson.decodeSchemaString from effect/encoding instead of JSON.parse on each line: it handles CRLF, blank lines and lines split across chunks, and fails with an NdjsonError.',
      encode:
        'Use Ndjson.encodeString or Ndjson.encodeSchemaString from effect/encoding instead of joining JSON.stringify results with line breaks.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/encoding/Ndjson',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    const context: LineContext = { imports, sourceCode: ctx.sourceCode };

    const stringify: ElementMapping = {
      mapper: (node) => isGlobalJson(node, 'stringify', ctx.sourceCode),
      element: (node) => node.type === 'CallExpression' && isGlobalJson(node.callee, 'stringify', ctx.sourceCode),
    };

    function isLineParse(node: ESTree.CallExpression): boolean {
      return (
        isGlobalJson(node.callee, 'parse', ctx.sourceCode) &&
        Opt.exists(argumentAt(node, 0), (argument) => isLineValue(argument, context))
      );
    }

    function isJsonLinesJoin(node: ESTree.CallExpression): boolean {
      return Opt.exists(joinCall(node, isNewlineSeparator, imports), (subject) =>
        mapsEachTo(joinedValues(node, subject, imports), stringify, context),
      );
    }

    return Visitor.merge(
      // `JSON.parse(line)` in a per-line callback or loop.
      Visitor.on('CallExpression', (node) => {
        if (isLineParse(node)) {
          return ctx.report(Diagnostic.fromId({ node, messageId: 'decode' }));
        }

        return isJsonLinesJoin(node) ? ctx.report(Diagnostic.fromId({ node, messageId: 'encode' })) : Effect.void;
      }),
      // `lines.map(JSON.parse)`.
      Visitor.on('MemberExpression', (node) =>
        isGlobalJson(node, 'parse', ctx.sourceCode) && isPerLineCallback(node, context)
          ? ctx.report(Diagnostic.fromId({ node, messageId: 'decode' }))
          : Effect.void,
      ),
    );
  },
});
