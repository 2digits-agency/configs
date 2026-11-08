import type { Context, ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import type * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import {
  canonicalPath,
  containsRange,
  defineEffectRule,
  enclosingFunction,
  findAncestor,
  propertyName,
  ruleMeta,
  staticPropertyName,
  unwrapExpression,
  type FileState,
  type FunctionNode,
} from '../../utils';
import { millisName } from './duration';
import { isForeignCallback } from './utils';

type SchemaApi = keyof typeof Schema;

const numberSchemas: ReadonlySet<string> = new Set<SchemaApi>([
  'Finite',
  'FiniteFromString',
  'Int',
  'Number',
  'NumberFromString',
]);

const schemaWrappers: ReadonlySet<string> = new Set<SchemaApi>([
  'NullOr',
  'NullishOr',
  'UndefinedOr',
  'optional',
  'optionalKey',
]);

const schemaMethods: ReadonlySet<string> = new Set(['annotate', 'check', 'pipe']);

/**
 * Whether a schema decodes to a plain number: `Schema.Number`, `Schema.Int`, and those wrapped in `optional`, `NullOr`
 * and similar, or refined with `.pipe(...)` or `.check(...)`.
 *
 * @param node Field schema.
 * @param state Effect import bindings for the file.
 */
function isNumberSchema(node: ESTree.Expression, state: FileState): boolean {
  const expression = unwrapExpression(node);

  if (expression.type !== 'CallExpression') {
    const path = canonicalPath(expression, state);

    return path?.length === 2 && path[0] === 'Schema' && numberSchemas.has(path[1] ?? '');
  }

  const callee = expression.callee;

  const path = canonicalPath(callee, state);

  const first = expression.arguments[0];

  if (path?.length === 2 && path[0] === 'Schema' && schemaWrappers.has(path[1] ?? '')) {
    return first !== undefined && first.type !== 'SpreadElement' && isNumberSchema(first, state);
  }

  return (
    callee.type === 'MemberExpression' &&
    schemaMethods.has(staticPropertyName(callee) ?? '') &&
    callee.object.type !== 'Super' &&
    isNumberSchema(callee.object, state)
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
    Arr.every(type.types, (member) => ['TSNullKeyword', 'TSNumberKeyword', 'TSUndefinedKeyword'].includes(member.type))
  );
}

function isDurationName(name: string | undefined): name is string {
  return name !== undefined && millisName(name) === 'duration';
}

function keyName(node: ESTree.PropertyDefinition | ESTree.TSPropertySignature): string | undefined {
  if (node.computed) {
    return node.key.type === 'Literal' && typeof node.key.value === 'string' ? node.key.value : undefined;
  }

  return node.key.type === 'Identifier' ? node.key.name : undefined;
}

/**
 * Whether a declaration describes data that this code does not own: ambient declarations (`.d.ts` files, `declare
 * module`, `declare global`) and parameter types of callbacks that a non-Effect API calls.
 *
 * @param node Declaration to inspect.
 * @param context Rule context.
 * @param state Effect import bindings for the file.
 */
function isForeignDeclaration(node: ESTree.Node, context: Context, state: FileState): boolean {
  if (Str.endsWith('.d.ts')(context.filename)) {
    return true;
  }

  const module = findAncestor(
    node,
    (ancestor): ancestor is ESTree.TSModuleDeclaration => ancestor.type === 'TSModuleDeclaration',
  );

  if (module?.declare === true) {
    return true;
  }

  const owner = enclosingFunction(node);

  return (
    owner !== undefined &&
    isForeignCallback(owner, state) &&
    Arr.some(owner.params, (parameter) => containsRange(parameter, node))
  );
}

function parameterBinding(parameter: ESTree.ParamPattern): ESTree.BindingIdentifier | undefined {
  const pattern = parameter.type === 'TSParameterProperty' ? parameter.parameter : parameter;

  if (pattern.type === 'Identifier') {
    return isNumberType(pattern.typeAnnotation) ? pattern : undefined;
  }

  if (pattern.type !== 'AssignmentPattern' || pattern.left.type !== 'Identifier') {
    return undefined;
  }

  const fallback = unwrapExpression(pattern.right);

  // `timeoutMs = 5000` is a number even without an annotation.
  return isNumberType(pattern.left.typeAnnotation) ||
    (!pattern.left.typeAnnotation && fallback.type === 'Literal' && typeof fallback.value === 'number')
    ? pattern.left
    : undefined;
}

export const preferEffectDurationTypes: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer Duration types over plain numbers for millisecond parameters and fields.',
    {
      durationType:
        '{{name}} holds a duration as a number of milliseconds. Type it as Duration.Input (or Duration.Duration) and convert with Duration.toMillis only where a non-Effect API needs milliseconds.',
      durationSchema:
        '{{name}} decodes a duration as a plain number. Use Schema.DurationFromMillis to keep milliseconds in the encoded data, or Schema.Duration.',
    },
    'https://www.effect.website/docs/v4/api/effect/Duration',
  ),
  (context, getState) => {
    function report(node: ESTree.Node, name: string, messageId: 'durationSchema' | 'durationType'): void {
      context.report({ node, messageId, data: { name } });
    }

    function checkFunction(node: FunctionNode): void {
      // Overloads and `declare function` have no body; the implementation is reported instead.
      if (
        !getState().hasEffectImport ||
        !node.body ||
        isForeignCallback(node, getState()) ||
        isForeignDeclaration(node, context, getState())
      ) {
        return;
      }

      for (const parameter of node.params) {
        const binding = parameterBinding(parameter);

        if (binding !== undefined && isDurationName(binding.name)) {
          report(binding, binding.name, 'durationType');
        }
      }
    }

    function checkField(node: ESTree.PropertyDefinition | ESTree.TSPropertySignature): void {
      const name = keyName(node);

      if (
        getState().hasEffectImport &&
        isDurationName(name) &&
        isNumberType(node.typeAnnotation) &&
        !isForeignDeclaration(node, context, getState())
      ) {
        report(node.key, name, 'durationType');
      }
    }

    return {
      ArrowFunctionExpression: checkFunction,
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      PropertyDefinition: checkField,
      TSPropertySignature: checkField,
      Property(node) {
        const name = propertyName(node as ESTree.ObjectProperty);

        if (
          getState().hasEffectImport &&
          node.parent.type === 'ObjectExpression' &&
          isDurationName(name) &&
          isNumberSchema(node.value as ESTree.Expression, getState())
        ) {
          report(node.key, name, 'durationSchema');
        }
      },
    };
  },
);
