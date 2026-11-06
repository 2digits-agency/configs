import { createRule } from '../utils';

const HAS_PREFIX = /^[T$]/;

// Checked in order; the first failing pattern is reported.
const NAME_CHECKS = [
  { pattern: HAS_PREFIX, messageId: 'prefix' },
  { pattern: /^[T$][A-Z]/, messageId: 'initial' },
  { pattern: /^[T$][A-Z][a-z]/, messageId: 'remainder' },
] as const;

type MessageId = (typeof NAME_CHECKS)[number]['messageId'] | 'suggestRename';

export const RULE_NAME = 'type-param-names';

export const typeParamNames = createRule<[], MessageId>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce giving proper names to type parameters when there are two or more',
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      prefix: 'Type parameter {{name}} should have a prefix of "T" or "$"',
      initial: "Type parameter {{name}}'s name should start with an uppercase letter",
      remainder: "Type parameter {{name}}'s name should contain at least one lowercase letter",
      suggestRename: 'Rename to {{suggestion}}',
    },
    defaultOptions: [],
  },
  create(context) {
    return {
      TSTypeParameterDeclaration(node) {
        const { params } = node;

        if (params.length === 1 && params[0]?.name.name === 'T') {
          return;
        }

        for (const param of params) {
          const {
            name: { name },
          } = param;

          const failed = NAME_CHECKS.find(({ pattern }) => !pattern.test(name));

          if (!failed) {
            continue;
          }

          const suggestion = getSuggestion(name);

          context.report({
            node: param,
            messageId: failed.messageId,
            data: { name },
            suggest: [
              {
                messageId: 'suggestRename',
                data: { suggestion },
                fix(fixer) {
                  return fixer.replaceText(param.name, suggestion);
                },
              },
            ],
          });
        }
      },
    };
  },
});

function getSuggestion(name: string): string {
  if (!HAS_PREFIX.test(name)) {
    const capitalized = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    return `T${capitalized}`;
  }

  const prefix = name.charAt(0);

  const rest = name.slice(1);

  if (rest.length === 0) {
    return `${prefix}Value`;
  }

  const fixed = rest.charAt(0).toUpperCase() + (rest.length > 1 ? rest.slice(1).toLowerCase() : 'a');

  return `${prefix}${fixed}`;
}
