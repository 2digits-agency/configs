import { Diagnostic, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import type * as Result from 'effect/Result';

import { argumentAt, firstIdentifierParameter, type FunctionNode } from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';
import { functionResult } from './internal/callbacks';

function returnsParameter(
  node: ESTree.Expression,
  member: keyof typeof Result,
  name: string,
  imports: ImportBindings,
): boolean {
  return (
    node.type === 'CallExpression' &&
    imports.isApi(node.callee, 'Result', member) &&
    Opt.exists(argumentAt(node, 0), (value) => value.type === 'Identifier' && value.name === name)
  );
}

/**
 * `(x) => cond ? Result.succeed(x) : Result.fail(x)`, which `Filter.fromPredicate` expresses directly.
 *
 * @param node Function.
 * @param imports Import bindings of the file.
 */
function isResultFilter(node: FunctionNode, imports: ImportBindings): boolean {
  return Opt.exists(firstIdentifierParameter(node), ({ name }) =>
    Opt.exists(
      functionResult(node),
      (result) =>
        result.type === 'ConditionalExpression' &&
        returnsParameter(result.consequent, 'succeed', name, imports) &&
        returnsParameter(result.alternate, 'fail', name, imports),
    ),
  );
}

export const preferEffectFilter: CreateRule = defineRule({
  name: 'prefer-effect-filter',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer Effect Filter constructors for reusable Result-valued predicates.',
    messages: {
      effectFilter: 'Use Filter.fromPredicate for this Result-valued predicate so it composes as a Filter.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/Filter',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    function check(node: FunctionNode) {
      return isResultFilter(node, imports)
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'effectFilter' }))
        : Effect.void;
    }

    return Visitor.merge(Visitor.on('ArrowFunctionExpression', check), Visitor.on('FunctionExpression', check));
  },
});
