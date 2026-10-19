// Adapted from anti-slop's ESLint Stylistic vendor. See NOTICE and padding-line-upstream.md.
/* eslint-disable unicorn/no-null -- Oxlint AST/token APIs and no-fix results use null. */
import {
  Rule,
  RuleContext,
  Visitor,
  type OxlintComment as Comment,
  type ESTree,
  type Location,
  type OxlintSourceCode as SourceCode,
  type OxlintToken as SyntaxToken,
} from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';
import * as Ref from 'effect/Ref';

type Token = SyntaxToken | Comment;

type NodeType = ESTree.Node['type'];

type NodeTest = (node: ESTree.Node, sourceCode: SourceCode) => boolean;

type PaddingType = 'any' | 'never' | 'always';

type LineMode = 'any' | 'singleline' | 'multiline';

interface SelectorOption {
  readonly selector: string;
  readonly lineMode?: LineMode;
}

type MultilineStatementType =
  | 'block-like'
  | 'expression'
  | 'return'
  | 'export'
  | 'var'
  | 'let'
  | 'const'
  | 'using'
  | 'type';

type BasicStatementType =
  | '*'
  | 'exports'
  | 'require'
  | 'directive'
  | 'iife'
  | 'block'
  | 'empty'
  | 'function'
  | 'ts-method'
  | 'break'
  | 'case'
  | 'class'
  | 'continue'
  | 'debugger'
  | 'default'
  | 'do'
  | 'for'
  | 'if'
  | 'import'
  | 'switch'
  | 'throw'
  | 'try'
  | 'while'
  | 'with'
  | 'cjs-export'
  | 'cjs-import'
  | 'enum'
  | 'interface'
  | 'function-overload';

type StatementType =
  | BasicStatementType
  | MultilineStatementType
  | `singleline-${MultilineStatementType}`
  | `multiline-${MultilineStatementType}`;

type StatementMatcher = StatementType | SelectorOption;

type StatementOption = StatementMatcher | Arr.NonEmptyReadonlyArray<StatementMatcher>;

interface StatementPair {
  readonly prevNode: ESTree.Node;
  readonly nextNode: ESTree.Node;
}

type PaddingLineSequence = readonly [Token, Token];

type SelectorMatches = ReadonlyMap<string, ReadonlySet<ESTree.Node>>;

/**
 * A spacing policy; later matching entries override earlier entries.
 */
export interface PaddingLineOption {
  readonly blankLine: PaddingType;
  readonly prev: StatementOption;
  readonly next: StatementOption;
}

// Treat CRLF as one terminator; the upstream character class could split it during removal.
const lineTerminator = String.raw`(?:\r\n|\r(?!\n)|[\n\u2028\u2029])`;

const horizontalWhitespace = String.raw`[^\S\r\n\u2028\u2029]*`;

const paddingLineSequence = new RegExp(
  `^(${horizontalWhitespace}${lineTerminator})(?:${horizontalWhitespace}${lineTerminator})+(${horizontalWhitespace};?)$`,
  'u',
);

const cjsExport = /^(?:module\s*\.\s*)?exports(?:\s*\.|\s*\[|$)/u;

const functionTypes: ReadonlySet<NodeType> = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);

const paddingTypes: ReadonlySet<unknown> = new Set<PaddingType>(['any', 'never', 'always']);

const lineModes: ReadonlySet<unknown> = new Set<LineMode>(['any', 'singleline', 'multiline']);

const optionKeys: ReadonlySet<string> = new Set(['blankLine', 'prev', 'next']);

const selectorKeys: ReadonlySet<string> = new Set(['selector', 'lineMode']);

function isSemicolonToken(token: Token): boolean {
  return token.type === 'Punctuator' && token.value === ';';
}

function isTokenOnSameLine(left: { readonly loc: Location }, right: { readonly loc: Location }): boolean {
  return left.loc.end.line === right.loc.start.line;
}

function isSingleLine(node: ESTree.Node): boolean {
  return node.loc.start.line === node.loc.end.line;
}

function isFunction(node: ESTree.Node): boolean {
  return functionTypes.has(node.type);
}

function skipChainExpression(node: ESTree.Node): ESTree.Node {
  return node.type === 'ChainExpression' ? node.expression : node;
}

