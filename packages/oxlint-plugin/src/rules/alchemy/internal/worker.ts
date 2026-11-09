import type { ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import type * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import {
  callbackCall,
  enclosingFunction,
  isFunctionNode,
  parentOf,
  propertyName,
  findAncestor,
} from '../../../internal/ast';
import type { ImportBindings } from '../../../internal/imports';

const WorkerHandler = Schema.Literals([
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

const isWorkerHandler = Schema.is(WorkerHandler);

const workerPaths: ReadonlyArray<ReadonlyArray<string>> = [
  ['Cloudflare', 'Worker'],
  ['Cloudflare', 'Workers', 'Worker'],
];

/**
 * Whether an expression names `Cloudflare.Worker`.
 *
 * @param node Callee or reference.
 * @param imports Import bindings of the file.
 */
export function isCloudflareWorker(node: ESTree.Node, imports: ImportBindings): boolean {
  return Arr.some(workerPaths, (path) => imports.isApiPath(node, path));
}

/**
 * The `Cloudflare.Worker(...)` call around `node`.
 *
 * @param node Node inside the Worker definition.
 * @param imports Import bindings of the file.
 */
export function containingWorker(node: ESTree.Node, imports: ImportBindings): Opt.Option<ESTree.CallExpression> {
  return findAncestor(
    node,
    (parent): parent is ESTree.CallExpression =>
      parent.type === 'CallExpression' && isCloudflareWorker(parent.callee, imports),
  );
}

/**
 * The `Effect.gen(...)` call whose generator directly contains `node`.
 *
 * @param node Node inside a generator.
 * @param imports Import bindings of the file.
 */
export function containingEffectGen(node: ESTree.Node, imports: ImportBindings): Opt.Option<ESTree.CallExpression> {
  return enclosingFunction(node).pipe(
    Opt.flatMap(callbackCall),
    Opt.filter((call) => imports.isApi(call.callee, 'Effect', 'gen' satisfies keyof typeof Effect)),
  );
}

/**
 * The Worker event handler (`fetch`, `queue`, ...) whose property value contains `node`, without crossing a function.
 *
 * @param node Node inside a handler.
 */
export function containingHandler(node: ESTree.Node): Opt.Option<typeof WorkerHandler.Type> {
  return Opt.flatMap(parentOf(node), (parent) => {
    if (isFunctionNode(parent)) {
      return Opt.none();
    }

    const handler =
      parent.type === 'Property'
        ? Opt.filter(propertyName(parent as ESTree.ObjectProperty), isWorkerHandler)
        : Opt.none();

    return Opt.orElse(handler, () => containingHandler(parent));
  });
}
