import { anyOf, createRegExp, digit, letter, oneOrMore } from 'magic-regexp';
import { match, P } from 'ts-pattern';

import { createEslintRule } from '../utils';

const PrefixRegex = createRegExp(anyOf('T', '$').at.lineStart());
const InitialRegex = createRegExp(anyOf('T', '$').at.lineStart(), letter.uppercase);
const RemainderRegex = createRegExp(anyOf('T', '$').at.lineStart(), letter.uppercase, oneOrMore(letter));
const TypeParamRegex = createRegExp(
  anyOf('T', '$').at.lineStart(),
  letter.uppercase,
  oneOrMore(letter),
  digit.times.any().at.lineEnd(),
);

type MessageId = (typeof MessageId)[keyof typeof MessageId];
const MessageId = {
  prefix: 'prefix',
  initial: 'initial',
  remainder: 'remainder',
  regex: 'regex',
} as const;

export const RULE_NAME = 'type-param-names';

export const typeParamNames = createEslintRule<[], MessageId>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce giving proper names to type parameters when there are two or more',
    },
    schema: [],
    messages: {
      prefix: 'Type parameter {{name}} should have a prefix of "T" or "$"',
      initial: "Type parameter {{name}}'s name should start with an uppercase letter",
      remainder: "Type parameter {{name}}'s name should contain at least one lowercase letter",
      regex: 'Type parameter {{name}} should match the regex {{regex}}',
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
            context.report({
              node: param,
              messageId,
              data: { name },
            });
          }
        }
      },
    };
  },
});

const typeParamSelect = P.string.regex(TypeParamRegex);
const prefixSelect = P.not(P.string.regex(PrefixRegex));
const initialSelect = P.not(P.string.regex(InitialRegex));
const remainderSelect = P.not(P.string.regex(RemainderRegex));

function getMessageId(name: string) {
  return match(name)
    .with(typeParamSelect, () => false as const)
    .with(prefixSelect, () => MessageId.prefix)
    .with(initialSelect, () => MessageId.initial)
    .with(remainderSelect, () => MessageId.remainder)
    .otherwise(() => false as const);
}
