import type { Rule } from '@oxlint/plugins';

import { argumentAt, defineEffectRule, objectProperty, ruleMeta } from '../../utils';
import { isCloudflareWorker } from './utils';

export const alchemyNoV1WorkerProperties: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow Alchemy v1 Cloudflare Worker property names.',
    {
      property: 'Cloudflare.Worker {{old}} was replaced in v2. Use {{replacement}}.',
    },
    'https://alchemy.run/migrating-from-v1',
  ),
  (context, getState) => ({
    CallExpression(node) {
      if (!isCloudflareWorker(node.callee, getState())) {
        return;
      }

      const options = argumentAt(node, 1);

      if (options?.type !== 'ObjectExpression') {
        return;
      }

      for (const [old, replacement] of [
        ['entrypoint', 'main'],
        ['bindings', 'env'],
      ] as const) {
        const property = objectProperty(options, old);

        if (property !== undefined) {
          context.report({ node: property, messageId: 'property', data: { old, replacement } });
        }
      }
    },
  }),
);
