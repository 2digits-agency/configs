import type { Context, ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';
import * as Str from 'effect/String';

import {
  defineEffectRule,
  resolveVariable,
  ruleMeta,
  soleDefinition,
  unwrapExpression,
  walkNodes,
  type FileState,
} from '../../utils';
import { durationArgument, durationConstructor, numericValue, timeArithmetic, type DurationUnit } from './duration';

type NumericDeclarator = ESTree.VariableDeclarator & {
  readonly id: ESTree.BindingIdentifier;
  readonly init: ESTree.Expression;
};

const unitWords = new Map<string, DurationUnit>([
  ['ms', 'millis'],
  ['milli', 'millis'],
  ['millis', 'millis'],
  ['millisecond', 'millis'],
  ['milliseconds', 'millis'],
  ['sec', 'seconds'],
  ['secs', 'seconds'],
  ['seconds', 'seconds'],
  ['mins', 'minutes'],
  ['minutes', 'minutes'],
  ['hr', 'hours'],
  ['hrs', 'hours'],
  ['hours', 'hours'],
  ['days', 'days'],
  ['weeks', 'weeks'],
]);

const singularUnits = new Set(['day', 'hour', 'minute', 'second', 'week']);

// Singular units name a quantity (`ONE_DAY`), not the unit of the number, so they only mark the name as a duration.
const durationWords = new Set([
  'backoff',
  'cooldown',
  'day',
  'debounce',
  'delay',
  'duration',
  'expiration',
  'expiry',
  'hour',
  'interval',
  'lifetime',
  'minute',
  'second',
  'throttle',
  'timeout',
  'ttl',
  'week',
]);

const words = Fn.flow(
  Str.split(/[_$]+|(?<=[\da-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/u),
  Arr.filter(Str.isNonEmpty),
  Arr.map(Str.toLowerCase),
);

// Conversion factors (`MS_PER_SECOND`, see also `SECONDS_IN_MINUTE` below), rates (`REQUESTS_PER_SECOND`), and timestamps (`CREATED_AT_MS`) are not durations.
const nonDurationWords = new Set(['at', 'epoch', 'per', 'timestamp']);

type NameUnit = DurationUnit | 'excluded' | 'unknown' | undefined;

function isUnit(named: NameUnit): named is DurationUnit {
  return named !== undefined && named !== 'excluded' && named !== 'unknown';
}

/**
 * Classify a binding name by its last word: a unit (`TIMEOUT_MS`, `ttlSeconds`) or a duration concept
 * (`REQUEST_TIMEOUT`, `ONE_DAY`, `maxAge`, `expiresIn`). Earlier words do not count, so `RETRY_DELAY_FACTOR` is not a
 * duration, except for words that mark a factor, rate, or timestamp.
 *
 * @param name Binding name.
 */
function nameUnit(name: string): NameUnit {
  const parts = words(name);

  const inIndex = parts.indexOf('in');

  // `SECONDS_IN_MINUTE` converts between units; `ttlInMinutes` and `expiresIn` are still durations.
  const before = parts[inIndex - 1] ?? '';

  const conversion = inIndex > 0 && inIndex < parts.length - 1 && (unitWords.has(before) || singularUnits.has(before));

  if (conversion || Arr.some(parts, (part) => nonDurationWords.has(part))) {
    return 'excluded';
  }

  const last = parts.at(-1);

  const previous = parts.at(-2);

  if (last === undefined) {
    return undefined;
  }

  const unit = unitWords.get(last);

  if (unit !== undefined) {
    return unit;
  }

  if (durationWords.has(last) || (last === 'age' && previous === 'max') || (last === 'in' && previous === 'expires')) {
    return 'unknown';
  }

  return undefined;
}

function resolvesToImport(node: ESTree.Node, name: string, context: Context): boolean {
  return Arr.some(
    resolveVariable(context, node, name)?.defs ?? [],
    (definition) => definition.type === 'ImportBinding',
  );
}

type TypeNamePath = ReadonlyArray<string> | undefined;

const typeNamePath: (node: ESTree.TSTypeName) => TypeNamePath = Match.type<ESTree.TSTypeName>().pipe(
  Match.discriminators('type')({
    Identifier: ({ name }): TypeNamePath => [name],
    TSQualifiedName: ({ left, right }): TypeNamePath => {
      const path = typeNamePath(left);

      return path === undefined ? undefined : Arr.append(path, right.name);
    },
  }),
  Match.orElse(Fn.constUndefined),
);

/**
 * Whether an annotation references a type from Effect's Duration module through its import binding, such as
 * `Duration.Input`, `D.Duration` from `import type * as D from 'effect/Duration'`, or `Duration.Duration` from
 * `effect`.
 *
 * @param annotation Type annotation to inspect.
 * @param context Rule context, used to reject shadowed type names.
 * @param state Effect import bindings for the file.
 */
function durationAnnotation(annotation: ESTree.Node, context: Context, state: FileState): boolean {
  return walkNodes(annotation, (node) => {
    if (node.type !== 'TSTypeReference') {
      return false;
    }

    const [root, ...rest] = typeNamePath(node.typeName) ?? [];

    // Local types that shadow the import, such as an inner `type Input = number`, are not Effect's.
    const imported =
      root === undefined || !resolvesToImport(node, root, context) ? undefined : state.bindings?.get(root);

    return imported !== undefined && [...imported, ...rest][0] === 'Duration';
  });
}

function numericDeclarator(node: ESTree.VariableDeclarator): node is NumericDeclarator {
  return (
    node.parent.type === 'VariableDeclaration' &&
    node.parent.kind === 'const' &&
    node.id.type === 'Identifier' &&
    node.init !== null &&
    numericValue(node.init) !== undefined
  );
}

function declaratorOf(node: ESTree.Expression, context: Context): NumericDeclarator | undefined {
  const expression = unwrapExpression(node);

  if (expression.type !== 'Identifier') {
    return undefined;
  }

  const declaration = soleDefinition(resolveVariable(context, expression, expression.name))?.node;

  return declaration?.type === 'VariableDeclarator' && numericDeclarator(declaration) ? declaration : undefined;
}

export const preferEffectDurationConstants: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer Effect Duration values over plain-number duration constants.',
    {
      durationConstant:
        '{{name}} holds a duration as a plain number. Declare it as {{replacement}} and convert at non-Effect boundaries with Duration.toMillis or Duration.toSeconds.',
    },
    'https://www.effect.website/docs/v4/api/effect/Duration',
  ),
  (context, getState) => {
    // Classify at the end of the file so forward references and declaration order do not change the suggestion.
    let candidates = new Map<NumericDeclarator, boolean>();

    function durationUnit(node: NumericDeclarator, passedAsDuration: boolean): DurationUnit | 'none' | undefined {
      // `const TIMEOUT: Duration.Input = 5000` already opts into Duration.
      if (node.id.typeAnnotation && durationAnnotation(node.id.typeAnnotation, context, getState())) {
        return 'none';
      }

      const named = nameUnit(node.id.name);

      // Effect reads a plain number passed as `Duration.Input` as milliseconds.
      if (passedAsDuration) {
        return isUnit(named) ? named : 'millis';
      }

      // Zero and negative values are usually sentinels such as "disabled" or "no timeout".
      if (named === 'excluded' || (numericValue(node.init) ?? 0) <= 0) {
        return 'none';
      }

      if (isUnit(named)) {
        return named;
      }

      const arithmetic = timeArithmetic(node.init);

      if (arithmetic?.millis === true) {
        return 'millis';
      }

      return arithmetic !== undefined || named === 'unknown' ? undefined : 'none';
    }

    return {
      before() {
        candidates = new Map();
      },
      VariableDeclarator(node) {
        if (getState().hasEffectImport && numericDeclarator(node) && !candidates.has(node)) {
          candidates.set(node, false);
        }
      },
      CallExpression(node) {
        const argument = durationArgument(node, context, getState());

        const declarator = argument === undefined ? undefined : declaratorOf(argument, context);

        if (declarator !== undefined) {
          candidates.set(declarator, true);
        }
      },
      'Program:exit': function reportCandidates() {
        for (const [node, passedAsDuration] of candidates) {
          const unit = durationUnit(node, passedAsDuration);

          const value = numericValue(node.init);

          if (unit === 'none') {
            continue;
          }

          context.report({
            node: node.id,
            messageId: 'durationConstant',
            data: {
              name: node.id.name,
              replacement:
                unit === undefined || value === undefined
                  ? 'a Duration constructor such as Duration.seconds'
                  : durationConstructor(value, unit),
            },
          });
        }
      },
    };
  },
);
