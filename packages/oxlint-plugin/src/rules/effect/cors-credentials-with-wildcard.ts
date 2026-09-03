import type { ESTree, Rule } from '@oxlint/plugins';

import { defineEffectRule, isApi, isLiteral, objectProperty, ruleMeta, unwrapExpression } from '../../utils';
import { objectArgument } from './utils';

function wildcardOrigins(node: ESTree.Expression): boolean {
  const origins = unwrapExpression(node);

  if (isLiteral(origins, '*')) {
    return true;
  }

  return (
    origins.type === 'ArrayExpression' &&
    (origins.elements.length === 0 ||
      origins.elements.some((element) => {
        if (!element || element.type === 'SpreadElement') {
          return false;
        }

        return isLiteral(element, '*');
      }))
  );
}

export const corsCredentialsWithWildcard: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow credentialed CORS with wildcard origins because browsers reject that combination.',
    {
      wildcard:
        'Credentialed CORS cannot use a wildcard origin. Set allowedOrigins to explicit trusted origins or disable credentials.',
    },
    'https://github.com/Effect-TS/tsgo/issues/400',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const state = getState();

      if (
        !isApi(node.callee, state, 'HttpMiddleware', 'cors') &&
        !isApi(node.callee, state, 'HttpRouter', 'cors') &&
        !isApi(node.callee, state, 'HttpApiBuilder', 'middlewareCors')
      ) {
        return;
      }

      const options = objectArgument(node);

      if (options === undefined || !isLiteral(objectProperty(options, 'credentials')?.value ?? options, true)) {
        return;
      }

      const origins = objectProperty(options, 'allowedOrigins');

      if (origins === undefined || wildcardOrigins(origins.value)) {
        context.report({ node, messageId: 'wildcard' });
      }
    },
  }),
);
