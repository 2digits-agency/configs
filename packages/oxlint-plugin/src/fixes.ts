import type { Context, ESTree, Fix, Fixer, Scope, Variable } from '@oxlint/plugins';

import { staticPath } from './utils';

/**
 * Resolve names at the edit site, including local shadowing.
 *
 * @param context Rule context.
 * @param node Edit site.
 * @param name Local binding name.
 */
function binding(context: Context, node: ESTree.Node, name: string): Variable | undefined {
  let scope: Scope | null = context.sourceCode.getScope(node);

  while (scope !== null) {
    const variable = scope.set.get(name);

    if (variable !== undefined) {
      return variable;
    }
    scope = scope.upper;
  }

  return undefined;
}

/**
 * Only rewrite API roots that still resolve to runtime imports.
 *
 * @param context Rule context.
 * @param node API expression.
 */
export function importedApi(context: Context, node: ESTree.Node): boolean {
  const name = staticPath(node)?.[0];
  const variable = name === undefined ? undefined : binding(context, node, name);

  return (
    variable?.defs.some((definition) => {
      const specifier = definition.node;

      return (
        definition.type === 'ImportBinding' &&
        specifier.parent?.type === 'ImportDeclaration' &&
        specifier.parent.importKind !== 'type' &&
        (specifier.type !== 'ImportSpecifier' || specifier.importKind !== 'type')
      );
    }) === true
  );
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

  for (const statement of program.body) {
    if (
      statement.type !== 'ImportDeclaration' ||
      statement.source.value !== source ||
      statement.importKind === 'type'
    ) {
      continue;
    }
    for (const specifier of statement.specifiers) {
      if (
        specifier.type === 'ImportNamespaceSpecifier' &&
        binding(context, node, specifier.local.name)?.defs.some((definition) => definition.node === specifier)
      ) {
        return { name: specifier.local.name, fixes: [] };
      }
    }
  }
  const names = new Set(
    context.sourceCode.scopeManager.scopes.flatMap((scope) => [
      ...scope.variables.map((variable) => variable.name),
      ...scope.references.map((reference) => reference.identifier.name),
    ]),
  );
  let name = preferred;
  let suffix = 2;

  while (names.has(name)) {
    name = `${preferred}${suffix++}`;
  }
  const text = `import * as ${name} from '${source}';\n`;
  const first = program.body.find(
    (statement) =>
      statement.type !== 'ExpressionStatement' ||
      statement.expression.type !== 'Literal' ||
      typeof statement.expression.value !== 'string',
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

  return node.properties.every((property) => {
    if (property.type !== 'Property' || property.computed || property.method || property.kind !== 'init') {
      return false;
    }
    const name =
      property.key.type === 'Identifier'
        ? property.key.name
        : property.key.type === 'Literal'
          ? String(property.key.value)
          : undefined;

    if (name === undefined || name === destination || names.has(name)) {
      return false;
    }
    names.add(name);

    return true;
  });
}
