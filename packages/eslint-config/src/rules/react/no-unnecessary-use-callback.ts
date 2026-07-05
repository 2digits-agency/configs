import type { RuleFunction, RuleToolkit, RuleListener } from '@eslint-react/kit';
import type { Scope } from '@typescript-eslint/scope-manager';
import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import type { RuleContext, SourceCode } from '@typescript-eslint/utils/ts-eslint';

const FUNCTION_NODE_TYPES = new Set<TSESTree.Node['type']>([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
]);

export function noUnnecessaryUseCallback(): RuleFunction {
  return noUnnecessaryUseCallbackImpl;
}

function noUnnecessaryUseCallbackImpl(context: RuleContext, { ast, is }: RuleToolkit): RuleListener {
  const { sourceCode } = context;

  if (!sourceCode.text.includes('useCallback')) {
    return {};
  }

  return {
    VariableDeclarator(node) {
      const { id, init } = node;

      if (id.type !== AST_NODE_TYPES.Identifier || !is.useCallbackCall(init)) {
        return;
      }

      const [callback, ...rest] = sourceCode.getDeclaredVariables(node);

      if (!callback || rest.length > 0) {
        return;
      }

      const effectReport = getUseEffectOnlyReport(
        sourceCode,
        (candidate, test) => ast.findParent(candidate, test) ?? undefined,
        init,
        id.name,
        is.useEffectLikeCall,
      );

      const { block: component } = sourceCode.getScope(init);

      if (!isFunction(component)) {
        return;
      }

      const { arguments: initArguments } = init;
      const [fn, deps] = initArguments;

      if (!fn || !deps) {
        return;
      }

      if (!isEmptyDependencyArray(deps)) {
        reportIfPresent(context, effectReport);

        return;
      }

      const callbackNode = getFunctionNode(fn);

      if (!callbackNode) {
        return;
      }

      const referencesComponentScope = getScopes(sourceCode.getScope(callbackNode))
        .flatMap((scope) => scope.references)
        .some((reference) => reference.resolved?.scope.block === component);

      if (!referencesComponentScope) {
        context.report({
          message: "An 'useCallback' with empty deps and no references to the component scope may be unnecessary.",
          node,
        });

        return;
      }

      reportIfPresent(context, effectReport);
    },
  };
}

interface UseEffectOnlyReport {
  message: string;
  node: TSESTree.Node;
}

function getUseEffectOnlyReport(
  sourceCode: Readonly<SourceCode>,
  findParent: (node: TSESTree.Node, test: (node: TSESTree.Node) => boolean) => TSESTree.Node | undefined,
  node: TSESTree.CallExpression,
  name: string,
  isUseEffectLikeCall: (node: TSESTree.Node, additionalHooks?: { test(value: string): boolean }) => boolean,
): UseEffectOnlyReport | undefined {
  if (!/use\w*Effect/u.test(sourceCode.text)) {
    return;
  }

  const references = sourceCode.getDeclaredVariables(node.parent)[0]?.references ?? [];
  const usages = references.filter((reference) => !reference.init);

  if (usages.length === 0) {
    return;
  }

  const effects = new Set<TSESTree.Node>();

  for (const usage of usages) {
    const effect = findParent(usage.identifier, isUseEffectLikeCall);

    if (!effect) {
      return;
    }

    if (effects.add(effect).size > 1) {
      return;
    }
  }

  return {
    message: `${name} is only used inside 1 useEffect, which may be unnecessary. You can move the computation into useEffect directly and merge the dependency arrays.`,
    node,
  };
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
  const scopes = [scope];

  for (const child of scope.childScopes) {
    scopes.push(...getScopes(child));
  }

  return scopes;
}

function isEmptyDependencyArray(node: TSESTree.CallExpressionArgument): boolean {
  return node.type === AST_NODE_TYPES.ArrayExpression && node.elements.length === 0;
}

function isFunction(
  node: TSESTree.Node,
): node is TSESTree.ArrowFunctionExpression | TSESTree.FunctionDeclaration | TSESTree.FunctionExpression {
  return FUNCTION_NODE_TYPES.has(node.type);
}

function reportIfPresent(context: RuleContext, report: UseEffectOnlyReport | undefined): void {
  if (!report) {
    return;
  }

  context.report(report);
}
