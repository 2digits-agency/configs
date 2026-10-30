import type { Context, ESTree, Rule } from '@oxlint/plugins';
import type * as EffectBarrel from 'effect';
import * as Arr from 'effect/Array';
import * as Fn from 'effect/Function';
import * as Opt from 'effect/Option';
import type * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { importedApi } from '../../fixes';
import {
  canonicalPath,
  containsRange,
  defineEffectRule,
  isApiPath,
  resolveVariable,
  ruleMeta,
  staticPath,
  staticPropertyName,
  type FileState,
} from '../../utils';

// Lists follow docs/adr/0001 for the catalog's Effect version; revisit them when Effect adds Schema functions.
const modifiers: ReadonlySet<string> = new Set([
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
] satisfies ReadonlyArray<keyof typeof Schema>);

const wrappers: ReadonlySet<string> = new Set([
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
] satisfies ReadonlyArray<keyof typeof Schema>);

const dataLastSteps: ReadonlySet<string> = new Set([
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
] satisfies ReadonlyArray<keyof typeof Schema>);

// Schema methods that return a schema, so a head built from them still has `.pipe`.
const schemaMethods: ReadonlySet<string> = new Set([
  'annotate',
  'annotateKey',
  'check',
  'mapFields',
] satisfies ReadonlyArray<keyof Schema.Struct<Schema.Struct.Fields>>);

// Heads that can take `.pipe(...)` without parentheses.
const memberSafeHeads = new Set<string>(['CallExpression', 'Identifier', 'MemberExpression', 'ThisExpression']);

// Stands in for the head while rendering, so the fix only rewrites the text around it.
const headMarker = '\0';

const constructorName = /^\p{Lu}/u;

type Violation = 'dataLastCall' | 'functionPipe' | 'modifierCall' | 'wrapperPipe';

interface Step {
  readonly text: string;
  readonly wrapper: boolean;
}

interface Chain {
  readonly head: ESTree.Expression;
  readonly steps: ReadonlyArray<Step>;
  readonly violation: { readonly kind: Violation; readonly name?: string } | undefined;
  // The fix would evaluate an impure expression at a different time than the original code.
  readonly reordersEffects: boolean;
}

function schemaMember(node: ESTree.Node, context: Context, state: FileState): string | undefined {
  const path = canonicalPath(node, state);

  return staticPath(node)?.length === 2 && path?.length === 2 && path[0] === 'Schema' && importedApi(context, node)
    ? path[1]
    : undefined;
}

function isWrapper(name: string | undefined): name is string {
  return name !== undefined && wrappers.has(name);
}

function isSchemaFunction(name: string | undefined): name is string {
  return name !== undefined && (modifiers.has(name) || wrappers.has(name));
}

const pureLeaves = new Set<string>([
  'ArrowFunctionExpression',
  'FunctionExpression',
  'Identifier',
  'Literal',
  'ThisExpression',
]);

function allPure(nodes: ReadonlyArray<ESTree.Node | null>, context: Context, state: FileState): boolean {
  return Arr.every(nodes, (node) => node === null || isPure(node, context, state));
}

// Expressions whose evaluation has no observable effect, so a fix may move them. Schema factories count as pure.
function isPure(node: ESTree.Node, context: Context, state: FileState): boolean {
  if (pureLeaves.has(node.type)) {
    return true;
  }

  if (node.type === 'MemberExpression') {
    return isPure(node.object, context, state) && (!node.computed || isPure(node.property, context, state));
  }

  if (node.type === 'TemplateLiteral') {
    return allPure(node.expressions, context, state);
  }

  if (node.type === 'ArrayExpression') {
    return allPure(node.elements, context, state);
  }

  if (node.type === 'ObjectExpression') {
    return Arr.every(node.properties, (property) =>
      property.type === 'SpreadElement'
        ? isPure(property.argument, context, state)
        : (!property.computed || isPure(property.key, context, state)) && isPure(property.value, context, state),
    );
  }

  if (node.type !== 'CallExpression') {
    return false;
  }

  const callee = node.callee.type === 'CallExpression' ? node.callee.callee : node.callee;

  return (
    schemaMember(callee, context, state) !== undefined &&
    (node.callee === callee || isPure(node.callee, context, state)) &&
    allPure(node.arguments, context, state)
  );
}

function typePath(node: ESTree.TSTypeName, state: FileState): ReadonlyArray<string> | undefined {
  if (node.type === 'Identifier') {
    return state.bindings.get(node.name);
  }

  if (node.type !== 'TSQualifiedName') {
    return undefined;
  }

  const left = typePath(node.left, state);

  return left === undefined ? undefined : [...left, node.right.name];
}

