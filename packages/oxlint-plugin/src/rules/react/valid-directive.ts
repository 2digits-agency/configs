import type { Rule } from '@oxlint/plugins';

import { defineSyntaxRule, ruleMeta } from '../../utils';

// Anything that reads like `use client`, `use server` or `use cache`, in any case or spacing.
const directiveLike = /^\s*use[\s_-]*(?:client|server|cache)\b/iu;

const exactDirective = /^use (?:client|server|cache(?:: [\w-]+)?)$/u;

export const validDirective: Rule = defineSyntaxRule(
  ruleMeta(
    'problem',
    "Disallow misspelled 'use client', 'use server' and 'use cache' directives, which do nothing.",
    {
      invalidDirective:
        "'{{directive}}' is not a valid directive, so it does nothing. Directives are case- and whitespace-sensitive: write 'use client', 'use server' or 'use cache'.",
    },
    'https://react.dev/reference/rsc/directives',
  ),
  (context) => ({
    ExpressionStatement(node) {
      const { directive } = node;

      if (typeof directive !== 'string' || exactDirective.test(directive) || !directiveLike.test(directive)) {
        return;
      }

      context.report({ node, messageId: 'invalidDirective', data: { directive } });
    },
  }),
);
