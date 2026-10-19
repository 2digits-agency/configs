import type { Context, Definition, ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';

import {
  argumentAt,
  defineSyntaxRule,
  propertyName,
  resolveVariable,
  ruleMeta,
  soleDefinition,
  staticPath,
} from '../../utils';
import { isTypeOnlyImport } from './import-style-utils';

const endpointMethods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);

function isEndpointImport(definition: Definition, path: ReadonlyArray<string>): boolean {
  const declaration = definition.parent;

  const specifier = definition.node;

  if (
    definition.type !== 'ImportBinding' ||
    declaration?.type !== 'ImportDeclaration' ||
    isTypeOnlyImport(declaration, specifier.type === 'ImportSpecifier' ? specifier : undefined)
  ) {
    return false;
  }

  const source = declaration.source.value;

  if (specifier.type === 'ImportNamespaceSpecifier') {
    return (
      (source === 'effect/unstable/httpapi/HttpApiEndpoint' && path.length === 2) ||
      (source === 'effect/unstable/httpapi' && path.length === 3 && path[1] === 'HttpApiEndpoint')
    );
  }

  return (
    specifier.type === 'ImportSpecifier' &&
    specifier.imported.type === 'Identifier' &&
    specifier.imported.name === 'HttpApiEndpoint' &&
    source === 'effect/unstable/httpapi' &&
    path.length === 2
  );
}

function isEndpointCall(node: ESTree.CallExpression, context: Context): boolean {
  const path = staticPath(node.callee);

  const root = path?.[0];

  const method = path?.at(-1);

  if (path === undefined || root === undefined || method === undefined || !endpointMethods.has(method)) {
    return false;
  }

  const definition = soleDefinition(resolveVariable(context, node, root));

  return definition !== undefined && isEndpointImport(definition, path);
}

function directProperties(node: ESTree.Expression | undefined): Array<ESTree.ObjectProperty> | undefined {
  if (node?.type !== 'ObjectExpression') {
    return undefined;
  }

  const names = new Set<string>();

  const properties: Array<ESTree.ObjectProperty> = [];

  for (const property of node.properties) {
    if (property.type !== 'Property' || property.computed || property.method || property.kind !== 'init') {
      return undefined;
    }

    const name =
      propertyName(property) ??
      (property.key.type === 'Literal' && P.isNumber(property.key.value) ? String(property.key.value) : undefined);

    if (name === undefined || names.has(name)) {
      return undefined;
    }

    names.add(name);

    properties.push(property);
  }

  return properties;
}

export const noUppercaseHttpApiHeader: Rule = defineSyntaxRule(
  ruleMeta(
    'problem',
    'Require lowercase static keys in Effect v4 endpoint header field schemas.',
    {
      uppercase:
        'Header schema key "{{name}}" contains ASCII uppercase letters. Incoming headers use exact lowercase runtime lookup; review the schema and its consumers before renaming this key.',
    },
    'https://github.com/Effect-TS/tsgo/issues/413',
  ),
  (context) => ({
    CallExpression(node) {
      if (Arr.some(node.arguments, (argument) => argument.type === 'SpreadElement') || !isEndpointCall(node, context)) {
        return;
      }

      const options = directProperties(argumentAt(node, 2));

      const headers = directProperties(
        Opt.getOrUndefined(Arr.findFirst(options ?? [], (property) => propertyName(property) === 'headers'))?.value,
      );

      if (headers === undefined) {
        return;
      }

      for (const property of headers) {
        const name = propertyName(property);

        if (name !== undefined && /[A-Z]/u.test(name)) {
          context.report({ node: property.key, messageId: 'uppercase', data: { name } });
        }
      }
    },
  }),
);