function keywordTester(types: NodeType | ReadonlyArray<NodeType>, keyword: string): NodeTest {
  const nodeTypes: ReadonlySet<NodeType> = new Set(Arr.ensure(types));

  return (node, sourceCode) => sourceCode.getFirstToken(node)?.value === keyword && nodeTypes.has(node.type);
}

function nodeTypeTester(type: NodeType): NodeTest {
  return (node) => node.type === type;
}

function lineModeTester(test: NodeTest, lineMode: Exclude<LineMode, 'any'>): NodeTest {
  return (node, sourceCode) => test(node, sourceCode) && isSingleLine(node) === (lineMode === 'singleline');
}

function isIIFEStatement(node: ESTree.Node): boolean {
  if (node.type !== 'ExpressionStatement') {
    return false;
  }

  let expression = skipChainExpression(node.expression);

  if (expression.type === 'UnaryExpression') {
    expression = skipChainExpression(expression.argument);
  }

  if (expression.type !== 'CallExpression') {
    return false;
  }

  let callee: ESTree.Node = expression.callee;

  while (callee.type === 'SequenceExpression') {
    callee = Opt.getOrThrowWith(
      Arr.last(callee.expressions),
      () => new Error('Padding rule invariant: sequence expression is empty'),
    );
  }

  return isFunction(callee);
}

function isCJSRequire(node: ESTree.Node): boolean {
  if (node.type !== 'VariableDeclaration') {
    return false;
  }

  let call = node.declarations[0]?.init;

  if (call == null) {
    return false;
  }

  while (call.type === 'MemberExpression') {
    call = call.object;
  }

  return call.type === 'CallExpression' && call.callee.type === 'Identifier' && call.callee.name === 'require';
}

function isBlockLikeStatement(node: ESTree.Node, sourceCode: SourceCode): boolean {
  if ((node.type === 'DoWhileStatement' && node.body.type === 'BlockStatement') || isIIFEStatement(node)) {
    return true;
  }

  const last = sourceCode.getLastToken(node, (token) => !isSemicolonToken(token));

  const belongingNode =
    last?.type === 'Punctuator' && last.value === '}' ? sourceCode.getNodeByRangeIndex(last.range[0]) : null;

  return belongingNode?.type === 'BlockStatement' || belongingNode?.type === 'SwitchStatement';
}

function isDirective(node: ESTree.Node, sourceCode: SourceCode): boolean {
  return (
    node.type === 'ExpressionStatement' &&
    (node.parent.type === 'Program' || (node.parent.type === 'BlockStatement' && isFunction(node.parent.parent))) &&
    node.expression.type === 'Literal' &&
    P.isString(node.expression.value) &&
    (sourceCode.getTokenBefore(node.expression)?.value !== '(' ||
      sourceCode.getTokenAfter(node.expression)?.value !== ')')
  );
}

function isDirectivePrologue(node: ESTree.Node, sourceCode: SourceCode): boolean {
  if (!isDirective(node, sourceCode) || !node.parent || !('body' in node.parent) || !Arr.isArray(node.parent.body)) {
    return false;
  }

  const siblings: ReadonlyArray<ESTree.Node> = node.parent.body;

  return Fn.pipe(
    siblings,
    Arr.takeWhile((sibling) => sibling !== node),
    Arr.every((sibling) => isDirective(sibling, sourceCode)),
  );
}

function isCJSExport(node: ESTree.Node): boolean {
  if (node.type !== 'ExpressionStatement' || node.expression.type !== 'AssignmentExpression') {
    return false;
  }

  let left = node.expression.left;

  if (left.type !== 'MemberExpression') {
    return false;
  }

  while (left.object.type === 'MemberExpression') {
    left = left.object;
  }

  return (
    left.object.type === 'Identifier' &&
    (left.object.name === 'exports' ||
      (left.object.name === 'module' && left.property.type === 'Identifier' && left.property.name === 'exports'))
  );
}

function getActualLastToken(node: ESTree.Node, sourceCode: SourceCode): Token {
  const last = sourceCode.getLastToken(node);

  if (last === null) {
    throw new Error('Padding rule invariant: statement has no token');
  }

  const prev = sourceCode.getTokenBefore(last);

  const next = sourceCode.getTokenAfter(last);

  // Ignore the leading semicolon belonging to the next statement in semicolon-free code.
  return prev &&
    next &&
    prev.range[0] >= node.range[0] &&
    isSemicolonToken(last) &&
    !isTokenOnSameLine(prev, last) &&
    isTokenOnSameLine(last, next)
    ? prev
    : last;
}

