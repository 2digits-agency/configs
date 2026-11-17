import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { findAncestor, isSomeSame, parentOf, parentOfType, propertyName } from '../../internal/ast';
import { isDeclarationFilename } from '../../internal/files';
import { ruleMeta } from '../../internal/meta';
import { UnionFilterName } from '../../schemas/names';

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

const isUnionFilterName = Schema.is(UnionFilterName);

/**
 * The outermost type that `node` is a member of through unions and parentheses, such as the whole `{ _tag: 'A' } | {
 * _tag: 'B' }`.
 *
 * @param node Type literal.
 */
function outermostUnionMember(node: ESTree.Node): ESTree.Node {
  return Opt.match(
    Opt.filter(parentOf(node), (parent) => parent.type === 'TSUnionType' || parent.type === 'TSParenthesizedType'),
    { onNone: () => node, onSome: outermostUnionMember },
  );
}

/**
 * Whether a type literal is the filter of `Extract<Union, { _tag: 'A' }>` or `Exclude<…>`, which selects members of an
 * existing union instead of declaring a tagged type.
 *
 * @param node Type literal holding the `_tag` member.
 */
function isUnionFilter(node: ESTree.Node): boolean {
  const filter = outermostUnionMember(node);

  return parentOfType(filter, 'TSTypeParameterInstantiation').pipe(
    Opt.filter((instantiation) => isSomeSame<ESTree.Node>(Arr.get(instantiation.params, 1), filter)),
    Opt.flatMap((instantiation) => parentOfType(instantiation, 'TSTypeReference')),
    Opt.exists(({ typeName }) => typeName.type === 'Identifier' && isUnionFilterName(typeName.name)),
  );
}

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
      !isUnionFilter(node.parent) &&
      Opt.isNone(findAncestor(node, isDeclareBlock))
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'manualTaggedType' }))
        : Effect.void,
    );
  },
});
