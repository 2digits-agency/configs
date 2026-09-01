import type { Rule } from '@oxlint/plugins';

import {
  containsIdentifier,
  defineEffectRule,
  firstIdentifierParameter,
  isApi,
  isErrorConstructor,
  ruleMeta,
  walkNodes,
  type FileState,
  type FunctionNode,
} from '../../utils';
import { callbackApi, functionProperty } from './utils';

const errorHandlerMethods = new Set(['catch', 'catchAll', 'mapError']);

function wrapperDropsCause(node: FunctionNode, state: FileState): boolean {
  const callPath = callbackApi(node, state);
  const optionsCall = functionProperty(node, 'catch');
  const isHandler =
    (callPath?.[0] === 'Effect' && callPath[1] !== undefined && errorHandlerMethods.has(callPath[1])) ||
    (optionsCall !== undefined &&
      (isApi(optionsCall.callee, state, 'Effect', 'try') || isApi(optionsCall.callee, state, 'Effect', 'tryPromise')));

  if (!isHandler || !node.body) {
    return false;
  }

  const parameter = firstIdentifierParameter(node);

  return walkNodes(
    node.body,
    (child) =>
      child.type === 'NewExpression' &&
      isErrorConstructor(child) &&
      (parameter === undefined || !containsIdentifier(child, parameter.name)),
  );
}

export const preserveCaughtError: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Preserve the underlying cause when wrapping an Effect failure.',
    {
      droppedCause:
        'This handler constructs a new error but drops the caught failure. Accept it as a parameter and attach it as cause.',
    },
    'https://github.com/Effect-TS/tsgo/issues/490',
  ),
  (context, getState) => ({
    ArrowFunctionExpression(node) {
      if (wrapperDropsCause(node, getState())) {
        context.report({ node, messageId: 'droppedCause' });
      }
    },
    FunctionExpression(node) {
      if (wrapperDropsCause(node, getState())) {
        context.report({ node, messageId: 'droppedCause' });
      }
    },
  }),
);