function getReportLoc(node: ESTree.Node, sourceCode: SourceCode): Location {
  if (isSingleLine(node)) {
    return node.loc;
  }

  const line = node.loc.start.line;

  const sourceLine = sourceCode.lines[line - 1];

  if (sourceLine === undefined) {
    throw new Error('Padding rule invariant: statement source line is missing');
  }

  return { start: node.loc.start, end: { line, column: sourceLine.length } };
}

const multilineStatementTypes: Record<MultilineStatementType, NodeTest> = {
  'block-like': isBlockLikeStatement,
  expression: (node, sourceCode) => node.type === 'ExpressionStatement' && !isDirectivePrologue(node, sourceCode),
  return: keywordTester('ReturnStatement', 'return'),
  export: keywordTester(['ExportAllDeclaration', 'ExportDefaultDeclaration', 'ExportNamedDeclaration'], 'export'),
  var: keywordTester('VariableDeclaration', 'var'),
  let: keywordTester('VariableDeclaration', 'let'),
  const: keywordTester('VariableDeclaration', 'const'),
  using: (node) => node.type === 'VariableDeclaration' && (node.kind === 'using' || node.kind === 'await using'),
  type: keywordTester('TSTypeAliasDeclaration', 'type'),
};

const baseStatementTypes: Record<BasicStatementType, NodeTest> = {
  '*': () => true,
  exports: isCJSExport,
  require: isCJSRequire,
  directive: isDirectivePrologue,
  iife: isIIFEStatement,
  block: nodeTypeTester('BlockStatement'),
  empty: nodeTypeTester('EmptyStatement'),
  function: nodeTypeTester('FunctionDeclaration'),
  'ts-method': nodeTypeTester('TSMethodSignature'),
  break: keywordTester('BreakStatement', 'break'),
  case: keywordTester('SwitchCase', 'case'),
  class: keywordTester('ClassDeclaration', 'class'),
  continue: keywordTester('ContinueStatement', 'continue'),
  debugger: keywordTester('DebuggerStatement', 'debugger'),
  default: keywordTester(['SwitchCase', 'ExportDefaultDeclaration'], 'default'),
  do: keywordTester('DoWhileStatement', 'do'),
  for: keywordTester(['ForStatement', 'ForInStatement', 'ForOfStatement'], 'for'),
  if: keywordTester('IfStatement', 'if'),
  import: keywordTester('ImportDeclaration', 'import'),
  switch: keywordTester('SwitchStatement', 'switch'),
  throw: keywordTester('ThrowStatement', 'throw'),
  try: keywordTester('TryStatement', 'try'),
  while: keywordTester(['WhileStatement', 'DoWhileStatement'], 'while'),
  with: keywordTester('WithStatement', 'with'),
  'cjs-export': (node, sourceCode) =>
    node.type === 'ExpressionStatement' &&
    node.expression.type === 'AssignmentExpression' &&
    cjsExport.test(sourceCode.getText(node.expression.left)),
  'cjs-import': (node, sourceCode) =>
    node.type === 'VariableDeclaration' &&
    node.declarations[0]?.init != null &&
    sourceCode.getText(node.declarations[0].init).startsWith('require('),
  enum: keywordTester('TSEnumDeclaration', 'enum'),
  interface: keywordTester('TSInterfaceDeclaration', 'interface'),
  'function-overload': nodeTypeTester('TSDeclareFunction'),
};

