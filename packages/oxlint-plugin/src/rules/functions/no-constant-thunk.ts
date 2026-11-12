import {
  Diagnostic,
  Rule,
  RuleContext,
  Visitor,
  type Definition,
  type ESTree,
  type OxlintSourceCode,
} from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';

import { isConstDeclaration, isFunctionNode, staticPropertyName, type FunctionNode } from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { lookupVariable, soleDefinition } from '../../internal/scope';
import { functionResult } from '../effect/internal/callbacks';
import { isPureApi } from './internal/pure-api';

/*
 * Modules whose functions call their callbacks right away, such as `Option.map(some, f)` or `pipe(value, f)`, so the
 * result is only constant when no function argument can read changing state.
 */
const isEagerModule = Schema.is(
  Schema.Literals([
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
  ]),
);

const isEagerMember = Schema.is(Schema.Literals(['pipe', 'value', 'valueTags']));

/**
 * What constness depends on: the file's scopes, to tell `const` from `let`, and its import bindings.
 */
interface Constness {
  readonly sourceCode: OxlintSourceCode;
  readonly imports: ImportBindings;
}

function definitionOf(node: ESTree.Node & { readonly name: string }, env: Constness): Opt.Option<Definition> {
  return soleDefinition(lookupVariable(env.sourceCode, node, node.name));
}

function isConstantCall(node: ESTree.CallExpression, env: Constness): boolean {
  const callee = node.callee;

  const path = Opt.getOrElse(env.imports.path(callee), (): ReadonlyArray<string> => []);

  const pureApi = isPureApi(path);

  // `Schema.Struct(…).pipe(…)`, `Match.type<A>().pipe(…)` and curried `Schema.decodeUnknownEffect(User)(…)`.
  const pureBuilder =
    (callee.type === 'MemberExpression' &&
      !callee.computed &&
      Opt.contains(staticPropertyName(callee), 'pipe') &&
      callee.object.type === 'CallExpression' &&
      isConstantCall(callee.object, env)) ||
    (callee.type === 'CallExpression' && isConstantCall(callee, env));

  const eager = Opt.exists(Arr.head(path), isEagerModule) || Opt.exists(Arr.get(path, 1), isEagerMember);

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

  return Opt.exists(
    definitionOf(node, env),
    (definition) =>
      definition.type === 'FunctionName' ||
      definition.type === 'ImportBinding' ||
      (definition.type === 'Variable' &&
        definition.node.type === 'VariableDeclarator' &&
        P.isNotNull(definition.node.init) &&
        isFunctionNode(definition.node.init)),
  );
}

function isConstant(node: ESTree.Node, env: Constness): boolean {
  return Match.value(node).pipe(
    Match.discriminators('type')({
      // A regex literal is a fresh `RegExp` per call; a shared one keeps `lastIndex` between `/g` matches.
      Literal: (literal) => !('regex' in literal),
      ArrowFunctionExpression: Fn.constTrue,
      FunctionExpression: Fn.constTrue,
      // A `let` binding can change between calls; the function would see the change and a constant would not.
      Identifier: (identifier) =>
        !Opt.exists(
          definitionOf(identifier, env),
          (definition) =>
            definition.type === 'Variable' &&
            definition.parent?.type === 'VariableDeclaration' &&
            !isConstDeclaration(definition.parent),
        ),
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
        Opt.isSome(env.imports.path(member)) ||
        (member.object.type === 'CallExpression' &&
          isConstantCall(member.object, env) &&
          (!member.computed || isConstant(member.property, env))),
      UnaryExpression: ({ argument, operator }) => operator !== 'delete' && isConstant(argument, env),
      BinaryExpression: ({ left, right }) => isConstant(left, env) && isConstant(right, env),
      LogicalExpression: ({ left, right }) => isConstant(left, env) && isConstant(right, env),
      ConditionalExpression: ({ alternate, consequent, test }) =>
        isConstant(test, env) && isConstant(consequent, env) && isConstant(alternate, env),
      ArrayExpression: ({ elements }) =>
        Arr.every(elements, (element) => P.isNull(element) || isConstant(element, env)),
      ObjectExpression: ({ properties }) =>
        Arr.every(properties, (property) =>
          property.type === 'SpreadElement'
            ? isConstant(property.argument, env)
            : (!property.computed || isConstant(property.key as ESTree.Expression, env)) &&
              isConstant(property.value, env),
        ),
      CallExpression: (call) => isConstantCall(call, env),
    }),
    Match.orElse(Fn.constFalse),
  );
}

