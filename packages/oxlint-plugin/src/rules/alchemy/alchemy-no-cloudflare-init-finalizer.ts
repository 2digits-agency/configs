import { Diagnostic, RuleContext, Visitor, type CreateRule } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { containsSame } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';
import { containingEffectGen, containingWorker } from './internal/worker';

export const alchemyNoCloudflareInitFinalizer: CreateRule = defineRule({
  name: 'alchemy-no-cloudflare-init-finalizer',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow finalizers in Cloudflare Worker initialization, where workerd never runs them.',
    messages: {
      finalizer:
        'A Cloudflare Worker init finalizer never runs because workerd has no isolate teardown hook. Acquire disposable resources inside an event handler.',
    },
    url: 'https://alchemy.run/cloudflare/compute/workers',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      imports.isApi(node.callee, 'Effect', 'addFinalizer' satisfies keyof typeof Effect) &&
      Opt.exists(containingEffectGen(node, imports), (program) =>
        Opt.exists(containingWorker(program, imports), (worker) => containsSame(worker.arguments, program)),
      )
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'finalizer' }))
        : Effect.void,
    );
  },
});
