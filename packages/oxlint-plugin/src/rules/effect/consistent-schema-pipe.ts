import type * as EffectBarrel from 'effect';
import { Diagnostic, Rule, RuleContext, Visitor, type ESTree, type OxlintSourceCode } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';
import * as Struct from 'effect/Struct';
import * as Tuple from 'effect/Tuple';

import {
  argumentAt,
  containsRange,
  containsSame,
  isSomeSame,
  staticPath,
  staticPropertyName,
} from '../../internal/ast';
import { importBindings, namespaceMember, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { isImportedApiIn, lookupVariable } from '../../internal/scope';

type SchemaApi = keyof typeof Schema;

// Lists follow docs/adr/0001 for the catalog's Effect version; revisit them when Effect adds Schema functions.
const isModifier = Schema.is(
  Schema.Literals([
    'flip',
    'fromFormData',
    'fromJsonString',
    'fromURLSearchParams',
    'mutable',
    'mutableKey',
    'NullishOr',
    'NullOr',
    'optional',
    'optionalKey',
    'OptionFromNullishOr',
    'OptionFromNullOr',
    'OptionFromOptional',
    'OptionFromOptionalKey',
    'OptionFromOptionalNullOr',
    'OptionFromUndefinedOr',
    'readonlyKey',
    'RedactedFromValue',
    'required',
    'requiredKey',
    'toCodecArrayFromSingle',
    'toCodecGoJson',
    'toCodecIso',
    'toCodecJson',
    'toCodecStringTree',
    'toEncoded',
    'toType',
    'UndefinedOr',
  ] satisfies ReadonlyArray<SchemaApi>),
);

const isWrapper = Schema.is(
  Schema.Literals([
    'Array',
    'ArrayEnsure',
    'Chunk',
    'HashSet',
    'NonEmptyArray',
    'Option',
    'ReadonlySet',
    'Redacted',
    'Tree',
    'UniqueArray',
  ] satisfies ReadonlyArray<SchemaApi>),
);

const isDataLastStep = Schema.is(
  Schema.Literals([
    'annotate',
    'annotateEncoded',
    'annotateKey',
    'brand',
    'catchDecoding',
    'catchDecodingWithContext',
    'catchEncoding',
    'catchEncodingWithContext',
    'check',
    'decode',
    'decodeTo',
    'encode',
    'encodeKeys',
    'encodeTo',
    'extendTo',
    'fieldsAssign',
    'fromBrand',
    'middlewareDecoding',
    'middlewareEncoding',
    'overrideToCodecIso',
    'overrideToEquivalence',
    'overrideToFormatter',
    'refine',
    'toTaggedUnion',
    'withConstructorDefault',
    'withDecodingDefault',
    'withDecodingDefaultKey',
    'withDecodingDefaultType',
    'withDecodingDefaultTypeKey',
  ] satisfies ReadonlyArray<SchemaApi>),
);

// Schema methods that return a schema, so a head built from them still has `.pipe`.
const isSchemaMethod = Schema.is(
  Schema.Literals(['annotate', 'annotateKey', 'check', 'mapFields'] satisfies ReadonlyArray<
    keyof Schema.Struct<Schema.Struct.Fields>
  >),
);

// Heads that can take `.pipe(...)` without parentheses.
const isMemberSafeHead = Schema.is(
  Schema.Literals(['CallExpression', 'Identifier', 'MemberExpression', 'ThisExpression']),
);

const isPureLeaf = Schema.is(
  Schema.Literals(['ArrowFunctionExpression', 'FunctionExpression', 'Identifier', 'Literal', 'ThisExpression']),
);

const ConstructorName = Schema.String.check(Schema.isPattern(/^\p{Lu}/u));

const isConstructorName = Schema.is(ConstructorName);

// Stands in for the head while rendering, so the fix only rewrites the text around it.
const headMarker = '\0';

interface Violation {
  readonly kind: 'dataLastCall' | 'functionPipe' | 'modifierCall' | 'wrapperPipe';
  readonly name?: string;
}

interface Step {
  readonly text: string;
  readonly wrapper: boolean;
}

interface Chain {
  readonly head: ESTree.Expression;
  readonly steps: ReadonlyArray<Step>;
  readonly violation: Opt.Option<Violation>;
  // The fix would evaluate an impure expression at a different time than the original code.
  readonly reordersEffects: boolean;
}

/**
 * What the chain analysis reads from the file: its source and its import bindings.
 */
interface Env {
  readonly sourceCode: OxlintSourceCode;
  readonly imports: ImportBindings;
}

function isSchemaFunction(name: string): boolean {
  return isModifier(name) || isWrapper(name);
}

/**
 * The `Schema` member a two-part expression such as `Schema.optional` or `S.Array` names, while its import is still in
 * scope.
 *
 * @param node Expression.
 * @param env File being linted.
 */
function schemaMember(node: ESTree.Node, env: Env): Opt.Option<string> {
  return Opt.filter(
    env.imports.member(node, 'Schema'),
    () => Opt.exists(staticPath(node), (local) => local.length === 2) && isImportedApiIn(env.sourceCode, node),
  );
}

function allPure(nodes: ReadonlyArray<ESTree.Node | null>, env: Env): boolean {
  return Arr.every(nodes, (node) => P.isNull(node) || isPure(node, env));
}

/**
 * Whether evaluating an expression has no observable effect, so a fix may move it. Schema factories count as pure.
 *
 * @param node Expression.
 * @param env File being linted.
 */
function isPure(node: ESTree.Node, env: Env): boolean {
  return (
    isPureLeaf(node.type) ||
    Match.value(node).pipe(
      Match.discriminators('type')({
        MemberExpression: ({ object, computed, property }) =>
          isPure(object, env) && (!computed || isPure(property, env)),
        TemplateLiteral: ({ expressions }) => allPure(expressions, env),
        ArrayExpression: ({ elements }) => allPure(elements, env),
        ObjectExpression: ({ properties }) =>
          Arr.every(properties, (property) =>
            property.type === 'SpreadElement'
              ? isPure(property.argument, env)
              : (!property.computed || isPure(property.key, env)) && isPure(property.value, env),
          ),
        CallExpression: (call) => {
          const callee = call.callee.type === 'CallExpression' ? call.callee.callee : call.callee;

          return (
            Opt.isSome(schemaMember(callee, env)) &&
            (call.callee === callee || isPure(call.callee, env)) &&
            allPure(call.arguments, env)
          );
        },
      }),
      Match.orElse(Fn.constFalse),
    )
  );
}

function typePath(node: ESTree.TSTypeName, imports: ImportBindings): Opt.Option<ReadonlyArray<string>> {
  if (node.type === 'Identifier') {
    return Opt.fromNullishOr(imports.bindings.get(node.name));
  }

  return node.type === 'TSQualifiedName'
    ? Opt.map(typePath(node.left, imports), (left) => [...left, node.right.name])
    : Opt.none();
}

/**
 * The type parameter named `name` that is in scope at `from`.
 *
 * @param name Type parameter name.
 * @param from Reference site.
 */
function typeParameter(name: string, from: ESTree.Node): Opt.Option<ESTree.TSTypeParameter> {
  return Opt.fromNullishOr(from.parent as ESTree.Node | null).pipe(
    Opt.flatMap((node) => {
      const declared =
        'typeParameters' in node && node.typeParameters?.type === 'TSTypeParameterDeclaration'
          ? Arr.findFirst(node.typeParameters.params, (candidate) => candidate.name.name === name)
          : Opt.none();

      return Opt.orElse(declared, () => typeParameter(name, node));
    }),
  );
}

/**
 * Whether a value of the declared type has `.pipe`, or none when that is unknown without type information. A type
 * parameter only has `.pipe` when its constraint does, so constraints are followed to a Schema type.
 *
 * @param declared Declared type.
 * @param from Where the type is written, for resolving type parameters.
 * @param imports Import bindings of the file.
 * @param seen Type parameters already followed.
 */
function hasPipe(
  declared: ESTree.TSType | null,
  from: ESTree.Node,
  imports: ImportBindings,
  seen: ReadonlyArray<ESTree.TSTypeParameter> = [],
): Opt.Option<boolean> {
  const unknownOrFalse = Arr.isReadonlyArrayEmpty(seen) ? Opt.none<boolean>() : Opt.some(false);

  if (declared?.type !== 'TSTypeReference') {
    return unknownOrFalse;
  }

  const member = Opt.flatMap(typePath(declared.typeName, imports), (path) => namespaceMember(path, 'Schema'));

  if (Opt.isSome(member)) {
    // Schema.Constraint and its subtypes are not Pipeable, unlike Schema.Top and the schemas built on it.
    return Opt.some(!Str.startsWith('Constraint')(member.value));
  }

  const { typeName } = declared;

  const parameter = Opt.filter(
    typeName.type === 'Identifier' ? typeParameter(typeName.name, from) : Opt.none(),
    (candidate) => !containsSame(seen, candidate),
  );

  return Opt.match(parameter, {
    onNone: () => unknownOrFalse,
    onSome: (next) => hasPipe(next.constraint, next, imports, [...seen, next]),
  });
}

function declaredType(node: ESTree.IdentifierReference, env: Env): Opt.Option<ESTree.TSTypeAnnotation> {
  return lookupVariable(env.sourceCode, node, node.name).pipe(
    Opt.flatMap(({ defs }) => Arr.head(defs)),
    Opt.flatMapNullishOr(({ name }) => ('typeAnnotation' in name ? name.typeAnnotation : undefined)),
  );
}

function unwrapHead(node: ESTree.Expression): ESTree.Expression {
  return node.type === 'TSSatisfiesExpression' || node.type === 'TSNonNullExpression'
    ? unwrapHead(node.expression)
    : node;
}

// Without types, only the declared type of a head shows that it cannot take `.pipe(...)`, e.g. a generic schema.
function headLacksPipe(node: ESTree.Expression, env: Env): boolean {
  const head = unwrapHead(node);

  if (head.type === 'TSAsExpression') {
    return Opt.contains(hasPipe(head.typeAnnotation, head, env.imports), false);
  }

  return Opt.exists(head.type === 'Identifier' ? declaredType(head, env) : Opt.none(), (annotation) =>
    Opt.contains(hasPipe(annotation.typeAnnotation, annotation, env.imports), false),
  );
}

function hasSpread(node: ESTree.CallExpression): boolean {
  return Arr.some(node.arguments, (argument) => argument.type === 'SpreadElement');
}

function isMethodPipe(
  node: ESTree.CallExpression,
): node is ESTree.CallExpression & { readonly callee: ESTree.MemberExpression } {
  return (
    node.callee.type === 'MemberExpression' &&
    !node.callee.optional &&
    Opt.contains(staticPropertyName(node.callee), 'pipe') &&
    !node.typeArguments &&
    !hasSpread(node)
  );
}

function isFunctionPipe(node: ESTree.CallExpression, env: Env): boolean {
  return (
    (env.imports.isApiPath(node.callee, ['pipe' satisfies keyof typeof EffectBarrel]) ||
      env.imports.isApiPath(node.callee, ['Function', 'pipe' satisfies keyof typeof Fn])) &&
    isImportedApiIn(env.sourceCode, node.callee)
  );
}

function isKnownStep(node: ESTree.Node, env: Env): boolean {
  return (
    Opt.exists(schemaMember(node, env), isSchemaFunction) ||
    (node.type === 'CallExpression' && Opt.exists(schemaMember(node.callee, env), isDataLastStep))
  );
}

// A Schema constructor or value, a schema chain, or a schema method called on one of those.
function isSchemaHead(node: ESTree.Expression, env: Env): boolean {
  if (Opt.exists(schemaMember(node, env), isConstructorName) || Opt.isSome(flatten(node, env))) {
    return true;
  }

  if (node.type !== 'CallExpression') {
    return false;
  }

  return Opt.match(schemaMember(node.callee, env), {
    onSome: (name) => isConstructorName(name) || isSchemaFunction(name),
    onNone: () =>
      node.callee.type === 'MemberExpression' &&
      Opt.exists(staticPropertyName(node.callee), isSchemaMethod) &&
      isSchemaHead(node.callee.object, env),
  });
}

// Without types, only rewrite `pipe(x, ...)` when x is known to be a schema, so `x.pipe` exists.
function functionPipeParts(
  node: ESTree.CallExpression,
  env: Env,
): Opt.Option<readonly [ESTree.Expression, ReadonlyArray<ESTree.Expression>]> {
  const [head, first] = node.arguments;

  if (
    P.isUndefined(head) ||
    P.isUndefined(first) ||
    head.type === 'SpreadElement' ||
    node.typeArguments ||
    hasSpread(node) ||
    (!isSchemaHead(head, env) && !isKnownStep(first, env))
  ) {
    return Opt.none();
  }

  return Opt.some([head, node.arguments.slice(1) as ReadonlyArray<ESTree.Expression>]);
}

/**
 * Extend the chain of `receiver` with more steps. The innermost violation wins, so the report names the first one.
 *
 * @param receiver Expression the steps apply to.
 * @param steps Steps in application order.
 * @param violation Violation of these steps.
 * @param reordersEffects Whether fixing these steps would reorder effects.
 * @param env File being linted.
 */
function appendSteps(
  receiver: ESTree.Expression,
  steps: ReadonlyArray<Step>,
  violation: Opt.Option<Violation>,
  reordersEffects: boolean,
  env: Env,
): Chain {
  const inner = flattenOrHead(receiver, env);

  return {
    head: inner.head,
    steps: [...inner.steps, ...steps],
    violation: Opt.orElse(inner.violation, () => violation),
    reordersEffects: inner.reordersEffects || reordersEffects,
  };
}

function callChain(node: ESTree.CallExpression, env: Env): Opt.Option<Chain> {
  // A rewrite would drop explicit type arguments, so such calls are left alone.
  const soleArgument = node.arguments.length === 1 && !node.typeArguments ? argumentAt(node, 0) : Opt.none();

  return Opt.flatMap(soleArgument, (argument) => {
    const step: Step = { text: env.sourceCode.getText(node.callee), wrapper: false };

    function dataLastStep() {
      return (node.callee.type === 'CallExpression' ? schemaMember(node.callee.callee, env) : Opt.none()).pipe(
        Opt.filter(isDataLastStep),
        Opt.map((name) =>
          appendSteps(
            argument,
            [step],
            Opt.some({ kind: 'dataLastCall', name }),
            // The configured step was evaluated before the schema; in a pipe the schema comes first.
            !isPure(node.callee, env) && !isPure(argument, env),
            env,
          ),
        ),
      );
    }

    return schemaMember(node.callee, env).pipe(
      Opt.filter(isSchemaFunction),
      Opt.match({
        onNone: dataLastStep,
        onSome: (name) => {
          const wrapper = isWrapper(name);

          return Opt.some(
            appendSteps(
              argument,
              [Struct.assign(step, { wrapper })],
              wrapper ? Opt.none() : Opt.some({ kind: 'modifierCall', name }),
              false,
              env,
            ),
          );
        },
      }),
    );
  });
}

function pipeChain(node: ESTree.CallExpression, env: Env): Opt.Option<Chain> {
  const functionPipe = isFunctionPipe(node, env);

  const parts = functionPipe
    ? functionPipeParts(node, env)
    : isMethodPipe(node)
      ? Opt.some([node.callee.object, node.arguments as ReadonlyArray<ESTree.Expression>] as const)
      : Opt.none();

  return Opt.map(parts, ([receiver, args]) => {
    const names = Arr.map(args, (arg) => schemaMember(arg, env));

    const firstWrapper = Arr.findFirstIndex(names, Opt.exists(isWrapper));

    // Steps after an extracted wrapper move into a later pipe, so they would be built after earlier steps ran.
    const reordersEffects = Opt.exists(firstWrapper, (index) =>
      Arr.some(args.slice(index + 1), (arg) => !isPure(arg, env)),
    );

    const violation: Opt.Option<Violation> = functionPipe
      ? Opt.some({ kind: 'functionPipe' })
      : firstWrapper.pipe(
          Opt.flatMap((index) => Opt.flatten(Arr.get(names, index))),
          Opt.map((name) => ({ kind: 'wrapperPipe', name })),
        );

    return appendSteps(
      receiver,
      Arr.map(args, (arg, index) => ({
        text: env.sourceCode.getText(arg),
        wrapper: Arr.get(names, index).pipe(Opt.flatten, Opt.exists(isWrapper)),
      })),
      violation,
      reordersEffects,
      env,
    );
  });
}

function flatten(node: ESTree.Expression, env: Env): Opt.Option<Chain> {
  return node.type === 'CallExpression' ? Opt.orElse(callChain(node, env), () => pipeChain(node, env)) : Opt.none();
}

function flattenOrHead(node: ESTree.Expression, env: Env): Chain {
  return Opt.getOrElse(flatten(node, env), () => ({
    head: node,
    steps: [],
    violation: Opt.none(),
    reordersEffects: false,
  }));
}

// The outermost chain reports once and fixes the whole chain.
function isNestedInChain(node: ESTree.CallExpression, env: Env): boolean {
  const parent = node.parent;

  if (parent.type === 'MemberExpression' && parent.object === node && parent.parent.type === 'CallExpression') {
    return parent.parent.callee === parent && isMethodPipe(parent.parent);
  }

  // The first argument of a method pipe is a step, not the head.
  return (
    parent.type === 'CallExpression' &&
    isSomeSame(argumentAt(parent, 0), node) &&
    (isFunctionPipe(parent, env) || !isMethodPipe(parent)) &&
    Opt.isSome(flatten(parent, env))
  );
}

function pipeSteps(target: string, steps: ReadonlyArray<string>, head: ESTree.Expression): string {
  if (!Arr.isReadonlyArrayNonEmpty(steps)) {
    return target;
  }

  const receiver = target === headMarker && !isMemberSafeHead(head.type) ? `(${headMarker})` : target;

  return `${receiver}.pipe(${Arr.join(steps, ', ')})`;
}

interface Rendering {
  readonly target: string;
  readonly pending: ReadonlyArray<string>;
}

/**
 * Render a chain in its preferred form. Wrappers take everything before them as their argument; the remaining steps
 * stay in a trailing pipe.
 *
 * @param head Chain head, rendered as the head marker.
 * @param steps Steps in application order.
 */
function render(head: ESTree.Expression, steps: ReadonlyArray<Step>): string {
  const { target, pending } = Arr.reduce(
    steps,
    { target: headMarker, pending: [] } as Rendering,
    ({ target: current, pending: queued }, step): Rendering => {
      if (!step.wrapper) {
        return { target: current, pending: [...queued, step.text] };
      }

      const argument = pipeSteps(current, queued, head);

      // A comma expression would otherwise become several arguments.
      const safeArgument = argument === headMarker && head.type === 'SequenceExpression' ? `(${argument})` : argument;

      return { target: `${step.text}(${safeArgument})`, pending: [] };
    },
  );

  return pipeSteps(target, pending, head);
}

export const consistentSchemaPipe = Rule.define({
  name: 'consistent-schema-pipe',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Apply Schema modifiers with `.pipe(...)` and call Schema wrappers directly.',
    messages: {
      modifierCall: 'Apply Schema.{{name}} with `.pipe(...)` instead of calling it.',
      dataLastCall: 'Apply Schema.{{name}}(...) with `.pipe(...)` instead of calling it on the schema.',
      functionPipe: 'Call `.pipe(...)` on the schema instead of passing it to `pipe(...)`.',
      wrapperPipe: 'Call Schema.{{name}}(...) directly instead of piping into it.',
    },
    url: 'https://github.com/2digits-agency/configs/blob/main/docs/adr/0001-schema-modifiers-pipe-wrappers-call.md',
    fixable: 'code',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    const env: Env = { sourceCode: ctx.sourceCode, imports };

    function report(node: ESTree.CallExpression, chain: Chain, violation: Violation) {
      const { head } = chain;

      // Steps are moved around, so comments between them would be lost.
      const hasComments = Arr.some(ctx.sourceCode.getCommentsInside(node), (comment) => !containsRange(head, comment));

      // Chains inside the head keep their own fixes; chains inside steps are fixed on a later pass.
      const [prefix, suffix = ''] = Str.split(render(head, chain.steps), headMarker);

      const diagnostic = Diagnostic.fromId({
        node,
        messageId: violation.kind,
        data: { name: violation.name ?? '' },
      });

      return ctx.report(
        hasComments || chain.reordersEffects
          ? diagnostic
          : Diagnostic.withFix(
              diagnostic,
              Diagnostic.composeFixes(
                (fixer) => fixer.replaceTextRange([Tuple.get(node.range, 0), Tuple.get(head.range, 0)], prefix),
                (fixer) => fixer.replaceTextRange([Tuple.get(head.range, 1), Tuple.get(node.range, 1)], suffix),
              ),
            ),
      );
    }

    return Visitor.on('CallExpression', (node) => {
      const chain = Opt.filter(
        flatten(node, env),
        // Unless a wrapper comes first, the fix calls `.pipe(...)` on the head itself.
        ({ head, steps }) => !Opt.exists(Arr.head(steps), ({ wrapper }) => !wrapper) || !headLacksPipe(head, env),
      );

      return chain.pipe(
        Opt.flatMap((found) => Opt.map(found.violation, (violation) => [found, violation] as const)),
        Opt.filter(() => !isNestedInChain(node, env)),
        Opt.match({
          onNone: () => Effect.void,
          onSome: ([found, violation]) => report(node, found, violation),
        }),
      );
    });
  },
});
