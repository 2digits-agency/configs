import type { Context, ESTree, Rule, Scope, Variable } from '@oxlint/plugins';

import { argumentAt, defineSyntaxRule, ruleMeta, staticPropertyName, unwrapExpression } from '../../utils';

interface ApiMember {
  readonly module: string;
  readonly member: string;
  readonly platform: boolean;
  readonly source: string;
}

interface Registration {
  readonly name: string;
  readonly method: string;
  readonly path: string | undefined;
  readonly platform: boolean;
  readonly node: ESTree.Expression;
}

interface Group {
  readonly platform: boolean;
  readonly registrations: Array<Registration>;
}

function binding(context: Context, node: ESTree.IdentifierReference): Variable | undefined {
  let scope: Scope | null = context.sourceCode.getScope(node);

  while (scope !== null) {
    const variable = scope.set.get(node.name);

    if (variable !== undefined) {
      return variable;
    }
    scope = scope.upper;
  }

  return undefined;
}

function modulePath(source: string): ReadonlyArray<string> | undefined {
  const barrels = ['effect/http-api', 'effect/unstable/httpapi', '@effect/platform'];

  if (barrels.includes(source)) {
    return [];
  }
  const barrel = barrels.find((entry) => source.startsWith(`${entry}/`));
  const namespace = barrel === undefined ? undefined : source.slice(barrel.length + 1);

  return namespace === 'HttpApiGroup' || namespace === 'HttpApiEndpoint' ? [namespace] : undefined;
}

function importPath(
  context: Context,
  node: ESTree.IdentifierReference,
): { readonly source: string; readonly path: Array<string> } | undefined {
  const definition = binding(context, node)?.defs[0];
  const specifier = definition?.node;
  const declaration = specifier?.parent;

  if (
    definition?.type !== 'ImportBinding' ||
    declaration?.type !== 'ImportDeclaration' ||
    declaration.importKind === 'type' ||
    specifier?.type === 'ImportDefaultSpecifier'
  ) {
    return undefined;
  }
  const source = declaration.source.value;
  const base = modulePath(source);

  if (base === undefined) {
    return undefined;
  }
  const path = [...base];

  if (specifier?.type === 'ImportSpecifier') {
    if (specifier.importKind === 'type' || specifier.imported.type !== 'Identifier') {
      return undefined;
    }
    path.push(specifier.imported.name);
  }

  return { source, path };
}

function apiMember(context: Context, expression: ESTree.Expression): ApiMember | undefined {
  let node = unwrapExpression(expression);
  const members: Array<string> = [];

  while (node.type === 'MemberExpression' && !node.optional) {
    const member = staticPropertyName(node);

    if (member === undefined) {
      return undefined;
    }
    members.unshift(member);
    node = unwrapExpression(node.object);
  }
  if (node.type !== 'Identifier') {
    return undefined;
  }
  const imported = importPath(context, node);

  if (imported === undefined) {
    return undefined;
  }
  members.unshift(...imported.path);
  const [namespace, member] = members;
  const source = imported.source;
  const platform = source === '@effect/platform' || source.startsWith('@effect/platform/');

  return member !== undefined &&
    members.length === 2 &&
    (namespace === 'HttpApiGroup' || namespace === 'HttpApiEndpoint')
    ? { module: namespace, member, platform, source }
    : undefined;
}

function literal(node: ESTree.Expression | undefined): string | undefined {
  const expression = node === undefined ? undefined : unwrapExpression(node);

  return expression?.type === 'Literal' && typeof expression.value === 'string' ? expression.value : undefined;
}

function immutableInitializer(
  context: Context,
  node: ESTree.IdentifierReference,
  seen: Set<Variable>,
): ESTree.Expression | undefined {
  const variable = binding(context, node);
  const definition = variable?.defs[0];
  const declarator = definition?.node;

  if (
    variable === undefined ||
    seen.has(variable) ||
    variable.defs.length !== 1 ||
    definition?.type !== 'Variable' ||
    declarator?.type !== 'VariableDeclarator' ||
    declarator.id.type !== 'Identifier' ||
    !declarator.init ||
    declarator.parent.type !== 'VariableDeclaration' ||
    declarator.parent.kind !== 'const' ||
    variable.references.some((reference) => reference.isWrite() && !reference.init)
  ) {
    return undefined;
  }
  seen.add(variable);

  return declarator.init;
}

