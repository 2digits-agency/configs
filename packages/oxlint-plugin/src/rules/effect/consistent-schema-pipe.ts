import type { Context, ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';

import { importedApi } from '../../fixes';
import {
  argumentAt,
  canonicalPath,
  containsRange,
  defineEffectRule,
  findAncestor,
  isApiPath,
  resolveVariable,
  ruleMeta,
  staticPath,
  staticPropertyName,
  type FileState,
} from '../../utils';

// Lists follow docs/adr/0001 for the catalog's Effect version; revisit them when Effect adds Schema functions.
const modifiers = new Set([
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
  'toCodecIso',
  'toCodecJson',
  'toCodecStringTree',
  'toEncoded',
  'toType',
  'UndefinedOr',
]);

const wrappers = new Set([
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
]);

const dataLastSteps = new Set([
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
]);

// Schema methods that return a schema, so a head built from them still has `.pipe`.
const schemaMethods = new Set(['annotate', 'annotateKey', 'check', 'mapFields']);

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

function isNameIn(names: ReadonlySet<string>): P.Refinement<string | undefined, string> {
  return (name): name is string => name !== undefined && names.has(name);
}

const isWrapper = isNameIn(wrappers);

const isSchemaFunction = P.or(isNameIn(modifiers), isWrapper);

const isDataLastStep = isNameIn(dataLastSteps);

const isSchemaMethod = isNameIn(schemaMethods);

const isConstructorName = P.compose(P.isString, (name) => constructorName.test(name));

// The member of a `Schema.<name>` path.
function schemaName(path: ReadonlyArray<string> | undefined): string | undefined {
  return path?.length === 2 && path[0] === 'Schema' ? path[1] : undefined;
}

function schemaMember(node: ESTree.Node, context: Context, state: FileState): string | undefined {
  const name = schemaName(canonicalPath(node, state));

  return name !== undefined && staticPath(node)?.length === 2 && importedApi(context, node) ? name : undefined;
}

function allPure(nodes: ReadonlyArray<ESTree.Node | null>, context: Context, state: FileState): boolean {
  return Arr.every(nodes, (node) => node === null || isPure(node, context, state));
}

function isPureCall(node: ESTree.CallExpression, context: Context, state: FileState): boolean {
  const callee = node.callee.type === 'CallExpression' ? node.callee.callee : node.callee;

  return (
    schemaMember(callee, context, state) !== undefined &&
    (node.callee === callee || isPure(node.callee, context, state)) &&
    allPure(node.arguments, context, state)
  );
}

// Expressions whose evaluation has no observable effect, so a fix may move them. Schema factories count as pure.
// `Match.fn` handlers get the matched node followed by every argument of the call, hence the ignored `_node`.
const isPure: (node: ESTree.Node, context: Context, state: FileState) => boolean = Match.fn(
  (node: ESTree.Node, _context: Context, _state: FileState) => node,
).pipe(
  Match.withReturnType<boolean>(),
  Match.when(
    { type: Match.is('ArrowFunctionExpression', 'FunctionExpression', 'Identifier', 'Literal', 'ThisExpression') },
    Fn.constTrue,
  ),
  Match.when(
    { type: 'MemberExpression' },
    (node, _node, context, state) =>
      isPure(node.object, context, state) && (!node.computed || isPure(node.property, context, state)),
  ),
  Match.when({ type: 'TemplateLiteral' }, ({ expressions }, _node, context, state) =>
    allPure(expressions, context, state),
  ),
  Match.when({ type: 'ArrayExpression' }, ({ elements }, _node, context, state) => allPure(elements, context, state)),
  Match.when({ type: 'ObjectExpression' }, ({ properties }, _node, context, state) =>
    Arr.every(properties, (property) =>
      property.type === 'SpreadElement'
        ? isPure(property.argument, context, state)
        : (!property.computed || isPure(property.key, context, state)) && isPure(property.value, context, state),
    ),
  ),
  Match.when({ type: 'CallExpression' }, (node, _node, context, state) => isPureCall(node, context, state)),
  Match.orElse(Fn.constFalse),
);

const typePath: (node: ESTree.TSTypeName, state: FileState) => ReadonlyArray<string> | undefined = Match.fn(
  (node: ESTree.TSTypeName, _state: FileState) => node,
).pipe(
  Match.withReturnType<ReadonlyArray<string> | undefined>(),
  Match.when({ type: 'Identifier' }, ({ name }, _node, state) => state.bindings.get(name)),
  Match.when({ type: 'TSQualifiedName' }, ({ left, right }, _node, state) => {
    const path = typePath(left, state);

    return path === undefined ? undefined : Arr.append(path, right.name);
  }),
  Match.orElse(Fn.constUndefined),
);

function ownTypeParameter(node: ESTree.Node, name: string): ESTree.TSTypeParameter | undefined {
  return 'typeParameters' in node && node.typeParameters?.type === 'TSTypeParameterDeclaration'
    ? Opt.getOrUndefined(Arr.findFirst(node.typeParameters.params, (candidate) => candidate.name.name === name))
    : undefined;
}

// The nearest type parameter called `name` that is in scope at `from`.
function typeParameter(name: string, from: ESTree.Node): ESTree.TSTypeParameter | undefined {
  const owner = findAncestor(from, (node): node is ESTree.Node => ownTypeParameter(node, name) !== undefined);

  return owner === undefined ? undefined : ownTypeParameter(owner, name);
}

// Whether a value of the declared type has `.pipe`, or undefined when that is unknown without type information.
function hasPipe(declared: ESTree.TSType, from: ESTree.Node, state: FileState): boolean | undefined {
  const seen = new Set<ESTree.TSTypeParameter>();

  let type: ESTree.TSType | null = declared;

  let scope: ESTree.Node = from;

  // A type parameter only has `.pipe` when its constraint does, so follow constraints to a Schema type.
  while (type?.type === 'TSTypeReference') {
    const member = schemaName(typePath(type.typeName, state));

    if (member !== undefined) {
      // Schema.Constraint and its subtypes are not Pipeable, unlike Schema.Top and the schemas built on it.
      return !member.startsWith('Constraint');
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
const headLacksPipe: (node: ESTree.Expression, context: Context, state: FileState) => boolean = Match.fn(
  (node: ESTree.Expression, _context: Context, _state: FileState) => node,
).pipe(
  Match.withReturnType<boolean>(),
  Match.when(
    { type: Match.is('TSNonNullExpression', 'TSSatisfiesExpression') },
    ({ expression }, _node, context, state) => headLacksPipe(expression, context, state),
  ),
  Match.when(
    { type: 'TSAsExpression' },
    (head, _node, _context, state) => hasPipe(head.typeAnnotation, head, state) === false,
  ),
  Match.when({ type: 'Identifier' }, (head, _node, context, state) => {
    const annotation = declaredType(head, context);

    return annotation !== undefined && hasPipe(annotation.typeAnnotation, annotation, state) === false;
  }),
  Match.orElse(Fn.constFalse),
);

function isExpression(argument: ESTree.Argument): argument is ESTree.Expression {
  return argument.type !== 'SpreadElement';
}

// A rewrite would drop explicit type arguments, and spread arguments hide the steps, so such calls are left alone.
function plainArguments(node: ESTree.CallExpression): ReadonlyArray<ESTree.Expression> | undefined {
  const args = node.arguments;

  return !node.typeArguments && Arr.every(args, isExpression) ? args : undefined;
}

function soleArgument(node: ESTree.CallExpression): ESTree.Expression | undefined {
  return node.arguments.length === 1 && !node.typeArguments ? argumentAt(node, 0) : undefined;
}

// An optional link before the call, as in `a?.b.pipe(...)`, can skip it, which a direct wrapper call would not.
const isShortCircuitable: (node: ESTree.Expression) => boolean = Match.type<ESTree.Expression>().pipe(
  Match.withReturnType<boolean>(),
  Match.when({ type: 'CallExpression' }, ({ optional, callee }) => optional || isShortCircuitable(callee)),
  Match.when({ type: 'MemberExpression' }, ({ optional, object }) => optional || isShortCircuitable(object)),
  Match.when({ type: 'TSNonNullExpression' }, ({ expression }) => isShortCircuitable(expression)),
  Match.orElse(Fn.constFalse),
);

function isPipeCall(
  node: ESTree.CallExpression,
): node is ESTree.CallExpression & { readonly callee: ESTree.MemberExpression } {
  return (
    node.callee.type === 'MemberExpression' && staticPropertyName(node.callee) === 'pipe' && !isShortCircuitable(node)
  );
}

function isMethodPipe(node: ESTree.CallExpression): boolean {
  return isPipeCall(node) && plainArguments(node) !== undefined;
}

function isFunctionPipe(node: ESTree.CallExpression, context: Context, state: FileState): boolean {
  return (
    (isApiPath(node.callee, state, ['pipe']) || isApiPath(node.callee, state, ['Function', 'pipe'])) &&
    importedApi(context, node.callee)
  );
}

function isKnownStep(node: ESTree.Node, context: Context, state: FileState): boolean {
  return (
    isSchemaFunction(schemaMember(node, context, state)) ||
    (node.type === 'CallExpression' && isDataLastStep(schemaMember(node.callee, context, state)))
  );
}

// A Schema constructor or function call, or a schema method called on a schema head.
function isSchemaCall(node: ESTree.CallExpression, context: Context, state: FileState): boolean {
  const name = schemaMember(node.callee, context, state);

  if (name !== undefined) {
    return isConstructorName(name) || isSchemaFunction(name);
  }

  return (
    node.callee.type === 'MemberExpression' &&
    isSchemaMethod(staticPropertyName(node.callee)) &&
    isSchemaHead(node.callee.object, context, state)
  );
}

// A Schema constructor or value, a schema chain, or a schema call.
function isSchemaHead(node: ESTree.Expression, context: Context, state: FileState): boolean {
  return (
    isConstructorName(schemaMember(node, context, state)) ||
    flatten(node, context, state) !== undefined ||
    (node.type === 'CallExpression' && isSchemaCall(node, context, state))
  );
}

// Without types, only rewrite `pipe(x, ...)` when x is known to be a schema, so `x.pipe` exists.
function functionPipeParts(
  args: ReadonlyArray<ESTree.Expression>,
  context: Context,
  state: FileState,
): readonly [ESTree.Expression, ReadonlyArray<ESTree.Expression>] | undefined {
  const [head, first] = args;

  return head !== undefined &&
    first !== undefined &&
    (isSchemaHead(head, context, state) || isKnownStep(first, context, state))
    ? [head, args.slice(1)]
    : undefined;
}

function extendChain(
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
    steps: Arr.appendAll(inner.steps, steps),
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

    return extendChain(
      argument,
      [{ text: context.sourceCode.getText(node.callee), wrapper }],
      wrapper ? undefined : { kind: 'modifierCall', name },
      false,
      context,
      state,
    );
  }

  const stepName = node.callee.type === 'CallExpression' ? schemaMember(node.callee.callee, context, state) : undefined;

  if (!isDataLastStep(stepName)) {
    return undefined;
  }

  return extendChain(
    argument,
    [{ text: context.sourceCode.getText(node.callee), wrapper: false }],
    { kind: 'dataLastCall', name: stepName },
    // The configured step was evaluated before the schema; in a pipe the schema comes first.
    !isPure(node.callee, context, state) && !isPure(argument, context, state),
    context,
    state,
  );
}

function pipeChain(node: ESTree.CallExpression, context: Context, state: FileState): Chain | undefined {
  const args = plainArguments(node);

  if (args === undefined) {
    return undefined;
  }

  const functionPipe = isFunctionPipe(node, context, state);

  const parts = functionPipe
    ? functionPipeParts(args, context, state)
    : isPipeCall(node)
      ? ([node.callee.object, args] as const)
      : undefined;

  if (parts === undefined) {
    return undefined;
  }

  const [receiver, steps] = parts;

  const names = Arr.map(steps, (step) => schemaMember(step, context, state));

  const firstWrapper = Arr.findFirstWithIndex(names, isWrapper);

  // Steps after an extracted wrapper move into a later pipe, so they would be built after earlier steps ran.
  const reordersEffects = Opt.exists(firstWrapper, ([, wrapperIndex]) =>
    Arr.some(steps, (step, index) => index > wrapperIndex && !isPure(step, context, state)),
  );

  return extendChain(
    receiver,
    Arr.zipWith(steps, names, (step, name) => ({ text: context.sourceCode.getText(step), wrapper: isWrapper(name) })),
    functionPipe
      ? { kind: 'functionPipe' }
      : Opt.getOrUndefined(Opt.map(firstWrapper, ([name]) => ({ kind: 'wrapperPipe', name }) as const)),
    reordersEffects,
    context,
    state,
  );
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
      const [prefix = '', suffix = ''] = render(head, chain.steps).split(headMarker);

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
