import type { ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as P from 'effect/Predicate';
import type * as Schema from 'effect/Schema';

import {
  canonicalPath,
  defineEffectRule,
  isFunctionNode,
  objectProperty,
  ruleMeta,
  staticPath,
  staticPropertyName,
  unwrapExpression,
} from '../../utils';
import { objectArgument } from './utils';

const nonJsonGlobals: ReadonlySet<string> = new Set(['NaN', 'Infinity', 'undefined']);

const annotateMethods: ReadonlySet<string> = new Set([
  'annotate',
  'annotateEncoded',
  'annotateKey',
] satisfies ReadonlyArray<keyof typeof Schema>);

const jsonValueAnnotations = ['default', 'examples'] as const;

function directlyNonJson(expression: ESTree.Expression): boolean {
  return (
    (expression.type === 'Literal' && P.isBigInt(expression.value)) ||
    (expression.type === 'Identifier' && nonJsonGlobals.has(expression.name)) ||
    isFunctionNode(expression) ||
    (expression.type === 'CallExpression' && staticPath(expression.callee)?.at(-1) === 'Symbol')
  );
}

function appendJsonChildren(expression: ESTree.Expression, pending: Array<ESTree.Expression>): void {
  if (expression.type === 'ArrayExpression') {
    for (const element of expression.elements) {
      if (element && element.type !== 'SpreadElement') {
        pending.push(element);
      }
    }

    return;
  }

  if (expression.type === 'ObjectExpression') {
    for (const property of expression.properties) {
      if (property.type === 'Property') {
        pending.push(property.value);
      }
    }
  }
}

function nonJsonValue(node: ESTree.Expression): ESTree.Node | undefined {
  const pending: Array<ESTree.Expression> = [node];

  while (Arr.isReadonlyArrayNonEmpty(pending)) {
    const candidate = pending.pop();

    if (P.isUndefined(candidate)) {
      continue;
    }

    const expression = unwrapExpression(candidate);

    if (directlyNonJson(expression)) {
      return expression;
    }

    appendJsonChildren(expression, pending);
  }

  return undefined;
}

export const noNonJsonSchemaAnnotation: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow schema examples and defaults that cannot be represented in JSON Schema.',
    {
      nonJson:
        'This schema annotation value is not JSON-serializable and will be omitted from or corrupt generated JSON Schema.',
    },
    'https://github.com/Effect-TS/tsgo/issues/440',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const state = getState();

      if (!state.hasEffectImport) {
        return;
      }

      const directPath = canonicalPath(node.callee, state);

      const method =
        node.callee.type === 'MemberExpression'
          ? staticPropertyName(node.callee)
          : directPath?.[0] === 'Schema'
            ? directPath[1]
            : undefined;

      if (P.isUndefined(method) || !annotateMethods.has(method)) {
        return;
      }

      const annotations = objectArgument(node);

      if (P.isUndefined(annotations) || P.isNotUndefined(objectProperty(annotations, 'jsonSchema'))) {
        return;
      }

      for (const name of jsonValueAnnotations) {
        const property = objectProperty(annotations, name);

        if (P.isUndefined(property)) {
          continue;
        }

        const invalid = nonJsonValue(property.value);

        if (P.isNotUndefined(invalid)) {
          context.report({ node: invalid, messageId: 'nonJson' });
        }
      }
    },
  }),
);
