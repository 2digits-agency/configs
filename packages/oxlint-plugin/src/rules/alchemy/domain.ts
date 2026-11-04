import type { ESTree } from '@oxlint/plugins';
import * as Arr from 'effect/Array';

import { argumentAt, canonicalPath, propertyName, type FileState } from '../../utils';

const domainBlocks = [
  'Aggregate',
  'Api',
  'Command',
  'Event',
  'ExternalSystem',
  'Model',
  'Policy',
  'Projection',
  'Rejection',
  'RequestContext',
  'Saga',
  'Stream',
  'View',
] as const;

export type DomainBlock = (typeof domainBlocks)[number];

function isDomainBlock(name: string | undefined): name is DomainBlock {
  return Arr.contains(domainBlocks, name);
}

/**
 * The block a `Domain.<Block>(...)` call declares.
 *
 * @param node Call to check.
 * @param state Import bindings of the file.
 */
export function domainBlock(node: ESTree.CallExpression, state: FileState): DomainBlock | undefined {
  const path = canonicalPath(node.callee, state);

  const name = path?.[1];

  return path?.length === 2 && path[0] === 'Domain' && isDomainBlock(name) ? name : undefined;
}

/**
 * The definition section (`decide`, `evolve`, `reply`, ...) of the `Domain.<Block>(name, definition)` call that
 * contains `node`.
 *
 * @param node Node inside the definition.
 * @param state Import bindings of the file.
 */
export function domainSection(
  node: ESTree.Node,
  state: FileState,
): { readonly block: DomainBlock; readonly section: string } | undefined {
  for (let child = node, parent = node.parent; parent; child = parent, parent = parent.parent) {
    if (parent.type !== 'Property' || parent.value !== child) {
      continue;
    }

    const definition = parent.parent;

    const call = definition.parent;

    if (
      definition.type !== 'ObjectExpression' ||
      call?.type !== 'CallExpression' ||
      argumentAt(call, 1) !== definition
    ) {
      continue;
    }

    const block = domainBlock(call, state);

    const section = propertyName(parent as ESTree.ObjectProperty);

    return block === undefined || section === undefined ? undefined : { block, section };
  }

  return undefined;
}
