import type * as EffectBarrel from 'effect';
import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import type * as Console from 'effect/Console';
import * as Effect from 'effect/Effect';
import type * as Fn from 'effect/Function';
import * as Opt from 'effect/Option';

import { argumentAt, staticPropertyName, unwrapExpression } from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

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

/**
 * A log effect whose result an `Effect.as*` step replaces.
 */
interface AsOnLog {
  readonly logger: string;
  readonly method: string;
  readonly node: ESTree.Node;
}

/**
 * The name of a log effect, as printed in messages: `Effect.log*(…)`, `Effect.logWithLevel(level)(…)` or
 * `Console.log(…)` and similar.
 *
 * @param node Expression.
 * @param imports Import bindings of the file.
 */
function loggerName(node: ESTree.Expression, imports: ImportBindings): Opt.Option<string> {
  const expression = unwrapExpression(node);

  if (expression.type !== 'CallExpression') {
    return Opt.none();
  }

  const callee = unwrapExpression(expression.callee);

  if (
    callee.type === 'CallExpression' &&
    imports.isApiPath(callee.callee, ['Effect', 'logWithLevel' satisfies keyof typeof Effect])
  ) {
    return Opt.some('Effect.logWithLevel');
  }

  return imports.isApi(callee, 'Effect', effectLogMethods) || imports.isApi(callee, 'Console', consoleLogMethods)
    ? Opt.some(
        imports.path(callee).pipe(
          Opt.getOrElse(() => []),
          Arr.join('.'),
        ),
      )
    : Opt.none();
}

function effectMember(node: ESTree.Node, imports: ImportBindings): Opt.Option<string> {
  return Opt.flatMap(imports.path(node), ([, member]) => Opt.fromNullishOr(member));
}

/**
 * The `Effect.as*` method of a data-last pipe step: `Effect.as(value)`, `Effect.asVoid` or `Effect.asSome`.
 *
 * @param node Pipe step.
 * @param imports Import bindings of the file.
 */
function asStep(node: ESTree.Expression, imports: ImportBindings): Opt.Option<string> {
  const step = unwrapExpression(node);

  if (
    step.type === 'CallExpression' &&
    step.arguments.length === 1 &&
    imports.isApiPath(step.callee, ['Effect', 'as' satisfies keyof typeof Effect])
  ) {
    return Opt.some('as');
  }

  return imports.isApi(step, 'Effect', ['asSome', 'asVoid'] satisfies ReadonlyArray<keyof typeof Effect>)
    ? effectMember(step, imports)
    : Opt.none();
}

function isPipeFunction(node: ESTree.Node, imports: ImportBindings): boolean {
  return (
    imports.isApiPath(node, ['pipe' satisfies keyof typeof EffectBarrel]) ||
    imports.isApiPath(node, ['Function', 'pipe' satisfies keyof typeof Fn])
  );
}

function pipedAsOnLog(
  self: Opt.Option<ESTree.Expression>,
  step: Opt.Option<ESTree.Expression>,
  imports: ImportBindings,
): Opt.Option<AsOnLog> {
  return Opt.flatMap(step, (node) =>
    self.pipe(
      Opt.flatMap((value) => loggerName(value, imports)),
      Opt.zipWith(asStep(node, imports), (logger, method): AsOnLog => ({ logger, method, node })),
    ),
  );
}

function matchCall(node: ESTree.CallExpression, imports: ImportBindings): Opt.Option<AsOnLog> {
  const callee = unwrapExpression(node.callee);

  // `Effect.log(...).pipe(Effect.as(value))`
  if (callee.type === 'MemberExpression' && Opt.contains(staticPropertyName(callee), 'pipe')) {
    return pipedAsOnLog(Opt.some(callee.object), argumentAt(node, 0), imports);
  }

  // `pipe(Effect.log(...), Effect.as(value))`
  if (isPipeFunction(callee, imports)) {
    return pipedAsOnLog(argumentAt(node, 0), argumentAt(node, 1), imports);
  }

  // `Effect.as(Effect.log(...), value)` and `Effect.asVoid(Effect.log(...))`
  const method = imports.isApi(callee, 'Effect', asMethods) ? effectMember(callee, imports) : Opt.none();

  return method.pipe(
    Opt.filter((name) => name !== 'as' || node.arguments.length === 2),
    Opt.flatMap((name) =>
      argumentAt(node, 0).pipe(
        Opt.flatMap((self) => loggerName(self, imports)),
        Opt.map((logger): AsOnLog => ({ logger, method: name, node })),
      ),
    ),
  );
}

export const noEffectAsOnLog = Rule.define({
  name: 'no-effect-as-on-log',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Disallow Effect.as, Effect.asSome and Effect.asVoid on log effects.',
    messages: {
      asOnLog:
        'Do not swap the result of {{logger}} with Effect.{{method}}. Use Effect.gen: `yield*` the log, then return the value.',
      asVoidOnLog: '{{logger}} already succeeds with void; remove Effect.asVoid.',
    },
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      Opt.match(matchCall(node, imports), {
        onNone: () => Effect.void,
        onSome: (match) =>
          ctx.report(
            Diagnostic.fromId({
              node: match.node,
              messageId: match.method === 'asVoid' ? 'asVoidOnLog' : 'asOnLog',
              data: { logger: match.logger, method: match.method },
            }),
          ),
      }),
    );
  },
});
