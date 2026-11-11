import type { ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import type * as Effect from 'effect/Effect';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Tuple from 'effect/Tuple';

import {
  callbackCall,
  containsSame,
  enclosingFunction,
  isEqualityOperator,
  isStringLiteral,
  parentOfType,
  staticPropertyName,
} from '../../../internal/ast';

// `catchAll` is the Effect v3 name, which the current Effect types no longer export.
const BroadCatchName = Schema.Literals([
  'catch' satisfies keyof typeof Effect,
  'catchAll',
  'catchIf' satisfies keyof typeof Effect,
]);

const MatchPatternName = Schema.Literals(['when', 'not'] satisfies ReadonlyArray<keyof typeof Match>);

function staticMemberOf(object: string, isName: (name: string) => boolean) {
  return Match.type<ESTree.Expression>().pipe(
    Match.when(
      {
        type: 'MemberExpression',
        computed: false,
        object: { type: 'Identifier', name: object },
        property: { type: 'Identifier', name: isName },
      },
      Fn.constTrue,
    ),
    Match.orElse(Fn.constFalse),
  );
}

const isBroadEffectCatchCallee = staticMemberOf('Effect', Schema.is(BroadCatchName));

const isMatchPatternCallee = staticMemberOf('Match', Schema.is(MatchPatternName));

const tagDiscriminant: ReadonlySet<string> = new Set(['_tag']);

/**
 * Recognize static access to a discriminant such as `_tag`, including bracket notation.
 *
 * @param node - Candidate syntax node.
 * @param discriminants - Accepted property names.
 */
export function isDiscriminantMember(
  node: ESTree.Node,
  discriminants: ReadonlySet<string> = tagDiscriminant,
): node is ESTree.MemberExpression {
  return node.type === 'MemberExpression' && Opt.exists(staticPropertyName(node), (name) => discriminants.has(name));
}

/**
 * The discriminant member in a literal equality or inequality comparison, such as `value._tag === 'A'`.
 *
 * @param node - Comparison to inspect.
 * @param discriminants - Accepted property names.
 */
export function discriminantFromComparison(
  node: ESTree.BinaryExpression,
  discriminants: ReadonlySet<string> = tagDiscriminant,
): Opt.Option<ESTree.MemberExpression> {
  if (!isEqualityOperator(node.operator)) {
    return Opt.none();
  }

  return Arr.findFirst(
    [Tuple.make(node.left, node.right), Tuple.make(node.right, node.left)],
    ([member, literal]) => isDiscriminantMember(member, discriminants) && isStringLiteral(literal),
  ).pipe(Opt.map(([member]) => member as ESTree.MemberExpression));
}

/**
 * Whether the nearest enclosing callback is passed to a broad Effect catch handler; nested functions are not.
 *
 * @param node - Node whose enclosing callback is inspected.
 */
export function isInsideBroadEffectHandler(node: ESTree.Node): boolean {
  return enclosingFunction(node).pipe(
    Opt.flatMap(callbackCall),
    Opt.exists((call) => isBroadEffectCatchCallee(call.callee)),
  );
}

/**
 * Distinguish nested error `reason._tag` from the outer error tag.
 *
 * @param node - Tag member to inspect.
 */
export function isReasonTagMember(node: ESTree.MemberExpression): boolean {
  return node.object.type === 'MemberExpression' && Opt.contains(staticPropertyName(node.object), 'reason');
}

/**
 * Literal objects passed directly to Match.when/not are patterns, not construction.
 *
 * @param node - Object whose direct call argument position is inspected.
 */
export function isMatchPatternObject(node: ESTree.ObjectExpression): boolean {
  return Opt.exists(
    parentOfType(node, 'CallExpression'),
    (call) => containsSame<ESTree.Node>(call.arguments, node) && isMatchPatternCallee(call.callee),
  );
}
