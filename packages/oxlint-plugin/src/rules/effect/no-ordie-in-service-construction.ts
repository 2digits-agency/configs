import type * as EffectBarrel from 'effect';
import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import type * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import type * as Fn from 'effect/Function';
import type * as Layer from 'effect/Layer';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import {
  containsSame,
  firstIdentifierParameter,
  isFunctionNode,
  isStringLiteral,
  isWrapperExpressionType,
  parentOf,
  staticPropertyName,
  unwrapExpression,
  type FunctionNode,
} from '../../internal/ast';
import { isTestFilename } from '../../internal/files';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import type { ImportBindings } from '../../schemas/imports';
import { ServiceConstructionMemberName } from '../../schemas/names';

/**
 * Layer constructors whose effect argument builds the service.
 */
const layerConstructors = ['effect', 'effectContext', 'effectDiscard', 'unwrap'] as const satisfies ReadonlyArray<
  keyof typeof Layer
>;

/**
 * Effect constructors whose function argument runs as part of the surrounding construction.
 */
const thunkConstructors = ['suspend', 'sync'] as const satisfies ReadonlyArray<keyof typeof Effect>;

/**
 * Effect constructors that define an operation; their arguments run when it is called, not during construction.
 */
const operationConstructors = ['fn', 'fnUntraced'] as const satisfies ReadonlyArray<keyof typeof Effect>;

const isConstructionMemberName = Schema.is(ServiceConstructionMemberName);

/**
 * Whether a call is `api(...)` or the curried `api(...)(...)` for one of `members` of `namespace`.
 *
 * @param node Call.
 * @param imports Import bindings of the file.
 * @param namespace Module namespace, such as `Layer`.
 * @param members Accepted member names.
 */
function isApiCall(
  node: ESTree.CallExpression,
  imports: ImportBindings,
  namespace: string,
  members: ReadonlyArray<string>,
): boolean {
  return (
    imports.isApi(node.callee, namespace, members) ||
    (node.callee.type === 'CallExpression' && imports.isApi(node.callee.callee, namespace, members))
  );
}

/**
 * Whether a node is `class X extends Context.Service<X, Shape>()('key', options) {}`.
 *
 * @param node Candidate class.
 * @param imports Import bindings of the file.
 */
function isServiceClass(node: ESTree.Node | null, imports: ImportBindings): boolean {
  if ((node?.type !== 'ClassDeclaration' && node?.type !== 'ClassExpression') || P.isNullish(node.superClass)) {
    return false;
  }

  const superClass = unwrapExpression(node.superClass);

  if (superClass.type !== 'CallExpression') {
    return false;
  }

  const factory = unwrapExpression(superClass.callee);

  return (
    factory.type === 'CallExpression' &&
    imports.isApi(factory.callee, 'Context', 'Service' satisfies keyof typeof Context)
  );
}

function keyName(key: ESTree.Node): Opt.Option<string> {
  if (key.type === 'Identifier') {
    return Opt.some(key.name);
  }

  return isStringLiteral(key) ? Opt.some(key.value) : Opt.none();
}

/**
 * Whether `node`, entered from `child`, is where a service is built: a static `make` or `layer*` member of a service
 * class, the `make` option of `Context.Service`, or an argument of a Layer constructor or a pipeline into one.
 *
 * @param node Ancestor.
 * @param child Child of `node` on the path from the reported node.
 * @param imports Import bindings of the file.
 */
function isConstructionRoot(node: ESTree.Node, child: ESTree.Node, imports: ImportBindings): boolean {
  if (node.type === 'PropertyDefinition' || node.type === 'MethodDefinition') {
    return (
      node.static &&
      !node.computed &&
      node.value === child &&
      Opt.exists(keyName(node.key), isConstructionMemberName) &&
      isServiceClass(node.parent.parent, imports)
    );
  }

  if (node.type === 'Property') {
    const options = node.parent;

    return (
      !node.computed &&
      node.value === child &&
      Opt.contains(keyName(node.key), 'make') &&
      options.type === 'ObjectExpression' &&
      options.parent.type === 'CallExpression' &&
      isServiceClass(options.parent.parent, imports)
    );
  }

  return (
    node.type === 'CallExpression' &&
    ((containsSame<ESTree.Node>(node.arguments, child) && isApiCall(node, imports, 'Layer', layerConstructors)) ||
      Arr.some(stepsAfter(node, child, imports), (step) => isLayerStep(step, imports)))
  );
}

