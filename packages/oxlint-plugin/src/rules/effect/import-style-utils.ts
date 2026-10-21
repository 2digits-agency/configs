import type { ESTree } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as Opt from 'effect/Option';
import * as R from 'effect/Record';
import * as Str from 'effect/String';

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

const moduleNamePattern = /^\p{Lu}/u;

/**
 * Effect and Alchemy module namespaces are PascalCase; lowercase exports are plain values.
 *
 * @param name Exported or submodule name.
 */
export function isModuleName(name: string): boolean {
  return moduleNamePattern.test(name);
}

function isEffectVitestSource(source: string): boolean {
  return source === '@effect/vitest' || Str.startsWith('@effect/vitest/')(source);
}

export function isTypeOnlyImport(declaration: ESTree.ImportDeclaration, specifier?: ESTree.ImportSpecifier): boolean {
  return declaration.importKind === 'type' || specifier?.importKind === 'type';
}

export function namespaceAlias(moduleName: string): string {
  return Opt.getOrElse(R.get(effectImportAliases, moduleName), () => moduleName);
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
    Str.startsWith('effect/')(source) || Str.startsWith('alchemy/')(source) || /^@effect\/[^/]+\//u.test(source);

  if (!isSubmodule) {
    return undefined;
  }

  const name = Arr.lastNonEmpty(Str.split(source, '/'));

  return isModuleName(name) ? name : undefined;
}
