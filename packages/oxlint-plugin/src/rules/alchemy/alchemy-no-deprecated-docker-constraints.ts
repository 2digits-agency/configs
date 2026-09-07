import type { Rule } from '@oxlint/plugins';

import { importedApi, plainOptions } from '../../fixes';
import { argumentAt, defineEffectRule, isApi, objectProperty, ruleMeta } from '../../utils';

export const alchemyNoDeprecatedDockerConstraints: Rule = defineEffectRule(
  {
    ...ruleMeta(
      'problem',
      'Disallow the deprecated top-level Docker Service constraints property.',
      {
        constraints: 'Docker.Service constraints is deprecated. Move it to placement: { constraints: ... }.',
      },
      'https://alchemy.run/providers/docker/service',
    ),
    fixable: 'code',
  },
  (context, getState) => ({
    CallExpression(node) {
      if (!isApi(node.callee, getState(), 'Docker', 'Service')) {
        return;
      }

      const options = argumentAt(node, 1);
      const constraints = options?.type === 'ObjectExpression' ? objectProperty(options, 'constraints') : undefined;

      if (constraints !== undefined) {
        context.report({
          node: constraints,
          messageId: 'constraints',
          fix(fixer) {
            if (
              !importedApi(context, node.callee) ||
              options?.type !== 'ObjectExpression' ||
              !plainOptions(options, 'placement')
            ) {
              return;
            }

            return fixer.replaceText(constraints, `placement: { ${context.sourceCode.getText(constraints)} }`);
          },
        });
      }
    },
  }),
);
