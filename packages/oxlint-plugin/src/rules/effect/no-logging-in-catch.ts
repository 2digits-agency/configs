import type { ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import type * as Effect from 'effect/Effect';

import { callbackCall, canonicalPath, defineEffectRule, isFunctionNode, ruleMeta, type FileState } from '../../utils';

const catchMethods: ReadonlySet<string> = new Set([
  ...(['catch', 'catchIf', 'catchTag', 'orElseSucceed'] satisfies ReadonlyArray<keyof typeof Effect>),
  // Effect v3 names, which the current Effect types no longer export.
  'catchAll',
  'catchAllCause',
  'catchSome',
  'catchSomeCause',
  'orElse',
  'orElseFail',
]);

const logMethods: ReadonlySet<string> = new Set([
  'log',
  'logDebug',
  'logError',
  'logInfo',
  'logTrace',
  'logWarning',
] satisfies ReadonlyArray<keyof typeof Effect>);

function catchCallback(node: ESTree.Node, state: FileState): { readonly method: string } | undefined {
  let parent = node.parent;

  while (parent) {
    if (isFunctionNode(parent)) {
      const call = callbackCall(parent);

      if (call?.arguments.at(-1) === parent) {
        const path = canonicalPath(call.callee, state);

        const method = path?.[1];

        if (method !== undefined && path?.[0] === 'Effect' && catchMethods.has(method)) {
          return { method };
        }
      }
    }

    parent = parent.parent;
  }

  return undefined;
}

export const noLoggingInCatch: Rule = defineEffectRule(
  ruleMeta('suggestion', 'Keep logging separate from Effect recovery handlers.', {
    logging: 'Move {{logger}} out of Effect.{{catchMethod}} and use Effect.tapError before recovery.',
  }),
  (context, getState) => ({
    CallExpression(node) {
      const state = getState();

      const path = canonicalPath(node.callee, state);

      const logger =
        path?.[1] !== undefined && path[0] === 'Effect' && logMethods.has(path[1]) ? Arr.join(path, '.') : undefined;

      if (logger === undefined) {
        return;
      }

      const callback = catchCallback(node, state);

      if (callback !== undefined) {
        context.report({
          node,
          messageId: 'logging',
          data: { logger, catchMethod: callback.method },
        });
      }
    },
  }),
);
