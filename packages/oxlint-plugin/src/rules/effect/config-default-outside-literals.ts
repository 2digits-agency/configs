import type { Context, ESTree, Rule, Scope } from '@oxlint/plugins';

import { argumentAt, defineSyntaxRule, ruleMeta, staticPath, staticPropertyName } from '../../utils';

function api(context: Context, node: ESTree.Node, namespace: string, member: string, typeOnly = false): boolean {
  let current = node;
  const suffix: Array<string> = [];

  while (current.type === 'TSQualifiedName') {
    suffix.unshift(current.right.name);
    current = current.left;
  }
  const prefix = staticPath(current);
  const path = prefix === undefined ? undefined : [...prefix, ...suffix];
  const root = path?.[0];

  if (!path || !root) {
    return false;
  }
  let scope: Scope | null = context.sourceCode.getScope(node);

  while (scope !== null) {
    const variable = scope.set.get(root);

    if (variable) {
      return variable.defs.some((definition) => {
        const specifier = definition.node;
        const declaration = specifier.parent;

        if (
          definition.type !== 'ImportBinding' ||
          declaration?.type !== 'ImportDeclaration' ||
          (!typeOnly &&
            (declaration.importKind === 'type' ||
              (specifier.type === 'ImportSpecifier' && specifier.importKind === 'type')))
        ) {
          return false;
        }
        const source = declaration.source.value;
        const base = source === 'effect' ? [] : source === `effect/${namespace}` ? [namespace] : undefined;

        if (!base) {
          return false;
        }
        const imported =
          specifier.type === 'ImportSpecifier'
            ? specifier.imported.type === 'Identifier'
              ? specifier.imported.name
              : specifier.imported.value
            : undefined;
        const canonical = [...base, ...(imported === undefined ? [] : [imported]), ...path.slice(1)];

        return canonical.length === 2 && canonical[0] === namespace && canonical[1] === member;
      });
    }
    scope = scope.upper;
  }

  return false;
}

function inlineExpression(node: ESTree.Expression, allowConst = false): ESTree.Expression {
  let current = node;

  for (;;) {
    if (current.type === 'ParenthesizedExpression') {
      current = current.expression;
      continue;
    }
    if (current.type !== 'TSAsExpression' && current.type !== 'TSTypeAssertion') {
      return current;
    }
    if (
      !allowConst ||
      current.typeAnnotation.type !== 'TSTypeReference' ||
      current.typeAnnotation.typeName.type !== 'Identifier' ||
      current.typeAnnotation.typeName.name !== 'const'
    ) {
      return current;
    }
    current = current.expression;
  }
}

function primitive(node: ESTree.Node): string | number | undefined {
  if (node.type === 'Literal' && (typeof node.value === 'string' || typeof node.value === 'number')) {
    return node.value;
  }
  if (
    node.type === 'UnaryExpression' &&
    (node.operator === '-' || node.operator === '+') &&
    node.argument.type === 'Literal' &&
    typeof node.argument.value === 'number'
  ) {
    return node.operator === '-' ? -node.argument.value : node.argument.value;
  }

  return undefined;
}

function shouldSkipAnnotatedDeclaration(
  context: Context,
  result: ESTree.Node,
  values: Array<string | number>,
  value: string | number,
): boolean {
  let current = result;

  while (
    current.parent &&
    [
      'ParenthesizedExpression',
      'TSAsExpression',
      'TSSatisfiesExpression',
      'TSTypeAssertion',
      'TSNonNullExpression',
    ].includes(current.parent.type)
  ) {
    current = current.parent;
  }
  const declaration = current.parent;

  if (
    declaration?.type !== 'VariableDeclarator' ||
    declaration.init !== current ||
    declaration.id.type !== 'Identifier'
  ) {
    return false;
  }
  const annotation = declaration.id.typeAnnotation?.typeAnnotation;

  if (!annotation) {
    return false;
  }
  if (
    annotation.type !== 'TSTypeReference' ||
    !api(context, annotation.typeName, 'Config', 'Config', true) ||
    annotation.typeArguments?.params.length !== 1
  ) {
    return true; // Unknown annotations are not evidence of a finite contract.
  }
  const success = annotation.typeArguments.params[0];

  if (success?.type !== 'TSUnionType') {
    return true;
  }
  const members = new Set(
    success.types.map((type) => (type.type === 'TSLiteralType' ? primitive(type.literal) : undefined)),
  );

  return members.has(undefined) || [...values, value].every((member) => members.has(member));
}

function literalValues(context: Context, source: ESTree.Expression): Array<string | number> | undefined {
  const config = inlineExpression(source);

  if (config.type !== 'CallExpression' || config.arguments.length === 0 || config.arguments.length > 2) {
    return undefined;
  }
  let literals = config;

  if (api(context, config.callee, 'Config', 'schema')) {
    const schema = argumentAt(config, 0);

    if (
      schema?.type !== 'CallExpression' ||
      schema.arguments.length !== 1 ||
      !api(context, schema.callee, 'Schema', 'Literals')
    ) {
      return undefined;
    }
    literals = schema;
  } else if (!api(context, config.callee, 'Config', 'Literals')) {
    return undefined;
  }
  const array = argumentAt(literals, 0);
  const allowed = array === undefined ? undefined : inlineExpression(array, true);

  if (allowed?.type !== 'ArrayExpression' || allowed.elements.length < 2) {
    return undefined;
  }
  const values: Array<string | number> = [];

  for (const element of allowed.elements) {
    const member = element ? primitive(element) : undefined;

    if (member === undefined || (values.length > 0 && typeof member !== typeof values[0])) {
      return undefined;
    }
    values.push(member);
  }

  return values;
}

export const configDefaultOutsideLiterals: Rule = defineSyntaxRule(
  {
    ...ruleMeta(
      'suggestion',
      'Check same-kind defaults outside an inline literal Config contract.',
      {
        outsideLiterals:
          'Check this Config default: it is outside the inline allowed values ({{allowed}}). Widening may be intentional.',
      },
      'https://github.com/2digits-agency/configs/issues/2732',
    ),
    docs: {
      description: 'Check same-kind defaults outside an inline literal Config contract.',
      recommended: false,
      url: 'https://github.com/2digits-agency/configs/issues/2732',
    },
  },
  (context) => ({
    CallExpression(node) {
      if (
        !api(context, node.callee, 'Config', 'withDefault') ||
        (node.arguments.length !== 1 && node.arguments.length !== 2)
      ) {
        return;
      }
      const fallback = argumentAt(node, node.arguments.length - 1);
      const parent = node.parent;
      const source =
        node.arguments.length === 2
          ? argumentAt(node, 0)
          : parent.type === 'CallExpression' &&
              parent.arguments.length === 1 &&
              parent.arguments[0] === node &&
              parent.callee.type === 'MemberExpression' &&
              staticPropertyName(parent.callee) === 'pipe'
            ? parent.callee.object
            : undefined;
      const value = fallback === undefined ? undefined : primitive(inlineExpression(fallback, true));

      if (!source || !fallback || value === undefined) {
        return;
      }
      const values = literalValues(context, source);

      if (values === undefined || typeof value !== typeof values[0]) {
        return;
      }
      const result = node.arguments.length === 2 ? node : parent;

      if (!values.includes(value) && !shouldSkipAnnotatedDeclaration(context, result, values, value)) {
        context.report({
          node: fallback,
          messageId: 'outsideLiterals',
          data: { allowed: values.map((value) => JSON.stringify(value)).join(', ') },
        });
      }
    },
  }),
);
