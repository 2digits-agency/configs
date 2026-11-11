import { Diagnostic, type ESTree, type FixFn, type OxlintSourceCode, type Variable } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Opt from 'effect/Option';
import * as Result from 'effect/Result';
import * as Str from 'effect/String';
import * as Tuple from 'effect/Tuple';

import { containsSame, isSomeSame, moduleExportName } from '../../../internal/ast';
import { barrelModuleSource, isModuleName, isTypeOnlyImport, namespaceAlias, submoduleName } from './import-style';

/**
 * Split barrel module imports without renaming their local bindings.
 *
 * @param sourceCode Source of the file.
 * @param node Import to split.
 */
export function barrelFix(sourceCode: OxlintSourceCode, node: ESTree.ImportDeclaration): Opt.Option<FixFn> {
  const specifiers: ReadonlyArray<ESTree.ImportDeclarationSpecifier> = node.specifiers;

  if (
    Arr.isReadonlyArrayNonEmpty(sourceCode.getCommentsInside(node)) ||
    Arr.isReadonlyArrayNonEmpty(node.attributes) ||
    !Arr.every(specifiers, (specifier): specifier is ESTree.ImportSpecifier => specifier.type === 'ImportSpecifier')
  ) {
    return Opt.none();
  }

  const [imports, remaining] = Arr.partition(specifiers, (specifier) => {
    const name = moduleExportName(specifier.imported);

    const source =
      isModuleName(name) && !isTypeOnlyImport(node, specifier)
        ? barrelModuleSource(node.source.value, name)
        : Opt.none();

    return Opt.match(source, {
      onNone: () => Result.fail(sourceCode.getText(specifier)),
      onSome: (module) => Result.succeed(`import * as ${specifier.local.name} from '${module}';`),
    });
  });

  const lines = Arr.isReadonlyArrayNonEmpty(remaining)
    ? Arr.prepend(imports, `import { ${Arr.join(remaining, ', ')} } from ${sourceCode.getText(node.source)};`)
    : imports;

  return Opt.some(Diagnostic.replaceText(node, Arr.join(lines, '\n')));
}

/**
 * Rewrite every reference of an imported variable, or none when one cannot be rewritten: writes, re-exports and JSX.
 *
 * @param variable Imported variable.
 * @param replacement Replacement expression.
 * @param member Whether the replacement is a member access, which needs `(0, …)` in call and tag position.
 */
function referenceFixes(variable: Variable, replacement: string, member: boolean): Opt.Option<ReadonlyArray<FixFn>> {
  const references = Arr.dedupeWith(
    variable.references,
    (left, right) => Tuple.get(left.identifier.range, 0) === Tuple.get(right.identifier.range, 0),
  );

  return Opt.all(
    Arr.map(references, (reference) => {
      const identifier = reference.identifier;

      const parent = identifier.parent;

      if (reference.isWrite() || parent.type === 'ExportSpecifier' || Str.startsWith('JSX')(parent.type)) {
        return Opt.none();
      }

      const called =
        (parent.type === 'CallExpression' && parent.callee === identifier) ||
        (parent.type === 'TaggedTemplateExpression' && parent.tag === identifier);

      const text =
        member && called
          ? `(0, ${replacement})`
          : parent.type === 'Property' && parent.shorthand
            ? `${identifier.name}: ${replacement}`
            : replacement;

      return Opt.some(Diagnostic.replaceText(identifier, text));
    }),
  );
}

function valueImportFixes(
  specifier: ESTree.ImportSpecifier | ESTree.ImportNamespaceSpecifier,
  variables: ReadonlyArray<Variable>,
  alias: string,
): Opt.Option<ReadonlyArray<FixFn>> {
  return Opt.flatMap(
    Arr.findFirst(variables, (entry) => entry.name === specifier.local.name),
    (variable) => {
      if (specifier.type === 'ImportNamespaceSpecifier') {
        return referenceFixes(variable, alias, false);
      }

      return specifier.imported.type === 'Identifier'
        ? referenceFixes(variable, `${alias}.${specifier.imported.name}`, true)
        : Opt.none();
    },
  );
}

/**
 * Whether `alias` is free for the namespace import: no other variable or reference uses the name.
 *
 * @param sourceCode Source of the file.
 * @param alias Namespace alias.
 * @param target The import's own variable named `alias`, if any.
 */
function isAliasFree(sourceCode: OxlintSourceCode, alias: string, target: Opt.Option<Variable>): boolean {
  function isTarget(variable: Variable | null) {
    return isSomeSame<Variable | null>(target, variable);
  }

  return !Arr.some(
    sourceCode.scopeManager.scopes,
    (scope) =>
      Arr.some(scope.variables, (variable) => variable.name === alias && !isTarget(variable)) ||
      Arr.some(scope.references, (reference) => reference.identifier.name === alias && !isTarget(reference.resolved)),
  );
}

/**
 * Rewrite an entire import to a namespace import atomically; decline exports and unsupported reference syntax.
 *
 * @param sourceCode Source of the file.
 * @param node Import to rewrite.
 */
export function namespaceFix(sourceCode: OxlintSourceCode, node: ESTree.ImportDeclaration): Opt.Option<FixFn> {
  return Opt.flatMap(submoduleName(node.source.value), (moduleName) => {
    if (
      Arr.isReadonlyArrayNonEmpty(node.attributes) ||
      Arr.isReadonlyArrayNonEmpty(sourceCode.getCommentsInside(node))
    ) {
      return Opt.none();
    }

    const alias = namespaceAlias(moduleName);

    const variables = sourceCode.getDeclaredVariables(node);

    if (
      !isAliasFree(
        sourceCode,
        alias,
        Arr.findFirst(variables, (variable) => variable.name === alias),
      )
    ) {
      return Opt.none();
    }

    const typeSpecifiers = Arr.filter(
      node.specifiers,
      (specifier): specifier is ESTree.ImportSpecifier =>
        specifier.type === 'ImportSpecifier' && isTypeOnlyImport(node, specifier),
    );

    if (
      Arr.some(node.specifiers, (specifier) => specifier.type === 'ImportDefaultSpecifier') ||
      Arr.some(typeSpecifiers, (specifier) => specifier.local.name === alias)
    ) {
      return Opt.none();
    }

    const valueSpecifiers = Arr.filter(
      node.specifiers,
      (specifier): specifier is ESTree.ImportSpecifier | ESTree.ImportNamespaceSpecifier =>
        specifier.type !== 'ImportDefaultSpecifier' && !containsSame<ESTree.Node>(typeSpecifiers, specifier),
    );

    return Opt.all(Arr.map(valueSpecifiers, (specifier) => valueImportFixes(specifier, variables, alias))).pipe(
      Opt.map((fixes) => {
        const source = sourceCode.getText(node.source);

        const typeImport = Arr.isReadonlyArrayEmpty(typeSpecifiers)
          ? ''
          : `\nimport { ${Arr.join(
              Arr.map(typeSpecifiers, (specifier) => sourceCode.getText(specifier)),
              ', ',
            )} } from ${source};`;

        return Diagnostic.composeFixes(
          Diagnostic.replaceText(node, `import * as ${alias} from ${source};${typeImport}`),
          ...Arr.flatten(fixes),
        );
      }),
    );
  });
}
