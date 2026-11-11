import type { ESTree, OxlintSourceCode } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Str from 'effect/String';

import {
  argumentAt,
  containsSame,
  isFunctionNode,
  isStringLiteral,
  parentOf,
  staticPropertyName,
  unwrapExpression,
  type FunctionNode,
} from '../../../internal/ast';
import type { ImportBindings } from '../../../internal/imports';
import { isGlobalIn, lookupVariable, soleDefinition } from '../../../internal/scope';

/**
 * What the line and delimiter helpers need from the file being linted.
 */
export interface LineContext {
  readonly imports: ImportBindings;
  readonly sourceCode: OxlintSourceCode;
}

/**
 * The text of a string literal or a template literal without substitutions.
 *
 * @param node Expression.
 */
function staticString(node: ESTree.Node): Opt.Option<string> {
  if (isStringLiteral(node)) {
    return Opt.some(node.value);
  }

  return node.type === 'TemplateLiteral' && Arr.isReadonlyArrayEmpty(node.expressions)
    ? Opt.flatMap(Arr.head(node.quasis), ({ value }) => Opt.fromNullishOr(value.cooked))
    : Opt.none();
}

function regexPattern(node: ESTree.Node): Opt.Option<string> {
  return node.type === 'Literal' && 'regex' in node && P.isNotNullish(node.regex)
    ? Opt.some(node.regex.pattern)
    : Opt.none();
}

