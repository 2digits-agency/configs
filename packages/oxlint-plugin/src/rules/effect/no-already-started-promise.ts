import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as HashSet from 'effect/HashSet';
import * as Opt from 'effect/Option';
import * as Ref from 'effect/Ref';

import { argumentAt } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { functionResult, promiseInitializer, promiseThunkArgument } from './internal/callbacks';

export const noAlreadyStartedPromise = Rule.define({
  name: 'no-already-started-promise',
  meta: ruleMeta({
    type: 'problem',
    description:
      'Ensure Effect Promise thunks start fresh asynchronous work rather than reusing an already-started Promise.',
    messages: {
      prestarted:
        'This thunk returns an already-started Promise. Start the asynchronous work inside the thunk so retries and repeats run it again.',
    },
    url: 'https://github.com/Effect-TS/tsgo/issues/475',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    const prestartedPromises = yield* Ref.make(HashSet.empty<string>());

    return Visitor.merge(
      Visitor.on('VariableDeclarator', (node) =>
        node.id.type === 'Identifier' && node.init && promiseInitializer(node.init)
          ? Ref.update(prestartedPromises, HashSet.add(node.id.name))
          : Effect.void,
      ),
      Visitor.on('CallExpression', (node) =>
        Effect.gen(function* () {
          if (
            !imports.isApi(node.callee, 'Effect', ['promise', 'tryPromise'] satisfies ReadonlyArray<
              keyof typeof Effect
            >)
          ) {
            return;
          }

          const result = Opt.flatMap(promiseThunkArgument(argumentAt(node, 0)), functionResult);

          if (Opt.isNone(result) || result.value.type !== 'Identifier') {
            return;
          }

          const names = yield* Ref.get(prestartedPromises);

          if (HashSet.has(names, result.value.name)) {
            yield* ctx.report(Diagnostic.fromId({ node: result.value, messageId: 'prestarted' }));
          }
        }),
      ),
    );
  },
});
