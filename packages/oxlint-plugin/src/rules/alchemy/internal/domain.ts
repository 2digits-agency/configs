import type { ESTree, OxlintSourceCode } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';
import * as Tuple from 'effect/Tuple';

import {
  argumentAt,
  isWrapperExpressionType,
  parentOf,
  propertyName,
  staticPath,
  unwrapExpression,
  namespaceMember,
} from '../../../internal/ast';
import { lookupVariable, soleDefinition } from '../../../internal/scope';
import { DomainBlock } from '../../../schemas/alchemy';
import type { ImportBindings } from '../../../schemas/imports';

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
  return staticPath(node).pipe(
    Opt.filter((path) => isImportBinding(file.sourceCode, node, Arr.headNonEmpty(path))),
    Opt.flatMap(() => file.imports.path(node)),
  );
}

/**
 * The block a `Domain.<Block>(...)` call declares.
 *
 * @param node Call to check.
 * @param file File being linted.
 */
export function domainBlock(node: ESTree.CallExpression, file: DomainFile): Opt.Option<DomainBlock> {
  return importedPath(node.callee, file).pipe(Opt.flatMap(namespaceMember('Domain')), Opt.filter(isDomainBlock));
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
 * The section of the definition that contains `node` itself, and the named functions and constants passed on the way
 * up, whose references may place `node` in a section too.
 *
 * @param node Node to start from.
 * @param file File being linted.
 */
function enclosingSection(
  node: ESTree.Node,
  file: DomainFile,
): readonly [Opt.Option<DomainSection>, ReadonlyArray<ESTree.Node>] {
  const named: Array<ESTree.Node> = [];

  let child = node;

  let parent = parentOf(node);

  while (Opt.isSome(parent)) {
    const { value } = parent;

    const block = value.type === 'Property' && value.value === child ? definitionBlock(value.parent, file) : Opt.none();

    if (Opt.isSome(block)) {
      return [
        Opt.map(propertyName(value as ESTree.ObjectProperty), (section) => ({ block: block.value, section })),
        named,
      ];
    }

    if (
      (value.type === 'FunctionDeclaration' && P.isNotNull(value.id)) ||
      (value.type === 'VariableDeclarator' && value.id.type === 'Identifier')
    ) {
      named.push(value);
    }

    child = value;

    parent = parentOf(value);
  }

  return [Opt.none(), named];
}

/**
 * The definition sections (`decide`, `evolve`, `reply`, ...) of the `Domain.<Block>(name, definition)` calls that
 * contain `node`. A helper declared in the same file counts as part of every section that names it, as a handler
 * (`evolve: { TicketAppeared: placed }`) or a call (`decide: { Open: (s) => openFor(s) }`), one level deep.
 *
 * @param node Node inside the definition.
 * @param file File being linted.
 */
export function domainSections(node: ESTree.Node, file: DomainFile): ReadonlyArray<DomainSection> {
  const [section, named] = enclosingSection(node, file);

  return Opt.match(section, {
    onSome: Arr.of,
    onNone: () =>
      Arr.flatMap(named, (declaration) =>
        Arr.flatMap(file.sourceCode.getDeclaredVariables(declaration), ({ references }) =>
          Arr.flatMap(references, ({ identifier, init }) =>
            init ? [] : Opt.toArray(Tuple.get(enclosingSection(identifier, file), 0)),
          ),
        ),
      ),
  });
}