function constructorEndpoint(context: Context, node: ESTree.CallExpression): Registration | undefined {
  const constructor = node.callee.type === 'CallExpression' ? node.callee : undefined;
  const api = apiMember(context, constructor?.callee ?? node.callee);

  if (api?.module !== 'HttpApiEndpoint') {
    return undefined;
  }
  const methods = new Map(
    Object.entries({
      get: 'GET',
      post: 'POST',
      put: 'PUT',
      patch: 'PATCH',
      head: 'HEAD',
      options: 'OPTIONS',
      ...(api.platform ? { del: 'DELETE' } : { delete: 'DELETE' }),
      ...(api.source === 'effect/http-api' || api.source.startsWith('effect/http-api/') ? { query: 'QUERY' } : {}),
    }),
  );
  const method =
    constructor === undefined
      ? methods.get(api.member)
      : api.member === 'make' && constructor.arguments.length === 1
        ? literal(argumentAt(constructor, 0))
        : undefined;
  const name = literal(argumentAt(node, 0));
  const path = literal(argumentAt(node, 1));

  return method !== undefined &&
    name !== undefined &&
    path !== undefined &&
    node.arguments.length >= 2 &&
    node.arguments.length <= (api.platform ? 2 : 3) &&
    node.arguments.every((argument) => argument.type !== 'SpreadElement')
    ? { name, method, path, platform: api.platform, node }
    : undefined;
}

function endpoint(context: Context, expression: ESTree.Expression, seen: Set<Variable>): Registration | undefined {
  const node = unwrapExpression(expression);
  let resolved: Registration | undefined;

  if (node.type === 'Identifier') {
    const initializer = immutableInitializer(context, node, seen);

    resolved = initializer === undefined ? undefined : endpoint(context, initializer, seen);
  } else if (node.type === 'CallExpression' && !node.optional) {
    const member =
      node.callee.type === 'MemberExpression' && !node.callee.optional ? staticPropertyName(node.callee) : undefined;

    resolved =
      (member === 'middleware' || member === 'annotate') && node.callee.type === 'MemberExpression'
        ? endpoint(context, node.callee.object, seen)
        : constructorEndpoint(context, node);
  }

  return resolved === undefined ? undefined : { ...resolved, node: expression };
}

function group(context: Context, expression: ESTree.Expression): Group | undefined {
  const node = unwrapExpression(expression);

  if (node.type !== 'CallExpression' || node.optional) {
    return undefined;
  }
  const api = apiMember(context, node.callee);

  if (api?.module === 'HttpApiGroup' && api.member === 'make') {
    return { platform: api.platform, registrations: [] };
  }
  if (node.callee.type !== 'MemberExpression' || node.callee.optional) {
    return undefined;
  }
  const member = staticPropertyName(node.callee);
  const resolved = group(context, node.callee.object);

  if (resolved === undefined) {
    return undefined;
  }
  if (member === 'prefix') {
    // Prefixes transform only existing endpoints. Do not infer effective paths.
    return { ...resolved, registrations: resolved.registrations.map((entry) => ({ ...entry, path: undefined })) };
  }
  if (member === 'middleware' || member === 'annotate') {
    return resolved;
  }
  if (member !== 'add' || (resolved.platform && node.arguments.length !== 1)) {
    return undefined;
  }
  for (const argument of node.arguments) {
    if (argument.type === 'SpreadElement') {
      continue;
    }

    const registration = endpoint(context, argument, new Set());

    if (registration !== undefined && registration.platform === resolved.platform) {
      resolved.registrations.push(registration);
    }
  }

  return resolved;
}

export const noDuplicateHttpApiEndpoints: Rule = defineSyntaxRule(
  ruleMeta(
    'problem',
    'Disallow duplicate literal endpoint names and method/path pairs within one Effect HTTP API group.',
    {
      duplicateName: 'Endpoint name "{{name}}" is already registered in this group at {{earlier}}.',
      duplicateRoute: 'Endpoint {{method}} "{{path}}" is already registered in this group at {{earlier}}.',
    },
    'https://github.com/2digits-agency/configs/issues/2733',
  ),
  (context) => ({
    CallExpression(node) {
      if (
        node.optional ||
        node.callee.type !== 'MemberExpression' ||
        node.callee.optional ||
        staticPropertyName(node.callee) !== 'add'
      ) {
        return;
      }
      const resolved = group(context, node.callee.object);

      if (resolved === undefined || (resolved.platform && node.arguments.length !== 1)) {
        return;
      }
      const previous = resolved.registrations;

      for (const argument of node.arguments) {
        if (argument.type === 'SpreadElement') {
          continue;
        }
        const current = endpoint(context, argument, new Set());

        if (current === undefined || current.platform !== resolved.platform) {
          continue;
        }
        for (const [messageId, earlier] of [
          ['duplicateName', previous.find((entry) => entry.name === current.name)],
          ['duplicateRoute', previous.find((entry) => entry.method === current.method && entry.path === current.path)],
        ] as const) {
          if (earlier === undefined) {
            continue;
          }

          const { line, column } = earlier.node.loc.start;

          context.report({
            node: argument,
            messageId,
            data: {
              name: current.name,
              method: current.method,
              path: current.path ?? '',
              earlier: `${line}:${column + 1}`,
            },
          });
        }
        previous.push(current);
      }
    },
  }),
);
