import { Visitor, type ESTree, type RuleContext } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Str from 'effect/String';

import { isStringLiteral } from '../../../internal/ast';

/**
 * The npm package an import source names, such as `@scope/name` for `@scope/name/sub` and `name` for `name/sub`.
 *
 * @param source Import source.
 */
export function packageName(source: string): string {
  const [first, second] = Str.split(source, '/');

  return second !== undefined && Str.startsWith('@')(first) ? `${first}/${second}` : first;
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
    Visitor.on('ImportDeclaration', (node) =>
      node.importKind === 'type' ? Effect.void : check(node.source, Opt.some(node)),
    ),
    Visitor.on('ImportExpression', ({ source }) => (isStringLiteral(source) ? check(source, Opt.none()) : Effect.void)),
  );
}
