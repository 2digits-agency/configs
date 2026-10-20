import { testRule } from '../../rule-tester';

testRule('alchemy-no-plaintext-github-secret', {
  valid: [
    `
    import * as GitHub from 'alchemy/GitHub'
    import * as Redacted from 'effect/Redacted'
    GitHub.Secret('Token', { value: Redacted.make('secret') })
  `,
  ],
  invalid: [
    {
      code: `
    import * as GitHub from 'alchemy/GitHub'
    GitHub.Secret('Token', { value: 'secret' })
  `,
      errors: [{ messageId: 'plaintext' }],
    },
  ],
});
