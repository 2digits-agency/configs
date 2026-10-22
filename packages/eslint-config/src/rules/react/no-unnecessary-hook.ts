import type { RuleFunction, RuleToolkit } from '@eslint-react/kit';
import type { Scope, ScopeVariable } from '@typescript-eslint/scope-manager';
import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import type { RuleContext, SourceCode } from '@typescript-eslint/utils/ts-eslint';

type Hook = 'useCallback' | 'useMemo';

const FUNCTION_NODE_TYPES = new Set<TSESTree.Node['type']>([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
]);

const COMPUTATION_NODE_TYPES = new Set<TSESTree.Node['type']>([
  AST_NODE_TYPES.CallExpression,
  AST_NODE_TYPES.NewExpression,
]);

export function noUnnecessaryUseCallback(): RuleFunction {
  return noUnnecessaryHook('useCallback');
}

export function noUnnecessaryUseMemo(): RuleFunction {
  return noUnnecessaryHook('useMemo');
}

function noUnnecessaryHook(hook: Hook): RuleFunction {
  return (context, toolkit) => {
    const { sourceCode } = context;

    if (!sourceCode.text.includes(hook)) {
      return {};
    }

    const isHookCall = hook === 'useMemo' ? toolkit.is.useMemoCall : toolkit.is.useCallbackCall;

    return {
      VariableDeclarator(node) {
        const { id, init } = node;

        if (id.type !== AST_NODE_TYPES.Identifier || !isHookCall(init)) {
          return;
        }

        const [variable, ...rest] = sourceCode.getDeclaredVariables(node);

        if (!variable || rest.length > 0) {
          return;
        }

        const { block: component } = sourceCode.getScope(init);

        const [fn, deps] = init.arguments;

        if (!fn || !deps || !isFunction(component)) {
          return;
        }

        // Memoizing a call or `new` keeps one result per component instance, so hoisting it out would change behavior.
        const memoizesComputation =
          hook === 'useMemo' && isFunction(fn) && containsComputation(fn.body, sourceCode.visitorKeys);

        if (memoizesComputation || !isEmptyDependencyArray(deps)) {
          reportIfOnlyUsedInOneEffect(context, toolkit, variable, init);

          return;
        }

        const callbackNode = getFunctionNode(fn);

        if (!callbackNode) {
          return;
        }

        const referencesComponentScope = getScopes(sourceCode.getScope(callbackNode))
          .flatMap((scope) => scope.references)
          .some((reference) => reference.resolved?.scope.block === component);

        if (referencesComponentScope) {
          reportIfOnlyUsedInOneEffect(context, toolkit, variable, init);

          return;
        }

        context.report({
          message: `An '${hook}' with empty deps and no references to the component scope may be unnecessary.`,
          node,
        });
      },
    };
  };
}

function reportIfOnlyUsedInOneEffect(
  context: RuleContext,
  { ast, is }: RuleToolkit,
  { name, references }: ScopeVariable,
  node: TSESTree.CallExpression,
): void {
  if (!/use\w*Effect/u.test(context.sourceCode.text)) {
    return;
  }

  const usages = references.filter((reference) => !reference.init);

  const [effect, ...otherEffects] = new Set(
    usages.map((usage) => ast.findParent(usage.identifier, is.useEffectLikeCall)),
  );

  if (!effect || otherEffects.length > 0) {
    return;
  }

  context.report({
    message: `${name} is only used inside 1 useEffect, which may be unnecessary. You can move the computation into useEffect directly and merge the dependency arrays.`,
    node,
  });
}

function containsComputation(node: TSESTree.Node, visitorKeys: SourceCode['visitorKeys']): boolean {
  if (COMPUTATION_NODE_TYPES.has(node.type)) {
    return true;
  }

  return (visitorKeys[node.type] ?? []).some((key) =>
    [node[key as keyof TSESTree.Node]].flat().some((child) => isNode(child) && containsComputation(child, visitorKeys)),
  );
}

function getFunctionNode(
  node: TSESTree.CallExpressionArgument,
): TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression | undefined {
  if (node.type !== AST_NODE_TYPES.ArrowFunctionExpression && node.type !== AST_NODE_TYPES.FunctionExpression) {
    return;
  }

  return node.body.type === AST_NODE_TYPES.ArrowFunctionExpression ? node.body : node;
}

function getScopes(scope: Scope): Array<Scope> {
  return [scope, ...scope.childScopes.flatMap((child) => getScopes(child))];
}

function isEmptyDependencyArray(node: TSESTree.CallExpressionArgument): boolean {
  return node.type === AST_NODE_TYPES.ArrayExpression && node.elements.length === 0;
}

function isFunction(
  node: TSESTree.Node,
): node is TSESTree.ArrowFunctionExpression | TSESTree.FunctionDeclaration | TSESTree.FunctionExpression {
  return FUNCTION_NODE_TYPES.has(node.type);
}

function isNode(value: unknown): value is TSESTree.Node {
  return typeof value === 'object' && value !== null && 'type' in value;
}
