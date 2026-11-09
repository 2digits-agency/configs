import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import { callbackCall, isFunctionNode, isSomeSame, parentOf } from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

const CatchMethod = Schema.Literals([
  ...(['catch', 'catchIf', 'catchTag', 'orElseSucceed'] satisfies ReadonlyArray<keyof typeof Effect>),
  // Effect v3 names, which the current Effect types no longer export.
  'catchAll',
  'catchAllCause',
  'catchSome',
  'catchSomeCause',
  'orElse',
  'orElseFail',
]);

const isCatchMethod = Schema.is(CatchMethod);

const LogMethod = Schema.Literals([
  'log',
  'logDebug',
  'logError',
  'logInfo',
  'logTrace',
  'logWarning',
] satisfies ReadonlyArray<keyof typeof Effect>);

const isLogMethod = Schema.is(LogMethod);

/**
 * The `Effect` member a path names when it passes `isMember`, such as `catchTag` for `['Effect', 'catchTag']`.
 *
 * @param path Module path.
 * @param isMember Member test.
 */
function effectMember(
  path: Opt.Option<ReadonlyArray<string>>,
  isMember: (name: unknown) => boolean,
): Opt.Option<string> {
  return Opt.flatMap(
    Opt.filter(path, ([namespace, member]) => namespace === 'Effect' && isMember(member)),
    ([, member]) => Opt.fromNullishOr(member),
  );
}

/**
 * The catch method of the nearest enclosing function passed as the last argument of an Effect recovery API.
 *
 * @param node Node inside the handler.
 * @param imports Import bindings of the file.
 */
function catchMethod(node: ESTree.Node, imports: ImportBindings): Opt.Option<string> {
  return Opt.flatMap(parentOf(node), (parent) => {
    const method = isFunctionNode(parent)
      ? Opt.flatMap(
          Opt.filter(callbackCall(parent), (call) => isSomeSame<ESTree.Node>(Arr.last(call.arguments), parent)),
          (call) => effectMember(imports.path(call.callee), isCatchMethod),
        )
      : Opt.none();

    return Opt.orElse(method, () => catchMethod(parent, imports));
  });
}

export const noLoggingInCatch: CreateRule = Rule.define({
  name: 'no-logging-in-catch',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Keep logging separate from Effect recovery handlers.',
    messages: { logging: 'Move {{logger}} out of Effect.{{catchMethod}} and use Effect.tapError before recovery.' },
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) => {
      const path = imports.path(node.callee);

      return Opt.match(
        Opt.zipWith(effectMember(path, isLogMethod), catchMethod(node, imports), (_, method) => method),
        {
          onNone: () => Effect.void,
          onSome: (method) =>
            ctx.report(
              Diagnostic.fromId({
                node,
                messageId: 'logging',
                data: {
                  logger: Arr.join(
                    Opt.getOrElse(path, () => []),
                    '.',
                  ),
                  catchMethod: method,
                },
              }),
            ),
        },
      );
    });
  },
});
