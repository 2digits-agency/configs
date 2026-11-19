import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import type * as P from 'effect/Predicate';

import { namespaceMember, staticPath } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import type { ImportBindings } from '../../schemas/imports';
import { isInsideBroadEffectHandler, isReasonMember } from './internal/tagged-values';

const isTagged = 'isTagged' satisfies keyof typeof P;

/**
 * `Predicate.isTagged` as written, like upstream, or through an Effect import such as `P.isTagged`.
 *
 * @param imports Effect imports of the file.
 * @param callee Callee to inspect.
 */
function isIsTaggedCallee(imports: ImportBindings, callee: ESTree.Node): boolean {
  return (
    imports.isApi(callee, 'Predicate', isTagged) ||
    Opt.contains(Opt.flatMap(staticPath(callee), namespaceMember('Predicate')), isTagged)
  );
}

/**
 * The value an `isTagged` call checks: `x` in `Predicate.isTagged(x, 'A')` and `Predicate.isTagged('A')(x)`.
 *
 * @param imports Effect imports of the file.
 * @param node Call to inspect.
 */
function taggedSubject(imports: ImportBindings, node: ESTree.CallExpression): Opt.Option<ESTree.Node> {
  const { callee } = node;

  const dataFirst = isIsTaggedCallee(imports, callee) && node.arguments.length === 2;

  const curried =
    callee.type === 'CallExpression' &&
    isIsTaggedCallee(imports, callee.callee) &&
    callee.arguments.length === 1 &&
    node.arguments.length === 1;

  return dataFirst || curried ? Arr.head(node.arguments) : Opt.none();
}

/**
 * Prefer tagged handlers to `Predicate.isTagged` checks in broad Effect catch callbacks.
 */
export const preferTaggedErrorHandling = Rule.define({
  name: 'prefer-tagged-error-handling',
  meta: ruleMeta({
    type: 'problem',
    description: 'Use Effect tagged error handlers instead of `Predicate.isTagged` checks in a broad catch handler.',
    messages: {
      taggedError:
        'Use Effect.catchTag or Effect.catchTags instead of checking the error with `Predicate.isTagged` in a broad Effect catch handler.',
      taggedReason:
        'Use Effect.catchReason or Effect.catchReasons instead of checking the error `reason` with `Predicate.isTagged` in a broad Effect catch handler.',
    },
    url: 'https://github.com/K-Mistele/anti-slop/blob/main/src/effect/rules/prefer-tagged-error-handling.ts',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      taggedSubject(imports, node).pipe(
        Opt.filter(() => isInsideBroadEffectHandler(node)),
        Opt.match({
          onNone: () => Effect.void,
          onSome: (subject) =>
            ctx.report(
              Diagnostic.fromId({ node, messageId: isReasonMember(subject) ? 'taggedReason' : 'taggedError' }),
            ),
        }),
      ),
    );
  },
});
