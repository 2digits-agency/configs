import { type RuleFunction, type RuleToolkit, merge } from '@eslint-react/kit';
import type { Reference, Scope } from '@typescript-eslint/scope-manager';
import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import type { RuleContext, RuleListener } from '@typescript-eslint/utils/ts-eslint';

const BROWSER_GLOBALS = new Set(['document', 'localStorage', 'navigator', 'sessionStorage', 'window']);

const BROWSER_GLOBALS_PATTERN = /\b(?:document|localStorage|navigator|sessionStorage|window)\b/u;

/**
 * Array methods that call their callback synchronously, so a callback created during render also runs during it.
 */
const SYNCHRONOUS_ARRAY_METHODS = new Set([
  'every',
  'filter',
  'find',
  'findIndex',
  'findLast',
  'findLastIndex',
  'flatMap',
  'forEach',
  'map',
  'reduce',
  'reduceRight',
  'some',
  'sort',
  'toSorted',
]);

type FunctionNode = TSESTree.ArrowFunctionExpression | TSESTree.FunctionDeclaration | TSESTree.FunctionExpression;

export function noBrowserApiInRender(): RuleFunction {
  return noBrowserApiInRenderImpl;
}

function noBrowserApiInRenderImpl(context: RuleContext, { collect, is }: RuleToolkit): RuleListener {
  if (!BROWSER_GLOBALS_PATTERN.test(context.sourceCode.text)) {
    return {};
  }

  const components = collect.components(context);

  const hooks = collect.hooks(context);

  function isRenderTimeCallback(fn: FunctionNode): boolean {
    const { parent } = fn;

    if (parent.type !== AST_NODE_TYPES.CallExpression) {
      return false;
    }

    const { arguments: callArguments, callee } = parent;

    if (callee === fn) {
      return true;
    }

    const [first, , third] = callArguments;

    if (is.useStateCall(parent) || is.useMemoCall(parent)) {
      return first === fn;
    }

    if (is.useReducerCall(parent)) {
      return third === fn;
    }

    return (
      first === fn &&
      callee.type === AST_NODE_TYPES.MemberExpression &&
      !callee.computed &&
      callee.property.type === AST_NODE_TYPES.Identifier &&
      SYNCHRONOUS_ARRAY_METHODS.has(callee.property.name)
    );
  }

  function runsDuringRender(node: TSESTree.Node, renderFunctions: ReadonlySet<TSESTree.Node>): boolean {
    for (let current = node.parent; current !== undefined; current = current.parent) {
      if (!isFunction(current)) {
        continue;
      }

      if (renderFunctions.has(current)) {
        return true;
      }

      if (!isRenderTimeCallback(current)) {
        return false;
      }
    }

    return false;
  }

  function programExit(program: TSESTree.Program) {
    const renderFunctions = new Set<TSESTree.Node>([
      ...components.query.all(program).map(({ node }) => node),
      ...hooks.query.all(program).map(({ node }) => node),
    ]);

    if (renderFunctions.size === 0) {
      return;
    }

    const references = getGlobalReferences(context.sourceCode.scopeManager?.globalScope);

    for (const reference of references) {
      const read = getBrowserApiRead(reference);

      if (read === undefined || !runsDuringRender(read.node, renderFunctions)) {
        continue;
      }

      context.report({ message: browserApiInRenderMessage(read.name), node: read.node });
    }
  }

  return merge(components.visitor, hooks.visitor, {
    'Program:exit': programExit,
  });
}

export function browserApiInRenderMessage(name: string): string {
  return `Reading \`${name}\` during render makes the server and client render differ, even behind a \`typeof window\` check. Read it in \`useEffect\` or subscribe with \`useSyncExternalStore\`.`;
}

/**
 * References to globals that no local declaration shadows, whether or not the config declares them.
 *
 * @param globalScope The file's global scope.
 */
function getGlobalReferences(globalScope: Scope | null | undefined): Set<Reference> {
  const references = new Set<Reference>();

  if (!globalScope) {
    return references;
  }

  for (const reference of globalScope.through) {
    references.add(reference);
  }

  for (const variable of globalScope.variables) {
    if (variable.defs.length === 0) {
      for (const reference of variable.references) {
        references.add(reference);
      }
    }
  }

  return references;
}

function getBrowserApiRead(reference: Reference): { name: string; node: TSESTree.Node } | undefined {
  const { identifier } = reference;

  if (!reference.isValueReference || identifier.type !== AST_NODE_TYPES.Identifier) {
    return;
  }

  let name: string;

  let node: TSESTree.Identifier | TSESTree.MemberExpression;

  if (BROWSER_GLOBALS.has(identifier.name)) {
    name = identifier.name;

    node = identifier;
  } else if (identifier.name === 'globalThis') {
    const { parent } = identifier;

    if (parent.type !== AST_NODE_TYPES.MemberExpression) {
      return;
    }

    const property = getPropertyName(parent);

    if (property === undefined || !BROWSER_GLOBALS.has(property)) {
      return;
    }

    name = `globalThis.${property}`;

    node = parent;
  } else {
    return;
  }

  const { parent } = node;

  // `typeof window` only checks the environment; the reads it guards are what this rule reports.
  // In a type (`typeof window`, `typeof window.document`), it does not run at all.
  if (
    (parent.type === AST_NODE_TYPES.UnaryExpression && parent.operator === 'typeof') ||
    parent.type === AST_NODE_TYPES.TSTypeQuery ||
    parent.type === AST_NODE_TYPES.TSQualifiedName
  ) {
    return;
  }

  return { name, node };
}

function getPropertyName(node: TSESTree.MemberExpression): string | undefined {
  const { computed, property } = node;

  if (!computed && property.type === AST_NODE_TYPES.Identifier) {
    return property.name;
  }

  return computed && property.type === AST_NODE_TYPES.Literal && typeof property.value === 'string'
    ? property.value
    : undefined;
}

function isFunction(node: TSESTree.Node): node is FunctionNode {
  return (
    node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    node.type === AST_NODE_TYPES.FunctionDeclaration ||
    node.type === AST_NODE_TYPES.FunctionExpression
  );
}
