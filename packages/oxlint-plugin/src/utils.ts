import {
  defineRule,
  type Context,
  type ESTree,
  type Rule,
  type RuleMeta,
  type Scope,
  type Visitor,
  type VisitorWithHooks,
} from '@oxlint/plugins';

export interface FileState {
  readonly bindings: ReadonlyMap<string, ReadonlyArray<string>>;
  readonly hasEffectImport: boolean;
}

export type FunctionNode = ESTree.ArrowFunctionExpression | ESTree.Function;

type WrapperExpression =
  | ESTree.ParenthesizedExpression
  | ESTree.TSAsExpression
  | ESTree.TSNonNullExpression
  | ESTree.TSSatisfiesExpression
  | ESTree.TSTypeAssertion;

type StateGetter = () => FileState;

const emptyState: FileState = {
  bindings: new Map(),
  hasEffectImport: false,
};

function importedName(specifier: ESTree.ImportSpecifier): string | undefined {
  if (specifier.imported.type === 'Identifier') {
    return specifier.imported.name;
  }

  return typeof specifier.imported.value === 'string' ? specifier.imported.value : undefined;
}

function modulePath(source: string): ReadonlyArray<string> | undefined {
  if (source === 'alchemy') {
    return ['Alchemy'];
  }

  if (source === 'effect' || source === '@effect/platform') {
    return [];
  }

  if (source.startsWith('effect/') || source.startsWith('@effect/platform/') || source.startsWith('alchemy/')) {
    const name = source.split('/').at(-1);

    if (name === undefined) {
      return undefined;
    }

    // Lowercase entrypoints such as effect/unstable/http are barrels. Their named imports are module namespaces,
    // While PascalCase entrypoints such as effect/Schema are the module itself.
    return /^\p{Ll}/u.test(name) ? [] : [name];
  }

  return undefined;
}

function collectState(program: ESTree.Program): FileState {
  const bindings = new Map<string, ReadonlyArray<string>>();
  let hasEffectImport = false;

  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration') {
      continue;
    }

    const source = statement.source.value;

    if (source === 'effect' || source.startsWith('effect/') || source.startsWith('@effect/')) {
      hasEffectImport = true;
    }

    const path = modulePath(source);

    if (path === undefined) {
      continue;
    }

    for (const specifier of statement.specifiers) {
      if (specifier.type === 'ImportNamespaceSpecifier' || specifier.type === 'ImportDefaultSpecifier') {
        bindings.set(specifier.local.name, path);
        continue;
      }

      const name = importedName(specifier);

      if (name !== undefined) {
        bindings.set(specifier.local.name, [...path, name]);
      }
    }
  }

  return { bindings, hasEffectImport };
}

export function defineSyntaxRule(meta: RuleMeta, create: (context: Context) => Visitor): Rule {
  return defineRule({
    meta,
    createOnce: create,
  });
}

export function defineEffectRule(
  meta: RuleMeta,
  create: (context: Context, state: StateGetter) => VisitorWithHooks,
): Rule {
  return defineRule({
    meta,
    createOnce(context) {
      let currentState = emptyState;

      const visitor = create(context, () => currentState);
      const { before, Program, ...rest } = visitor;

      return {
        before() {
          currentState = emptyState;
          before?.();
        },
        Program(node) {
          currentState = collectState(node);
          Program?.(node);
        },
        ...rest,
      };
    },
  });
}

export function ruleMeta(
  type: NonNullable<RuleMeta['type']>,
  description: string,
  messages: NonNullable<RuleMeta['messages']>,
  url?: string,
): RuleMeta {
  return {
    type,
    docs: {
      description,
      recommended: true,
      ...(url === undefined ? {} : { url }),
    },
    schema: [],
    messages,
  };
}

export function staticPropertyName(node: ESTree.MemberExpression): string | undefined {
  if (!node.computed && node.property.type === 'Identifier') {
    return node.property.name;
  }

  if (node.computed && node.property.type === 'Literal' && typeof node.property.value === 'string') {
    return node.property.value;
  }

  return undefined;
}

export function staticPath(node: ESTree.Node): ReadonlyArray<string> | undefined {
  const path: Array<string> = [];
  let current = node;

  while (current.type === 'ChainExpression' || current.type === 'MemberExpression') {
    if (current.type === 'ChainExpression') {
      current = current.expression;
      continue;
    }

    const property = staticPropertyName(current);

    if (property === undefined) {
      return undefined;
    }

    path.unshift(property);
    current = current.object;
  }

  return current.type === 'Identifier' ? [current.name, ...path] : undefined;
}

export function isGlobalIdentifier(node: ESTree.Node, context: Context, name: string): boolean {
  if (node.type !== 'Identifier' || node.name !== name) {
    return false;
  }

  let scope: Scope | null = context.sourceCode.getScope(node);

  while (scope !== null) {
    if (scope.set.has(name)) {
      return false;
    }

    scope = scope.upper;
  }

  return true;
}

