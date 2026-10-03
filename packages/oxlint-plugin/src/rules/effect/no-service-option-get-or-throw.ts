import type { Context, ESTree, Rule } from '@oxlint/plugins';

import { importedApi } from '../../fixes';
import {
  argumentAt,
  callbackCall,
  defineEffectRule,
  isApi,
  ruleMeta,
  staticPropertyName,
  unwrapExpression,
  type FileState,
} from '../../utils';

function isImportedApi(
  context: Context,
  state: FileState,
  node: ESTree.Node,
  namespace: string,
  member: string,
): boolean {
  return isApi(node, state, namespace, member) && importedApi(context, node);
}

function isOptionUnwrap(context: Context, state: FileState, node: ESTree.Node): boolean {
  return (
    isImportedApi(context, state, node, 'Option', 'getOrThrow') ||
    isImportedApi(context, state, node, 'Option', 'getOrThrowWith')
  );
}

function serviceOptionBlock(
  context: Context,
  state: FileState,
  declarator: ESTree.VariableDeclarator,
): ESTree.BlockStatement | undefined {
  const declaration = declarator.parent;
  const block = declaration.parent;
  const generator = block?.parent;

  if (
    declaration.type !== 'VariableDeclaration' ||
    declaration.kind !== 'const' ||
    declaration.declarations.length !== 1 ||
    block?.type !== 'BlockStatement' ||
    generator?.type !== 'FunctionExpression' ||
    !generator.generator
  ) {
    return undefined;
  }
  const gen = callbackCall(generator);
  const yielded = declarator.init;

  if (
    gen === undefined ||
    !isImportedApi(context, state, gen.callee, 'Effect', 'gen') ||
    yielded?.type !== 'YieldExpression' ||
    !yielded.delegate ||
    yielded.argument?.type !== 'CallExpression' ||
    !isImportedApi(context, state, yielded.argument.callee, 'Effect', 'serviceOption')
  ) {
    return undefined;
  }

  return block;
}

function isUnwrapStatement(statement: ESTree.Statement | undefined, node: ESTree.CallExpression): boolean {
  return (
    (statement?.type === 'ReturnStatement' && statement.argument === node) ||
    (statement?.type === 'ExpressionStatement' && statement.expression === node) ||
    (statement?.type === 'VariableDeclaration' &&
      statement.declarations.length === 1 &&
      statement.declarations[0]?.init === node)
  );
}

function isBoundServiceOption(
  context: Context,
  state: FileState,
  node: ESTree.CallExpression,
  option: ESTree.Expression | undefined,
): boolean {
  if (option?.type !== 'Identifier' || node.optional) {
    return false;
  }
  const scope = context.sourceCode.getScope(option);
  const variable = scope.references.find((reference) => reference.identifier === option)?.resolved ?? undefined;
  const definition = variable?.defs[0];

  if (variable === undefined || definition?.type !== 'Variable' || definition.node.type !== 'VariableDeclarator') {
    return false;
  }
  const declarator = definition.node;
  const declaration = declarator.parent;
  const block = serviceOptionBlock(context, state, declarator);

  if (block === undefined || declaration.type !== 'VariableDeclaration' || declarator.id.type !== 'Identifier') {
    return false;
  }
  const references = variable.references;

  if (
    references.filter((reference) => reference.isRead()).length !== 1 ||
    references.some((reference) => reference.isWrite() && reference.identifier !== declarator.id)
  ) {
    return false;
  }
  const next = block.body
    .slice(block.body.indexOf(declaration) + 1)
    .find((statement) => statement.type !== 'EmptyStatement');

  return isUnwrapStatement(next, node);
}

export const noServiceOptionGetOrThrow: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow turning missing Effect services into untyped Option defects.',
    {
      getOrThrow:
        'Option.getOrThrow after Effect.serviceOption hides a mandatory service until runtime. Use Effect.service so it remains a typed requirement.',
    },
    'https://github.com/Effect-TS/tsgo/issues/650',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const state = getState();

      if (isOptionUnwrap(context, state, node.callee)) {
        const option = argumentAt(node, 0);
        const yielded = option?.type === 'YieldExpression' ? option.argument : option;

        if (
          (yielded?.type === 'CallExpression' &&
            isImportedApi(context, state, yielded.callee, 'Effect', 'serviceOption')) ||
          isBoundServiceOption(context, state, node, option)
        ) {
          context.report({ node, messageId: 'getOrThrow' });
        }

        return;
      }

      if (node.callee.type !== 'MemberExpression' || staticPropertyName(node.callee) !== 'pipe') {
        return;
      }

      const source = unwrapExpression(node.callee.object);
      const map = argumentAt(node, 0);

      if (
        source.type !== 'CallExpression' ||
        !isImportedApi(context, state, source.callee, 'Effect', 'serviceOption') ||
        map?.type !== 'CallExpression' ||
        !isImportedApi(context, state, map.callee, 'Effect', 'map')
      ) {
        return;
      }

      const mapper = argumentAt(map, 0);

      if (mapper !== undefined && isOptionUnwrap(context, state, mapper)) {
        context.report({ node, messageId: 'getOrThrow' });
      }
    },
  }),
);
