import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import {
  argumentAt,
  containsRange,
  enclosingFunction,
  findAncestor,
  propertyName,
  staticPropertyName,
  unwrapExpression,
  type FunctionNode,
} from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { isForeignCallback } from './internal/callbacks';
import { millisName } from './internal/duration';

type SchemaApi = keyof typeof Schema;

const isNumberSchemaName = Schema.is(
  Schema.Literals(['Finite', 'FiniteFromString', 'Int', 'Number', 'NumberFromString'] satisfies Array<SchemaApi>),
);

const isSchemaWrapper = Schema.is(
  Schema.Literals(['NullOr', 'NullishOr', 'UndefinedOr', 'optional', 'optionalKey'] satisfies Array<SchemaApi>),
);

// Pipe steps that keep a number a number. Any other step, such as `Schema.decodeTo(Schema.Duration, ...)`, may not.
const isNumberPreservingStepName = Schema.is(
  Schema.Literals([
    'annotate',
    'annotateKey',
    'brand',
    'check',
    'withConstructorDefault',
    'withDecodingDefault',
    'withDecodingDefaultKey',
  ] satisfies Array<SchemaApi>),
);

const isNumberMethod = Schema.is(Schema.Literals(['annotate', 'check']));

const isNumberUnionMember = Schema.is(Schema.Literals(['TSNullKeyword', 'TSNumberKeyword', 'TSUndefinedKeyword']));

function schemaApiName(node: ESTree.Node, imports: ImportBindings): Opt.Option<string> {
  return imports.member(node, 'Schema');
}

function isNumberPreservingStep(node: ESTree.Argument, imports: ImportBindings): boolean {
  if (node.type === 'SpreadElement') {
    return false;
  }

  const step = unwrapExpression(node);

  return step.type === 'CallExpression'
    ? Opt.exists(schemaApiName(step.callee, imports), isNumberPreservingStepName)
    : Opt.exists(schemaApiName(step, imports), isSchemaWrapper);
}

/**
 * Whether a schema decodes to a plain number: `Schema.Number`, `Schema.Int`, and those wrapped in `optional`, `NullOr`
 * and similar, refined with `.check(...)`, or piped only through modifiers, checks, brands, annotations and defaults.
 *
 * @param node Field schema.
 * @param imports Import bindings of the file.
 */
function isNumberSchema(node: ESTree.Expression, imports: ImportBindings): boolean {
  const expression = unwrapExpression(node);

  if (expression.type !== 'CallExpression') {
    return Opt.exists(schemaApiName(expression, imports), isNumberSchemaName);
  }

  const callee = expression.callee;

  if (Opt.exists(schemaApiName(callee, imports), isSchemaWrapper)) {
    return Opt.exists(argumentAt(expression, 0), (first) => isNumberSchema(first, imports));
  }

  if (callee.type !== 'MemberExpression' || callee.object.type === 'Super' || !isNumberSchema(callee.object, imports)) {
    return false;
  }

  return Opt.exists(staticPropertyName(callee), (method) =>
    method === 'pipe'
      ? Arr.every(expression.arguments, (step) => isNumberPreservingStep(step, imports))
      : isNumberMethod(method),
  );
}

/**
 * Whether an annotation is `number`, optionally in a union with `undefined` or `null`.
 *
 * @param annotation Type annotation to inspect.
 */
function isNumberType(annotation: ESTree.TSTypeAnnotation | null | undefined): boolean {
  const type = annotation?.typeAnnotation;

  if (type?.type === 'TSNumberKeyword') {
    return true;
  }

  return (
    type?.type === 'TSUnionType' &&
    Arr.some(type.types, (member) => member.type === 'TSNumberKeyword') &&
    Arr.every(type.types, (member) => isNumberUnionMember(member.type))
  );
}

function isDurationName(name: string): boolean {
  return Opt.contains(millisName(name), 'duration');
}

function keyName(node: ESTree.PropertyDefinition | ESTree.TSPropertySignature): Opt.Option<string> {
  if (node.computed) {
    return node.key.type === 'Literal' && Str.isString(node.key.value) ? Opt.some(node.key.value) : Opt.none();
  }

  return node.key.type === 'Identifier' ? Opt.some(node.key.name) : Opt.none();
}

const DeclarationFile = Schema.String.check(Schema.isPattern(/\.d\.[cm]?ts$/u));