function typeParameter(name: string, from: ESTree.Node): ESTree.TSTypeParameter | undefined {
  for (let node: ESTree.Node | null = from.parent; node !== null; node = node.parent) {
    const parameter =
      'typeParameters' in node && node.typeParameters?.type === 'TSTypeParameterDeclaration'
        ? Fn.pipe(
            node.typeParameters.params,
            Arr.findFirst((candidate) => candidate.name.name === name),
            Opt.getOrUndefined,
          )
        : undefined;

    if (parameter !== undefined) {
      return parameter;
    }
  }

  return undefined;
}

// Whether a value of the declared type has `.pipe`, or undefined when that is unknown without type information.
function hasPipe(declared: ESTree.TSType, from: ESTree.Node, state: FileState): boolean | undefined {
  const seen = new Set<ESTree.TSTypeParameter>();

  let type: ESTree.TSType | null = declared;

  let scope: ESTree.Node = from;

  // A type parameter only has `.pipe` when its constraint does, so follow constraints to a Schema type.
  while (type?.type === 'TSTypeReference') {
    const path = typePath(type.typeName, state);

    const member = path?.length === 2 && path[0] === 'Schema' ? path[1] : undefined;

    if (member !== undefined) {
      // Schema.Constraint and its subtypes are not Pipeable, unlike Schema.Top and the schemas built on it.
      return !Str.startsWith('Constraint')(member);
    }

    const parameter: ESTree.TSTypeParameter | undefined =
      type.typeName.type === 'Identifier' ? typeParameter(type.typeName.name, scope) : undefined;

    if (parameter === undefined || seen.has(parameter)) {
      return seen.size === 0 ? undefined : false;
    }

    seen.add(parameter);

    type = parameter.constraint;

    scope = parameter;
  }

  return seen.size === 0 ? undefined : false;
}

function declaredType(node: ESTree.IdentifierReference, context: Context): ESTree.TSTypeAnnotation | undefined {
  const name = resolveVariable(context, node, node.name)?.defs[0]?.name;

  return name !== undefined && 'typeAnnotation' in name ? (name.typeAnnotation ?? undefined) : undefined;
}

// Without types, only the declared type of a head shows that it cannot take `.pipe(...)`, e.g. a generic schema.
function headLacksPipe(node: ESTree.Expression, context: Context, state: FileState): boolean {
  let head = node;

  while (head.type === 'TSSatisfiesExpression' || head.type === 'TSNonNullExpression') {
    head = head.expression;
  }

  if (head.type === 'TSAsExpression') {
    return hasPipe(head.typeAnnotation, head, state) === false;
  }

  const annotation = head.type === 'Identifier' ? declaredType(head, context) : undefined;

  return annotation !== undefined && hasPipe(annotation.typeAnnotation, annotation, state) === false;
}

function hasSpread(node: ESTree.CallExpression): boolean {
  return Arr.some(node.arguments, (argument) => argument.type === 'SpreadElement');
}

// A rewrite would drop explicit type arguments, so such calls are left alone.
function soleArgument(node: ESTree.CallExpression): ESTree.Expression | undefined {
  const [argument] = node.arguments;

  return node.arguments.length === 1 && argument?.type !== 'SpreadElement' && !node.typeArguments
    ? argument
    : undefined;
}

function isMethodPipe(
  node: ESTree.CallExpression,
): node is ESTree.CallExpression & { readonly callee: ESTree.MemberExpression } {
  return (
    node.callee.type === 'MemberExpression' &&
    !node.callee.optional &&
    staticPropertyName(node.callee) === 'pipe' &&
    !node.typeArguments &&
    !hasSpread(node)
  );
}

function isFunctionPipe(node: ESTree.CallExpression, context: Context, state: FileState): boolean {
  return (
    (isApiPath(node.callee, state, ['pipe' satisfies keyof typeof EffectBarrel]) ||
      isApiPath(node.callee, state, ['Function', 'pipe' satisfies keyof typeof Fn])) &&
    importedApi(context, node.callee)
  );
}

function isKnownStep(node: ESTree.Node, context: Context, state: FileState): boolean {
  if (isSchemaFunction(schemaMember(node, context, state))) {
    return true;
  }

  return node.type === 'CallExpression' && dataLastSteps.has(schemaMember(node.callee, context, state) ?? '');
}

