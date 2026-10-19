import { testRule } from '../../rule-tester';

testRule('alchemy-no-deprecated-resource', {
  valid: [
    `
    import * as Cloudflare from 'alchemy/Cloudflare'
    Cloudflare.Access.Application('Wiki', { type: 'bookmark' })
  `,
  ],
  invalid: [
    {
      code: `
    import * as Cloudflare from 'alchemy/Cloudflare'
    Cloudflare.Access.Bookmark('Wiki', { domain: 'wiki.example.com' })
  `,
      errors: [{ messageId: 'deprecated' }],
    },
  ],
});
