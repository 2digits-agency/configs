import type { ESTree, Rule } from '@oxlint/plugins';

import { importedApi, namespaceImport } from '../../fixes';
import { argumentAt, canonicalPath, defineEffectRule, ruleMeta, unwrapExpression } from '../../utils';

const durationApis = new Set([
  'Effect.delay',
  'Effect.sleep',
  'Effect.timeout',
  'Effect.timeoutOption',
  'Effect.timeoutOrElse',
  'Schedule.fixed',
  'Schedule.spaced',
  'Schedule.windowed',
]);

const unitConstructors: Readonly<Record<string, string>> = {
  ns: 'nanos',
  nano: 'nanos',
  nanos: 'nanos',
  nanosecond: 'nanos',
  nanoseconds: 'nanos',
  us: 'micros',
  micro: 'micros',
  micros: 'micros',
  microsecond: 'micros',
  microseconds: 'micros',
  ms: 'millis',
  milli: 'millis',
  millis: 'millis',
  millisecond: 'millis',
  milliseconds: 'millis',
  sec: 'seconds',
  secs: 'seconds',
  second: 'seconds',
  seconds: 'seconds',
  minute: 'minutes',
  minutes: 'minutes',
  hr: 'hours',
  hrs: 'hours',
  hour: 'hours',
  hours: 'hours',
  day: 'days',
  days: 'days',
  week: 'weeks',
  weeks: 'weeks',
};

// Names that read as a duration even though they carry no explicit unit; `Duration` itself is excluded because
// `const Duration = 1` only shadows the module name.
const durationWords = new Set(['timeout', 'delay', 'interval', 'ttl', 'backoff', 'debounce', 'throttle']);

/**
 * Split `TIMEOUT_MS`, `sessionWindowMs`, and `timeToLive` into lowercase words.
 *
 * @param name - Declared constant name.
 */
function nameWords(name: string): Array<string> {
  return name
    .split(/[^A-Za-z]+/u)
    .flatMap((part) =>
      part
        .replaceAll(/([a-z0-9])([A-Z])/gu, '$1 $2')
        .replaceAll(/([A-Z]+)([A-Z][a-z])/gu, '$1 $2')
        .split(' '),
    )
    .map((word) => word.toLowerCase())
    .filter((word) => word.length > 0);
}

// Words that only count a duration or measure one in another unit, so `TIMEOUT_COUNT` is not a timeout.
const nonDurationWords = new Set(['count', 'retries', 'attempts', 'window', 'at', 'on', 'in', 'from', 'to']);

/**
 * Return the Duration constructor a name advertises, or `millis` when the name only says "duration".
 *
 * A trailing unit is the storage unit: `FIVE_MINUTES_MS` is stored in milliseconds, `timeoutInSeconds` in seconds.
 *
 * @param words - Lowercase words from the constant name.
 */
function advertisedConstructor(words: Array<string>): string | undefined {
  const last = words.at(-1);

  // A trailing unit is the storage unit: `THIRTY_SECONDS_MS` and `timeoutInSeconds` are both unambiguous.
  if (last !== undefined && unitConstructors[last] !== undefined) {
    return unitConstructors[last];
  }

  // A trailing qualifier (`TIMEOUT_COUNT`, `SESSION_WINDOW_MINUTES`) describes the number, not a duration.
  if (last !== undefined && nonDurationWords.has(last)) {
    return undefined;
  }

  for (const word of words) {
    if (unitConstructors[word] !== undefined) {
      return unitConstructors[word];
    }
  }

  const generic = words.some(
    (word, index) =>
      durationWords.has(word) || (word === 'time' && words[index + 1] === 'to' && words[index + 2] === 'live'),
  );

  return generic ? 'millis' : undefined;
}

/**
 * Find the root type name behind `Duration`, `Duration.Duration`, and `Duration.Input`.
 *
 * @param node - Type name to resolve.
 */
function typeName(node: ESTree.TSTypeName): string | undefined {
  let current = node;

  while (current.type === 'TSQualifiedName') {
    current = current.left;
  }

  return current.type === 'Identifier' ? current.name : undefined;
}

/**
 * Recognize a `Duration`, `Duration.Duration`, or `Duration.Input` annotation on the declared constant.
 *
 * @param node - Declared binding.
 */
function hasDurationAnnotation(node: ESTree.BindingIdentifier): boolean {
  const annotation = node.typeAnnotation?.typeAnnotation;

  return annotation?.type === 'TSTypeReference' && typeName(annotation.typeName) === 'Duration';
}