const isDeclarationFile = Schema.is(DeclarationFile);

function isAmbient(node: ESTree.Node): node is ESTree.Node & { readonly declare: true } {
  return P.hasProperty(node, 'declare') && node.declare;
}

/**
 * Whether a declaration describes data that this code does not own: ambient declarations (`declare` modules, globals,
 * classes and variables) and parameter types of callbacks that a non-Effect API calls. Declaration files are skipped
 * entirely.
 *
 * @param node Declaration to inspect.
 * @param imports Import bindings of the file.
 */
function isForeignDeclaration(node: ESTree.Node, imports: ImportBindings): boolean {
  // `declare module`, `declare global`, `declare class` and `declare const` describe code defined elsewhere.
  return (
    Opt.isSome(findAncestor(node, isAmbient)) ||
    Opt.exists(
      enclosingFunction(node),
      (owner) =>
        isForeignCallback(owner, imports) && Arr.some(owner.params, (parameter) => containsRange(parameter, node)),
    )
  );
}

function parameterBinding(parameter: ESTree.ParamPattern): Opt.Option<ESTree.BindingIdentifier> {
  const pattern = parameter.type === 'TSParameterProperty' ? parameter.parameter : parameter;

  if (pattern.type === 'Identifier') {
    return isNumberType(pattern.typeAnnotation) ? Opt.some(pattern) : Opt.none();
  }

  if (pattern.type !== 'AssignmentPattern' || pattern.left.type !== 'Identifier') {
    return Opt.none();
  }

  const fallback = unwrapExpression(pattern.right);

  // `timeoutMs = 5000` is a number even without an annotation.
  return isNumberType(pattern.left.typeAnnotation) ||
    (!pattern.left.typeAnnotation && fallback.type === 'Literal' && P.isNumber(fallback.value))
    ? Opt.some(pattern.left)
    : Opt.none();
}

export const preferEffectDurationTypes = Rule.define({
  name: 'prefer-effect-duration-types',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer Duration types over plain numbers for millisecond parameters and fields.',
    messages: {
      durationType:
        '{{name}} holds a duration as a number of milliseconds. Type it as Duration.Input (or Duration.Duration) and convert with Duration.toMillis only where a non-Effect API needs milliseconds.',
      durationSchema:
        '{{name}} decodes a duration as a plain number. Use Schema.DurationFromMillis to keep milliseconds in the encoded data, or Schema.Duration.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/Duration',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    // `.d.ts` files describe code defined elsewhere.
    const declarationFile = isDeclarationFile(ctx.filename);

    function report(node: ESTree.Node, name: string, messageId: 'durationSchema' | 'durationType') {
      return ctx.report(Diagnostic.fromId({ node, messageId, data: { name } }));
    }

    function checkFunction(node: FunctionNode) {
      return declarationFile || !node.body || isForeignCallback(node, imports) || isForeignDeclaration(node, imports)
        ? Effect.void
        : // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
          Effect.forEach(
            Arr.filter(Arr.getSomes(Arr.map(node.params, parameterBinding)), ({ name }) => isDurationName(name)),
            (binding) => report(binding, binding.name, 'durationType'),
            { discard: true },
          );
    }

    function checkField(node: ESTree.PropertyDefinition | ESTree.TSPropertySignature) {
      return keyName(node).pipe(
        Opt.filter(
          (name) =>
            isDurationName(name) &&
            isNumberType(node.typeAnnotation) &&
            !declarationFile &&
            !isForeignDeclaration(node, imports),
        ),
        Opt.match({ onNone: () => Effect.void, onSome: (name) => report(node.key, name, 'durationType') }),
      );
    }

    return Visitor.merge(
      Visitor.on('ArrowFunctionExpression', checkFunction),
      Visitor.on('FunctionDeclaration', checkFunction),
      Visitor.on('FunctionExpression', checkFunction),
      Visitor.on('PropertyDefinition', checkField),
      Visitor.on('TSPropertySignature', checkField),
      Visitor.on('Property', (node) =>
        node.parent.type === 'ObjectExpression'
          ? propertyName(node as ESTree.ObjectProperty).pipe(
              Opt.filter((name) => isDurationName(name) && isNumberSchema(node.value as ESTree.Expression, imports)),
              Opt.match({ onNone: () => Effect.void, onSome: (name) => report(node.key, name, 'durationSchema') }),
            )
          : Effect.void,
      ),
    );
  },
});
