import { anyOf, createRegExp, digit, letter, oneOrMore } from 'magic-regexp';
import { match, P } from 'ts-pattern';

import { createRule } from '../utils';

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

export default createRule<[], MessageId>({
  name: __filename,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce giving proper names to generic parameters when there are two or more',
      recommended: 'error',
    },
    schema: [],
    messages: {
      prefix: 'Generic parameter {{name}} should have a prefix of "T" or "$"',
      initial: "Generic parameter {{name}}'s name should start with an uppercase letter",
      remainder: "Generic parameter {{name}}'s name should contain at least one lowercase letter",
      regex: 'Generic parameter {{name}} should match the regex {{regex}}',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      TSTypeParameterDeclaration(node) {
        const { params } = node;

        if (params.length === 1 && params.at(0)?.name.name === 'T') return;

        for (const param of params) {
          const { name } = param.name;

          const messageId = match(name)
            .with(P.string.regex(TypeParamRegex), () => false as const)
            .with(P.string.regex(RemainderRegex), () => MessageId.remainder)
            .with(P.not(P.string.regex(PrefixRegex)), () => MessageId.prefix)
            .with(P.not(P.string.regex(InitialRegex)), () => MessageId.initial)
            .otherwise(() => false as const);

          messageId &&
            context.report({
              node: param,
              messageId,
              data: { name },
            });
        }
      },
    };
  },
});
