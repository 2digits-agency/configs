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

// Verified namespace exports and provider module entrypoints in Alchemy 2.0.0-beta.79.
// Keep this explicit: PascalCase names also include Config values and service identifiers.
const alchemyModules = new Set([
  'AdoptPolicy',
  'AWS',
  'Axiom',
  'Cloudflare',
  'Docker',
  'Drift',
  'Fly',
  'GitHub',
  'Hetzner',
  'Kubernetes',
  'Neon',
  'Plan',
  'Planetscale',
  'ProviderMode',
  'Railway',
  'RemovalPolicy',
  'Report',
  'Schema',
  'Server',
  'Stripe',
  'Telemetry',
]);

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
  if (source === 'alchemy') {
    return alchemyModules.has(moduleName) ? `alchemy/${moduleName}` : undefined;
  }

  if (source === 'effect') {
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
