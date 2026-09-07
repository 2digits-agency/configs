import type { Context, ESTree, Fix, Fixer, Variable } from '@oxlint/plugins';

import { barrelModuleSource, isTypeOnlyImport, namespaceAlias, submoduleName } from './import-style-utils';

/**
 * Split barrel module imports without renaming their local bindings.
 *
 * @param context Rule context.
 * @param node Import to split.
 * @param fixer Edit factory.
 */
export function fixBarrel(context: Context, node: ESTree.ImportDeclaration, fixer: Fixer): Array<Fix> | undefined {
  if (context.sourceCode.getCommentsInside(node).length > 0 || node.attributes.length > 0) {
    return undefined;
  }
  const remaining: Array<string> = [];
  const imports: Array<string> = [];

  for (const specifier of node.specifiers) {
    if (specifier.type !== 'ImportSpecifier') {
      return undefined;
    }
    const name = specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value;
    const source =
      /^\p{Lu}/u.test(name) && !isTypeOnlyImport(node, specifier)
        ? barrelModuleSource(node.source.value, name)
        : undefined;

    if (source === undefined) {
      remaining.push(context.sourceCode.getText(specifier));
    } else {
      imports.push(`import * as ${specifier.local.name} from '${source}';`);
    }
  }
  if (remaining.length > 0) {
    imports.unshift(`import { ${remaining.join(', ')} } from ${context.sourceCode.getText(node.source)};`);
  }

  return [fixer.replaceText(node, imports.join('\n'))];
}

/**
 * Rewrite an entire import atomically; decline exports and unsupported reference syntax.
 *
 * @param context Rule context.
 * @param node Import to rewrite.
 * @param fixer Edit factory.
 */
export function fixNamespace(context: Context, node: ESTree.ImportDeclaration, fixer: Fixer): Array<Fix> | undefined {
  const moduleName = submoduleName(node.source.value);

  if (moduleName === undefined || node.attributes.length > 0 || context.sourceCode.getCommentsInside(node).length > 0) {
    return undefined;
  }
  const alias = namespaceAlias(moduleName);
  const variables = context.sourceCode.getDeclaredVariables(node);
  const target = variables.find((variable) => variable.name === alias);

  if (
    context.sourceCode.scopeManager.scopes.some(
      (scope) =>
        scope.variables.some((variable) => variable.name === alias && variable !== target) ||
        scope.references.some((reference) => reference.identifier.name === alias && reference.resolved !== target),
    )
  ) {
    return undefined;
  }
  const fixes: Array<Fix> = [];
  const types: Array<string> = [];

  for (const specifier of node.specifiers) {
    if (specifier.type === 'ImportDefaultSpecifier') {
      return undefined;
    }
    if (specifier.type === 'ImportSpecifier' && isTypeOnlyImport(node, specifier)) {
      if (specifier.local.name === alias) {
        return undefined;
      }
      types.push(context.sourceCode.getText(specifier));
      continue;
    }
    const references = fixValueImport(specifier, variables, alias, fixer);

    if (references === undefined) {
      return undefined;
    }
    fixes.push(...references);
  }
  const source = context.sourceCode.getText(node.source);
  const typeImport = types.length === 0 ? '' : `\nimport { ${types.join(', ')} } from ${source};`;
  const text = `import * as ${alias} from ${source};${typeImport}`;

  return [fixer.replaceText(node, text), ...fixes];
}

function fixValueImport(
  specifier: ESTree.ImportSpecifier | ESTree.ImportNamespaceSpecifier,
  variables: Array<Variable>,
  alias: string,
  fixer: Fixer,
): Array<Fix> | undefined {
  const variable = variables.find((entry) => entry.name === specifier.local.name);

  if (variable === undefined) {
    return undefined;
  }
  if (specifier.type === 'ImportNamespaceSpecifier') {
    return fixReferences(variable, alias, false, fixer);
  }
  if (specifier.imported.type !== 'Identifier') {
    return undefined;
  }

  return fixReferences(variable, `${alias}.${specifier.imported.name}`, true, fixer);
}

function fixReferences(variable: Variable, replacement: string, member: boolean, fixer: Fixer): Array<Fix> | undefined {
  const fixes: Array<Fix> = [];
  const seen = new Set<number>();

  for (const reference of variable.references) {
    const identifier = reference.identifier;

    if (seen.has(identifier.range[0])) {
      continue;
    }
    seen.add(identifier.range[0]);
    const parent = identifier.parent;

    if (reference.isWrite() || parent.type === 'ExportSpecifier' || parent.type.startsWith('JSX')) {
      return undefined;
    }
    let text = parent.type === 'Property' && parent.shorthand ? `${identifier.name}: ${replacement}` : replacement;

    if (
      member &&
      ((parent.type === 'CallExpression' && parent.callee === identifier) ||
        (parent.type === 'TaggedTemplateExpression' && parent.tag === identifier))
    ) {
      text = `(0, ${replacement})`;
    }
    fixes.push(fixer.replaceText(identifier, text));
  }

  return fixes;
}
