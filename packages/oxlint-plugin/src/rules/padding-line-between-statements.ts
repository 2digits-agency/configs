// Adapted from anti-slop's ESLint Stylistic vendor. See NOTICE and padding-line-upstream.md.
/* oxlint-disable unicorn/no-null -- Oxlint AST/token APIs and no-fix results use null. */
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
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Ref from 'effect/Ref';

type Token = SyntaxToken | Comment;
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
type StatementOption = StatementMatcher | [StatementMatcher, ...Array<StatementMatcher>];

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

function isSemicolonToken(token: Token): boolean {
  return token.type === 'Punctuator' && token.value === ';';
}

function isTokenOnSameLine(left: { loc: Location }, right: { loc: Location }): boolean {
  return left.loc.end.line === right.loc.start.line;
}

function isSingleLine(node: ESTree.Node): boolean {
  return node.loc.start.line === node.loc.end.line;
}

function isFunction(node: ESTree.Node): boolean {
  return ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(node.type);
}

function skipChainExpression(node: ESTree.Node): ESTree.Node {
  return node.type === 'ChainExpression' ? node.expression : node;
}

function keywordTester(types: string | Array<string>, keyword: string): NodeTest {
  return (node, sourceCode) =>
    sourceCode.getFirstToken(node)?.value === keyword &&
    (Array.isArray(types) ? types.includes(node.type) : types === node.type);
}

function nodeTypeTester(type: string): NodeTest {
  return (node) => node.type === type;
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
    const last = callee.expressions.at(-1);

    if (last === undefined) {
      throw new Error('Padding rule invariant: sequence expression is empty');
    }
    callee = last;
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
    typeof node.expression.value === 'string' &&
    (sourceCode.getTokenBefore(node.expression)?.value !== '(' ||
      sourceCode.getTokenAfter(node.expression)?.value !== ')')
  );
}

