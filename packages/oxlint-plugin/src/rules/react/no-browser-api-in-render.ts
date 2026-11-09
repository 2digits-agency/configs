import {
  Diagnostic,
  Rule,
  RuleContext,
  Scope,
  Visitor,
  type CreateRule,
  type ESTree,
  type OxlintScope,
  type Reference,
} from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';
import * as Schema from 'effect/Schema';

import {
  argumentAt,
  isSomeSame,
  parentOf,
  parentOfType,
  staticPropertyName,
  walkNodes,
  type FunctionNode,
} from '../../internal/ast';
import { ruleMeta } from '../../internal/meta';

const BrowserGlobal = Schema.Literals(['document', 'localStorage', 'navigator', 'sessionStorage', 'window']);

const isBrowserGlobal = Schema.is(BrowserGlobal);

const BROWSER_GLOBALS_PATTERN = /\b(?:document|localStorage|navigator|sessionStorage|window)\b/u;

/**
 * Array methods that call their callback synchronously, so a callback created during render also runs during it.
 */
const isSynchronousArrayMethod = Schema.is(
  Schema.Literals([
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
  ]),
);

/**
 * Hooks whose callback argument at this index runs during render.
 */
const RENDER_TIME_HOOK_CALLBACKS: Readonly<Record<string, number>> = {
  useMemo: 0,
  useReducer: 2,
  useState: 0,
};

const isComponentWrapperName = Schema.is(Schema.Literals(['forwardRef', 'memo']));

const HookName = Schema.String.check(Schema.isPattern(/^use[A-Z0-9]/u));

const isHookName = Schema.is(HookName);

const ComponentName = Schema.String.check(Schema.isPattern(/^_?[A-Z]/u));

const isComponentName = Schema.is(ComponentName);

/**
 * A browser global read: its display name and the node to report.
 */
interface BrowserApiRead {
  readonly name: string;
  readonly node: ESTree.Node;
}

/**
 * Report browser-only globals read while a component or hook renders; the server render cannot match them, and a
 * `typeof window` guard is what makes the two renders differ.
 */
export const noBrowserApiInRender: CreateRule = Rule.define({
  name: 'no-browser-api-in-render',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow reading browser-only APIs while a React component or hook renders.',
    messages: {
      browserApiInRender:
        'Reading `{{name}}` during render makes the server and client render differ, even behind a `typeof window` check. Read it in `useEffect` or subscribe with `useSyncExternalStore`.',
    },
    url: 'https://react.dev/reference/react-dom/client/hydrateRoot#handling-different-client-and-server-content',
  }),
  *create() {
    const ctx = yield* RuleContext;

    if (!BROWSER_GLOBALS_PATTERN.test(ctx.sourceCode.text)) {
      return {};
    }

    return Visitor.onExit('Program', () => {
      const reads = Arr.filter(
        Arr.getSomes(
          Arr.map(globalReferences(ctx.sourceCode.scopeManager.globalScope), ({ identifier }) =>
            browserApiRead(identifier),
          ),
        ),
        ({ node }) => runsDuringRender(node),
      );

      // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
      return Effect.forEach(
        reads,
        ({ name, node }) => ctx.report(Diagnostic.fromId({ node, messageId: 'browserApiInRender', data: { name } })),
        { discard: true },
      );
    });
  },
});

/**
 * References to globals that no local declaration shadows, whether or not the config declares them.
 *
 * @param globalScope The file's global scope.
 */
function globalReferences(globalScope: OxlintScope | null): ReadonlyArray<Reference> {
  return Opt.match(Opt.fromNullishOr(globalScope), {
    onNone: () => [],
    onSome: (scope) =>
      Arr.dedupeWith(
        [
          ...Scope.throughReferences(scope),
          ...Arr.flatMap(
            Arr.filter(Scope.variables(scope), ({ defs }) => Arr.isReadonlyArrayEmpty(defs)),
            Scope.getReferences,
          ),
        ],
        (left, right) => left === right,
      ),
  });
}

/**
 * The browser global an identifier reads, as `window` or `globalThis.window`. `typeof window` only checks the
 * environment; the reads it guards are what this rule reports. In a type (`typeof window`, `typeof window.document`),
 * it does not run at all.
 *
 * @param identifier Reference identifier.
 */
