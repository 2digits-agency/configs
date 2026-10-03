import type { Context, ESTree, Rule } from '@oxlint/plugins';

import { importedApi, plainOptions } from '../../fixes';
import { argumentAt, defineEffectRule, isApi, objectProperty, ruleMeta, type FileState } from '../../utils';

function effectApi(node: ESTree.Node, context: Context, state: FileState, module: string, member: string): boolean {
  return isApi(node, state, module, member) && importedApi(context, node, ['effect', `effect/${module}`]);
}

function primitive(node: ESTree.Node, context: Context, state: FileState): boolean {
  return ['String', 'Number', 'Boolean'].some((name) => effectApi(node, context, state, 'Schema', name));
}

function omitsEncodedKey(options: ESTree.Expression | undefined, context: Context, state: FileState): boolean {
  if (options?.type !== 'ObjectExpression' || !plainOptions(options, '__proto__')) {
    return false;
  }

  const encoder = objectProperty(options, 'encode')?.value;

  return (
    encoder?.type === 'CallExpression' &&
    !encoder.optional &&
    encoder.arguments.length === 0 &&
    effectApi(encoder.callee, context, state, 'SchemaGetter', 'omit')
  );
}

function requiredTarget(node: ESTree.Expression, context: Context, state: FileState): ESTree.Expression | undefined {
  if (
    node.type !== 'CallExpression' ||
    node.optional ||
    node.callee.type !== 'MemberExpression' ||
    node.callee.optional ||
    node.callee.computed ||
    node.callee.property.type !== 'Identifier' ||
    node.callee.property.name !== 'pipe' ||
    !primitive(node.callee.object, context, state) ||
    node.arguments.length !== 1
  ) {
    return undefined;
  }

  const transform = argumentAt(node, 0);

  if (
    transform?.type !== 'CallExpression' ||
    transform.optional ||
    transform.arguments.length !== 2 ||
    !effectApi(transform.callee, context, state, 'Schema', 'encodeTo')
  ) {
    return undefined;
  }

  const target = argumentAt(transform, 0);
  const options = argumentAt(transform, 1);

  return target !== undefined && primitive(target, context, state) && omitsEncodedKey(options, context, state)
    ? target
    : undefined;
}

export const noOmitRequiredEncodedKey: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow omit encoders for required primitive encoded Struct keys.',
    {
      requiredEncodedKey:
        'SchemaGetter.omit() removes this required encoded key, so encoding the Struct fails with MissingKey. Choose an optional encoded key contract or a non-omitting encoder.',
    },
    'https://github.com/Effect-TS/tsgo/issues/422',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const state = getState();
      const fields = argumentAt(node, 0);

      if (
        node.optional ||
        node.arguments.length !== 1 ||
        !effectApi(node.callee, context, state, 'Schema', 'Struct') ||
        fields?.type !== 'ObjectExpression' ||
        !plainOptions(fields, '__proto__')
      ) {
        return;
      }

      for (const field of fields.properties) {
        if (field.type !== 'Property') {
          continue;
        }

        const target = requiredTarget(field.value, context, state);

        if (target !== undefined) {
          context.report({ node: target, messageId: 'requiredEncodedKey' });
        }
      }
    },
  }),
);