function isDirectivePrologue(node: ESTree.Node, sourceCode: SourceCode): boolean {
  if (!isDirective(node, sourceCode) || !node.parent || !('body' in node.parent) || !Array.isArray(node.parent.body)) {
    return false;
  }
  for (const sibling of node.parent.body) {
    if (sibling === node) {
      break;
    }
    if (!isDirective(sibling, sourceCode)) {
      return false;
    }
  }

  return true;
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

const statementTypes: Record<string, NodeTest> = {
  ...baseStatementTypes,
  ...Object.fromEntries(
    Object.entries(multilineStatementTypes).flatMap(([key, test]) => [
      [key, test],
      [
        `singleline-${key}`,
        (node: ESTree.Node, sourceCode: SourceCode) => test(node, sourceCode) && isSingleLine(node),
      ],
      [
        `multiline-${key}`,
        (node: ESTree.Node, sourceCode: SourceCode) => test(node, sourceCode) && !isSingleLine(node),
      ],
    ]),
  ),
};

function isStatementType(value: unknown): value is StatementType {
  return typeof value === 'string' && Object.hasOwn(statementTypes, value);
}

function parseMatcher(value: unknown): StatementMatcher {
  if (isStatementType(value)) {
    return value;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'selector' in value &&
    typeof value.selector === 'string' &&
    Object.keys(value).every((key) => key === 'selector' || key === 'lineMode')
  ) {
    if (!('lineMode' in value)) {
      return { selector: value.selector };
    }
    // eslint-disable-next-line unicorn/prefer-includes-over-repeated-comparisons -- Equality checks narrow the parsed union.
    if (value.lineMode === 'any' || value.lineMode === 'singleline' || value.lineMode === 'multiline') {
      return { selector: value.selector, lineMode: value.lineMode };
    }
  }
  throw new Error('Invalid padding-line-between-statements statement matcher');
}

function parseStatementOption(value: unknown): StatementOption {
  if (!Array.isArray(value)) {
    return parseMatcher(value);
  }
  const matchers: ReadonlyArray<unknown> = value;
  const first = matchers[0];

  if (first === undefined) {
    throw new Error('Padding statement matcher arrays must not be empty');
  }

  return [parseMatcher(first), ...matchers.slice(1).map((matcher) => parseMatcher(matcher))];
}

function parseOptions(values: ReadonlyArray<unknown>): Array<PaddingLineOption> {
  return values.map((value) => {
    if (
      typeof value !== 'object' ||
      value === null ||
      !('blankLine' in value) ||
      !('prev' in value) ||
      !('next' in value) ||
      Object.keys(value).some((key) => !['blankLine', 'prev', 'next'].includes(key)) ||
      (value.blankLine !== 'any' && value.blankLine !== 'never' && value.blankLine !== 'always')
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
): Array<[Token, Token]> {
  const pairs: Array<[Token, Token]> = [];
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
  context: RuleContext['Service'],
  prevNode: ESTree.Node,
  nextNode: ESTree.Node,
  padding: PaddingType,
): Effect.Effect<void> {
  if (padding === 'any') {
    return Effect.void;
  }
  const sourceCode = context.sourceCode;
  const pairs = getPaddingLineSequences(prevNode, nextNode, sourceCode);

  if (padding === 'never') {
    if (pairs.length === 0) {
      return Effect.void;
    }

    return context.report({
      node: nextNode,
      messageId: 'unexpectedBlankLine',
      loc: getReportLoc(nextNode, sourceCode),
      fix(fixer) {
        // Multiple gaps separated by comments cannot be safely collapsed together.
        if (pairs.length >= 2) {
          return null;
        }
        const pair = pairs[0];

        if (pair === undefined) {
          throw new Error('Padding rule invariant: reported padding pair is missing');
        }
        const start = pair[0].range[1];
        const end = pair[1].range[0];

        return fixer.replaceTextRange(
          [start, end],
          sourceCode.text.slice(start, end).replace(paddingLineSequence, '$1$2'),
        );
      },
    });
  }
  if (pairs.length > 0) {
    return Effect.void;
  }

  return context.report({
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
}

function* createVisitor(context: RuleContext['Service'], options: ReadonlyArray<PaddingLineOption>) {
  const sourceCode = context.sourceCode;
  const selectors = new Set(
    options.flatMap((option) =>
      [option.prev, option.next].flat().flatMap((matcher) => (typeof matcher === 'string' ? [] : matcher.selector)),
    ),
  );
  // Collections are mutated only inside Ref updates, avoiding quadratic copies during traversal.
  const matches = yield* Ref.make<Map<string, Set<ESTree.Node>>>(
    new Map(Array.from(selectors, (selector) => [selector, new Set<ESTree.Node>()])),
  );
  const pendingPairs = yield* Ref.make<Array<{ prevNode: ESTree.Node; nextNode: ESTree.Node }>>([]);

  interface Scope {
    readonly upper: Opt.Option<Scope>;
    readonly prevNode: Opt.Option<ESTree.Node>;
  }
  const scope = yield* Ref.make<Opt.Option<Scope>>(Opt.none());

  function enterScope(): Effect.Effect<void> {
    return Ref.update(scope, (upper) => Opt.some({ upper, prevNode: Opt.none() }));
  }
  function exitScope(): Effect.Effect<void> {
    return Ref.update(
      scope,
      Opt.flatMap((current) => current.upper),
    );
  }

  function match(
    node: ESTree.Node,
    matcher: StatementOption,
    matchedNodes: ReadonlyMap<string, ReadonlySet<ESTree.Node>>,
  ): boolean {
    let inner = node;

    while (inner.type === 'LabeledStatement') {
      inner = inner.body;
    }
    if (Array.isArray(matcher)) {
      return matcher.some((item) => match(inner, item, matchedNodes));
    }
    if (typeof matcher !== 'string') {
      return (
        matchedNodes.get(matcher.selector)?.has(inner) === true &&
        (matcher.lineMode === 'singleline'
          ? isSingleLine(inner)
          : matcher.lineMode !== 'multiline' || !isSingleLine(inner))
      );
    }
    const test = statementTypes[matcher];

    if (test === undefined) {
      throw new Error(`Padding rule invariant: unsupported statement type ${matcher}`);
    }

    return test(inner, sourceCode);
  }

  const reversedOptions = options.toReversed();

  function getPaddingType(
    prevNode: ESTree.Node,
    nextNode: ESTree.Node,
    matchedNodes: ReadonlyMap<string, ReadonlySet<ESTree.Node>>,
  ): PaddingType {
    for (const option of reversedOptions) {
      if (match(prevNode, option.prev, matchedNodes) && match(nextNode, option.next, matchedNodes)) {
        return option.blankLine;
      }
    }

    return 'any';
  }

  function verify(node: ESTree.Node): Effect.Effect<void> {
    if (
      !node.parent ||
      ![
        'BlockStatement',
        'Program',
        'StaticBlock',
        'SwitchCase',
        'SwitchStatement',
        'TSInterfaceBody',
        'TSModuleBlock',
        'TSTypeLiteral',
      ].includes(node.parent.type)
    ) {
      return Effect.void;
    }

    return Effect.gen(function* () {
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
    });
  }

  function verifyThenEnterScope(node: ESTree.Node): Effect.Effect<void> {
    return Effect.andThen(verify(node), enterScope());
  }

  const visitor: Visitor.EffectVisitor = {
    Program: enterScope,
    'Program:exit': () =>
      Effect.gen(function* () {
        const pairs = yield* Ref.get(pendingPairs);
        const matchedNodes = yield* Ref.get(matches);

        for (const { prevNode, nextNode } of pairs) {
          yield* verifyPair(context, prevNode, nextNode, getPaddingType(prevNode, nextNode, matchedNodes));
        }
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
    ...Array.from(selectors, (selector) =>
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
      recommended: false,
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
            { type: 'string', enum: Object.keys(statementTypes) },
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
