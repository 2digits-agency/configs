import type { Context, ESTree } from '@oxlint/plugins';
import * as Arr from 'effect/Array';

import { argumentAt, canonicalPath, propertyName, resolveVariable, soleDefinition, type FileState } from '../../utils';

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
 * Whether an identifier reads an import binding, rather than naming a property (`x.now`, `{ now: 1 }`) or reading a
 * local that shadows the import.
 *
 * @param node Identifier to check.
 * @param node.name Its name.
 * @param node.parent Its parent node.
 * @param context Rule context.
 */
export function isImportReference(
  node: { readonly name: string; readonly parent: ESTree.Node },
  context: Context,
): boolean {
  const parent = node.parent;

  if (
    (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) ||
    (parent.type === 'Property' && parent.key === node && parent.value !== node)
  ) {
    return false;
  }

  return soleDefinition(resolveVariable(context, parent, node.name))?.type === 'ImportBinding';
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

    if (block === undefined) {
      continue;
    }

    const section = propertyName(parent as ESTree.ObjectProperty);

    return section === undefined ? undefined : { block, section };
  }

  return undefined;
}
