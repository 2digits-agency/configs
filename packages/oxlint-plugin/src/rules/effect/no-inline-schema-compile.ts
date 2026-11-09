import {
  Diagnostic,
  RuleContext,
  Visitor,
  type CreateRule,
  type ESTree,
  type OxlintSourceCode,
  type Variable,
} from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';

import { containsRange, findAncestor, parentOf, staticPath, unwrapExpression, walkNodes } from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';
import { lookupVariable } from '../../internal/scope';

const CompilerMethod = Schema.Literals([
  'asserts',
  'decodeEffect',
  'decodeExit',
  'decodeOption',
  'decodePromise',
  'decodeResult',
  'decodeSync',
  'decodeUnknownEffect',
  'decodeUnknownExit',
  'decodeUnknownOption',
  'decodeUnknownPromise',
  'decodeUnknownResult',
  'decodeUnknownSync',
  'encodeEffect',
  'encodeExit',
  'encodeOption',
  'encodePromise',
  'encodeResult',
  'encodeSync',
  'encodeUnknownEffect',
  'encodeUnknownExit',
  'encodeUnknownOption',
  'encodeUnknownPromise',
  'encodeUnknownResult',
  'encodeUnknownSync',
  'is',
] satisfies ReadonlyArray<keyof typeof Schema>);

const isCompilerMethod = Schema.is(CompilerMethod);

const isModuleScope = Schema.is(Schema.Literals(['global', 'module']));

const isFunctionType = Schema.is(
  Schema.Literals(['ArrowFunctionExpression', 'FunctionDeclaration', 'FunctionExpression']),
);

const isDynamicType = Schema.is(
  Schema.Literals([
    'AssignmentExpression',
    'AwaitExpression',
    'ImportExpression',
    'TaggedTemplateExpression',
    'UpdateExpression',
    'YieldExpression',
  ]),
);

const isTransparentParentType = Schema.is(
  Schema.Literals(['ParenthesizedExpression', 'TSAsExpression', 'TSNonNullExpression']),
);

/**
 * The Schema compiler a callee names, when its root resolves to the import itself and not to a shadowing local.
 *
 * @param node Callee.
 * @param imports Import bindings of the file.
 * @param sourceCode Source of the file.
 */
function compilerMethod(node: ESTree.Node, imports: ImportBindings, sourceCode: OxlintSourceCode): Opt.Option<string> {
  const method = Opt.filter(imports.member(node, 'Schema'), isCompilerMethod);

  const isImport = Opt.exists(
    Opt.flatMap(staticPath(node), ([root]) => lookupVariable(sourceCode, node, root)),
    ({ defs }) => Arr.every(defs, (definition) => definition.type === 'ImportBinding'),
  );

  return isImport ? method : Opt.none();
}

/**
 * Whether the compiled function is called right away, through parentheses and assertions.
 *
 * @param node Compiler call.
 * @param current Expression whose parent is inspected.
 */
function isImmediatelyInvoked(node: ESTree.CallExpression, current: ESTree.Node = node): boolean {
  return Opt.exists(parentOf(current), (parent) =>
    isTransparentParentType(parent.type) && P.isNotNullish(parent.parent)
      ? isImmediatelyInvoked(node, parent)
      : parent.type === 'CallExpression' && parent.callee === current,
  );
}

/**
 * The outermost member expression whose object chain starts at `node`, such as `a.b.c` for `a`.
 *
 * @param node Reference.
 */
function memberChainRoot(node: ESTree.Node): ESTree.Node {
  return Opt.match(
    Opt.filter(parentOf(node), (parent) => parent.type === 'MemberExpression' && parent.object === node),
    { onNone: () => node, onSome: memberChainRoot },
  );
}

/**
 * Whether a reference is the object of a member chain that is assigned, updated or deleted.
 *
 * @param node Reference.
 */
function isMutationTarget(node: ESTree.Node): boolean {
  const outermost = memberChainRoot(node);

  return (
    outermost !== node &&
    Opt.exists(
      parentOf(outermost),
      (parent) =>
        (parent.type === 'AssignmentExpression' && parent.left === outermost) ||
        (parent.type === 'UpdateExpression' && parent.argument === outermost) ||
        (parent.type === 'UnaryExpression' && parent.operator === 'delete' && parent.argument === outermost),
    )
  );
}

// A module binding is stable when neither it nor its members are reassigned after initialization.
function isStableVariable(variable: Variable): boolean {
  return Arr.every(
    variable.references,
    (reference) => (!reference.isWrite() || reference.init) && !isMutationTarget(reference.identifier),
  );
}

