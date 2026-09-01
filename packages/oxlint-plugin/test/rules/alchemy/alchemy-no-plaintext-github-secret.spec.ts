import { alchemyNoPlaintextGithubSecret } from '../../../src/rules/alchemy/alchemy-no-plaintext-github-secret';
import { testRule } from '../../rule-tester';

testRule('alchemy-no-plaintext-github-secret', alchemyNoPlaintextGithubSecret, {
  valid: `
    import * as GitHub from 'alchemy/GitHub'
    import * as Redacted from 'effect/Redacted'
    GitHub.Secret('Token', { value: Redacted.make('secret') })
  `,
  invalid: `
    import * as GitHub from 'alchemy/GitHub'
    GitHub.Secret('Token', { value: 'secret' })
  `,
  messageId: 'plaintext',
});
