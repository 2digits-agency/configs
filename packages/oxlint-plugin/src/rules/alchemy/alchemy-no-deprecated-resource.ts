import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as R from 'effect/Record';

import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

const deprecatedResources: Readonly<Record<string, string>> = {
  'Cloudflare.Access.Bookmark': 'Cloudflare.Access.Application with type: "bookmark"',
  'AWS.RDSData.ExecuteSql': 'AWS.RDSData.ExecuteStatement',
  'AWS.EKS.Deployment': 'Kubernetes.Deployment from alchemy/Kubernetes',
  'AWS.EKS.HelmChart': 'Kubernetes.HelmChart from alchemy/Kubernetes',
  'AWS.EKS.Job': 'Kubernetes.Job from alchemy/Kubernetes',
  'AWS.EKS.Manifest': 'Kubernetes.Manifest from alchemy/Kubernetes',
};

export const alchemyNoDeprecatedResource = Rule.define({
  name: 'alchemy-no-deprecated-resource',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow deprecated Alchemy resource APIs that have supported replacements.',
    messages: {
      deprecated: '{{api}} is deprecated. Use {{replacement}}.',
    },
    url: 'https://alchemy.run/llms-full.txt',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      imports.path(node.callee).pipe(
        Opt.flatMap((path) => {
          const api = Arr.join(path, '.');

          return Opt.map(R.get(deprecatedResources, api), (replacement) => ({ api, replacement }));
        }),
        Opt.match({
          onNone: () => Effect.void,
          onSome: (data) => ctx.report(Diagnostic.fromId({ node: node.callee, messageId: 'deprecated', data })),
        }),
      ),
    );
  },
});