// Movable means declared at module scope with a stable value, or inside the schema itself (callback params).
function isMovableIdentifier(
  node: ESTree.IdentifierReference | ESTree.Node,
  name: string,
  root: ESTree.Node,
  sourceCode: OxlintSourceCode,
): boolean {
  return Opt.match(lookupVariable(sourceCode, node, name), {
    onNone: () => true,
    onSome: (variable) =>
      containsRange(root, variable.scope.block) || (isModuleScope(variable.scope.type) && isStableVariable(variable)),
  });
}

function isNonReferenceName(node: ESTree.Node): boolean {
  return Opt.exists(
    parentOf(node),
    (parent) =>
      (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) ||
      (parent.type === 'Property' && parent.key === node && !parent.computed && !parent.shorthand),
  );
}

function isInsideCallback(node: ESTree.Node, root: ESTree.Node): boolean {
  return (
    node !== root &&
    Opt.exists(
      parentOf(node),
      (parent) => parent !== root && (isFunctionType(parent.type) || isInsideCallback(parent, root)),
    )
  );
}

// Hoisting evaluates the arguments once, so only Effect API calls may run eagerly; callbacks still run later.
function isDynamic(node: ESTree.Node, root: ESTree.Node, imports: ImportBindings): boolean {
  if (isInsideCallback(node, root)) {
    return false;
  }

  if (node.type === 'CallExpression' || node.type === 'NewExpression') {
    return Opt.isNone(imports.path(node.callee));
  }

  return isDynamicType(node.type);
}

// Hoisting needs arguments free of `this`, `new.target`, function-local or mutable bindings, and non-Effect calls.
function isHoistable(node: ESTree.Node, imports: ImportBindings, sourceCode: OxlintSourceCode): boolean {
  return !walkNodes(
    node,
    (child) =>
      child.type === 'ThisExpression' ||
      child.type === 'Super' ||
      (child.type === 'MetaProperty' && child.meta.name === 'new') ||
      isDynamic(child, node, imports) ||
      (child.type === 'Identifier' &&
        !isNonReferenceName(child) &&
        !isMovableIdentifier(child, child.name, node, sourceCode)),
  );
}

/**
 * Which message an inline compile gets: `inlineSchema` when it also builds the schema, `inlineCompile` when it compiles
 * an existing one; none when it cannot be hoisted.
 *
 * @param node Compiler call.
 * @param imports Import bindings of the file.
 * @param sourceCode Source of the file.
 */
function inlineKind(
  node: ESTree.CallExpression,
  imports: ImportBindings,
  sourceCode: OxlintSourceCode,
): Opt.Option<'inlineSchema' | 'inlineCompile'> {
  const [argument] = node.arguments;

  if (
    P.isUndefined(argument) ||
    Arr.some(node.arguments, (child) => child.type === 'SpreadElement') ||
    !isImmediatelyInvoked(node) ||
    Opt.isNone(findAncestor(node, (ancestor): ancestor is ESTree.Node => isFunctionType(ancestor.type)))
  ) {
    return Opt.none();
  }

  const schema = unwrapExpression(argument as ESTree.Expression);

  const inlineSchema =
    schema.type === 'CallExpression' &&
    Opt.exists(imports.path(schema.callee), (path) => Opt.contains(Arr.head(path), 'Schema'));

  if (
    (!inlineSchema && schema.type !== 'Identifier' && schema.type !== 'MemberExpression') ||
    !Arr.every(node.arguments, (child) => isHoistable(child, imports, sourceCode))
  ) {
    return Opt.none();
  }

  return Opt.some(inlineSchema ? 'inlineSchema' : 'inlineCompile');
}

export const noInlineSchemaCompile: CreateRule = defineRule({
  name: 'no-inline-schema-compile',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow compiling Schema decoders, encoders, and guards inside function bodies.',
    messages: {
      inlineSchema:
        'Hoist Schema.{{method}}(...) to module scope: both the inline schema and the compiled function are rebuilt on every call. Move the compiled function to a module-level const.',
      inlineCompile:
        'Hoist Schema.{{method}}(...) to module scope: the compiled function is rebuilt on every call. Move it to a module-level const.',
    },
    url: 'https://github.com/pingdotgg/t3code/blob/main/oxlint-plugin-t3code/rules/no-inline-schema-compile.ts',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    return Visitor.on('CallExpression', (node) =>
      Opt.match(
        Opt.zipWith(
          compilerMethod(node.callee, imports, ctx.sourceCode),
          inlineKind(node, imports, ctx.sourceCode),
          (method, messageId) => ({ method, messageId }),
        ),
        {
          onNone: () => Effect.void,
          onSome: ({ method, messageId }) =>
            ctx.report(Diagnostic.fromId({ node: node.callee, messageId, data: { method } })),
        },
      ),
    );
  },
});
