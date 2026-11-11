import {
  RuleContext,
  Scope,
  SourceCode,
  type Definition,
  type ESTree,
  type OxlintScope,
  type OxlintSourceCode,
  type Variable,
} from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { staticPath } from './ast';

/**
 * Resolve a name synchronously from the scope at `node` outwards, for use inside tree walks.
 *
 * @param sourceCode Source of the file.
 * @param node Lookup site.
 * @param name Local binding name.
 */
export function lookupVariable(sourceCode: OxlintSourceCode, node: ESTree.Node, name: string): Opt.Option<Variable> {
  return Scope.findVariableUp(sourceCode.getScope(node), name);
}

/**
 * Resolve a name from the scope at `node` outwards, so local shadowing wins over imports and globals.
 *
 * @param node Lookup site.
 * @param name Local binding name.
 */
export function resolveVariable(
  node: ESTree.Node,
  name: string,
): Effect.Effect<Opt.Option<Variable>, never, RuleContext> {
  return Effect.map(SourceCode.getScope(node), Scope.findVariableUp(name));
}

/**
 * The only definition of a variable, or none when it is redeclared or unresolved.
 *
 * @param variable Resolved variable.
 */
export function soleDefinition(variable: Opt.Option<Variable>): Opt.Option<Definition> {
  return variable.pipe(
    Opt.filter(({ defs }) => defs.length === 1),
    Opt.flatMap(({ defs }) => Arr.head(defs)),
  );
}

/**
 * Whether `node` names the global `name` as seen from `scope`. Globals from `env` or `globals` config resolve to a
 * variable without definitions, so only a declaration in the file shadows them.
 *
 * @param scope Scope of the reference.
 * @param node Reference.
 * @param name Global name.
 */
export function isGlobalIn(scope: OxlintScope, node: ESTree.Node, name: string): boolean {
  return (
    node.type === 'Identifier' &&
    node.name === name &&
    !Opt.exists(Scope.findVariableUp(scope, name), ({ defs }) => Arr.isArrayNonEmpty(defs))
  );
}

/**
 * Whether `node` names the global `name`; see `isGlobalIn`.
 *
 * @param node Reference.
 * @param name Global name.
 */
export function isGlobalIdentifier(node: ESTree.Node, name: string): Effect.Effect<boolean, never, RuleContext> {
  return node.type === 'Identifier' && node.name === name
    ? Effect.map(SourceCode.getScope(node), (scope) => isGlobalIn(scope, node, name))
    : Effect.succeed(false);
}

function isRuntimeImport(definition: Definition): boolean {
  const specifier = definition.node;

  return (
    definition.type === 'ImportBinding' &&
    specifier.parent?.type === 'ImportDeclaration' &&
    specifier.parent.importKind !== 'type' &&
    (specifier.type !== 'ImportSpecifier' || specifier.importKind !== 'type')
  );
}

/**
 * Whether the root of an API expression still resolves to a runtime import, synchronously, for use inside tree walks.
 *
 * @param sourceCode Source of the file.
 * @param node API expression.
 */
export function isImportedApiIn(sourceCode: OxlintSourceCode, node: ESTree.Node): boolean {
  return staticPath(node).pipe(
    Opt.flatMap((path) => lookupVariable(sourceCode, node, Arr.headNonEmpty(path))),
    Opt.exists(({ defs }) => Arr.some(defs, isRuntimeImport)),
  );
}

/**
 * Whether the root of an API expression still resolves to a runtime import, so autofixes may rewrite it.
 *
 * @param node API expression.
 */
export function isImportedApi(node: ESTree.Node): Effect.Effect<boolean, never, RuleContext> {
  return Effect.map(Effect.service(RuleContext), ({ sourceCode }) => isImportedApiIn(sourceCode, node));
}

/**
 * Every variable and reference name in the file, for picking collision-free identifiers.
 */
export const usedNames: Effect.Effect<ReadonlySet<string>, never, RuleContext> = Effect.map(
  Effect.service(RuleContext),
  ({ sourceCode }) =>
    new Set(
      Arr.flatMap(sourceCode.scopeManager.scopes, (scope) => [
        ...Arr.map(scope.variables, ({ name }) => name),
        ...Arr.map(scope.references, ({ identifier }) => identifier.name),
      ]),
    ),
);
