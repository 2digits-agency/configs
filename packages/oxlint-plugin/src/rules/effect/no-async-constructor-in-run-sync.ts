import type { ESTree, Rule } from '@oxlint/plugins';

import { importedApi } from '../../fixes';
import { argumentAt, defineEffectRule, ruleMeta, staticPropertyName, unwrapExpression } from '../../utils';

function positiveDuration(node: ESTree.Expression | undefined): boolean {
  const expression = node === undefined ? undefined : unwrapExpression(node);

  return (
    expression?.type === 'Literal' &&
    typeof expression.value === 'number' &&
    Number.isFinite(expression.value) &&
    expression.value > 0
  );
}

function pipeHead(node: ESTree.CallExpression): ESTree.Expression | undefined {
  const callee = unwrapExpression(node.callee);

  return callee.type === 'MemberExpression' && staticPropertyName(callee) === 'pipe' ? callee.object : undefined;
}

const meta = ruleMeta(
  'problem',
  'Reject directly visible asynchronous constructors passed to Effect.runSync.',
  {
    promise: 'runSync cannot await this Promise-backed effect. Use an asynchronous runner and adapt the caller.',
    duration: 'runSync cannot await this positive sleep or delay with the default Clock. Use an asynchronous runner.',
  },
  'https://github.com/2digits-agency/configs/issues/2730',
);

export const noAsyncConstructorInRunSync: Rule = defineEffectRule(
  {
    ...meta,
    docs: { ...meta.docs, recommended: false },
  },
  (context, getState) => {
    let effectBindings = new Set<string>();

    function api(node: ESTree.Expression, member: string): boolean {
      let root = unwrapExpression(node);
      const members: Array<string> = [];

      // Wrappers may surround either the API itself or a receiver anywhere in its member chain.
      while (root.type === 'MemberExpression' || root.type === 'ChainExpression') {
        if (root.type === 'ChainExpression') {
          root = unwrapExpression(root.expression);
          continue;
        }
        const property = staticPropertyName(root);

        if (property === undefined) {
          return false;
        }
        members.unshift(property);
        root = unwrapExpression(root.object);
      }

      if (root.type !== 'Identifier' || !effectBindings.has(root.name) || !importedApi(context, root)) {
        return false;
      }
      const imported = getState().bindings.get(root.name);
      const path = [...(imported ?? []), ...members];

      return path.length === 2 && path[0] === 'Effect' && path[1] === member;
    }

    function preservingStep(operator: ESTree.CallExpression['arguments'][number]): ESTree.Expression | undefined {
      if (operator.type === 'SpreadElement') {
        return undefined;
      }
      const step = unwrapExpression(operator);

      if (api(step, 'asVoid')) {
        return step;
      }
      if (step.type !== 'CallExpression' || step.arguments.length !== 1) {
        return undefined;
      }

      return api(step.callee, 'map') ||
        api(step.callee, 'as') ||
        (api(step.callee, 'delay') && positiveDuration(argumentAt(step, 0)))
        ? step
        : undefined;
    }

    function reportConstructor(source: ESTree.Expression, delayed: ESTree.CallExpression | undefined): void {
      if (source.type !== 'CallExpression') {
        return;
      }
      if (api(source.callee, 'promise') || api(source.callee, 'tryPromise')) {
        context.report({ node: source, messageId: 'promise' });
      } else if (api(source.callee, 'sleep') && positiveDuration(argumentAt(source, 0))) {
        context.report({ node: source, messageId: 'duration' });
      } else if (
        delayed !== undefined &&
        ['succeed', 'sync', 'try', 'sleep'].some((member) => api(source.callee, member))
      ) {
        context.report({ node: delayed, messageId: 'duration' });
      }
    }

    function inspect(input: ESTree.Expression, steps: ReadonlyArray<ESTree.CallExpression['arguments'][number]>): void {
      let source = unwrapExpression(input);
      const operators = [...steps];
      let delayed: ESTree.CallExpression | undefined;

      // Only peel directly visible instance pipes and data-first delay. Never enter callbacks or variables.
      while (source.type === 'CallExpression') {
        const head = pipeHead(source);

        if (head !== undefined) {
          operators.push(...source.arguments);
          source = unwrapExpression(head);
        } else if (api(source.callee, 'delay') && source.arguments.length === 2) {
          const first = argumentAt(source, 0);

          if (first === undefined || !positiveDuration(argumentAt(source, 1))) {
            return;
          }
          delayed = source;
          source = unwrapExpression(first);
        } else {
          break;
        }
      }

      for (const operator of operators) {
        const step = preservingStep(operator);

        if (step === undefined) {
          return;
        }
        if (step.type === 'CallExpression' && api(step.callee, 'delay')) {
          delayed = step;
        }
      }

      reportConstructor(source, delayed);
    }

    return {
      before() {
        effectBindings = new Set();
      },
      Program(node) {
        for (const statement of node.body) {
          if (
            statement.type !== 'ImportDeclaration' ||
            statement.importKind === 'type' ||
            !['effect', 'effect/Effect'].includes(statement.source.value)
          ) {
            continue;
          }
          for (const specifier of statement.specifiers) {
            if (
              specifier.type !== 'ImportDefaultSpecifier' &&
              (specifier.type !== 'ImportSpecifier' || specifier.importKind !== 'type')
            ) {
              effectBindings.add(specifier.local.name);
            }
          }
        }
      },
      CallExpression(node) {
        const first = argumentAt(node, 0);

        if (first !== undefined && node.arguments.length === 1 && api(node.callee, 'runSync')) {
          inspect(first, []);

          return;
        }
        const head = pipeHead(node);
        const last = argumentAt(node, node.arguments.length - 1);

        if (head !== undefined && last !== undefined && api(last, 'runSync')) {
          inspect(head, node.arguments.slice(0, -1));
        }
      },
    };
  },
);
