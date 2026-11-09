import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { containingEffectGen, containingHandler, containingWorker } from './internal/worker';

export const alchemyNoRuntimeConfig: CreateRule = Rule.define({
  name: 'alchemy-no-runtime-config',
  meta: ruleMeta({
    type: 'problem',
    description: 'Require Effect Config values to be resolved during Alchemy Worker initialization.',
    messages: {
      runtime:
        'Config resolved inside the {{handler}} handler is invisible to Alchemy deployment. Resolve it in Worker init and close over the value, or put it in env.',
    },
    url: 'https://alchemy.run/environments/secrets',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('YieldExpression', (node) => {
      const argument = node.argument;

      if (
        argument?.type !== 'CallExpression' ||
        !Opt.exists(imports.path(argument.callee), ([module]) => module === 'Config')
      ) {
        return Effect.void;
      }

      const handler = Opt.flatMap(containingEffectGen(node, imports), (program) =>
        Opt.filter(containingHandler(program), () => Opt.isSome(containingWorker(program, imports))),
      );

      return Opt.match(handler, {
        onNone: () => Effect.void,
        onSome: (name) =>
          ctx.report(Diagnostic.fromId({ node: argument, messageId: 'runtime', data: { handler: name } })),
      });
    });
  },
});