/**
 * The steps that receive `child` in `child.pipe(...)`, `x.pipe(child, ...)` or `pipe(x, child, ...)`.
 *
 * @param node Call.
 * @param child Callee or argument of `node`.
 * @param imports Import bindings of the file.
 */
function stepsAfter(
  node: ESTree.CallExpression,
  child: ESTree.Node,
  imports: ImportBindings,
): ReadonlyArray<ESTree.Node> {
  const isPipeMethod = node.callee.type === 'MemberExpression' && Opt.contains(staticPropertyName(node.callee), 'pipe');

  if (isPipeMethod && node.callee === child) {
    return node.arguments;
  }

  if (
    !isPipeMethod &&
    !imports.isApiPath(node.callee, ['pipe' satisfies keyof typeof EffectBarrel]) &&
    !imports.isApiPath(node.callee, ['Function', 'pipe' satisfies keyof typeof Fn])
  ) {
    return [];
  }

  return Opt.match(
    Arr.findFirstIndex(node.arguments, (argument) => argument === child),
    {
      onNone: () => [],
      onSome: (index) => node.arguments.slice(index + 1),
    },
  );
}

/**
 * Whether a pipeline step builds a layer from the effect it receives: `Layer.unwrap` or `Layer.effect(Store)`.
 *
 * @param step Pipeline step.
 * @param imports Import bindings of the file.
 */
function isLayerStep(step: ESTree.Node, imports: ImportBindings): boolean {
  return isFunctionNode(step)
    ? passesInputToLayer(step, imports)
    : imports.isApi(step.type === 'CallExpression' ? step.callee : step, 'Layer', layerConstructors);
}

/**
 * Whether a pipeline callback returns a Layer constructor call that receives its input, such as `(effect) =>
 * Layer.effect(Store, effect)`.
 *
 * @param step Pipeline callback.
 * @param imports Import bindings of the file.
 */
function passesInputToLayer(step: FunctionNode, imports: ImportBindings): boolean {
  const returned =
    step.body?.type === 'BlockStatement'
      ? Arr.flatMap(step.body.body, (statement) =>
          statement.type === 'ReturnStatement' && P.isNotNullish(statement.argument) ? [statement.argument] : [],
        )
      : Arr.fromNullishOr(step.body);

  return Opt.exists(firstIdentifierParameter(step), (input) =>
    Arr.some(returned, (expression) => {
      const call = unwrapExpression(expression);

      return (
        call.type === 'CallExpression' &&
        isApiCall(call, imports, 'Layer', layerConstructors) &&
        Arr.some(call.arguments, (argument) => argument.type === 'Identifier' && argument.name === input.name)
      );
    }),
  );
}

/**
 * Whether a property belongs to an object passed to `Effect.all`, which runs it: `Effect.all({ key: load })`.
 *
 * @param node Object property.
 * @param imports Import bindings of the file.
 */
function isEffectAllProperty(node: ESTree.Node, imports: ImportBindings): boolean {
  if (node.parent?.type !== 'ObjectExpression') {
    return false;
  }

  const argument = outermostWrapper(node.parent);

  return Opt.exists(
    parentOf(argument),
    (call) =>
      call.type === 'CallExpression' &&
      containsSame<ESTree.Node>(call.arguments, argument) &&
      imports.isApi(call.callee, 'Effect', 'all' satisfies keyof typeof Effect),
  );
}

/**
 * The outermost of the parentheses and type assertions around an expression, such as `(x satisfies T)` for `x`.
 *
 * @param node Wrapped expression.
 */
function outermostWrapper(node: ESTree.Node): ESTree.Node {
  return Opt.match(parentOf(node), {
    onNone: () => node,
    onSome: (parent) => (isWrapperExpressionType(parent.type) ? outermostWrapper(parent) : node),
  });
}

/**
 * The Effect constructor a function is passed to, such as `gen` for `Effect.gen(function* () {})`.
 *
 * @param fn Function.
 * @param imports Import bindings of the file.
 */
function effectConstructorOf(fn: ESTree.Node, imports: ImportBindings): Opt.Option<string> {
  return Opt.flatMap(parentOf(fn), (parent) =>
    parent.type === 'CallExpression' && containsSame<ESTree.Node>(parent.arguments, fn)
      ? imports.member(parent.callee, 'Effect')
      : Opt.none(),
  );
}

