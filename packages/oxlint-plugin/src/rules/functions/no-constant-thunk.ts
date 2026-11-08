import type { Context, ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';

import {
  canonicalPath,
  defineEffectRule,
  isFunctionNode,
  resolveVariable,
  ruleMeta,
  soleDefinition,
  type FileState,
  type FunctionNode,
} from '../../utils';
import { functionResult } from '../effect/utils';

/**
 * Modules whose functions build immutable values or lazy descriptions, so calling them once at module load is the same
 * as calling them on every use.
 */
const pureModules: ReadonlySet<string> = new Set([
  'BigDecimal',
  'Config',
  'Data',
  'DateTime',
  'Duration',
  'Effect',
  'Equivalence',
  'Exit',
  'Function',
  'Layer',
  'Match',
  'Option',
  'Order',
  'Predicate',
  'Result',
  'Schedule',
  'Schema',
  'Stream',
  'String',
  'Struct',
  'flow',
  'pipe',
]);

/*
 * Modules whose functions call their callbacks right away, such as `Option.map(some, f)` or `pipe(value, f)`, so the
 * result is only constant when no function argument can read changing state.
 */
const eagerModules: ReadonlySet<string> = new Set([
  'BigDecimal',
  'Data',
  'DateTime',
  'Duration',
  'Exit',
  'Option',
  'Result',
  'String',
  'Struct',
  'pipe',
]);

const eagerMembers: ReadonlySet<string> = new Set(['pipe', 'value', 'valueTags']);

// `Effect.runSync`, `DateTime.nowUnsafe`, `Ref.makeUnsafe` and similar run effects or read mutable state.
const impureMember = /^run|unsafe/iu;

interface Constness {
  readonly context: Context;
  readonly state: FileState;
}

function isConstantCall(node: ESTree.CallExpression, env: Constness): boolean {
  const callee = node.callee;

  const path = canonicalPath(callee, env.state) ?? [];

  const pureApi = pureModules.has(path[0] ?? '') && !Arr.some(path, (part) => impureMember.test(part));

  // `Schema.Struct(…).pipe(…)`, `Match.type<A>().pipe(…)` and curried `Schema.decodeUnknownEffect(User)(…)`.
  const pureBuilder =
    (callee.type === 'MemberExpression' &&
      !callee.computed &&
      callee.property.type === 'Identifier' &&
      callee.property.name === 'pipe' &&
      callee.object.type === 'CallExpression' &&
      isConstantCall(callee.object, env)) ||
    (callee.type === 'CallExpression' && isConstantCall(callee, env));

  const eager = eagerModules.has(path[0] ?? '') || eagerMembers.has(path[1] ?? '');

  return (
    !node.optional &&
    (pureApi || pureBuilder) &&
    Arr.every(
      node.arguments,
      (argument) =>
        argument.type !== 'SpreadElement' && isConstant(argument, env) && (!eager || !isLocalFunction(argument, env)),
    )
  );
}

// A function whose body this rule doesn't see: an inline function, or a local or imported function binding.
function isLocalFunction(node: ESTree.Expression, env: Constness): boolean {
  if (node.type !== 'Identifier') {
    return isFunctionNode(node);
  }

  const definition = soleDefinition(resolveVariable(env.context, node, node.name));

  return (
    definition?.type === 'FunctionName' ||
    definition?.type === 'ImportBinding' ||
    (definition?.type === 'Variable' &&
      definition.node.type === 'VariableDeclarator' &&
      definition.node.init !== null &&
      isFunctionNode(definition.node.init))
  );
}

function isConstantIdentifier(node: ESTree.Node & { readonly name: string }, env: Constness): boolean {
  const definition = soleDefinition(resolveVariable(env.context, node, node.name));

  // A `let` binding can change between calls; the function would see the change and a constant would not.
  return (
    definition?.type !== 'Variable' ||
    definition.parent?.type !== 'VariableDeclaration' ||
    definition.parent.kind === 'const'
  );
}

function isConstantProperty(property: ESTree.ObjectPropertyKind, env: Constness): boolean {
  if (property.type === 'SpreadElement') {
    return isConstant(property.argument, env);
  }

  return (!property.computed || isConstant(property.key as ESTree.Expression, env)) && isConstant(property.value, env);
}

function isConstant(node: ESTree.Node, env: Constness): boolean {
  return Match.value(node).pipe(
    Match.discriminators('type')({
      // A regex literal is a fresh `RegExp` per call; a shared one keeps `lastIndex` between `/g` matches.
      Literal: (literal) => !('regex' in literal),
      ArrowFunctionExpression: Fn.constTrue,
      FunctionExpression: Fn.constTrue,
      Identifier: (identifier) => isConstantIdentifier(identifier, env),
      TemplateLiteral: ({ expressions }) => Arr.every(expressions, (expression) => isConstant(expression, env)),
      ParenthesizedExpression: ({ expression }) => isConstant(expression, env),
      TSAsExpression: ({ expression }) => isConstant(expression, env),
      TSSatisfiesExpression: ({ expression }) => isConstant(expression, env),
      TSNonNullExpression: ({ expression }) => isConstant(expression, env),
      /*
       * A property of a module, such as `Schema.String`, or of a value built by a constant call; any other object may
       * be mutated between calls.
       */
      MemberExpression: (member) =>
        canonicalPath(member, env.state) !== undefined ||
        (member.object.type === 'CallExpression' &&
          isConstantCall(member.object, env) &&
          (!member.computed || isConstant(member.property, env))),
      UnaryExpression: ({ argument, operator }) => operator !== 'delete' && isConstant(argument, env),
      BinaryExpression: ({ left, right }) => isConstant(left, env) && isConstant(right, env),
      LogicalExpression: ({ left, right }) => isConstant(left, env) && isConstant(right, env),
      ConditionalExpression: ({ alternate, consequent, test }) =>
        isConstant(test, env) && isConstant(consequent, env) && isConstant(alternate, env),
      ArrayExpression: ({ elements }) => Arr.every(elements, (element) => element === null || isConstant(element, env)),
      ObjectExpression: ({ properties }) => Arr.every(properties, (property) => isConstantProperty(property, env)),
      CallExpression: (call) => isConstantCall(call, env),
    }),
    Match.orElse(Fn.constFalse),
  );
}

/*
 * A fresh object or array literal can be a deliberate factory: each caller gets its own mutable copy. A returned
 * function is the factory shape some APIs require, such as `@eslint-react/kit` rule factories.
 */
function isFactoryResult(node: ESTree.Expression, context: Context): boolean {
  return (
    node.type === 'ObjectExpression' ||
    node.type === 'ArrayExpression' ||
    isFunctionNode(node) ||
    (node.type === 'Identifier' && soleDefinition(resolveVariable(context, node, node.name))?.type === 'FunctionName')
  );
}

function check(context: Context, state: FileState, node: FunctionNode, name: ESTree.BindingIdentifier): void {
  const expression = functionResult(node);

  if (
    expression === undefined ||
    node.params.length > 0 ||
    node.async ||
    node.generator ||
    node.typeParameters ||
    isFactoryResult(expression, context) ||
    !isConstant(expression, { context, state })
  ) {
    return;
  }

  context.report({ node: name, messageId: 'constantThunk', data: { name: name.name } });
}

function isTopLevel(node: ESTree.Node): boolean {
  return (node.parent?.type === 'ExportNamedDeclaration' ? node.parent : node).parent?.type === 'Program';
}

/**
 * Report top-level functions without parameters that always return the same value, such as `function userSchema() {
 * return Schema.Struct(…) }`.
 */
export const noConstantThunk: Rule = defineEffectRule(
  ruleMeta('suggestion', 'Disallow top-level functions without parameters that always return the same value.', {
    constantThunk:
      '`{{name}}` takes no parameters and always returns the same value. Make it a constant, or a static on its class.',
  }),
  (context, getState) => ({
    FunctionDeclaration(node) {
      if (node.id && node.body && isTopLevel(node)) {
        check(context, getState(), node, node.id);
      }
    },
    VariableDeclarator(node) {
      if (node.id.type === 'Identifier' && node.init && isFunctionNode(node.init) && isTopLevel(node.parent)) {
        check(context, getState(), node.init, node.id);
      }
    },
  }),
);
