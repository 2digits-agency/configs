import type { ESTree } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import type * as Effect from 'effect/Effect';

import {
  callbackCall,
  enclosingFunction,
  findAncestor,
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

// Not checked against `alchemy/Cloudflare`: its types load over a thousand files, which pushes the repo's type-aware
// ESLint run past the default Node heap.
const workerPaths: ReadonlyArray<ReadonlyArray<string>> = [
  ['Cloudflare', 'Worker'],
  ['Cloudflare', 'Workers', 'Worker'],
];

export function isCloudflareWorker(node: ESTree.Node, state: FileState): boolean {
  return Arr.some(workerPaths, (path) => isApiPath(node, state, path));
}

export function containingWorker(node: ESTree.Node, state: FileState): ESTree.CallExpression | undefined {
  return findAncestor(
    node,
    (parent): parent is ESTree.CallExpression =>
      parent.type === 'CallExpression' && isCloudflareWorker(parent.callee, state),
  );
}

export function containingEffectGen(node: ESTree.Node, state: FileState): ESTree.CallExpression | undefined {
  const callback = enclosingFunction(node);

  const call = callback === undefined ? undefined : callbackCall(callback);

  return call !== undefined && isApi(call.callee, state, 'Effect', 'gen' satisfies keyof typeof Effect)
    ? call
    : undefined;
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
