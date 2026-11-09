import type { ESTree, OxlintSourceCode } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';

import {
  argumentAt,
  isWrapperExpressionType,
  parentOf,
  propertyName,
  staticPath,
  unwrapExpression,
} from '../../../internal/ast';
import type { ImportBindings } from '../../../internal/imports';
import { lookupVariable, soleDefinition } from '../../../internal/scope';

export const DomainBlock = Schema.Literals([
  'Aggregate',
  'Api',
  'Command',
  'Event',
  'ExternalSystem',
  'Model',
  'Policy',
  'Projection',
  'Rejection',
  'RequestContext',
  'Saga',
  'Stream',
  'View',
]);

export type DomainBlock = typeof DomainBlock.Type;

const isDomainBlock = Schema.is(DomainBlock);

/**
 * The file an Alchemy Domain rule reads: its source, for scope lookups, and its import bindings.
 */
export interface DomainFile {
  readonly sourceCode: OxlintSourceCode;
  readonly imports: ImportBindings;
}

function isImportBinding(sourceCode: OxlintSourceCode, node: ESTree.Node, name: string): boolean {
  return Opt.exists(soleDefinition(lookupVariable(sourceCode, node, name)), ({ type }) => type === 'ImportBinding');
}

/**
 * The module path of a reference, only when its root name resolves to the import at `node`, not to a local that shadows
 * it.
 *
 * @param node Reference or member expression.
 * @param file File being linted.
 */
export function importedPath(node: ESTree.Node, file: DomainFile): Opt.Option<ReadonlyArray<string>> {
  return Opt.filter(file.imports.path(node), () =>
    Opt.exists(staticPath(node), (path) => isImportBinding(file.sourceCode, node, Arr.headNonEmpty(path))),
  );
}

/**
 * The block a `Domain.<Block>(...)` call declares.
 *
 * @param node Call to check.
 * @param file File being linted.
 */
export function domainBlock(node: ESTree.CallExpression, file: DomainFile): Opt.Option<DomainBlock> {
  return file.imports.member(node.callee, 'Domain').pipe(
    Opt.filter(isDomainBlock),
    // Scope analysis is only needed for a possible Domain block, not every imported call in a barrel-import file.
    Opt.filter(() => Opt.isSome(importedPath(node.callee, file))),
  );
}

/**
 * Whether an identifier reads an import binding, rather than naming a property (`x.now`, `{ now: 1 }`) or reading a
 * local that shadows the import.
 *
 * @param node Identifier to check.
 * @param node.name Its name.
 * @param node.parent Its parent node.
 * @param sourceCode Source of the file.
 */
export function isImportReference(
  node: { readonly name: string; readonly parent: ESTree.Node },
  sourceCode: OxlintSourceCode,
): boolean {
  const { parent } = node;

  if (
    (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) ||
    (parent.type === 'Property' && parent.key === node && parent.value !== node)
  ) {
    return false;
  }

  return isImportBinding(sourceCode, parent, node.name);
}

/**
 * A section of a Domain block definition, such as the `decide` handler of an aggregate.
 */
export interface DomainSection {
  readonly block: DomainBlock;
  readonly section: string;
}

function skipWrappers(node: ESTree.Node | null): ESTree.Node | null {
  return P.isNotNull(node) && isWrapperExpressionType(node.type)
    ? skipWrappers(node.parent as ESTree.Node | null)
    : node;
}

/**
 * The block of `Domain.<Block>(name, definition)` when `definition` is that call's definition object.
 *
 * @param definition Object literal.
 * @param file File being linted.
 */
function definitionBlock(definition: ESTree.Node, file: DomainFile): Opt.Option<DomainBlock> {
  if (definition.type !== 'ObjectExpression') {
    return Opt.none();
  }

  // Skip `as const`, `satisfies Definition` and parentheses around the definition.
  const call = skipWrappers(definition.parent as ESTree.Node | null);

  return call?.type === 'CallExpression' &&
    Opt.exists(argumentAt(call, 1), (argument) => unwrapExpression(argument) === definition)
    ? domainBlock(call, file)
    : Opt.none();
}

/**
 * The definition section (`decide`, `evolve`, `reply`, ...) of the `Domain.<Block>(name, definition)` call that
 * contains `node`.
 *
 * @param node Node inside the definition.
 * @param file File being linted.
 */
export function domainSection(node: ESTree.Node, file: DomainFile): Opt.Option<DomainSection> {
  return Opt.flatMap(parentOf(node), (parent) => {
    const block =
      parent.type === 'Property' && parent.value === node ? definitionBlock(parent.parent, file) : Opt.none();

    return Opt.match(block, {
      onNone: () => domainSection(parent, file),
      onSome: (found) =>
        Opt.map(propertyName(parent as ESTree.ObjectProperty), (section) => ({ block: found, section })),
    });
  });
}
