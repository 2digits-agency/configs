import type { Rule } from '@oxlint/plugins';
import type * as Effect from 'effect/Effect';

import {
  argumentAt,
  canonicalPath,
  defineEffectRule,
  functionUsesFirstParameter,
  isFunctionNode,
  ruleMeta,
} from '../../utils';

// Effect mask APIs, keyed by member, with the equivalent API to use when `restore` is unused.
const maskReplacements: ReadonlyMap<string, string> = new Map<keyof typeof Effect, keyof typeof Effect>([
  ['interruptibleMask', 'interruptible'],
  ['uninterruptibleMask', 'uninterruptible'],
]);

export const preferUninterruptible: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer the non-mask interruptibility API when the restore callback is unused.',
    {
      unusedRestore:
        'The mask callback never uses restore, so the mask is equivalent to {{replacement}} and misleadingly suggests a restored region.',
    },
    'https://github.com/Effect-TS/tsgo/issues/659',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const path = canonicalPath(node.callee, getState());

      const method = path?.length === 2 && path[0] === 'Effect' ? maskReplacements.get(path[1] ?? '') : undefined;

      const callback = argumentAt(node, 0);

      if (
        method !== undefined &&
        callback !== undefined &&
        isFunctionNode(callback) &&
        !functionUsesFirstParameter(callback)
      ) {
        context.report({
          node,
          messageId: 'unusedRestore',
          data: { replacement: `Effect.${method}` },
        });
      }
    },
  }),
);
