import type { ESTree, Reference, Rule, Scope } from '@oxlint/plugins';

import { argumentAt, defineSyntaxRule, type FunctionNode, ruleMeta, staticPropertyName, walkNodes } from '../../utils';

const BROWSER_GLOBALS: ReadonlySet<string> = new Set([
  'document',
  'localStorage',
  'navigator',
  'sessionStorage',
  'window',
]);

const BROWSER_GLOBALS_PATTERN = /\b(?:document|localStorage|navigator|sessionStorage|window)\b/u;

/**
 * Array methods that call their callback synchronously, so a callback created during render also runs during it.
 */
const SYNCHRONOUS_ARRAY_METHODS: ReadonlySet<string> = new Set([
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

/**
 * Hooks whose callback argument at this index runs during render.
 */
const RENDER_TIME_HOOK_CALLBACKS: ReadonlyMap<string, number> = new Map([
  ['useMemo', 0],
  ['useReducer', 2],
  ['useState', 0],
]);

const COMPONENT_WRAPPERS: ReadonlySet<string> = new Set(['forwardRef', 'memo']);

/**
 * Report browser-only globals read while a component or hook renders; the server render cannot match them, and a
 * `typeof window` guard is what makes the two renders differ.
 */
export const noBrowserApiInRender: Rule = defineSyntaxRule(
  ruleMeta(
    'problem',
    'Disallow reading browser-only APIs while a React component or hook renders.',
    {
      browserApiInRender:
        'Reading `{{name}}` during render makes the server and client render differ, even behind a `typeof window` check. Read it in `useEffect` or subscribe with `useSyncExternalStore`.',
    },
    'https://react.dev/reference/react-dom/client/hydrateRoot#handling-different-client-and-server-content',
  ),
  (context) => {
    function programExit() {
      if (!BROWSER_GLOBALS_PATTERN.test(context.sourceCode.text)) {
        return;
      }

      const references = globalReferences(context.sourceCode.scopeManager.globalScope);

      for (const reference of references) {
        const read = browserApiRead(reference.identifier);

        if (read !== undefined && runsDuringRender(read.node)) {
          context.report({ node: read.node, messageId: 'browserApiInRender', data: { name: read.name } });
        }
      }
    }

    return { 'Program:exit': programExit };
  },
);

/**
 * References to globals that no local declaration shadows, whether or not the config declares them.
 *
 * @param globalScope The file's global scope.
 */
function globalReferences(globalScope: Scope | null): Set<Reference> {
  const references = new Set<Reference>(globalScope?.through);

  if (globalScope === null) {
    return references;
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

function browserApiRead(identifier: ESTree.Node): { name: string; node: ESTree.Node } | undefined {
  if (identifier.type !== 'Identifier') {
    return undefined;
  }

  let name = identifier.name;

  let node: ESTree.Node = identifier;

  if (name === 'globalThis') {
    const { parent } = identifier;

    const property = parent.type === 'MemberExpression' ? staticPropertyName(parent) : undefined;

    if (property === undefined || !BROWSER_GLOBALS.has(property)) {
      return undefined;
    }

    name = `globalThis.${property}`;

    node = parent;
  } else if (!BROWSER_GLOBALS.has(name)) {
    return undefined;
  }

  const { parent } = node;

  // `typeof window` only checks the environment; the reads it guards are what this rule reports.
  // In a type (`typeof window`, `typeof window.document`), it does not run at all.
  if (
    (parent?.type === 'UnaryExpression' && parent.operator === 'typeof') ||
    parent?.type === 'TSTypeQuery' ||
    parent?.type === 'TSQualifiedName'
  ) {
    return undefined;
  }

  return { name, node };
}

function runsDuringRender(node: ESTree.Node): boolean {
  for (let current = node.parent; current; current = current.parent) {
    if (!isFunction(current)) {
      continue;
    }

    if (isComponentOrHook(current)) {
      return true;
    }

    if (!isRenderTimeCallback(current)) {
      return false;
    }
  }

  return false;
}

/**
 * Unlike `isFunctionNode`, includes function declarations, the usual way to write a component.
 *
 * @param node Any node.
 */
function isFunction(node: ESTree.Node): node is FunctionNode {
  return (
    node.type === 'ArrowFunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression'
  );
}

function isComponentOrHook(fn: FunctionNode): boolean {
  const name = functionName(fn);

  if (name === undefined) {
    return false;
  }

  if (/^use[A-Z0-9]/u.test(name)) {
    return true;
  }

  return (
    /^_?[A-Z]/u.test(name) &&
    fn.body !== null &&
    walkNodes(fn.body, (child) => child.type === 'JSXElement' || child.type === 'JSXFragment')
  );
}

/**
 * The declared name of a function, also through `const Name = memo(() => ...)`.
 *
 * @param fn Function node.
 */
function functionName(fn: FunctionNode): string | undefined {
  if (fn.type !== 'ArrowFunctionExpression' && fn.id) {
    return fn.id.name;
  }

  let node: ESTree.Node = fn;

  while (node.parent.type === 'CallExpression' && isComponentWrapper(node.parent.callee)) {
    node = node.parent;
  }

  const { parent } = node;

  return parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier' ? parent.id.name : undefined;
}

function isComponentWrapper(callee: ESTree.Node): boolean {
  const name = calleeName(callee);

  return name !== undefined && COMPONENT_WRAPPERS.has(name);
}

function calleeName(callee: ESTree.Node): string | undefined {
  if (callee.type === 'Identifier') {
    return callee.name;
  }

  return callee.type === 'MemberExpression' ? staticPropertyName(callee) : undefined;
}

function isRenderTimeCallback(fn: FunctionNode): boolean {
  const call = fn.parent;

  if (call.type !== 'CallExpression') {
    return false;
  }

  if (call.callee === fn) {
    return true;
  }

  const name = calleeName(call.callee);

  if (name === undefined) {
    return false;
  }

  const hookIndex = RENDER_TIME_HOOK_CALLBACKS.get(name);

  if (hookIndex !== undefined) {
    return argumentAt(call, hookIndex) === fn;
  }

  return call.callee.type === 'MemberExpression' && SYNCHRONOUS_ARRAY_METHODS.has(name) && argumentAt(call, 0) === fn;
}
