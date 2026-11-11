import { Diagnostic, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import type * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import { argumentAt, isLiteral, isStringLiteral, unwrapExpression } from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';

const ZeroDurationInput = Schema.String.check(
  Schema.isPattern(/^0\s*(?:nanos?|micros?|millis?|seconds?|minutes?|hours?|days?|weeks?)$/i),
);

const isZeroDurationInput = Schema.is(ZeroDurationInput);

/**
 * `0`, `'0 millis'`, `Duration.zero` or a `Duration` constructor called with `0`.
 *
 * @param node Duration input.
 * @param imports Import bindings of the file.
 */
function isZeroDuration(node: ESTree.Expression, imports: ImportBindings): boolean {
  const expression = unwrapExpression(node);

  if (isLiteral(expression, 0) || imports.isApi(expression, 'Duration', 'zero' satisfies keyof typeof Duration)) {
    return true;
  }

  if (isStringLiteral(expression)) {
    return isZeroDurationInput(expression.value);
  }

  return (
    expression.type === 'CallExpression' &&
    Opt.exists(imports.path(expression.callee), (path) => Opt.contains(Arr.head(path), 'Duration')) &&
    Opt.exists(argumentAt(expression, 0), (amount) => isLiteral(amount, 0))
  );
}

export const preferYieldNow: CreateRule = defineRule({
  name: 'prefer-yield-now',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer scheduler yielding to a zero-duration Clock sleep.',
    messages: {
      zeroSleep:
        'Effect.sleep(0) uses Clock and interacts with TestClock. Use Effect.yieldNow for a cooperative scheduler yield.',
    },
    url: 'https://github.com/Effect-TS/tsgo/issues/661',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      imports.isApi(node.callee, 'Effect', 'sleep' satisfies keyof typeof Effect) &&
      Opt.exists(argumentAt(node, 0), (duration) => isZeroDuration(duration, imports))
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'zeroSleep' }))
        : Effect.void,
    );
  },
});
