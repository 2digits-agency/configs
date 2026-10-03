import type { Context, ESTree, Rule, Scope, Variable } from '@oxlint/plugins';

import {
  callbackCall,
  defineEffectRule,
  isApi,
  isFunctionNode,
  ruleMeta,
  staticPath,
  type FunctionNode,
} from '../../utils';
import { callbackApi, functionProperty } from './utils';

const pureCallbackMethods = new Set(['andThen', 'map', 'mapError', 'tap', 'tapError', 'tapErrorCause']);

function binding(node: ESTree.Node, name: string, context: Context): Variable | undefined {
  for (let scope: Scope | null = context.sourceCode.getScope(node); scope; scope = scope.upper) {
    const variable = scope.set.get(name);

    if (variable !== undefined) {
      return variable;
    }
  }

  return undefined;
}

function hasImportBinding(node: ESTree.Node, context: Context): boolean {
  const name = staticPath(node)?.[0];

  return name !== undefined && binding(node, name, context)?.defs.some((def) => def.type === 'ImportBinding') === true;
}

function enclosingCallback(node: ESTree.Node): FunctionNode | undefined {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.type === 'FunctionDeclaration') {
      return undefined;
    }

    if (isFunctionNode(parent)) {
      return parent;
    }
  }

  return undefined;
}

// Deliberately bounded: unknown expressions (including calls and property reads) are not proof of consumption.
function nonthrowing(node: ESTree.Node, callback: FunctionNode, context: Context): boolean {
  switch (node.type) {
    case 'Literal':
    case 'EmptyStatement': {
      return true;
    }
    case 'Identifier': {
      // Outer parameters and destructured catch bindings may be read during their own initialization.
      return (
        binding(node, node.name, context)?.defs.some(
          (def) =>
            (def.type === 'Parameter' && def.node === callback) ||
            (def.type === 'CatchClause' && def.node.type === 'CatchClause' && def.node.param?.type === 'Identifier'),
        ) === true
      );
    }
    case 'ReturnStatement': {
      return node.argument === null || nonthrowing(node.argument, callback, context);
    }
    case 'BlockStatement': {
      return node.body.every((statement) => nonthrowing(statement, callback, context));
    }
    default: {
      return false;
    }
  }
}

function locallyConsumed(node: ESTree.ThrowStatement, callback: FunctionNode, context: Context): boolean {
  let child: ESTree.Node = node;

  for (let parent: ESTree.Node | null = child.parent; parent && parent !== callback; parent = parent.parent) {
    if (
      parent.type === 'TryStatement' &&
      child === parent.block &&
      parent.handler !== null &&
      (parent.handler.param === null || parent.handler.param.type === 'Identifier') &&
      nonthrowing(parent.handler.body, callback, context) &&
      (parent.finalizer === null || nonthrowing(parent.finalizer, callback, context))
    ) {
      return true;
    }

    child = parent;
  }

  return false;
}

export const noThrowInEffectCallback: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow throw in Effect callbacks that cannot add the thrown value to the typed error channel.',
    {
      callbackThrow:
        'Throwing in this Effect callback creates an untyped defect. Return Effect.fail(...) or return the mapped error value instead.',
    },
    'https://github.com/Effect-TS/tsgo/issues/406',
  ),
  (context, getState) => ({
    ThrowStatement(node) {
      const callback = enclosingCallback(node);

      if (callback === undefined || locallyConsumed(node, callback, context)) {
        return;
      }

      const state = getState();
      const path = callbackApi(callback, state);
      const call = callbackCall(callback);
      const optionsCall = functionProperty(callback, 'catch');

      if (
        (call !== undefined &&
          path?.[0] === 'Effect' &&
          path[1] !== undefined &&
          pureCallbackMethods.has(path[1]) &&
          hasImportBinding(call.callee, context)) ||
        (optionsCall !== undefined &&
          hasImportBinding(optionsCall.callee, context) &&
          (isApi(optionsCall.callee, state, 'Effect', 'try') ||
            isApi(optionsCall.callee, state, 'Effect', 'tryPromise')))
      ) {
        context.report({ node, messageId: 'callbackThrow' });
      }
    },
  }),
);
