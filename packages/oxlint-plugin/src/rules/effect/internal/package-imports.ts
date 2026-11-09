import { Visitor, type ESTree, type RuleContext } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Str from 'effect/String';

import { isStringLiteral } from '../../../internal/ast';

/**
 * The npm package an import source names, such as `@scope/name` for `@scope/name/sub` and `name` for `name/sub`.
 *
 * @param source Import source.
 */
export function packageName(source: string): string {
  const [first, second] = Str.split(source, '/');

  return P.isNotUndefined(second) && Str.startsWith('@')(first) ? `${first}/${second}` : first;
}

/**
 * Whether an import declaration only imports types: `import type …`, or `import { type A, type B } …`. A side-effect
 * import such as `import 'polyfill'` loads the module, so it is not type-only.
 *
 * @param declaration Import declaration.
 */
function isTypeOnly(declaration: ESTree.ImportDeclaration): boolean {
  return (
    declaration.importKind === 'type' ||
    (Arr.isReadonlyArrayNonEmpty(declaration.specifiers) &&
      Arr.every(
        declaration.specifiers,
        (specifier) => specifier.type === 'ImportSpecifier' && specifier.importKind === 'type',
      ))
  );
}

/**
 * Visit the source of every runtime import: value import declarations and `import()` with a string literal. The
 * declaration is none for `import()`.
 *
 * @param check Handler for one import source.
 */
export function onRuntimeImport(
  check: (
    source: ESTree.StringLiteral,
    declaration: Opt.Option<ESTree.ImportDeclaration>,
  ) => Effect.Effect<void, never, RuleContext>,
): Visitor.EffectVisitor {
  return Visitor.merge(
    Visitor.on('ImportDeclaration', (node) => (isTypeOnly(node) ? Effect.void : check(node.source, Opt.some(node)))),
    Visitor.on('ImportExpression', ({ source }) => (isStringLiteral(source) ? check(source, Opt.none()) : Effect.void)),
  );
}