// Explicit keys let TypeScript verify every supported statement type without assertions.
const statementTypes: Record<StatementType, NodeTest> = {
  ...baseStatementTypes,
  ...multilineStatementTypes,
  'singleline-block-like': lineModeTester(multilineStatementTypes['block-like'], 'singleline'),
  'multiline-block-like': lineModeTester(multilineStatementTypes['block-like'], 'multiline'),
  'singleline-expression': lineModeTester(multilineStatementTypes.expression, 'singleline'),
  'multiline-expression': lineModeTester(multilineStatementTypes.expression, 'multiline'),
  'singleline-return': lineModeTester(multilineStatementTypes.return, 'singleline'),
  'multiline-return': lineModeTester(multilineStatementTypes.return, 'multiline'),
  'singleline-export': lineModeTester(multilineStatementTypes.export, 'singleline'),
  'multiline-export': lineModeTester(multilineStatementTypes.export, 'multiline'),
  'singleline-var': lineModeTester(multilineStatementTypes.var, 'singleline'),
  'multiline-var': lineModeTester(multilineStatementTypes.var, 'multiline'),
  'singleline-let': lineModeTester(multilineStatementTypes.let, 'singleline'),
  'multiline-let': lineModeTester(multilineStatementTypes.let, 'multiline'),
  'singleline-const': lineModeTester(multilineStatementTypes.const, 'singleline'),
  'multiline-const': lineModeTester(multilineStatementTypes.const, 'multiline'),
  'singleline-using': lineModeTester(multilineStatementTypes.using, 'singleline'),
  'multiline-using': lineModeTester(multilineStatementTypes.using, 'multiline'),
  'singleline-type': lineModeTester(multilineStatementTypes.type, 'singleline'),
  'multiline-type': lineModeTester(multilineStatementTypes.type, 'multiline'),
};

function isLineMode(value: unknown): value is LineMode {
  return lineModes.has(value);
}

function isPaddingType(value: unknown): value is PaddingType {
  return paddingTypes.has(value);
}

function isStatementType(value: unknown): value is StatementType {
  return P.isString(value) && R.has(statementTypes, value as StatementType);
}

function isMatcherArray(value: StatementOption): value is Arr.NonEmptyReadonlyArray<StatementMatcher> {
  return Arr.isArray(value);
}

function parseMatcher(value: unknown): StatementMatcher {
  if (isStatementType(value)) {
    return value;
  }

  if (P.isObject(value) && P.isString(value.selector) && Arr.every(R.keys(value), (key) => selectorKeys.has(key))) {
    if (!('lineMode' in value)) {
      return { selector: value.selector };
    }

    if (isLineMode(value.lineMode)) {
      return { selector: value.selector, lineMode: value.lineMode };
    }
  }

  throw new Error('Invalid padding-line-between-statements statement matcher');
}

function parseStatementOption(value: unknown): StatementOption {
  if (!Arr.isArray(value)) {
    return parseMatcher(value);
  }

  const matchers: ReadonlyArray<unknown> = value;

  if (!Arr.isReadonlyArrayNonEmpty(matchers)) {
    throw new Error('Padding statement matcher arrays must not be empty');
  }

  return Arr.map(matchers, (matcher) => parseMatcher(matcher));
}

function parseOptions(values: ReadonlyArray<unknown>): Array<PaddingLineOption> {
  return Arr.map(values, (value) => {
    if (
      !P.isObject(value) ||
      !('blankLine' in value) ||
      !('prev' in value) ||
      !('next' in value) ||
      Arr.some(R.keys(value), (key) => !optionKeys.has(key)) ||
      !isPaddingType(value.blankLine)
    ) {
      throw new Error('Invalid padding-line-between-statements configuration');
    }

    return {
      blankLine: value.blankLine,
      prev: parseStatementOption(value.prev),
      next: parseStatementOption(value.next),
    };
  });
}

function getPaddingLineSequences(
  prevNode: ESTree.Node,
  nextNode: ESTree.Node,
  sourceCode: SourceCode,
): Array<PaddingLineSequence> {
  const pairs: Array<PaddingLineSequence> = [];

  let prevToken = getActualLastToken(prevNode, sourceCode);

  if (nextNode.loc.start.line - prevToken.loc.end.line >= 2) {
    do {
      const token = sourceCode.getTokenAfter(prevToken, { includeComments: true });

      if (token === null) {
        throw new Error('Padding rule invariant: next statement token is missing');
      }

      if (token.loc.start.line - prevToken.loc.end.line >= 2) {
        pairs.push([prevToken, token]);
      }

      prevToken = token;
    } while (prevToken.range[0] < nextNode.range[0]);
  }

  return pairs;
}

