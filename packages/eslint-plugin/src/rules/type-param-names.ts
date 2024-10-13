import { anyOf, createRegExp, digit, letter, oneOrMore } from 'magic-regexp';
import { match, P } from 'ts-pattern';

import { createEslintRule } from '../utils';

const prefix = anyOf('T', '$').at.lineStart();
const initial = letter.uppercase;
const remainder = oneOrMore(letter);
const digits = digit.times.any().at.lineEnd();

const PrefixRegex = createRegExp(prefix);
const InitialRegex = createRegExp(prefix, initial);
const RemainderRegex = createRegExp(prefix, initial, remainder);
const TypeParamRegex = createRegExp(prefix, initial, remainder, digits);

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

          const messageId = match(name)
            .with(P.string.regex(TypeParamRegex), () => false as const)
            .with(P.not(P.string.regex(PrefixRegex)), () => MessageId.prefix)
            .with(P.not(P.string.regex(InitialRegex)), () => MessageId.initial)
            .with(P.not(P.string.regex(RemainderRegex)), () => MessageId.remainder)
            .otherwise(() => false as const);

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