function browserApiRead(identifier: ESTree.Node): Opt.Option<BrowserApiRead> {
  if (identifier.type !== 'Identifier') {
    return Opt.none();
  }

  const read: Opt.Option<BrowserApiRead> =
    identifier.name === 'globalThis'
      ? Opt.flatMap(parentOfType(identifier, 'MemberExpression'), (parent) =>
          Opt.map(Opt.filter(staticPropertyName(parent), isBrowserGlobal), (property) => ({
            name: `globalThis.${property}`,
            node: parent,
          })),
        )
      : Opt.liftPredicate({ name: identifier.name, node: identifier }, ({ name }) => isBrowserGlobal(name));

  return Opt.filter(
    read,
    ({ node }) =>
      !Opt.exists(
        parentOf(node),
        (parent) =>
          (parent.type === 'UnaryExpression' && parent.operator === 'typeof') ||
          parent.type === 'TSTypeQuery' ||
          parent.type === 'TSQualifiedName',
      ),
  );
}

/**
 * Whether code at `node` runs while a component or hook renders: its nearest functions up to a component or hook are
 * all callbacks that run during render.
 *
 * @param node Read site.
 */
function runsDuringRender(node: ESTree.Node): boolean {
  return Opt.exists(
    findFunction(node),
    (fn) => isComponentOrHook(fn) || (isRenderTimeCallback(fn) && runsDuringRender(fn)),
  );
}

/**
 * The nearest function around a node.
 *
 * @param node Start node, not tested itself.
 */
function findFunction(node: ESTree.Node): Opt.Option<FunctionNode> {
  return Opt.flatMap(parentOf(node), (parent) => (isFunction(parent) ? Opt.some(parent) : findFunction(parent)));
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
  return Opt.exists(
    functionName(fn),
    (name) =>
      isHookName(name) ||
      (isComponentName(name) &&
        P.isNotNull(fn.body) &&
        walkNodes(fn.body, (child) => child.type === 'JSXElement' || child.type === 'JSXFragment')),
  );
}

/**
 * The node a function's name is bound through: the function itself, or the outermost `memo(...)` or `forwardRef(...)`
 * call around it.
 *
 * @param node Function or wrapper call.
 */
function outermostWrapper(node: ESTree.Node): ESTree.Node {
  return Opt.match(
    Opt.filter(parentOfType(node, 'CallExpression'), (parent) =>
      Opt.exists(calleeName(parent.callee), isComponentWrapperName),
    ),
    { onNone: () => node, onSome: outermostWrapper },
  );
}

/**
 * The declared name of a function, also through `const Name = memo(() => ...)`.
 *
 * @param fn Function node.
 */
function functionName(fn: FunctionNode): Opt.Option<string> {
  if (fn.type !== 'ArrowFunctionExpression' && fn.id) {
    return Opt.some(fn.id.name);
  }

  const { parent } = outermostWrapper(fn);

  return parent?.type === 'VariableDeclarator' && parent.id.type === 'Identifier'
    ? Opt.some(parent.id.name)
    : Opt.none();
}

function calleeName(callee: ESTree.Node): Opt.Option<string> {
  if (callee.type === 'Identifier') {
    return Opt.some(callee.name);
  }

  return callee.type === 'MemberExpression' ? staticPropertyName(callee) : Opt.none();
}

function isRenderTimeCallback(fn: FunctionNode): boolean {
  const call = fn.parent;

  if (call.type !== 'CallExpression') {
    return false;
  }

  if (call.callee === fn) {
    return true;
  }

  return Opt.exists(calleeName(call.callee), (name) =>
    Opt.match(R.get(RENDER_TIME_HOOK_CALLBACKS, name), {
      onSome: (hookIndex) => isSomeSame<ESTree.Node>(argumentAt(call, hookIndex), fn),
      onNone: () =>
        call.callee.type === 'MemberExpression' &&
        isSynchronousArrayMethod(name) &&
        isSomeSame<ESTree.Node>(argumentAt(call, 0), fn),
    }),
  );
}