// Patterns built only from `\r`, `\n`, groups, alternation, classes and quantifiers, such as `\r?\n` or `[\r\n]+`.
const lineBreakPattern = /^(?:\(\?:|[()|?*+[\]]|\\r|\\n)+$/u;

/**
 * Whether a separator splits or joins lines: `'\n'`, `'\r\n'`, or a pattern such as `/\r?\n/` that only matches line
 * breaks.
 *
 * @param node Separator argument.
 */
export function isNewlineSeparator(node: ESTree.Node): boolean {
  return (
    Opt.exists(staticString(node), (text) => text === '\n' || text === '\r\n') ||
    Opt.exists(regexPattern(node), (pattern) => Str.includes(String.raw`\n`)(pattern) && lineBreakPattern.test(pattern))
  );
}

const cellDelimiters: ReadonlySet<string> = new Set([',', ';', '\t']);

/**
 * Whether a separator splits or joins the cells of a CSV or TSV row: `','`, `';'` or `'\t'`. Multi-character separators
 * such as `', '` or `'||'` build or read human-readable text instead.
 *
 * @param node Separator argument.
 */
export function isCellDelimiter(node: ESTree.Node): boolean {
  return staticString(node).pipe(
    Opt.orElse(() => regexPattern(node)),
    Opt.exists((text) => cellDelimiters.has(text === String.raw`\t` ? '\t' : text)),
  );
}

/**
 * The separator and subject of a string method call such as `text.split(sep)`, or of its `effect/String` or
 * `effect/Array` counterpart: `Str.split(text, sep)`, or `Str.split(sep)` in a pipeline, which has no subject.
 *
 * @param node Call.
 * @param method Method name, `split` or `join`.
 * @param namespace Effect module of the counterpart, `String` or `Array`.
 * @param imports Import bindings of the file.
 */
function separatorCall(
  node: ESTree.Node,
  method: string,
  namespace: string,
  imports: ImportBindings,
): Opt.Option<{ readonly separator: ESTree.Expression; readonly subject: Opt.Option<ESTree.Expression> }> {
  if (node.type !== 'CallExpression') {
    return Opt.none();
  }

  if (imports.isApi(node.callee, namespace, method)) {
    return node.arguments.length === 1
      ? Opt.map(argumentAt(node, 0), (separator) => ({ separator, subject: Opt.none() }))
      : Opt.map(argumentAt(node, 1), (separator) => ({ separator, subject: argumentAt(node, 0) }));
  }

  const callee = node.callee;

  return callee.type === 'MemberExpression' &&
    Opt.isNone(imports.path(callee)) &&
    Opt.contains(staticPropertyName(callee), method) &&
    node.arguments.length === 1
    ? Opt.map(argumentAt(node, 0), (separator) => ({
        separator,
        subject: Opt.some(callee.object as ESTree.Expression),
      }))
    : Opt.none();
}

/**
 * The subject of a split call whose separator passes `separator`; see `separatorCall`.
 *
 * @param node Call.
 * @param separator Separator test.
 * @param imports Import bindings of the file.
 */
export function splitCall(
  node: ESTree.Node,
  separator: (node: ESTree.Node) => boolean,
  imports: ImportBindings,
): Opt.Option<Opt.Option<ESTree.Expression>> {
  return separatorCall(node, 'split', 'String', imports).pipe(
    Opt.filter((call) => separator(call.separator)),
    Opt.map(({ subject }) => subject),
  );
}

/**
 * The subject of a join call whose separator passes `separator`; see `separatorCall`.
 *
 * @param node Call.
 * @param separator Separator test.
 * @param imports Import bindings of the file.
 */
export function joinCall(
  node: ESTree.Node,
  separator: (node: ESTree.Node) => boolean,
  imports: ImportBindings,
): Opt.Option<Opt.Option<ESTree.Expression>> {
  return separatorCall(node, 'join', 'Array', imports).pipe(
    Opt.filter((call) => separator(call.separator)),
    Opt.map(({ subject }) => subject),
  );
}

/**
 * Whether `node` is `JSON.<method>` on the global `JSON`.
 *
 * @param node Callee or reference.
 * @param method `parse` or `stringify`.
 * @param sourceCode Source of the file.
 */
export function isGlobalJson(node: ESTree.Node, method: string, sourceCode: OxlintSourceCode): boolean {
  return (
    node.type === 'MemberExpression' &&
    Opt.contains(staticPropertyName(node), method) &&
    isGlobalIn(sourceCode.getScope(node), node.object, 'JSON')
  );
}

function isReference(node: ESTree.Node): node is ESTree.IdentifierReference {
  return (
    node.type === 'Identifier' &&
    !Opt.exists(
      parentOf(node),
      (parent) =>
        (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) ||
        (parent.type === 'Property' && parent.key === node && !parent.computed && !parent.shorthand),
    )
  );
}

/**
 * The initializer of a local `const x = …` or never-reassigned `let x = …` binding.
 *
 * @param node Reference.
 * @param context File context.
 */
function initializerOf(node: ESTree.IdentifierReference, context: LineContext): Opt.Option<ESTree.Expression> {
  const variable = lookupVariable(context.sourceCode, node, node.name);

  return soleDefinition(variable).pipe(
    Opt.filter((definition) => definition.type === 'Variable'),
    Opt.flatMap((definition) =>
      definition.node.type === 'VariableDeclarator' &&
      definition.node.id.type === 'Identifier' &&
      P.isNotNullish(definition.node.init) &&
      Opt.exists(variable, ({ references }) =>
        Arr.every(references, (reference) => !reference.isWrite() || reference.init),
      )
        ? Opt.some(definition.node.init)
        : Opt.none(),
    ),
  );
}

/**
 * How a collection is produced: `matches` accepts the step that gives its elements their format, such as a split on
 * line breaks or a map to `JSON.stringify`, and `preserves` accepts a step that keeps that format, such as a filter.
 */
interface CollectionSource {
  readonly matches: (node: ESTree.Node) => boolean;
  readonly preserves: (node: ESTree.CallExpression) => boolean;
}

// Steps that keep, drop, reorder or add elements without changing the format of the ones they keep.
const preservingSteps: ReadonlySet<string> = new Set([
  'append',
  'appendAll',
  'concat',
  'dedupe',
  'drop',
  'dropRight',
  'filter',
  'prepend',
  'prependAll',
  'reverse',
  'slice',
  'sort',
  'sortWith',
  'take',
  'takeRight',
  'toReversed',
  'toSorted',
]);

function stepName(node: ESTree.Node, imports: ImportBindings): Opt.Option<string> {
  const callee = node.type === 'CallExpression' ? node.callee : node;

  return Opt.orElse(imports.member(callee, 'Array'), () =>
    callee.type === 'MemberExpression' && Opt.isNone(imports.path(callee)) ? staticPropertyName(callee) : Opt.none(),
  );
}

function isPreservingStep(node: ESTree.Node, imports: ImportBindings): boolean {
  return Opt.exists(stepName(node, imports), (name) => preservingSteps.has(name));
}

/**
 * The collection a step is applied to: the receiver of `xs.filter(f)`, or the first argument of `Arr.filter(xs, f)`.
 *
 * @param node Step call.
 * @param imports Import bindings of the file.
 */
function stepSource(node: ESTree.CallExpression, imports: ImportBindings): Opt.Option<ESTree.Node> {
  const callee = node.callee;

  return Opt.match(imports.path(callee), {
    onSome: () =>
      node.arguments.length > 1 ||
      Opt.exists(stepName(node, imports), (name) => name === 'dedupe' || name === 'reverse')
        ? argumentAt(node, 0)
        : Opt.none(),
    onNone: () => (callee.type === 'MemberExpression' ? Opt.some<ESTree.Node>(callee.object) : Opt.none()),
  });
}

/**
 * Whether the last of a pipeline's value and steps produces the collection, walking back through steps that keep the
 * format of its elements.
 *
 * @param steps Pipeline value followed by its steps, in order.
 * @param source How the collection is produced.
 * @param context File context.
 * @param depth Remaining bindings to follow.
 */
function pipelineProduces(
  steps: ReadonlyArray<ESTree.Node>,
  source: CollectionSource,
  context: LineContext,
  depth: number,
): boolean {
  return Opt.exists(Arr.last(steps), (last) => {
    const rest = Arr.dropRight(steps, 1);

    if (Arr.isReadonlyArrayNonEmpty(rest) && !source.matches(last)) {
      const isDataLastStep =
        (last.type === 'CallExpression' && Opt.isNone(stepSource(last, context.imports))) ||
        last.type === 'MemberExpression';

      return (
        isDataLastStep &&
        (isPreservingStep(last, context.imports) || (last.type === 'CallExpression' && source.preserves(last))) &&
        pipelineProduces(rest, source, context, depth)
      );
    }

    return producesCollection(last, source, context, depth);
  });
}

/**
 * Whether an expression is a collection that `source` produced: the producing step itself, or that step followed by
 * steps that keep the format of its elements, through method chains, pipelines, spreads and local bindings.
 *
 * @param node Expression.
 * @param source How the collection is produced.
 * @param context File context.
 * @param depth Remaining bindings to follow.
 */
function producesCollection(node: ESTree.Node, source: CollectionSource, context: LineContext, depth = 3): boolean {
  const expression = node.type === 'SpreadElement' ? node.argument : unwrapExpression(node as ESTree.Expression);

  if (source.matches(expression)) {
    return true;
  }

  if (isReference(expression)) {
    return (
      depth > 0 &&
      Opt.exists(initializerOf(expression, context), (init) => producesCollection(init, source, context, depth - 1))
    );
  }

  if (expression.type === 'ArrayExpression') {
    return Arr.some(
      expression.elements,
      (element) => element?.type === 'SpreadElement' && producesCollection(element, source, context, depth),
    );
  }

  if (expression.type !== 'CallExpression') {
    return false;
  }

  if (isPipeCall(expression, context.imports)) {
    return pipelineProduces(
      [...(expression.callee.type === 'MemberExpression' ? [expression.callee.object] : []), ...expression.arguments],
      source,
      context,
      depth,
    );
  }

  return (
    (isPreservingStep(expression, context.imports) || source.preserves(expression)) &&
    Opt.exists(stepSource(expression, context.imports), (collection) =>
      producesCollection(collection, source, context, depth),
    )
  );
}

function lineSource(context: LineContext): CollectionSource {
  return {
    matches: (node) => Opt.isSome(splitCall(node, isNewlineSeparator, context.imports)),
    preserves: (node) =>
      isMappingCall(node, {
        mapper: (mapper) => context.imports.isApi(mapper, 'String', trimMethods),
        element: (element) => trimmedSubject(element, context.imports) !== element,
      }),
  };
}

function isPipeCall(node: ESTree.CallExpression, imports: ImportBindings): boolean {
  return (
    imports.isApiPath(node.callee, ['pipe']) ||
    imports.isApiPath(node.callee, ['Function', 'pipe']) ||
    (node.callee.type === 'MemberExpression' && Opt.contains(staticPropertyName(node.callee), 'pipe'))
  );
}

/**
 * The expressions an iteration call runs over: the receiver of `xs.map(f)`, the arguments before the callback in
 * `Arr.map(xs, f)` or `Effect.forEach(xs, f)`, and for a data-last step such as `Arr.map(f)` the value and steps before
 * it in `pipe(...)` or `.pipe(...)`.
 *
 * @param call Iteration call.
 * @param callback Callback argument.
 * @param imports Import bindings of the file.
 */
function iteratedValues(
  call: ESTree.CallExpression,
  callback: ESTree.Node,
  imports: ImportBindings,
): ReadonlyArray<ESTree.Node> {
  const index = Arr.findFirstIndex(call.arguments, (argument) => argument === callback);

  const before = Opt.match(index, { onNone: () => [], onSome: (position) => Arr.take(call.arguments, position) });

  const receiver =
    call.callee.type === 'MemberExpression' && Opt.isNone(imports.path(call.callee)) ? [call.callee.object] : [];

  const pipeline = parentOf(call).pipe(
    Opt.filter((parent): parent is ESTree.CallExpression => parent.type === 'CallExpression'),
    Opt.match({
      onNone: () => [],
      onSome: (parent) =>
        Arr.isReadonlyArrayEmpty(before) &&
        Arr.isReadonlyArrayEmpty(receiver) &&
        containsSame<ESTree.Node>(parent.arguments, call) &&
        isPipeCall(parent, imports)
          ? [
              ...(parent.callee.type === 'MemberExpression' ? [parent.callee.object] : []),
              ...Arr.takeWhile(parent.arguments, (argument) => argument !== call),
            ]
          : [],
    }),
  );

  return [...receiver, ...before, ...pipeline];
}

/**
 * Whether a callback, or a function reference such as `JSON.parse`, is passed to an iteration over split lines.
 *
 * @param node Callback argument.
 * @param context File context.
 */
export function isPerLineCallback(node: ESTree.Node, context: LineContext): boolean {
  return parentOf(node).pipe(
    Opt.filter(
      (parent): parent is ESTree.CallExpression =>
        parent.type === 'CallExpression' && containsSame<ESTree.Node>(parent.arguments, node),
    ),
    Opt.exists((call) =>
      pipelineProduces(iteratedValues(call, node, context.imports), lineSource(context), context, 3),
    ),
  );
}

const trimMethods: ReadonlyArray<string> = ['trim', 'trimEnd', 'trimStart'];

function trimmedSubject(node: ESTree.Expression, imports: ImportBindings): ESTree.Expression {
  const expression = unwrapExpression(node);

  if (expression.type !== 'CallExpression') {
    return expression;
  }

  if (imports.isApi(expression.callee, 'String', trimMethods)) {
    return Opt.match(argumentAt(expression, 0), {
      onNone: () => expression,
      onSome: (subject) => trimmedSubject(subject, imports),
    });
  }

  return expression.callee.type === 'MemberExpression' &&
    Opt.exists(staticPropertyName(expression.callee), (name) => Arr.contains(trimMethods, name)) &&
    Arr.isReadonlyArrayEmpty(expression.arguments)
    ? trimmedSubject(expression.callee.object as ESTree.Expression, imports)
    : expression;
}

/**
 * Whether an expression, after trimming, is one line of split text: the element parameter of a per-line callback, or
 * the variable of `for (const line of lines)`.
 *
 * @param node Expression.
 * @param context File context.
 */
export function isLineValue(node: ESTree.Expression, context: LineContext): boolean {
  const subject = trimmedSubject(node, context.imports);

  if (subject.type !== 'Identifier') {
    return false;
  }

  return Opt.exists(soleDefinition(lookupVariable(context.sourceCode, subject, subject.name)), (definition) => {
    if (definition.type === 'Parameter') {
      const owner = definition.node as FunctionNode;

      return (
        isFunctionNode(owner) &&
        Opt.exists(Arr.head(owner.params), (parameter) => parameter === definition.name) &&
        isPerLineCallback(owner, context)
      );
    }

    const loop = definition.parent?.parent;

    return (
      definition.type === 'Variable' &&
      loop?.type === 'ForOfStatement' &&
      loop.left === definition.parent &&
      producesCollection(loop.right, lineSource(context), context)
    );
  });
}

/**
 * The value a callback returns for each element: the body of an expression arrow or the argument of a lone `return`.
 *
 * @param node Callback.
 */
function callbackResult(node: FunctionNode): Opt.Option<ESTree.Expression> {
  if (node.body?.type !== 'BlockStatement') {
    return Opt.fromNullishOr(node.body as ESTree.Expression | null | undefined).pipe(Opt.map(unwrapExpression));
  }

  const [statement] = node.body.body;

  return node.body.body.length === 1 && statement?.type === 'ReturnStatement' && P.isNotNullish(statement.argument)
    ? Opt.some(unwrapExpression(statement.argument))
    : Opt.none();
}

/**
 * How a joined collection maps its elements: `mapper` accepts a function value passed to the mapping call, such as
 * `JSON.stringify` or `Arr.join(',')`; `element` accepts the value a callback returns, such as `JSON.stringify(x)` or
 * `row.join(',')`.
 */
export interface ElementMapping {
  readonly mapper: (node: ESTree.Node) => boolean;
  readonly element: (node: ESTree.Expression) => boolean;
}

function isMappingCall(node: ESTree.Node, mapping: ElementMapping): boolean {
  return (
    node.type === 'CallExpression' &&
    Arr.some(
      node.arguments,
      (argument) =>
        mapping.mapper(argument) || (isFunctionNode(argument) && Opt.exists(callbackResult(argument), mapping.element)),
    )
  );
}

/**
 * Whether the collection a join runs over is produced by mapping each element with `mapping`, possibly followed by
 * steps that keep the mapped elements, such as a filter. A later map, such as one that prefixes each JSON string with
 * `data: `, produces another format and does not count.
 *
 * @param values Pipeline value and steps the join runs over.
 * @param mapping Element mapping to look for.
 * @param context File context.
 */
export function mapsEachTo(values: ReadonlyArray<ESTree.Node>, mapping: ElementMapping, context: LineContext): boolean {
  return pipelineProduces(
    values,
    { matches: (node) => isMappingCall(node, mapping), preserves: () => false },
    context,
    3,
  );
}

/**
 * The expressions a join runs over: its subject, or for a data-last `Arr.join(sep)` the value and steps before it in a
 * pipeline.
 *
 * @param node Join call.
 * @param subject Subject of the join, when it has one.
 * @param imports Import bindings of the file.
 */
export function joinedValues(
  node: ESTree.CallExpression,
  subject: Opt.Option<ESTree.Expression>,
  imports: ImportBindings,
): ReadonlyArray<ESTree.Node> {
  return Opt.match(subject, {
    onSome: Arr.of<ESTree.Node>,
    onNone: () => iteratedValues(node, node, imports),
  });
}