function verifyPair(
  prevNode: ESTree.Node,
  nextNode: ESTree.Node,
  padding: PaddingType,
): Effect.Effect<void, never, RuleContext> {
  return Effect.gen(function* () {
    if (padding === 'any') {
      return yield* Effect.void;
    }

    const context = yield* RuleContext;

    const sourceCode = context.sourceCode;

    const pairs = getPaddingLineSequences(prevNode, nextNode, sourceCode);

    if (padding === 'never') {
      if (!Arr.isArrayNonEmpty(pairs)) {
        return yield* Effect.void;
      }

      return yield* context.report({
        node: nextNode,
        messageId: 'unexpectedBlankLine',
        loc: getReportLoc(nextNode, sourceCode),
        fix(fixer) {
          // Multiple gaps separated by comments cannot be safely collapsed together.
          if (pairs.length >= 2) {
            return null;
          }

          const pair = Arr.headNonEmpty(pairs);

          const start = pair[0].range[1];

          const end = pair[1].range[0];

          return fixer.replaceTextRange(
            [start, end],
            sourceCode.text.slice(start, end).replace(paddingLineSequence, '$1$2'),
          );
        },
      });
    }

    if (Arr.isArrayNonEmpty(pairs)) {
      return yield* Effect.void;
    }

    return yield* context.report({
      node: nextNode,
      messageId: 'expectedBlankLine',
      loc: getReportLoc(nextNode, sourceCode),
      fix(fixer) {
        let prevToken = getActualLastToken(prevNode, sourceCode);

        const nextToken =
          sourceCode.getFirstTokenBetween(prevToken, nextNode, {
            includeComments: true,
            filter(token) {
              if (isTokenOnSameLine(prevToken, token)) {
                prevToken = token;

                return false;
              }

              return true;
            },
          }) ?? nextNode;

        return fixer.insertTextAfter(prevToken, isTokenOnSameLine(prevToken, nextToken) ? '\n\n' : '\n');
      },
    });
  });
}

function* createVisitor(context: RuleContext['Service'], options: ReadonlyArray<PaddingLineOption>) {
  const sourceCode = context.sourceCode;

  const selectors = Arr.fromIterable(
    new Set(
      Fn.pipe(
        options,
        Arr.flatMap((option) => [...Arr.ensure(option.prev), ...Arr.ensure(option.next)]),
        Arr.flatMap((matcher) => (P.isString(matcher) ? [] : [matcher.selector])),
      ),
    ),
  );

  // Collections are mutated only inside Ref updates, avoiding quadratic copies during traversal.
  const matches = yield* Ref.make<Map<string, Set<ESTree.Node>>>(
    new Map(Arr.map(selectors, (selector) => [selector, new Set<ESTree.Node>()])),
  );

  const pendingPairs = yield* Ref.make(Arr.empty<StatementPair>());

  interface Scope {
    readonly upper: Opt.Option<Scope>;
    readonly prevNode: Opt.Option<ESTree.Node>;
  }

  const scope = yield* Ref.make(Opt.none<Scope>());

  function enterScope(): Effect.Effect<void> {
    return Ref.update(scope, (upper) => Opt.some({ upper, prevNode: Opt.none() }));
  }

  function exitScope(): Effect.Effect<void> {
    return Ref.update(
      scope,
      Opt.flatMap((current) => current.upper),
    );
  }

  function match(node: ESTree.Node, matcher: StatementOption, matchedNodes: SelectorMatches): boolean {
    let inner = node;

    while (inner.type === 'LabeledStatement') {
      inner = inner.body;
    }

    if (isMatcherArray(matcher)) {
      return Arr.some(matcher, (item) => match(inner, item, matchedNodes));
    }

    if (!P.isString(matcher)) {
      return (
        matchedNodes.get(matcher.selector)?.has(inner) === true &&
        (matcher.lineMode === 'singleline'
          ? isSingleLine(inner)
          : matcher.lineMode !== 'multiline' || !isSingleLine(inner))
      );
    }

    return statementTypes[matcher](inner, sourceCode);
  }

  function getPaddingType(prevNode: ESTree.Node, nextNode: ESTree.Node, matchedNodes: SelectorMatches): PaddingType {
    return Fn.pipe(
      Arr.findLast(
        options,
        (option) => match(prevNode, option.prev, matchedNodes) && match(nextNode, option.next, matchedNodes),
      ),
      Opt.match({ onNone: (): PaddingType => 'any', onSome: (option) => option.blankLine }),
    );
  }

  const verify = Match.type<ESTree.Node>().pipe(
    Match.when({ parent: Match.null }, Fn.constant(Effect.void)),
    Match.not(
      {
        parent: {
          type: Match.is(
            'BlockStatement',
            'Program',
            'StaticBlock',
            'SwitchCase',
            'SwitchStatement',
            'TSInterfaceBody',
            'TSModuleBlock',
            'TSTypeLiteral',
          ),
        },
      },
      Fn.constant(Effect.void),
    ),
    Match.orElse((node) =>
      Effect.gen(function* () {
        const current = yield* Ref.get(scope);

        if (Opt.isNone(current)) {
          return yield* Effect.die(new Error('Padding rule invariant: statement scope is missing'));
        }

        if (Opt.isSome(current.value.prevNode)) {
          const prevNode = current.value.prevNode.value;

          yield* Ref.update(pendingPairs, (pairs) => {
            pairs.push({ prevNode, nextNode: node });

            return pairs;
          });
        }

        yield* Ref.set(scope, Opt.some({ upper: current.value.upper, prevNode: Opt.some(node) }));
      }),
    ),
  );

  function verifyThenEnterScope(node: ESTree.Node): Effect.Effect<void> {
    return Effect.andThen(verify(node), enterScope());
  }

  const visitor: Visitor.EffectVisitor = {
    Program: enterScope,
    'Program:exit': Effect.fn("'Program:exit'")(function* () {
      const matchedNodes = yield* Ref.get(matches);

      yield* Ref.get(pendingPairs).pipe(
        Effect.flatMap((pairs) =>
          Effect.all(
            Arr.map(pairs, ({ prevNode, nextNode }) =>
              verifyPair(prevNode, nextNode, getPaddingType(prevNode, nextNode, matchedNodes)),
            ),
          ),
        ),
      );

      yield* exitScope();
    }),
    BlockStatement: enterScope,
    'BlockStatement:exit': exitScope,
    SwitchStatement: enterScope,
    'SwitchStatement:exit': exitScope,
    SwitchCase: verifyThenEnterScope,
    'SwitchCase:exit': exitScope,
    StaticBlock: enterScope,
    'StaticBlock:exit': exitScope,
    TSInterfaceBody: enterScope,
    'TSInterfaceBody:exit': exitScope,
    TSModuleBlock: enterScope,
    'TSModuleBlock:exit': exitScope,
    TSTypeLiteral: enterScope,
    'TSTypeLiteral:exit': exitScope,
    TSDeclareFunction: verifyThenEnterScope,
    'TSDeclareFunction:exit': exitScope,
    TSMethodSignature: verifyThenEnterScope,
    'TSMethodSignature:exit': exitScope,
    ':statement': verify,
  };

  // Compose colliding selectors instead of replacing the rule's scope/statement listeners.
  return Visitor.merge(
    visitor,
    ...Arr.map(selectors, (selector) =>
      Visitor.on(selector, (node) =>
        Ref.update(matches, (matchedNodes) => {
          matchedNodes.get(selector)?.add(node);

          return matchedNodes;
        }),
      ),
    ),
  );
}

