import { createRule } from '../utils';

type MessageId = 'invalidDirective' | 'replaceDirective';

export const RULE_NAME = 'valid-directive';

// Anything that reads like `use client`, `use server` or `use cache`, in any case or spacing.
const DIRECTIVE_LIKE = /^\s*use[\s_-]*(?<keyword>client|server|cache)\b(?<rest>.*)$/isu;

const VALID_DIRECTIVE = /^use (?:client|server|cache(?:: [\w-]+)?)$/u;

const TRAILING_NOISE = /^[\s;]*$/u;

const CACHE_KIND = /^\s*:\s*(?<kind>[\w-]+)[\s;]*$/u;

export const validDirective = createRule<[], MessageId>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: "Disallow misspelled 'use client', 'use server' and 'use cache' directives, which do nothing",
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      invalidDirective:
        "'{{directive}}' is not a valid directive, so it does nothing. Directives are case- and whitespace-sensitive: write 'use client', 'use server' or 'use cache'.",
      replaceDirective: "Replace with '{{suggestion}}'.",
    },
    defaultOptions: [],
  },
  create(context) {
    return {
      ExpressionStatement(node) {
        const { directive, expression } = node;

        if (directive === undefined || VALID_DIRECTIVE.test(directive)) {
          return;
        }

        const groups = DIRECTIVE_LIKE.exec(directive)?.groups;

        if (groups?.keyword === undefined || groups.rest === undefined) {
          return;
        }

        const suggestion = getSuggestion(groups.keyword.toLowerCase(), groups.rest);

        const quote = context.sourceCode.getText(expression).at(0) ?? "'";

        context.report({
          node,
          messageId: 'invalidDirective',
          data: { directive },
          suggest:
            suggestion === undefined
              ? []
              : [
                  {
                    messageId: 'replaceDirective',
                    data: { suggestion },
                    fix: (fixer) => fixer.replaceText(expression, `${quote}${suggestion}${quote}`),
                  },
                ],
        });
      },
    };
  },
});

function getSuggestion(keyword: string, rest: string): string | undefined {
  if (TRAILING_NOISE.test(rest)) {
    return `use ${keyword}`;
  }

  const kind = keyword === 'cache' ? CACHE_KIND.exec(rest)?.groups?.kind : undefined;

  return kind === undefined ? undefined : `use cache: ${kind}`;
}