/*
 * A fresh object or array literal can be a deliberate factory: each caller gets its own mutable copy. A returned
 * function is the factory shape some APIs require, such as `@eslint-react/kit` rule factories.
 */
function isFactoryResult(node: ESTree.Expression, env: Constness): boolean {
  return (
    node.type === 'ObjectExpression' ||
    node.type === 'ArrayExpression' ||
    isFunctionNode(node) ||
    (node.type === 'Identifier' && Opt.exists(definitionOf(node, env), ({ type }) => type === 'FunctionName'))
  );
}

/**
 * Whether a function takes no parameters and always returns the same value.
 *
 * @param node Function.
 * @param env File being linted.
 */
function isConstantThunk(node: FunctionNode, env: Constness): boolean {
  return (
    Arr.isReadonlyArrayEmpty(node.params) &&
    !node.async &&
    !node.generator &&
    !node.typeParameters &&
    Opt.exists(functionResult(node), (expression) => !isFactoryResult(expression, env) && isConstant(expression, env))
  );
}

/**
 * Whether a reference passes the function as a value, such as a handler argument, which needs a function, not a
 * constant.
 *
 * @param sourceCode Source of the file.
 * @param declaration Function declaration or declarator.
 * @param name Function name.
 */
function isPassedAsValue(sourceCode: OxlintSourceCode, declaration: ESTree.Node, name: string): boolean {
  return Opt.exists(
    Arr.findFirst(sourceCode.getDeclaredVariables(declaration), (variable) => variable.name === name),
    ({ references }) =>
      Arr.some(references, ({ identifier, init }) => {
        const parent = identifier.parent;

        return !init && (parent.type !== 'CallExpression' || parent.callee !== identifier);
      }),
  );
}

function isTopLevel(node: ESTree.Node): boolean {
  return (node.parent?.type === 'ExportNamedDeclaration' ? node.parent : node).parent?.type === 'Program';
}

/**
 * Report top-level functions without parameters that always return the same value, such as `function userSchema() {
 * return Schema.Struct(…) }`.
 */
export const noConstantThunk = Rule.define({
  name: 'no-constant-thunk',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Disallow top-level functions without parameters that always return the same value.',
    messages: {
      constantThunk:
        '`{{name}}` takes no parameters and always returns the same value. Make it a constant, or a static on its class.',
    },
  }),
  *create() {
    const ctx = yield* RuleContext;

    const env: Constness = { sourceCode: ctx.sourceCode, imports: yield* importBindings };

    function check(declaration: ESTree.Node, node: FunctionNode, name: ESTree.BindingIdentifier) {
      return isConstantThunk(node, env) && !isPassedAsValue(ctx.sourceCode, declaration, name.name)
        ? ctx.report(Diagnostic.fromId({ node: name, messageId: 'constantThunk', data: { name: name.name } }))
        : Effect.void;
    }

    return Visitor.merge(
      Visitor.on('FunctionDeclaration', (node) =>
        node.id && node.body && isTopLevel(node) ? check(node, node, node.id) : Effect.void,
      ),
      Visitor.on('VariableDeclarator', (node) =>
        node.id.type === 'Identifier' && node.init && isFunctionNode(node.init) && isTopLevel(node.parent)
          ? check(node, node.init, node.id)
          : Effect.void,
      ),
    );
  },
});