/**
 * Opt-in, comment-aware statement spacing with TypeScript and AST-selector matchers.
 */
export const paddingLineBetweenStatements = Rule.define({
  name: 'padding-line-between-statements',
  meta: {
    type: 'layout',
    docs: {
      description: 'Require or disallow padding lines between statements',
      url: 'https://eslint.style/rules/padding-line-between-statements',
      recommended: true,
    },
    fixable: 'whitespace',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          blankLine: { enum: ['any', 'never', 'always'] },
          prev: { $ref: '#/$defs/statementOption' },
          next: { $ref: '#/$defs/statementOption' },
        },
        required: ['blankLine', 'prev', 'next'],
        additionalProperties: false,
      },
      $defs: {
        statementMatcher: {
          anyOf: [
            { type: 'string', enum: R.keys(statementTypes) },
            {
              type: 'object',
              properties: { selector: { type: 'string' }, lineMode: { enum: ['any', 'singleline', 'multiline'] } },
              required: ['selector'],
              additionalProperties: false,
            },
          ],
        },
        statementOption: {
          anyOf: [
            { $ref: '#/$defs/statementMatcher' },
            { type: 'array', items: { $ref: '#/$defs/statementMatcher' }, minItems: 1, uniqueItems: true },
          ],
        },
      },
    },
    messages: {
      unexpectedBlankLine: 'Unexpected blank line before this statement.',
      expectedBlankLine: 'Expected blank line before this statement.',
    },
  },
  // Create keeps options, selector matches and scope state isolated per file.
  *create() {
    const context = yield* RuleContext;

    // Rule.define's options schema decodes only options[0]; this rule accepts a policy list.
    return yield* createVisitor(context, parseOptions(context.options));
  },
});