/**
 * Check whether an expression tree contains a numeric literal.
 *
 * @param node - Expression to inspect.
 */
function containsNumberLiteral(node: ESTree.Expression): boolean {
  let current = node;

  for (;;) {
    const expression = unwrapExpression(current);

    if (expression.type === 'Literal') {
      return typeof expression.value === 'number';
    }

    if (expression.type === 'UnaryExpression') {
      current = expression.argument;

      continue;
    }

    if (expression.type !== 'BinaryExpression' || expression.operator !== '*') {
      return false;
    }

    if (containsNumberLiteral(expression.left)) {
      return true;
    }

    current = expression.right;
  }
}

/**
 * Recognize the numeric shapes duration constants are written in: `5000`, `30 * 1000`, `BASE_DELAY_MS * 2`.
 *
 * Aliases (`const TIMEOUT = OTHER_MS`) and computed values stay unreported; the aliased declaration is the one to fix.
 *
 * @param node - Initializer expression.
 */
function isDurationValue(node: ESTree.Expression): boolean {
  const expression = unwrapExpression(node);

  if (expression.type === 'Literal') {
    // Zero and negative literals are usually sentinels ("no timeout"), not ambiguous millisecond amounts.
    return typeof expression.value === 'number' && expression.value > 0;
  }

  if (expression.type === 'UnaryExpression') {
    // `-1` is a sentinel for "no timeout"; only fold a sign into a larger amount such as `-5 * 1000`.
    return expression.operator === '+' && isDurationValue(expression.argument);
  }

  if (expression.type === 'BinaryExpression' && expression.operator === '*') {
    return containsNumberLiteral(expression) && isDurationFactor(expression.left) && isDurationFactor(expression.right);
  }

  return false;
}

/**
 * Check whether an operand can scale a duration amount.
 *
 * @param node - Multiplication operand.
 */
function isDurationFactor(node: ESTree.Expression): boolean {
  const expression = unwrapExpression(node);

  return expression.type === 'Identifier' || isDurationValue(expression);
}

export const preferEffectDuration: Rule = defineEffectRule(
  {
    ...ruleMeta(
      'suggestion',
      'Prefer explicit Effect Duration constructors over ambiguous millisecond literals.',
      {
        effectDuration: 'Wrap this number with Duration.millis or use a more descriptive Duration constructor.',
        effectDurationConstant:
          'Define {{name}} with Duration.{{constructor}} instead of a bare number, so its unit cannot be misread. Use Duration.toMillis({{name}}) where a plain millisecond number is required.',
      },
      'https://www.effect.website/docs/v4/api/effect/Duration',
    ),
    fixable: 'code',
  },
  (context, getState) => ({
    VariableDeclarator(node) {
      // Only immutable bindings keep the Duration type they are declared with; a `let` can be reassigned a number.
      // A Duration-annotated constant is already migrated, whatever its initializer looks like to this syntax check.
      if (
        !getState().hasEffectImport ||
        node.id.type !== 'Identifier' ||
        !node.init ||
        node.parent.type !== 'VariableDeclaration' ||
        node.parent.kind !== 'const' ||
        hasDurationAnnotation(node.id)
      ) {
        return;
      }

      const constructor = advertisedConstructor(nameWords(node.id.name));

      if (constructor === undefined || !isDurationValue(node.init)) {
        return;
      }

      // No autofix: unlike an Effect API argument, a constant can also feed number-typed APIs such as setTimeout.
      context.report({
        node: node.init,
        messageId: 'effectDurationConstant',
        data: { name: node.id.name, constructor },
      });
    },
    CallExpression(node) {
      const path = canonicalPath(node.callee, getState());

      if (path === undefined || !durationApis.has(path.join('.'))) {
        return;
      }

      const duration = argumentAt(node, node.arguments.length - 1);

      if (duration?.type === 'Literal' && typeof duration.value === 'number') {
        context.report({
          node: duration,
          messageId: 'effectDuration',
          fix(fixer) {
            if (!importedApi(context, node.callee)) {
              return;
            }

            const imported = namespaceImport(context, node, 'effect/Duration', 'Duration', fixer);

            return [
              ...imported.fixes,
              fixer.replaceText(duration, `${imported.name}.millis(${context.sourceCode.getText(duration)})`),
            ];
          },
        });
      }
    },
  }),
);
