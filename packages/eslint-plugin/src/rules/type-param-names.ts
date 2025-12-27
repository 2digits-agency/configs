import { createRule } from '../utils';

const VALID_TYPE_PARAM = /^[T$][A-Z][a-z]+\d*$/;
const HAS_PREFIX = /^[T$]/;
const HAS_INITIAL = /^[T$][A-Z]/;
const HAS_REMAINDER = /^[T$][A-Z][a-z]/;

type MessageId = (typeof MessageId)[keyof typeof MessageId];
const MessageId = {
  prefix: 'prefix',
  initial: 'initial',
  remainder: 'remainder',
  suggestRename: 'suggestRename',
} as const;

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
  },
  defaultOptions: [],
  create(context) {
    return {
      TSTypeParameterDeclaration(node) {
        const { params } = node;

        if (params.length === 1 && params.at(0)?.name.name === 'T') {
          return;
        }

        for (const param of params) {
          const { name } = param.name;
          const messageId = getMessageId(name);

          if (messageId) {
            const suggestion = getSuggestion(name);

            context.report({
              node: param,
              messageId,
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
        }
      },
    };
  },
});

function getMessageId(name: string): MessageId | undefined {
  if (VALID_TYPE_PARAM.test(name)) {
    return undefined;
  }

  if (!HAS_PREFIX.test(name)) {
    return MessageId.prefix;
  }

  if (!HAS_INITIAL.test(name)) {
    return MessageId.initial;
  }

  if (!HAS_REMAINDER.test(name)) {
    return MessageId.remainder;
  }

  return undefined;
}

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
