import type { Context, ESTree, Fix, Fixer } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as Opt from 'effect/Option';

import { isStringLiteral, resolveVariable, staticPath } from './utils';

/**
 * Only rewrite API roots that still resolve to runtime imports.
 *
 * @param context Rule context.
 * @param node API expression.
 */
export function importedApi(context: Context, node: ESTree.Node): boolean {
  const name = staticPath(node)?.[0];

  const variable = name === undefined ? undefined : resolveVariable(context, node, name);

  return Arr.some(variable?.defs ?? [], (definition) => {
    const specifier = definition.node;

    return (
      definition.type === 'ImportBinding' &&
      specifier.parent?.type === 'ImportDeclaration' &&
      specifier.parent.importKind !== 'type' &&
      (specifier.type !== 'ImportSpecifier' || specifier.importKind !== 'type')
    );
  });
}

/**
 * Reuse a visible namespace or insert a collision-free namespace import.
 *
 * @param context Rule context.
 * @param node Use site.
 * @param source Module entrypoint.
 * @param preferred Preferred local alias.
 * @param fixer Edit factory.
 */
export function namespaceImport(
  context: Context,
  node: ESTree.Node,
  source: string,
  preferred: string,
  fixer: Fixer,
): { readonly name: string; readonly fixes: Array<Fix> } {
  const program = context.sourceCode.ast;

  const visibleNamespace = Arr.findFirst(
    Arr.flatMap(program.body, (statement) =>
      statement.type === 'ImportDeclaration' && statement.source.value === source && statement.importKind !== 'type'
        ? statement.specifiers
        : [],
    ),
    (specifier) =>
      specifier.type === 'ImportNamespaceSpecifier' &&
      Arr.some(
        resolveVariable(context, node, specifier.local.name)?.defs ?? [],
        (definition) => definition.node === specifier,
      ),
  );

  if (Opt.isSome(visibleNamespace)) {
    return { name: visibleNamespace.value.local.name, fixes: [] };
  }

  const names = new Set(
    Arr.flatMap(context.sourceCode.scopeManager.scopes, (scope) => [
      ...Arr.map(scope.variables, (variable) => variable.name),
      ...Arr.map(scope.references, (reference) => reference.identifier.name),
    ]),
  );

  let name = preferred;

  let suffix = 2;

  while (names.has(name)) {
    name = `${preferred}${suffix++}`;
  }

  const text = `import * as ${name} from '${source}';\n`;

  const first = Opt.getOrUndefined(
    Arr.findFirst(
      program.body,
      (statement) => statement.type !== 'ExpressionStatement' || !isStringLiteral(statement.expression),
    ),
  );

  return {
    name,
    fixes: [first === undefined ? fixer.insertTextAfter(program, `\n${text}`) : fixer.insertTextBefore(first, text)],
  };
}

/**
 * Reject unknown keys, spreads, and duplicate destinations before migrating properties.
 *
 * @param node Options object.
 * @param destination Property that must not exist.
 */
export function plainOptions(node: ESTree.ObjectExpression, destination: string): boolean {
  const names = new Set<string>();

  return Arr.every(node.properties, (property) => {
    if (property.type !== 'Property' || property.computed || property.method || property.kind !== 'init') {
      return false;
    }

    if (property.key.type !== 'Identifier' && property.key.type !== 'Literal') {
      return false;
    }

    const name = property.key.type === 'Identifier' ? property.key.name : String(property.key.value);

    if (name === destination || names.has(name)) {
      return false;
    }

    names.add(name);

    return true;
  });
}
