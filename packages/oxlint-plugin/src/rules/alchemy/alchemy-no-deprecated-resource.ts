import type { Rule } from '@oxlint/plugins';

import { canonicalPath, defineEffectRule, ruleMeta } from '../../utils';

const deprecatedResources = new Map<string, string>([
  ['Cloudflare.Access.Bookmark', 'Cloudflare.Access.Application with type: "bookmark"'],
  ['AWS.RDSData.ExecuteSql', 'AWS.RDSData.ExecuteStatement'],
  ['AWS.EKS.Deployment', 'Kubernetes.Deployment from alchemy/Kubernetes'],
  ['AWS.EKS.HelmChart', 'Kubernetes.HelmChart from alchemy/Kubernetes'],
  ['AWS.EKS.Job', 'Kubernetes.Job from alchemy/Kubernetes'],
  ['AWS.EKS.Manifest', 'Kubernetes.Manifest from alchemy/Kubernetes'],
]);

export const alchemyNoDeprecatedResource: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow deprecated Alchemy resource APIs that have supported replacements.',
    {
      deprecated: '{{api}} is deprecated. Use {{replacement}}.',
    },
    'https://alchemy.run/llms-full.txt',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const path = canonicalPath(node.callee, getState());

      if (path === undefined) {
        return;
      }

      const api = path.join('.');
      const replacement = deprecatedResources.get(api);

      if (replacement !== undefined) {
        context.report({ node: node.callee, messageId: 'deprecated', data: { api, replacement } });
      }
    },
  }),
);
