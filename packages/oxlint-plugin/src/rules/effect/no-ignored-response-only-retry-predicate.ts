import type { Rule } from '@oxlint/plugins';

import { importedApi } from '../../fixes';
import {
  argumentAt,
  defineEffectRule,
  isApi,
  isLiteral,
  objectProperty,
  propertyName,
  ruleMeta,
  staticPath,
} from '../../utils';

const httpEntrypoints = new Set([
  'effect/unstable/http',
  'effect/unstable/http/HttpClient',
  'effect/http',
  'effect/http/HttpClient',
]);

export const noIgnoredResponseOnlyRetryPredicate: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Report ignored predicates in Effect v4 response-only transient retries.',
    {
      ignoredWhile:
        'retryOn: "response-only" ignores while. Review the intended retry policy; "errors-and-responses" also does not apply while to response retries.',
    },
    'https://github.com/Effect-TS/tsgo/issues/419',
  ),
  (context, getState) => {
    const httpImports = new Set<string>();

    return {
      before() {
        httpImports.clear();
      },
      Program(node) {
        for (const statement of node.body) {
          if (statement.type === 'ImportDeclaration' && httpEntrypoints.has(statement.source.value)) {
            for (const specifier of statement.specifiers) {
              if (specifier.type !== 'ImportDefaultSpecifier') {
                httpImports.add(specifier.local.name);
              }
            }
          }
        }
      },
      CallExpression(node) {
        const root = staticPath(node.callee)?.[0];

        if (
          root === undefined ||
          !httpImports.has(root) ||
          !isApi(node.callee, getState(), 'HttpClient', 'retryTransient') ||
          !importedApi(context, node.callee)
        ) {
          return;
        }

        if (
          (node.arguments.length !== 1 && node.arguments.length !== 2) ||
          node.arguments.some((argument) => argument.type === 'SpreadElement')
        ) {
          return;
        }

        const options = argumentAt(node, node.arguments.length - 1);

        if (options?.type !== 'ObjectExpression') {
          return;
        }

        const names = options.properties.map((property) =>
          property.type === 'Property' && !property.computed ? propertyName(property) : undefined,
        );

        if (names.includes(undefined) || new Set(names).size !== names.length) {
          return;
        }

        const retryOn = objectProperty(options, 'retryOn');
        const predicate = objectProperty(options, 'while');

        if (retryOn !== undefined && predicate !== undefined && isLiteral(retryOn.value, 'response-only')) {
          context.report({ node: predicate, messageId: 'ignoredWhile' });
        }
      },
    };
  },
);
