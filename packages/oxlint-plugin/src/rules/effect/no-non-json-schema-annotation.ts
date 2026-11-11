import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';

import {
  isFunctionNode,
  objectArgument,
  objectProperty,
  staticPath,
  staticPropertyName,
  unwrapExpression,
} from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

const NonJsonGlobal = Schema.Literals(['NaN', 'Infinity', 'undefined']);

const isNonJsonGlobal = Schema.is(NonJsonGlobal);

const AnnotateMethod = Schema.Literals(['annotate', 'annotateEncoded', 'annotateKey'] satisfies ReadonlyArray<
  keyof typeof Schema
>);

const isAnnotateMethod = Schema.is(AnnotateMethod);

const jsonValueAnnotations = ['default', 'examples'] as const;

function directlyNonJson(expression: ESTree.Expression): boolean {
  return (
    (expression.type === 'Literal' && P.isBigInt(expression.value)) ||
    (expression.type === 'Identifier' && isNonJsonGlobal(expression.name)) ||
    isFunctionNode(expression) ||
    (expression.type === 'CallExpression' &&
      Opt.exists(staticPath(expression.callee), (path) => Arr.lastNonEmpty(path) === 'Symbol'))
  );
}

function jsonChildren(expression: ESTree.Expression): ReadonlyArray<ESTree.Expression> {
  if (expression.type === 'ArrayExpression') {
    return Arr.filter(
      expression.elements,
      (element): element is ESTree.Expression => P.isNotNull(element) && element.type !== 'SpreadElement',
    );
  }

  return expression.type === 'ObjectExpression'
    ? Arr.flatMap(expression.properties, (property) => (property.type === 'Property' ? [property.value] : []))
    : [];
}

/**
 * The first value in an annotation that JSON cannot represent, searching the last child first.
 *
 * @param node Annotation value.
 */
function nonJsonValue(node: ESTree.Expression): Opt.Option<ESTree.Node> {
  const expression = unwrapExpression(node);

  return directlyNonJson(expression)
    ? Opt.some(expression)
    : Arr.findFirst(Arr.reverse(jsonChildren(expression)), nonJsonValue);
}

/**
 * The annotate method a call uses: `schema.annotate(…)` or the data-first `Schema.annotate(…)`.
 *
 * @param node Call.
 * @param imports Import bindings of the file.
 */
function annotateMethod(node: ESTree.CallExpression, imports: ImportBindings): Opt.Option<string> {
  const method =
    node.callee.type === 'MemberExpression'
      ? staticPropertyName(node.callee)
      : imports.path(node.callee).pipe(
          Opt.filter(([namespace]) => namespace === 'Schema'),
          Opt.flatMapNullishOr(([, member]) => member),
        );

  return Opt.filter(method, isAnnotateMethod);
}

/**
 * The non-JSON values in the `default` and `examples` annotations, unless the call sets `jsonSchema` explicitly.
 *
 * @param node Annotate call.
 */
function nonJsonAnnotations(node: ESTree.CallExpression): ReadonlyArray<ESTree.Node> {
  return objectArgument(node).pipe(
    Opt.filter((annotations) => Opt.isNone(objectProperty(annotations, 'jsonSchema'))),
    Opt.match({
      onNone: () => [],
      onSome: (annotations) =>
        Arr.getSomes(
          Arr.map(jsonValueAnnotations, (name) =>
            Opt.flatMap(objectProperty(annotations, name), ({ value }) => nonJsonValue(value)),
          ),
        ),
    }),
  );
}

export const noNonJsonSchemaAnnotation = Rule.define({
  name: 'no-non-json-schema-annotation',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow schema examples and defaults that cannot be represented in JSON Schema.',
    messages: {
      nonJson:
        'This schema annotation value is not JSON-serializable and will be omitted from or corrupt generated JSON Schema.',
    },
    url: 'https://github.com/Effect-TS/tsgo/issues/440',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    return Visitor.on('CallExpression', (node) =>
      Opt.match(annotateMethod(node, imports), {
        onNone: () => Effect.void,
        onSome: () =>
          // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
          Effect.forEach(
            nonJsonAnnotations(node),
            (invalid) => ctx.report(Diagnostic.fromId({ node: invalid, messageId: 'nonJson' })),
            { discard: true },
          ),
      }),
    );
  },
});
