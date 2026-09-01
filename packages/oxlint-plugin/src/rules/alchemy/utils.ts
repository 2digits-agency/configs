import type { ESTree } from '@oxlint/plugins';

import {
  callbackCall,
  enclosingFunction,
  isApi,
  isApiPath,
  isFunctionNode,
  propertyName,
  type FileState,
} from '../../utils';

const workerHandlers = new Set([
  'alarm',
  'fetch',
  'queue',
  'rpc',
  'scheduled',
  'tail',
  'trace',
  'webSocketClose',
  'webSocketError',
  'webSocketMessage',
]);

export function isCloudflareWorker(node: ESTree.Node, state: FileState): boolean {
  return (
    isApiPath(node, state, ['Cloudflare', 'Worker']) || isApiPath(node, state, ['Cloudflare', 'Workers', 'Worker'])
  );
}

export function containingWorker(node: ESTree.Node, state: FileState): ESTree.CallExpression | undefined {
  let parent = node.parent;

  while (parent) {
    if (parent.type === 'CallExpression' && isCloudflareWorker(parent.callee, state)) {
      return parent;
    }
    parent = parent.parent;
  }

  return undefined;
}

export function containingEffectGen(node: ESTree.Node, state: FileState): ESTree.CallExpression | undefined {
  const callback = enclosingFunction(node);
  const call = callback === undefined ? undefined : callbackCall(callback);

  return call !== undefined && isApi(call.callee, state, 'Effect', 'gen') ? call : undefined;
}

export function containingHandler(node: ESTree.Node): string | undefined {
  let parent = node.parent;

  while (parent) {
    if (isFunctionNode(parent)) {
      return undefined;
    }

    if (parent.type === 'Property') {
      const name = propertyName(parent as ESTree.ObjectProperty);

      if (name !== undefined && workerHandlers.has(name)) {
        return name;
      }
    }

    parent = parent.parent;
  }

  return undefined;
}
