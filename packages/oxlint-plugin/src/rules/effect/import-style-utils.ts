import type { ESTree } from '@oxlint/plugins';

const effectImportAliases: Readonly<Record<string, string>> = {
  Array: 'Arr',
  Boolean: 'Bool',
  Equal: 'Eq',
  Function: 'Fn',
  Number: 'Num',
  Option: 'Opt',
  Predicate: 'P',
  Record: 'R',
  String: 'Str',
};

function isEffectVitestSource(source: string): boolean {
  return source === '@effect/vitest' || source.startsWith('@effect/vitest/');
}

export function isTypeOnlyImport(declaration: ESTree.ImportDeclaration, specifier?: ESTree.ImportSpecifier): boolean {
  return declaration.importKind === 'type' || specifier?.importKind === 'type';
}

export function namespaceAlias(moduleName: string): string {
  return effectImportAliases[moduleName] ?? moduleName;
}

export function barrelModuleSource(source: string, moduleName: string): string | undefined {
  if (source === 'effect' || source === 'alchemy') {
    return `${source}/${moduleName}`;
  }

  if (/^@effect\/[^/]+$/u.test(source) && !isEffectVitestSource(source)) {
    return `${source}/${moduleName}`;
  }

  return undefined;
}

export function submoduleName(source: string): string | undefined {
  if (isEffectVitestSource(source)) {
    return undefined;
  }

  const isSubmodule =
    source.startsWith('effect/') || source.startsWith('alchemy/') || /^@effect\/[^/]+\//u.test(source);
  const name = isSubmodule ? source.split('/').at(-1) : undefined;

  return name !== undefined && /^\p{Lu}/u.test(name) ? name : undefined;
}
