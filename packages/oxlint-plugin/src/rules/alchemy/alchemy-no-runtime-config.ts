import type { Rule } from '@oxlint/plugins';

import { canonicalPath, defineEffectRule, ruleMeta } from '../../utils';
import { containingEffectGen, containingHandler, containingWorker } from './utils';

export const alchemyNoRuntimeConfig: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Require Effect Config values to be resolved during Alchemy Worker initialization.',
    {
      runtime:
        'Config resolved inside the {{handler}} handler is invisible to Alchemy deployment. Resolve it in Worker init and close over the value, or put it in env.',
    },
    'https://alchemy.run/environments/secrets',
  ),
  (context, getState) => ({
    YieldExpression(node) {
      const state = getState();
      const argument = node.argument;

      if (argument?.type !== 'CallExpression' || canonicalPath(argument.callee, state)?.[0] !== 'Config') {
        return;
      }

      const program = containingEffectGen(node, state);
      const handler = program === undefined ? undefined : containingHandler(program);

      if (program !== undefined && handler !== undefined && containingWorker(program, state) !== undefined) {
        context.report({ node: argument, messageId: 'runtime', data: { handler } });
      }
    },
  }),
);
