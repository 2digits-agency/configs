import type { Context, ESTree, Scope, Variable } from '@oxlint/plugins';

import { defineEffectRule, type FileState, isApi, ruleMeta, staticPath, staticPropertyName } from '../../utils';

function isManagedRuntimeMake(context: Context, callee: ESTree.Expression, state: FileState): boolean {
  const name = staticPath(callee)?.[0];

  if (name === undefined || !isApi(callee, state, 'ManagedRuntime', 'make')) {
    return false;
  }
  let scope: Scope | null = context.sourceCode.getScope(callee);

  while (scope !== null) {
    const variable = scope.set.get(name);

    if (variable !== undefined) {
      const definition = variable.defs[0];
      const source = definition?.parent;

      return (
        definition?.type === 'ImportBinding' &&
        source?.type === 'ImportDeclaration' &&
        (source.source.value === 'effect' || source.source.value === 'effect/ManagedRuntime') &&
        source.importKind !== 'type' &&
        definition.node.type !== 'ImportDefaultSpecifier' &&
        (definition.node.type !== 'ImportSpecifier' || definition.node.importKind !== 'type')
      );
    }
    scope = scope.upper;
  }

  return false;
}

const workMethods = new Set(['runPromise', 'runPromiseExit', 'runSync', 'runSyncExit', 'runFork', 'runCallback']);

function shouldReportRuntime(variable: Variable, declaration: ESTree.VariableDeclarator): boolean {
  let used = false;

  for (const reference of variable.references) {
    if (reference.init && reference.identifier === declaration.id) {
      continue;
    }
    const identifier = reference.identifier;
    const member = identifier.parent;

    // Any unrecognized reference could transfer ownership. Do not follow aliases or guess at helper contracts.
    if (reference.isWrite() || member.type !== 'MemberExpression' || member.object !== identifier) {
      return false;
    }
    const name = staticPropertyName(member);

    if (
      name === 'dispose' ||
      name === 'disposeEffect' ||
      !workMethods.has(name ?? '') ||
      member.parent.type !== 'CallExpression' ||
      member.parent.callee !== member
    ) {
      return false;
    }
    used = true;
  }

  return used;
}

const meta = ruleMeta(
  'problem',
  'Require visible disposal ownership for private ManagedRuntime bindings.',
  {
    missingDisposal:
      'This used private ManagedRuntime has no visible release reference. Provide an owner/release hook, use a scoped entrypoint, or document intentional process lifetime.',
  },
  'https://github.com/2digits-agency/configs/issues/2717',
);

export const requireManagedRuntimeDisposal = defineEffectRule(
  { ...meta, docs: { ...meta.docs, recommended: false } },
  (context, state) => {
    const candidates: Array<{ declaration: ESTree.VariableDeclarator; acquisition: ESTree.CallExpression }> = [];

    return {
      before() {
        candidates.length = 0;
      },
      VariableDeclarator(node) {
        const declaration = node.parent;

        if (
          node.id.type !== 'Identifier' ||
          node.init?.type !== 'CallExpression' ||
          declaration.type !== 'VariableDeclaration' ||
          declaration.kind !== 'const' ||
          declaration.parent.type === 'ExportNamedDeclaration' ||
          !isManagedRuntimeMake(context, node.init.callee, state())
        ) {
          return;
        }
        candidates.push({ declaration: node, acquisition: node.init });
      },
      'Program:exit': () => {
        for (const { declaration, acquisition } of candidates) {
          const variable = context.sourceCode.getDeclaredVariables(declaration)[0];

          if (variable !== undefined && shouldReportRuntime(variable, declaration)) {
            context.report({ node: acquisition, messageId: 'missingDisposal' });
          }
        }
      },
    };
  },
);
