import type { ESTree, Rule } from '@oxlint/plugins';
import type * as EffectBarrel from 'effect';
import * as Arr from 'effect/Array';
import type * as Console from 'effect/Console';
import type * as Effect from 'effect/Effect';
import type * as Fn from 'effect/Function';

import {
  argumentAt,
  canonicalPath,
  defineEffectRule,
  isAnyApi,
  isApiPath,
  ruleMeta,
  staticPropertyName,
  unwrapExpression,
  type FileState,
} from '../../utils';

const effectLogMethods = [
  'log',
  'logDebug',
  'logError',
  'logFatal',
  'logInfo',
  'logTrace',
  'logWarning',
] as const satisfies ReadonlyArray<keyof typeof Effect>;

const consoleLogMethods = ['debug', 'error', 'info', 'log', 'trace', 'warn'] as const satisfies ReadonlyArray<
  keyof typeof Console
>;

const asMethods = ['as', 'asSome', 'asVoid'] as const satisfies ReadonlyArray<keyof typeof Effect>;

// `Effect.log*(...)`, `Effect.logWithLevel(level)(...)` or `Console.log(...)` and similar, as printed in messages.
function loggerName(node: ESTree.Expression, state: FileState): string | undefined {
  const expression = unwrapExpression(node);

  if (expression.type !== 'CallExpression') {
    return undefined;
  }

  const callee = unwrapExpression(expression.callee);

  if (
    callee.type === 'CallExpression' &&
    isApiPath(callee.callee, state, ['Effect', 'logWithLevel' satisfies keyof typeof Effect])
  ) {
    return 'Effect.logWithLevel';
  }

  if (isAnyApi(callee, state, 'Effect', effectLogMethods) || isAnyApi(callee, state, 'Console', consoleLogMethods)) {
    return Arr.join(canonicalPath(callee, state) ?? [], '.');
  }

  return undefined;
}

// The `Effect.as*` method of a data-last pipe step: `Effect.as(value)`, `Effect.asVoid` or `Effect.asSome`.
function asStep(node: ESTree.Expression | undefined, state: FileState): string | undefined {
  if (node === undefined) {
    return undefined;
  }

  const step = unwrapExpression(node);

  if (
    step.type === 'CallExpression' &&
    step.arguments.length === 1 &&
    isApiPath(step.callee, state, ['Effect', 'as' satisfies keyof typeof Effect])
  ) {
    return 'as';
  }

  return isAnyApi(step, state, 'Effect', ['asSome', 'asVoid'] satisfies ReadonlyArray<keyof typeof Effect>)
    ? canonicalPath(step, state)?.[1]
    : undefined;
}

function isPipeFunction(node: ESTree.Node, state: FileState): boolean {
  return (
    isApiPath(node, state, ['pipe' satisfies keyof typeof EffectBarrel]) ||
    isApiPath(node, state, ['Function', 'pipe' satisfies keyof typeof Fn])
  );
}

interface Match {
  readonly logger: string;
  readonly method: string;
  readonly node: ESTree.Node;
}

function matchCall(node: ESTree.CallExpression, state: FileState): Match | undefined {
  const callee = unwrapExpression(node.callee);

  // `Effect.log(...).pipe(Effect.as(value))`
  if (callee.type === 'MemberExpression' && staticPropertyName(callee) === 'pipe') {
    const step = argumentAt(node, 0);

    const logger = loggerName(callee.object, state);

    const method = asStep(step, state);

    return step === undefined || logger === undefined || method === undefined
      ? undefined
      : { logger, method, node: step };
  }

  // `pipe(Effect.log(...), Effect.as(value))`
  if (isPipeFunction(callee, state)) {
    const self = argumentAt(node, 0);

    const logger = self === undefined ? undefined : loggerName(self, state);

    const step = argumentAt(node, 1);

    const method = asStep(step, state);

    return step === undefined || logger === undefined || method === undefined
      ? undefined
      : { logger, method, node: step };
  }

  // `Effect.as(Effect.log(...), value)` and `Effect.asVoid(Effect.log(...))`
  const method = isAnyApi(callee, state, 'Effect', asMethods) ? canonicalPath(callee, state)?.[1] : undefined;

  const self = argumentAt(node, 0);

  if (method === undefined || self === undefined || (method === 'as' && node.arguments.length !== 2)) {
    return undefined;
  }

  const logger = loggerName(self, state);

  return logger === undefined ? undefined : { logger, method, node };
}

export const noEffectAsOnLog: Rule = defineEffectRule(
  ruleMeta('suggestion', 'Disallow Effect.as, Effect.asSome and Effect.asVoid on log effects.', {
    asOnLog:
      'Do not swap the result of {{logger}} with Effect.{{method}}. Use Effect.gen: `yield*` the log, then return the value.',
    asVoidOnLog: '{{logger}} already succeeds with void; remove Effect.asVoid.',
  }),
  (context, getState) => ({
    CallExpression(node) {
      const match = matchCall(node, getState());

      if (match === undefined) {
        return;
      }

      context.report({
        node: match.node,
        messageId: match.method === 'asVoid' ? 'asVoidOnLog' : 'asOnLog',
        data: { logger: match.logger, method: match.method },
      });
    },
  }),
);
