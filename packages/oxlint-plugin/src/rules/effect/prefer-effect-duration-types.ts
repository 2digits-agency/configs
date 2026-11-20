import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import {
  containsRange,
  enclosingFunction,
  findAncestor,
  propertyName,
  unwrapExpression,
  type FunctionNode,
} from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { NumberUnionMember } from '../../schemas/ast';
import type { ImportBindings } from '../../schemas/imports';
import { DeclarationFile } from '../../schemas/names';
import { isForeignCallback } from './internal/callbacks';
import { millisName } from './internal/duration';
import { numberSchemaName } from './internal/number-schema';

const isNumberUnionMember = Schema.is(NumberUnionMember);

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
            { concurrency: 1, discard: true },
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
              Opt.filter(
                (name) =>
                  isDurationName(name) && Opt.isSome(numberSchemaName(node.value as ESTree.Expression, imports)),
              ),
              Opt.match({ onNone: () => Effect.void, onSome: (name) => report(node.key, name, 'durationSchema') }),
            )
          : Effect.void,
      ),
    );
  },
});
