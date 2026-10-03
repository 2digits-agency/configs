import type { Context, ESTree, Rule, Scope, Variable } from '@oxlint/plugins';

import { importedApi } from '../../fixes';
import {
  argumentAt,
  callbackCall,
  canonicalPath,
  defineEffectRule,
  enclosingFunction,
  isApi,
  isFunctionNode,
  ruleMeta,
  staticPropertyName,
  type FileState,
} from '../../utils';
import { callbackApi, functionProperty } from './utils';

const pureCallbackMethods = new Set(['andThen', 'map', 'mapError', 'tap', 'tapError', 'tapErrorCause']);

function binding(node: ESTree.Node, context: Context): Variable | undefined {
  if (node.type !== 'Identifier') {
    return undefined;
  }
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

function globalJsonMember(node: ESTree.Node, context: Context, member: string): boolean {
  if (
    node.type !== 'MemberExpression' ||
    staticPropertyName(node) !== member ||
    node.object.type !== 'Identifier' ||
    node.object.name !== 'JSON'
  ) {
    return false;
  }

  const variable = binding(node.object, context);

  return variable === undefined || (variable.scope.type === 'global' && variable.defs.length === 0);
}

function jsonParser(node: ESTree.Node, context: Context): boolean {
  if (globalJsonMember(node, context, 'parse')) {
    return true;
  }
  if (node.type !== 'Identifier') {
    return false;
  }

  const variable = binding(node, context);
  const definition = variable?.defs.length === 1 ? variable.defs[0] : undefined;
  const declaration = definition?.node;

  return (
    definition?.type === 'Variable' &&
    declaration?.type === 'VariableDeclarator' &&
    declaration.id.type === 'Identifier' &&
    declaration.parent.type === 'VariableDeclaration' &&
    declaration.parent.kind === 'const' &&
    declaration.init !== null &&
    globalJsonMember(declaration.init, context, 'parse') &&
    variable?.references.every((reference) => !reference.isWrite() || reference.init) === true
  );
}

function mappingCall(node: ESTree.CallExpression, context: Context, state: FileState): boolean {
  const path = canonicalPath(node.callee, state);

  return (
    path?.length === 2 &&
    path[0] === 'Effect' &&
    pureCallbackMethods.has(path[1] ?? '') &&
    importedApi(context, node.callee)
  );
}

function unguardedParserCallback(node: ESTree.Node): ESTree.CallExpression | undefined {
  let child = node;
  let parent = node.parent;

  while (parent) {
    if (parent.type === 'FunctionDeclaration') {
      return undefined;
    }
    if (isFunctionNode(parent)) {
      const call = callbackCall(parent);

      return call?.arguments.at(-1) === parent ? call : undefined;
    }
    // Parser-only conservative policy: skip the try body even if its catch rethrows.
    if (parent.type === 'TryStatement' && parent.block === child && parent.handler) {
      return undefined;
    }
    child = parent;
    parent = parent.parent;
  }

  return undefined;
}

function jsonClone(node: ESTree.CallExpression, context: Context): boolean {
  const input = argumentAt(node, 0);

  return (
    node.arguments.length === 1 &&
    input?.type === 'CallExpression' &&
    input.arguments.length === 1 &&
    globalJsonMember(input.callee, context, 'stringify')
  );
}

export const noThrowInEffectCallback: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow throw in Effect callbacks that cannot add the thrown value to the typed error channel.',
    {
      callbackThrow:
        'Throwing in this Effect callback creates an untyped defect. Return Effect.fail(...) or return the mapped error value instead.',
      callbackParse:
        'JSON.parse in this Effect callback can create an untyped defect. Parse inside Effect.try with an explicit error contract and compose that Effect instead.',
    },
    'https://github.com/Effect-TS/tsgo/issues/406',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const state = getState();

      if (mappingCall(node, context, state)) {
        const mapper = node.arguments.at(-1);

        if (mapper !== undefined && jsonParser(mapper, context)) {
          context.report({ node: mapper, messageId: 'callbackParse' });
        }
      }

      if (!jsonParser(node.callee, context) || jsonClone(node, context)) {
        return;
      }
      const call = unguardedParserCallback(node);

      if (call !== undefined && mappingCall(call, context, state)) {
        context.report({ node, messageId: 'callbackParse' });
      }
    },
    ThrowStatement(node) {
      const callback = enclosingFunction(node);

      if (callback === undefined) {
        return;
      }

      const state = getState();
      const path = callbackApi(callback, state);
      const optionsCall = functionProperty(callback, 'catch');

      if (
        (path?.[0] === 'Effect' && path[1] !== undefined && pureCallbackMethods.has(path[1])) ||
        (optionsCall !== undefined &&
          (isApi(optionsCall.callee, state, 'Effect', 'try') ||
            isApi(optionsCall.callee, state, 'Effect', 'tryPromise')))
      ) {
        context.report({ node, messageId: 'callbackThrow' });
      }
    },
  }),
);
