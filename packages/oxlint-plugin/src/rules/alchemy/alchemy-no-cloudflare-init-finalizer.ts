import type { Rule } from '@oxlint/plugins';

import { defineEffectRule, isApi, ruleMeta } from '../../utils';
import { containingEffectGen, containingWorker } from './utils';

export const alchemyNoCloudflareInitFinalizer: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow finalizers in Cloudflare Worker initialization, where workerd never runs them.',
    {
      finalizer:
        'A Cloudflare Worker init finalizer never runs because workerd has no isolate teardown hook. Acquire disposable resources inside an event handler.',
    },
    'https://alchemy.run/cloudflare/compute/workers',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const state = getState();

      if (!isApi(node.callee, state, 'Effect', 'addFinalizer')) {
        return;
      }

      const program = containingEffectGen(node, state);

      if (program !== undefined && containingWorker(program, state)?.arguments.includes(program)) {
        context.report({ node, messageId: 'finalizer' });
      }
    },
  }),
);