export function canonicalPath(node: ESTree.Node, state: FileState): ReadonlyArray<string> | undefined {
  const path = staticPath(node);
  const first = path?.[0];

  if (path === undefined || first === undefined) {
    return undefined;
  }

  const imported = state.bindings.get(first);

  return imported === undefined ? undefined : [...imported, ...path.slice(1)];
}

export function isApi(node: ESTree.Node, state: FileState, namespace: string, member: string): boolean {
  const path = canonicalPath(node, state);

  return path?.length === 2 && path[0] === namespace && path[1] === member;
}

export function isApiPath(node: ESTree.Node, state: FileState, expected: ReadonlyArray<string>): boolean {
  const path = canonicalPath(node, state);

  return path?.length === expected.length && path.every((part, index) => part === expected[index]);
}

export function isFunctionNode(node: ESTree.Node | undefined): node is FunctionNode {
  return node?.type === 'ArrowFunctionExpression' || node?.type === 'FunctionExpression';
}

export function argumentAt(
  node: ESTree.CallExpression | ESTree.NewExpression,
  index: number,
): ESTree.Expression | undefined {
  const argument = node.arguments[index];

  return argument === undefined || argument.type === 'SpreadElement' ? undefined : argument;
}

export function propertyName(node: ESTree.ObjectProperty): string | undefined {
  if (!node.computed && node.key.type === 'Identifier') {
    return node.key.name;
  }

  if (node.key.type === 'Literal' && typeof node.key.value === 'string') {
    return node.key.value;
  }

  return undefined;
}

export function objectProperty(node: ESTree.ObjectExpression, name: string): ESTree.ObjectProperty | undefined {
  for (const property of node.properties) {
    if (property.type === 'Property' && propertyName(property) === name) {
      return property;
    }
  }

  return undefined;
}

function isWrapperExpression(node: ESTree.Expression): node is WrapperExpression {
  return [
    'ParenthesizedExpression',
    'TSAsExpression',
    'TSNonNullExpression',
    'TSSatisfiesExpression',
    'TSTypeAssertion',
  ].includes(node.type);
}

export function unwrapExpression(node: ESTree.Expression): ESTree.Expression {
  let expression = node;

  while (isWrapperExpression(expression)) {
    expression = expression.expression;
  }

  return expression;
}

function appendNodeChildren(value: object, pending: Array<unknown>): void {
  if (Array.isArray(value)) {
    for (const child of value as Array<unknown>) {
      pending.push(child);
    }

    return;
  }

  for (const [key, child] of Object.entries(value)) {
    if (!['loc', 'parent', 'range'].includes(key)) {
      pending.push(child);
    }
  }
}

export function walkNodes(root: ESTree.Node, visit: (node: ESTree.Node) => boolean | undefined): boolean {
  const pending: Array<unknown> = [root];
  const seen = new WeakSet<object>();

  while (pending.length > 0) {
    const value = pending.pop();

    if (!value || typeof value !== 'object' || seen.has(value)) {
      continue;
    }

    seen.add(value);
    const record = value as Record<string, unknown>;

    if (typeof record.type === 'string' && visit(value as ESTree.Node) === true) {
      return true;
    }

    appendNodeChildren(value, pending);
  }

  return false;
}

export function containsIdentifier(root: ESTree.Node, name: string): boolean {
  return walkNodes(root, (node) => node.type === 'Identifier' && node.name === name);
}

export function firstIdentifierParameter(node: FunctionNode): ESTree.BindingIdentifier | undefined {
  const parameter = node.params[0];

  return parameter?.type === 'Identifier' ? parameter : undefined;
}

export function functionUsesFirstParameter(node: FunctionNode): boolean {
  const parameter = firstIdentifierParameter(node);

  if (parameter === undefined || !node.body || parameter.name.startsWith('_')) {
    return false;
  }

  return containsIdentifier(node.body, parameter.name);
}

export function enclosingFunction(node: ESTree.Node): FunctionNode | undefined {
  let parent = node.parent;

  while (parent) {
    if (isFunctionNode(parent)) {
      return parent;
    }
    parent = parent.parent;
  }

  return undefined;
}

export function callbackCall(node: FunctionNode): ESTree.CallExpression | undefined {
  const parent = node.parent;

  if (parent.type === 'CallExpression' && parent.arguments.includes(node)) {
    return parent;
  }

  return undefined;
}

export function isLiteral(node: ESTree.Node, value: string | number | boolean): boolean {
  return node.type === 'Literal' && node.value === value;
}

export function isDiscarded(node: ESTree.Node): boolean {
  const parent = node.parent;

  if (!parent) {
    return false;
  }

  if (parent.type === 'ExpressionStatement') {
    return true;
  }

  if (parent.type === 'UnaryExpression' && parent.operator === 'void') {
    return true;
  }

  return parent.type === 'SequenceExpression' && parent.expressions.at(-1) !== node;
}

export function isErrorConstructor(node: ESTree.NewExpression): boolean {
  return staticPath(node.callee)?.at(-1)?.endsWith('Error') === true;
}