/**
 * Whether `node`, entered from `child`, runs while the service is built. Construction stops at operation boundaries:
 * functions other than `Effect.gen` generators and `suspend`/`sync` thunks, `Effect.fn` definitions, `Effect.succeed`
 * arguments that are not yielded, object-literal properties that are neither yielded nor passed to `Effect.all`
 * (operations of the returned service), and effects a generator defines without yielding them.
 *
 * @param child Reported node or one of its ancestors.
 * @param yielded Whether a `yield*` lies between `child` and the reported node since the last generator.
 * @param imports Import bindings of the file.
 */
function isInServiceConstruction(child: ESTree.Node, yielded: boolean, imports: ImportBindings): boolean {
  return Opt.exists(parentOf(child), (node) => {
    if (isConstructionRoot(node, child, imports)) {
      return true;
    }

    if (node.type === 'FunctionDeclaration') {
      return false;
    }

    if (isFunctionNode(node)) {
      // A static `make = () => …` or a static layer method builds the service when it is called.
      if (Opt.exists(parentOf(node), (parent) => isConstructionRoot(parent, node, imports))) {
        return true;
      }

      const constructor = effectConstructorOf(node, imports);

      if (Opt.contains(constructor, 'gen')) {
        return yielded && isInServiceConstruction(node, false, imports);
      }

      return (
        Opt.exists(constructor, (name) => Arr.contains(thunkConstructors, name)) &&
        isInServiceConstruction(node, yielded, imports)
      );
    }

    // `Effect.succeed` holds its argument as a value; a `yield*` inside the argument still runs first.
    if (
      (!yielded &&
        ((node.type === 'Property' && !isEffectAllProperty(node, imports)) ||
          (node.type === 'CallExpression' &&
            imports.isApi(node.callee, 'Effect', 'succeed' satisfies keyof typeof Effect)))) ||
      (node.type === 'CallExpression' && isApiCall(node, imports, 'Effect', operationConstructors))
    ) {
      return false;
    }

    return isInServiceConstruction(node, yielded || (node.type === 'YieldExpression' && node.delegate), imports);
  });
}

/**
 * Keep service construction failures typed instead of turning them into defects.
 */
export const noOrDieInServiceConstruction = Rule.define({
  name: 'no-ordie-in-service-construction',
  meta: ruleMeta({
    type: 'problem',
    description:
      'Disallow `Effect.orDie` while constructing a service (its make, its static layers, or Layer.effect/unwrap arguments) and `Layer.orDie` anywhere.',
    messages: {
      constructionOrDie:
        "`Effect.orDie` turns a service construction failure into a defect. Classify the failure as a Schema.TaggedError and let it flow through the layer's error channel (`Layer.Layer<Service, ThatError>`), or handle it here with Effect.catchTag.",
      layerOrDie:
        "`Layer.orDie` hides this layer's construction failures as defects. Leave them in the layer's error channel as Schema.TaggedErrors and handle them where the runtime is built.",
    },
    url: 'https://github.com/K-Mistele/anti-slop/blob/main/src/effect/rules/no-ordie-in-service-construction.ts',
  }),
  *create() {
    const ctx = yield* RuleContext;

    if (isTestFilename(Str.replaceAll('\\', '/')(ctx.filename))) {
      return {};
    }

    const imports = yield* importBindings;

    function check(node: ESTree.Node) {
      if (imports.isApi(node, 'Layer', 'orDie' satisfies keyof typeof Layer)) {
        return ctx.report(Diagnostic.fromId({ node, messageId: 'layerOrDie' }));
      }

      return imports.isApi(node, 'Effect', 'orDie' satisfies keyof typeof Effect) &&
        isInServiceConstruction(node, false, imports)
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'constructionOrDie' }))
        : Effect.void;
    }

    return Visitor.merge(
      Visitor.on('MemberExpression', check),
      // Check every read of a named import such as `import { orDie } from 'effect/Layer'`.
      // Property and method names never read it, and a local that shadows it is another variable.
      Visitor.on('ImportSpecifier', (specifier) =>
        // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
        Effect.forEach(
          Arr.flatMap(ctx.sourceCode.getDeclaredVariables(specifier), ({ references }) =>
            Arr.filter(
              references,
              (reference) => reference.identifier.parent.type !== 'ExportSpecifier' && reference.isRead(),
            ),
          ),
          ({ identifier }) => check(identifier),
          { concurrency: 1, discard: true },
        ),
      ),
    );
  },
});
