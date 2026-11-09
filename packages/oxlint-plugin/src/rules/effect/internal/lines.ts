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
  walkNodes,
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
  return Opt.exists(
    Opt.orElse(staticString(node), () => regexPattern(node)),
    (text) => cellDelimiters.has(text === String.raw`\t` ? '\t' : text),
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
  return Opt.map(
    Opt.filter(separatorCall(node, 'split', 'String', imports), (call) => separator(call.separator)),
    ({ subject }) => subject,
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
  return Opt.map(
    Opt.filter(separatorCall(node, 'join', 'Array', imports), (call) => separator(call.separator)),
    ({ subject }) => subject,
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

function isInsideFunctionBelow(node: ESTree.Node, root: ESTree.Node): boolean {
  return Opt.exists(
    parentOf(node),
    (parent) => parent !== root && (isFunctionNode(parent) || isInsideFunctionBelow(parent, root)),
  );
}

/**
 * Whether `root`, outside nested functions, has a node that passes `visit`. Functions inside `root` run per element, so
 * a split inside a callback splits each element, not the collection.
 *
 * @param root Expression.
 * @param visit Node test.
 */
function someOutsideFunctions(root: ESTree.Node, visit: (node: ESTree.Node) => boolean): boolean {
  return walkNodes(root, (node) => visit(node) && (node === root || !isInsideFunctionBelow(node, root)));
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

  return Opt.flatMap(
    Opt.filter(soleDefinition(variable), (definition) => definition.type === 'Variable'),
    (definition) =>
      definition.node.type === 'VariableDeclarator' &&
      definition.node.id.type === 'Identifier' &&
      P.isNotNullish(definition.node.init) &&
      Opt.exists(variable, ({ references }) =>
        Arr.every(references, (reference) => !reference.isWrite() || reference.init),
      )
        ? Opt.some(definition.node.init)
        : Opt.none(),
  );
}

/**
 * Whether an expression is built from a split on line breaks, through method chains, pipelines and local bindings.
 *
 * @param node Expression.
 * @param context File context.
 * @param depth Remaining bindings to follow.
 */
function derivesFromLineSplit(node: ESTree.Node, context: LineContext, depth = 3): boolean {
  return someOutsideFunctions(
    node,
    (child) =>
      Opt.isSome(splitCall(child, isNewlineSeparator, context.imports)) ||
      (depth > 0 &&
        isReference(child) &&
        Opt.exists(initializerOf(child, context), (init) => derivesFromLineSplit(init, context, depth - 1))),
  );
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

  const pipeline = Opt.match(
    Opt.filter(parentOf(call), (parent): parent is ESTree.CallExpression => parent.type === 'CallExpression'),
    {
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
    },
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
  return Opt.exists(
    Opt.filter(
      parentOf(node),
      (parent): parent is ESTree.CallExpression =>
        parent.type === 'CallExpression' && containsSame<ESTree.Node>(parent.arguments, node),
    ),
    (call) => Arr.some(iteratedValues(call, node, context.imports), (value) => derivesFromLineSplit(value, context)),
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
      derivesFromLineSplit(loop.right, context)
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
    return Opt.map(Opt.fromNullishOr(node.body as ESTree.Expression | null | undefined), unwrapExpression);
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
 * Whether one of the expressions a join runs over maps each element with `mapping`, through method chains, pipelines
 * and local bindings.
 *
 * @param values Expressions the join runs over.
 * @param mapping Element mapping to look for.
 * @param context File context.
 * @param depth Remaining bindings to follow.
 */
export function mapsEachTo(
  values: ReadonlyArray<ESTree.Node>,
  mapping: ElementMapping,
  context: LineContext,
  depth = 3,
): boolean {
  return Arr.some(values, (value) =>
    someOutsideFunctions(
      value,
      (child) =>
        isMappingCall(child, mapping) ||
        (depth > 0 &&
          isReference(child) &&
          Opt.exists(initializerOf(child, context), (init) => mapsEachTo([init], mapping, context, depth - 1))),
    ),
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
