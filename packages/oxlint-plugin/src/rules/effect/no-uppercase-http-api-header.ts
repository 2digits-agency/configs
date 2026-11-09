import { Diagnostic, RuleContext, Visitor, type CreateRule, type Definition, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';

import { argumentAt, plainProperty, propertyName, staticPath } from '../../internal/ast';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';
import { resolveVariable, soleDefinition } from '../../internal/scope';
import { isTypeOnlyImport } from './internal/import-style';

const EndpointMethod = Schema.Literals(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);

const isEndpointMethod = Schema.is(EndpointMethod);

const hasAsciiUppercase = Schema.is(Schema.String.check(Schema.isPattern(/[A-Z]/u)));

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

/**
 * Whether a call is `HttpApiEndpoint.get(…)` or another endpoint method through a runtime import.
 *
 * @param node Call.
 */
function isEndpointCall(node: ESTree.CallExpression) {
  return Opt.match(
    Opt.filter(staticPath(node.callee), (path) => isEndpointMethod(Arr.lastNonEmpty(path))),
    {
      onNone: () => Effect.succeed(false),
      onSome: (path) =>
        Effect.map(resolveVariable(node, Arr.headNonEmpty(path)), (variable) =>
          Opt.exists(soleDefinition(variable), (definition) => isEndpointImport(definition, path)),
        ),
    },
  );
}

function memberName(property: ESTree.ObjectProperty): Opt.Option<string> {
  return Opt.orElse(propertyName(property), () =>
    property.key.type === 'Literal' && P.isNumber(property.key.value)
      ? Opt.some(String(property.key.value))
      : Opt.none(),
  );
}

/**
 * The properties of an object literal when each is a plain, uniquely and statically named property.
 *
 * @param node Expression.
 */
function directProperties(node: Opt.Option<ESTree.Expression>): Opt.Option<ReadonlyArray<ESTree.ObjectProperty>> {
  return Opt.flatMap(
    Opt.filter(node, (value): value is ESTree.ObjectExpression => value.type === 'ObjectExpression'),
    (object) =>
      Opt.flatMap(Opt.all(Arr.map(object.properties, plainProperty)), (properties) =>
        Opt.flatMap(Opt.all(Arr.map(properties, memberName)), (names) =>
          Arr.dedupe(names).length === names.length ? Opt.some(properties) : Opt.none(),
        ),
      ),
  );
}

function headerProperties(node: ESTree.CallExpression): Opt.Option<ReadonlyArray<ESTree.ObjectProperty>> {
  return argumentAt(node, 2).pipe(
    directProperties,
    Opt.flatMap((options) => Arr.findFirst(options, (property) => Opt.contains(propertyName(property), 'headers'))),
    Opt.map(({ value }) => value),
    directProperties,
  );
}

export const noUppercaseHttpApiHeader: CreateRule = defineRule({
  name: 'no-uppercase-http-api-header',
  meta: ruleMeta({
    type: 'problem',
    description: 'Require lowercase static keys in Effect v4 endpoint header field schemas.',
    messages: {
      uppercase:
        'Header schema key "{{name}}" contains ASCII uppercase letters. Incoming headers use exact lowercase runtime lookup; review the schema and its consumers before renaming this key.',
    },
    url: 'https://github.com/Effect-TS/tsgo/issues/413',
  }),
  *create() {
    const ctx = yield* RuleContext;

    function reportHeaders(headers: ReadonlyArray<ESTree.ObjectProperty>) {
      // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
      return Effect.forEach(
        headers,
        (property) =>
          Opt.match(Opt.filter(propertyName(property), hasAsciiUppercase), {
            onNone: () => Effect.void,
            onSome: (name) =>
              ctx.report(Diagnostic.fromId({ node: property.key, messageId: 'uppercase', data: { name } })),
          }),
        { discard: true },
      );
    }

    return Visitor.on('CallExpression', (node) =>
      Arr.some(node.arguments, (argument) => argument.type === 'SpreadElement')
        ? Effect.void
        : Effect.flatMap(isEndpointCall(node), (isEndpoint) =>
            isEndpoint
              ? Opt.match(headerProperties(node), { onNone: () => Effect.void, onSome: reportHeaders })
              : Effect.void,
          ),
    );
  },
});