// A Schema constructor or value, a schema chain, or a schema method called on one of those.
function isSchemaHead(node: ESTree.Expression, context: Context, state: FileState): boolean {
  if (constructorName.test(schemaMember(node, context, state) ?? '') || flatten(node, context, state) !== undefined) {
    return true;
  }

  if (node.type !== 'CallExpression') {
    return false;
  }

  const name = schemaMember(node.callee, context, state);

  if (name !== undefined) {
    return constructorName.test(name) || isSchemaFunction(name);
  }

  return (
    node.callee.type === 'MemberExpression' &&
    schemaMethods.has(staticPropertyName(node.callee) ?? '') &&
    isSchemaHead(node.callee.object, context, state)
  );
}

// Without types, only rewrite `pipe(x, ...)` when x is known to be a schema, so `x.pipe` exists.
function functionPipeParts(
  node: ESTree.CallExpression,
  context: Context,
  state: FileState,
): readonly [ESTree.Expression, ReadonlyArray<ESTree.Expression>] | undefined {
  const [head, first] = node.arguments;

  if (
    head === undefined ||
    first === undefined ||
    head.type === 'SpreadElement' ||
    node.typeArguments ||
    hasSpread(node) ||
    (!isSchemaHead(head, context, state) && !isKnownStep(first, context, state))
  ) {
    return undefined;
  }

  return [head, node.arguments.slice(1) as ReadonlyArray<ESTree.Expression>];
}

function appendStep(
  argument: ESTree.Expression,
  step: Step,
  violation: Chain['violation'],
  reordersEffects: boolean,
  context: Context,
  state: FileState,
): Chain {
  const inner = flattenOrHead(argument, context, state);

  return {
    head: inner.head,
    steps: [...inner.steps, step],
    violation: inner.violation ?? violation,
    reordersEffects: inner.reordersEffects || reordersEffects,
  };
}

function callChain(node: ESTree.CallExpression, context: Context, state: FileState): Chain | undefined {
  const argument = soleArgument(node);

  if (argument === undefined) {
    return undefined;
  }

  const name = schemaMember(node.callee, context, state);

  if (isSchemaFunction(name)) {
    const wrapper = isWrapper(name);

    return appendStep(
      argument,
      { text: context.sourceCode.getText(node.callee), wrapper },
      wrapper ? undefined : { kind: 'modifierCall', name },
      false,
      context,
      state,
    );
  }

  const stepName = node.callee.type === 'CallExpression' ? schemaMember(node.callee.callee, context, state) : undefined;

  if (stepName === undefined || !dataLastSteps.has(stepName)) {
    return undefined;
  }

  return appendStep(
    argument,
    { text: context.sourceCode.getText(node.callee), wrapper: false },
    { kind: 'dataLastCall', name: stepName },
    // The configured step was evaluated before the schema; in a pipe the schema comes first.
    !isPure(node.callee, context, state) && !isPure(argument, context, state),
    context,
    state,
  );
}

function pipeChain(node: ESTree.CallExpression, context: Context, state: FileState): Chain | undefined {
  const functionPipe = isFunctionPipe(node, context, state);

  const parts = functionPipe
    ? functionPipeParts(node, context, state)
    : isMethodPipe(node)
      ? ([node.callee.object, node.arguments as ReadonlyArray<ESTree.Expression>] as const)
      : undefined;

  if (parts === undefined) {
    return undefined;
  }

  const [receiver, args] = parts;

  const names = Arr.map(args, (arg) => schemaMember(arg, context, state));

  const firstWrapper = Fn.pipe(names, Arr.findFirst(isWrapper), Opt.getOrUndefined);

  // Steps after an extracted wrapper move into a later pipe, so they would be built after earlier steps ran.
  const reordersEffects =
    firstWrapper !== undefined &&
    Arr.some(args.slice(names.indexOf(firstWrapper) + 1), (arg) => !isPure(arg, context, state));

  return appendSteps(
    receiver,
    Arr.map(args, (arg, index) => ({ text: context.sourceCode.getText(arg), wrapper: isWrapper(names[index]) })),
    functionPipe
      ? { kind: 'functionPipe' }
      : firstWrapper === undefined
        ? undefined
        : { kind: 'wrapperPipe', name: firstWrapper },
    reordersEffects,
    context,
    state,
  );
}

