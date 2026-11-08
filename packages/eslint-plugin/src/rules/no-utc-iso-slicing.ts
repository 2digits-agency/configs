import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils';

type MessageId = 'utcIsoSlicing';

export const RULE_NAME = 'no-utc-iso-slicing';

const STRING_METHODS = new Set(['replace', 'replaceAll', 'slice', 'split', 'substr', 'substring']);

const STRING_STEPS = new Set(['replace', 'replaceAll', 'slice', 'split', 'substring', 'takeLeft', 'takeRight']);

// `Str.split(self, separator)`, `Str.takeLeft(self, n)` and `Str.takeRight(self, n)` are dual.
const DATA_FIRST_STRING_STEPS = new Set(['split', 'takeLeft', 'takeRight']);

const PIPE_FUNCTIONS = new Set(['flow', 'pipe']);

// The Effect module an import source stands for: `effect/DateTime` is `DateTime`, the `effect` barrel is the root.
function effectModule(source: string): Array<string> | undefined {
  if (source === 'effect') {
    return [];
  }

  const name = /^effect\/(?<name>\p{Lu}\w*)$/u.exec(source)?.groups?.name;

  return name === undefined ? undefined : [name];
}

function collectBindings(program: TSESTree.Program): Map<string, Array<string>> {
  const bindings = new Map<string, Array<string>>();

  for (const statement of program.body) {
    if (statement.type !== AST_NODE_TYPES.ImportDeclaration) {
      continue;
    }

    const path = effectModule(statement.source.value);

    if (path === undefined) {
      continue;
    }

    for (const specifier of statement.specifiers) {
      if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
        const { imported } = specifier;

        bindings.set(specifier.local.name, [
          ...path,
          imported.type === AST_NODE_TYPES.Identifier ? imported.name : imported.value,
        ]);
      } else {
        bindings.set(specifier.local.name, path);
      }
    }
  }

  return bindings;
}

function unwrap(node: TSESTree.Node): TSESTree.Node {
  let current = node;

  while (
    current.type === AST_NODE_TYPES.ChainExpression ||
    current.type === AST_NODE_TYPES.TSAsExpression ||
    current.type === AST_NODE_TYPES.TSNonNullExpression ||
    current.type === AST_NODE_TYPES.TSSatisfiesExpression ||
    current.type === AST_NODE_TYPES.TSTypeAssertion
  ) {
    current = current.expression;
  }

  return current;
}

function propertyName(node: TSESTree.MemberExpression): string | undefined {
  if (!node.computed && node.property.type === AST_NODE_TYPES.Identifier) {
    return node.property.name;
  }

  return node.property.type === AST_NODE_TYPES.Literal && typeof node.property.value === 'string'
    ? node.property.value
    : undefined;
}

export const noUtcIsoSlicing = createRule<[], MessageId>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow slicing or rewriting a UTC ISO string to get a local date or time',
    },
    schema: [],
    messages: {
      utcIsoSlicing:
        'toISOString() and DateTime.formatIso give UTC, so slicing or rewriting them gives the UTC date and time: in Europe/Amsterdam the previous day between 00:00 and 02:00, and +00:00 instead of +01:00/+02:00. Format in an explicit zone instead: DateTime.setZone with DateTime.formatIsoDate, formatIsoOffset or formatIsoZoned, or Intl.DateTimeFormat with timeZone.',
    },
    defaultOptions: [],
  },
  create(context) {
    let bindings = new Map<string, Array<string>>();

    // The Effect API a callee refers to, such as `['DateTime', 'formatIso']` for `DT.formatIso`.
    function effectApi(node: TSESTree.Node): string | undefined {
      const path: Array<string> = [];

      let current = unwrap(node);

      while (current.type === AST_NODE_TYPES.MemberExpression) {
        const property = propertyName(current);

        if (property === undefined) {
          return undefined;
        }

        path.unshift(property);

        current = unwrap(current.object);
      }

      const imported = current.type === AST_NODE_TYPES.Identifier ? bindings.get(current.name) : undefined;

      return imported === undefined ? undefined : [...imported, ...path].join('.');
    }

    function isStringStep(node: TSESTree.Node | undefined, steps = STRING_STEPS): boolean {
      const api = node === undefined ? undefined : effectApi(node);

      return api?.startsWith('String.') === true && steps.has(api.slice('String.'.length));
    }

    // `x.toISOString()` or `DateTime.formatIso(x)`: a UTC timestamp such as `2026-03-29T23:30:00.000Z`.
    function isUtcIsoString(node: TSESTree.Node | undefined): boolean {
      const expression = node === undefined ? undefined : unwrap(node);

      if (expression?.type !== AST_NODE_TYPES.CallExpression) {
        return false;
      }

      const callee = unwrap(expression.callee);

      return (
        (callee.type === AST_NODE_TYPES.MemberExpression &&
          propertyName(callee) === 'toISOString' &&
          expression.arguments.length === 0) ||
        effectApi(callee) === 'DateTime.formatIso'
      );
    }

    // The values and steps of `self.pipe(...)`, `pipe(...)` or `flow(...)`, in order.
    function pipeSequence(node: TSESTree.CallExpression): Array<TSESTree.Node> | undefined {
      if (node.arguments.some((argument) => argument.type === AST_NODE_TYPES.SpreadElement)) {
        return undefined;
      }

      const callee = unwrap(node.callee);

      if (callee.type === AST_NODE_TYPES.MemberExpression && propertyName(callee) === 'pipe') {
        return [callee.object, ...node.arguments];
      }

      const api = effectApi(callee);

      return api !== undefined && PIPE_FUNCTIONS.has(api.replace(/^Function\./, '')) ? node.arguments : undefined;
    }

    // The node to report when `node` slices or rewrites a UTC ISO string.
    function slicedUtcIso(node: TSESTree.CallExpression): TSESTree.Node | undefined {
      const callee = unwrap(node.callee);

      const [first] = node.arguments;

      if (
        // `x.toISOString().slice(0, 10)`
        (callee.type === AST_NODE_TYPES.MemberExpression &&
          STRING_METHODS.has(propertyName(callee) ?? '') &&
          isUtcIsoString(callee.object)) ||
        // `Str.split(DateTime.formatIso(x), 'T')`
        (node.arguments.length === 2 && isStringStep(callee, DATA_FIRST_STRING_STEPS) && isUtcIsoString(first)) ||
        // `Str.slice(0, 10)(DateTime.formatIso(x))`
        (node.arguments.length === 1 &&
          callee.type === AST_NODE_TYPES.CallExpression &&
          isStringStep(callee.callee) &&
          isUtcIsoString(first))
      ) {
        return node;
      }

      // `pipe(DateTime.formatIso(x), Str.slice(0, 10))`, `x.pipe(DateTime.formatIso, Str.slice(0, 10))` and similar
      const sequence = pipeSequence(node);

      return sequence?.find((step, index) => {
        const previous = sequence[index - 1];

        return (
          previous !== undefined &&
          unwrap(step).type === AST_NODE_TYPES.CallExpression &&
          isStringStep((unwrap(step) as TSESTree.CallExpression).callee) &&
          (isUtcIsoString(previous) || effectApi(previous) === 'DateTime.formatIso')
        );
      });
    }

    return {
      Program(node) {
        bindings = collectBindings(node);
      },
      CallExpression(node) {
        const reported = slicedUtcIso(node);

        if (reported !== undefined) {
          context.report({ node: reported, messageId: 'utcIsoSlicing' });
        }
      },
    };
  },
});
