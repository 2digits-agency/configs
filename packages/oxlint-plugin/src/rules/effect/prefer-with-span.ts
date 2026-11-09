import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { argumentAt, functionUsesFirstParameter, isFunctionNode } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

export const preferWithSpan: CreateRule = Rule.define({
  name: 'prefer-with-span',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer Effect.withSpan when the callback does not use the span handle.',
    messages: {
      unusedSpan:
        'The useSpan callback ignores its span. Use Effect.withSpan so nested spans are parented beneath this span.',
    },
    url: 'https://github.com/Effect-TS/tsgo/issues/663',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      imports.isApi(node.callee, 'Effect', 'useSpan' satisfies keyof typeof Effect) &&
      Opt.exists(
        argumentAt(node, node.arguments.length - 1),
        (callback) => isFunctionNode(callback) && !functionUsesFirstParameter(callback),
      )
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'unusedSpan' }))
        : Effect.void,
    );
  },
});