function appendSteps(
  receiver: ESTree.Expression,
  steps: ReadonlyArray<Step>,
  violation: Chain['violation'],
  reordersEffects: boolean,
  context: Context,
  state: FileState,
): Chain {
  const inner = flattenOrHead(receiver, context, state);

  return {
    head: inner.head,
    steps: [...inner.steps, ...steps],
    violation: inner.violation ?? violation,
    reordersEffects: inner.reordersEffects || reordersEffects,
  };
}

function flatten(node: ESTree.Expression, context: Context, state: FileState): Chain | undefined {
  return node.type === 'CallExpression'
    ? (callChain(node, context, state) ?? pipeChain(node, context, state))
    : undefined;
}

function flattenOrHead(node: ESTree.Expression, context: Context, state: FileState): Chain {
  return flatten(node, context, state) ?? { head: node, steps: [], violation: undefined, reordersEffects: false };
}

// The outermost chain reports once and fixes the whole chain.
function isNestedInChain(node: ESTree.CallExpression, context: Context, state: FileState): boolean {
  const parent = node.parent;

  if (parent.type === 'MemberExpression' && parent.object === node && parent.parent.type === 'CallExpression') {
    return parent.parent.callee === parent && isMethodPipe(parent.parent);
  }

  // The first argument of a method pipe is a step, not the head.
  return (
    parent.type === 'CallExpression' &&
    parent.arguments[0] === node &&
    (isFunctionPipe(parent, context, state) || !isMethodPipe(parent)) &&
    flatten(parent, context, state) !== undefined
  );
}

function pipeSteps(target: string, steps: ReadonlyArray<string>, head: ESTree.Expression): string {
  if (!Arr.isReadonlyArrayNonEmpty(steps)) {
    return target;
  }

  const receiver = target === headMarker && !memberSafeHeads.has(head.type) ? `(${headMarker})` : target;

  return `${receiver}.pipe(${Arr.join(steps, ', ')})`;
}

// Wrappers take everything before them as their argument; the remaining steps stay in a trailing pipe.
function render(head: ESTree.Expression, steps: ReadonlyArray<Step>): string {
  let target = headMarker;

  let pending: Array<string> = [];

  for (const step of steps) {
    if (step.wrapper) {
      const argument = pipeSteps(target, pending, head);

      // A comma expression would otherwise become several arguments.
      const safeArgument = argument === headMarker && head.type === 'SequenceExpression' ? `(${argument})` : argument;

      target = `${step.text}(${safeArgument})`;

      pending = [];
    } else {
      pending.push(step.text);
    }
  }

  return pipeSteps(target, pending, head);
}

export const consistentSchemaPipe: Rule = defineEffectRule(
  {
    ...ruleMeta(
      'suggestion',
      'Apply Schema modifiers with `.pipe(...)` and call Schema wrappers directly.',
      {
        modifierCall: 'Apply Schema.{{name}} with `.pipe(...)` instead of calling it.',
        dataLastCall: 'Apply Schema.{{name}}(...) with `.pipe(...)` instead of calling it on the schema.',
        functionPipe: 'Call `.pipe(...)` on the schema instead of passing it to `pipe(...)`.',
        wrapperPipe: 'Call Schema.{{name}}(...) directly instead of piping into it.',
      },
      'https://github.com/2digits-agency/configs/blob/main/docs/adr/0001-schema-modifiers-pipe-wrappers-call.md',
    ),
    fixable: 'code',
  },
  (context, getState) => ({
    CallExpression(node) {
      const state = getState();

      if (!state.hasEffectImport) {
        return;
      }

      const chain = flatten(node, context, state);

      if (chain?.violation === undefined || isNestedInChain(node, context, state)) {
        return;
      }

      const { head } = chain;

      // Unless a wrapper comes first, the fix calls `.pipe(...)` on the head itself.
      if (chain.steps[0]?.wrapper === false && headLacksPipe(head, context, state)) {
        return;
      }

      // Steps are moved around, so comments between them would be lost.
      const hasComments = Arr.some(
        context.sourceCode.getCommentsInside(node),
        (comment) => !containsRange(head, comment),
      );

      // Chains inside the head keep their own fixes; chains inside steps are fixed on a later pass.
      const [prefix, suffix = ''] = Str.split(render(head, chain.steps), headMarker);

      context.report({
        node,
        messageId: chain.violation.kind,
        data: { name: chain.violation.name ?? '' },
        fix:
          hasComments || chain.reordersEffects
            ? undefined
            : (fixer) => [
                fixer.replaceTextRange([node.range[0], head.range[0]], prefix),
                fixer.replaceTextRange([head.range[1], node.range[1]], suffix),
              ],
      });
    },
  }),
);
