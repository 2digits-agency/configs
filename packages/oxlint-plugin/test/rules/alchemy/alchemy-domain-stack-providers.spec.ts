import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { alchemyDomainStackProviders } from '../../../src/rules/alchemy/alchemy-domain-stack-providers';

RuleTester.describe = describe;

RuleTester.it = it;

const header = `
  import * as Cloudflare from '@alchemy.run/cloudflare'
  import * as DomainCloudflare from '@alchemy.run/domain/Cloudflare'
  import * as GitHub from '@alchemy.run/github'
  import * as Alchemy from 'alchemy'
  import * as Layer from 'effect/Layer'
`;

function stack(providers: string): string {
  return `${header}export default Alchemy.Stack('Bank', { providers: ${providers}, state: Cloudflare.state() }, program)`;
}

const filename = 'alchemy.run.ts';

new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } }).run(
  'alchemy-domain-stack-providers',
  alchemyDomainStackProviders,
  {
    valid: [
      { filename, code: stack('Layer.mergeAll(Cloudflare.providers(), DomainCloudflare.providers())') },
      {
        filename,
        code: stack(
          'Layer.mergeAll(Cloudflare.providers(), DomainCloudflare.providers()).pipe(Layer.provideMerge(GitHub.providers()))',
        ),
      },
      {
        filename,
        code: `import { providers as domainProviders } from '@alchemy.run/domain/Cloudflare'\n${stack('Layer.mergeAll(Cloudflare.providers(), domainProviders())')}`,
      },
      { filename, code: stack('GitHub.providers()') },
      // Stacks besides alchemy.run.ts deploy no model.
      { filename: 'stacks/github.ts', code: stack('Layer.mergeAll(Cloudflare.providers(), GitHub.providers())') },
    ],
    invalid: [
      {
        filename,
        code: stack('Cloudflare.providers()'),
        errors: [{ messageId: 'missing' }],
      },
      {
        filename: '/repo/alchemy.run.ts',
        code: stack('Layer.mergeAll(Cloudflare.providers(), GitHub.providers())'),
        errors: [{ messageId: 'missing' }],
      },
      {
        filename,
        code: `
          import * as Cloudflare from '@alchemy.run/cloudflare'
          import * as Alchemy from 'alchemy'
          import * as Layer from 'effect/Layer'
          const DomainCloudflare = { providers: () => Layer.empty }
          export default Alchemy.Stack('Bank', { providers: Layer.mergeAll(Cloudflare.providers(), DomainCloudflare.providers()) }, program)
        `,
        errors: [{ messageId: 'missing' }],
      },
    ],
  },
);
