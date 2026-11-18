import type { ESTree, ScopeType } from 'effect-oxlint';
import * as Schema from 'effect/Schema';

import type { WrapperExpression } from '../internal/ast';

type NodeType = ESTree.Node['type'];

type BinaryOperator = ESTree.BinaryExpression['operator'];

/**
 * Expression wrappers that do not change the runtime value: parentheses, type assertions and non-null assertions.
 */
export const WrapperExpressionType = Schema.Literals([
  'ParenthesizedExpression',
  'TSAsExpression',
  'TSNonNullExpression',
  'TSSatisfiesExpression',
  'TSTypeAssertion',
] satisfies ReadonlyArray<WrapperExpression['type']>);

/**
 * Wrappers a parent may be without changing what the wrapped expression means.
 */
export const TransparentParentType = WrapperExpressionType.pick([
  'ParenthesizedExpression',
  'TSAsExpression',
  'TSNonNullExpression',
]);

export const FunctionType = Schema.Literals([
  'ArrowFunctionExpression',
  'FunctionDeclaration',
  'FunctionExpression',
] satisfies ReadonlyArray<NodeType>);

/**
 * Functions written as expressions.
 */
export const FunctionNodeType = FunctionType.pick(['ArrowFunctionExpression', 'FunctionExpression']);

export const DynamicType = Schema.Literals([
  'AssignmentExpression',
  'AwaitExpression',
  'ImportExpression',
  'TaggedTemplateExpression',
  'UpdateExpression',
  'YieldExpression',
] satisfies ReadonlyArray<NodeType>);

// Heads that can take `.pipe(...)` without parentheses.
export const MemberSafeHead = Schema.Literals([
  'CallExpression',
  'Identifier',
  'MemberExpression',
  'ThisExpression',
] satisfies ReadonlyArray<NodeType>);

export const PureLeaf = Schema.Literals([
  'ArrowFunctionExpression',
  'FunctionExpression',
  'Identifier',
  'Literal',
  'ThisExpression',
] satisfies ReadonlyArray<NodeType>);

export const NumberUnionMember = Schema.Literals([
  'TSNullKeyword',
  'TSNumberKeyword',
  'TSUndefinedKeyword',
] satisfies ReadonlyArray<NodeType>);

export const EqualityOperator = Schema.Literals(['==', '===', '!=', '!=='] satisfies ReadonlyArray<BinaryOperator>);

export const NegatedOperator = EqualityOperator.pick(['!==', '!=']);

export const ArithmeticOperator = Schema.Literals(['*', '+', '-', '/'] satisfies ReadonlyArray<BinaryOperator>);

export const ModuleScope = Schema.Literals(['global', 'module'] satisfies ReadonlyArray<ScopeType>);

export const LoopType = Schema.Literals([
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
] satisfies ReadonlyArray<NodeType>);

/**
 * Statements a `break` without a label leaves.
 */
export const BreakableType = Schema.Literals([
  ...LoopType.literals,
  'WhileStatement',
  'DoWhileStatement',
  'SwitchStatement',
] satisfies ReadonlyArray<NodeType>);
