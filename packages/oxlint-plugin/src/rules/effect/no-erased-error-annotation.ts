import type { Context, Definition, ESTree, Rule, Scope } from '@oxlint/plugins';

import { canonicalPath, defineEffectRule, type FileState, type FunctionNode } from '../../utils';

function isEffectImport(definition: Definition): boolean {
  return (
    definition.type === 'ImportBinding' &&
    definition.parent?.type === 'ImportDeclaration' &&
    ['effect', 'effect/Effect'].includes(definition.parent.source.value)
  );
}

function importedEffectApi(node: ESTree.Node, context: Context, state: FileState, member: string): boolean {
  const path = canonicalPath(node, state);

  if (path?.length !== 2 || path[0] !== 'Effect' || path[1] !== member) {
    return false;
  }
  let root = node;

  while (root.type === 'MemberExpression') {
    root = root.object;
  }
  if (root.type !== 'Identifier') {
    return false;
  }
  const reference = context.sourceCode.getScope(root).references.find((entry) => entry.identifier === root);

  return reference?.resolved?.defs.some((element) => isEffectImport(element)) === true;
}

function isEffectType(node: ESTree.TSTypeReference, context: Context, state: FileState): boolean {
  const parts: Array<string> = [];
  let root = node.typeName;

  while (root.type === 'TSQualifiedName') {
    parts.unshift(root.right.name);
    root = root.left;
  }
  if (root.type !== 'Identifier') {
    return false;
  }
  const path = [...(state.bindings.get(root.name) ?? []), ...parts];

  if (path.length !== 2 || path[0] !== 'Effect' || path[1] !== 'Effect') {
    return false;
  }
  let scope: Scope | null = context.sourceCode.getScope(root);

  while (scope !== null) {
    const variable = scope.set.get(root.name);

    if (variable !== undefined) {
      return variable.defs.some((element) => isEffectImport(element));
    }
    scope = scope.upper;
  }

  return false;
}

function isConcreteError(node: ESTree.TSType): boolean {
  if (node.type === 'TSUnionType') {
    return node.types.every((element) => isConcreteError(element));
  }
  if (node.type !== 'TSTypeReference' || node.typeArguments !== null) {
    return false;
  }
  const name = node.typeName.type === 'TSQualifiedName' ? node.typeName.right : node.typeName;

  if (name.type !== 'Identifier' || !/^\p{Lu}/u.test(name.name)) {
    return false;
  }
  let root = node.typeName;

  while (root.type === 'TSQualifiedName') {
    root = root.left;
  }
  let parent: ESTree.Node | null = node.parent;

  while (parent) {
    if (
      'typeParameters' in parent &&
      parent.typeParameters?.params.some((parameter) => root.type === 'Identifier' && parameter.name.name === root.name)
    ) {
      return false;
    }
    parent = parent.parent;
  }

  return true;
}

function returnsErasedEffect(node: FunctionNode, context: Context, state: FileState): boolean {
  const body = node.body;
  const returned =
    body?.type === 'BlockStatement' && body.body.length === 1 && body.body[0]?.type === 'ReturnStatement'
      ? body.body[0].argument
      : body;

  if (
    returned?.type !== 'CallExpression' ||
    returned.callee.type !== 'MemberExpression' ||
    returned.callee.computed ||
    returned.callee.property.type !== 'Identifier' ||
    returned.callee.property.name !== 'pipe'
  ) {
    return false;
  }
  const source = returned.callee.object;
  const terminal = returned.arguments.at(-1);
  const erasesError =
    terminal?.type === 'CallExpression'
      ? importedEffectApi(terminal.callee, context, state, 'orElseSucceed')
      : terminal !== undefined &&
        (importedEffectApi(terminal, context, state, 'ignore') || importedEffectApi(terminal, context, state, 'orDie'));

  return (
    source.type === 'CallExpression' &&
    ['tryPromise', 'try', 'fail', 'gen'].some((member) => importedEffectApi(source.callee, context, state, member)) &&
    erasesError
  );
}

export const noErasedErrorAnnotation: Rule = defineEffectRule(
  {
    type: 'suggestion',
    docs: {
      description: 'Suggest reviewing concrete Effect error annotations after terminal typed-error erasure.',
      recommended: false,
      url: 'https://github.com/2digits-agency/configs/issues/2721',
    },
    schema: [],
    messages: {
      erased:
        'This terminal operator removes the typed error channel, but the return annotation still declares {{error}}. Keep a wider API contract intentionally, or narrow the annotation. Defects and interruption remain possible; orDie converts typed failures into defects, not success.',
    },
  },
  (context, getState) => {
    function check(node: FunctionNode): void {
      if (node.async || node.generator) {
        return;
      }
      const annotation = node.returnType?.typeAnnotation;

      if (annotation?.type !== 'TSTypeReference' || !isEffectType(annotation, context, getState())) {
        return;
      }
      const error = annotation.typeArguments?.params[1];

      if (error === undefined || !isConcreteError(error)) {
        return;
      }
      if (returnsErasedEffect(node, context, getState())) {
        context.report({ node: error, messageId: 'erased', data: { error: context.sourceCode.getText(error) } });
      }
    }

    return { FunctionDeclaration: check, FunctionExpression: check, ArrowFunctionExpression: check };
  },
);
