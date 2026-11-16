import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Str from 'effect/String';

import { findAncestor, propertyName } from '../../internal/ast';
import { isDeclarationFilename } from '../../internal/files';
import { ruleMeta } from '../../internal/meta';

/**
 * Whether a type names concrete tags: a string literal such as `'Ready'`, or a union of them. `string`, type parameters
 * and other references describe any tagged value, which no constructor defines.
 */
const isLiteralTagType: (node: ESTree.TSType) => boolean = Match.type<ESTree.TSType>().pipe(
  Match.when({ type: 'TSLiteralType', literal: { type: 'Literal', value: Str.isString } }, Fn.constTrue),
  Match.when({ type: 'TSParenthesizedType' }, ({ typeAnnotation }) => isLiteralTagType(typeAnnotation)),
  Match.when({ type: 'TSUnionType' }, ({ types }) => Arr.every(types, isLiteralTagType)),
  Match.orElse(Fn.constFalse),
);

/**
 * Whether a node is a `declare module`, `declare global` or `declare namespace` block.
 *
 * @param node Ancestor.
 */
function isDeclareBlock(node: ESTree.Node): node is ESTree.TSModuleDeclaration {
  return node.type === 'TSModuleDeclaration' && node.declare;
}

/**
 * Prefer tagged types inferred from a tagged Schema or Data constructor to `_tag` written in a type.
 */
export const noManualTaggedType = Rule.define({
  name: 'no-manual-tagged-type',
  meta: ruleMeta({
    type: 'problem',
    description: 'Derive tagged types from a tagged Schema or Data constructor instead of declaring `_tag` in a type.',
    messages: {
      manualTaggedType:
        'Do not declare `_tag` by hand. Define the value with Schema.TaggedStruct, Schema.TaggedClass, Schema.TaggedError, Schema.TaggedUnion, Data.TaggedClass or Data.taggedEnum, then infer the type from it, such as `type X = typeof X.Type`.',
    },
    url: 'https://github.com/K-Mistele/anti-slop/blob/main/src/effect/rules/no-manual-tagged-type.ts',
  }),
  *create() {
    const ctx = yield* RuleContext;

    // Declaration files and `declare` blocks describe values defined elsewhere, such as another package's types.
    if (isDeclarationFilename(ctx.filename)) {
      return {};
    }

    return Visitor.on('TSPropertySignature', (node) =>
      Opt.contains(propertyName(node), '_tag') &&
      P.isNotNull(node.typeAnnotation) &&
      isLiteralTagType(node.typeAnnotation.typeAnnotation) &&
      Opt.isNone(findAncestor(node, isDeclareBlock))
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'manualTaggedType' }))
        : Effect.void,
    );
  },
});
