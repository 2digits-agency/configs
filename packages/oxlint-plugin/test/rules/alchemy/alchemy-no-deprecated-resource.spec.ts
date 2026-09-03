import { alchemyNoDeprecatedResource } from '../../../src/rules/alchemy/alchemy-no-deprecated-resource';
import { testRule } from '../../rule-tester';

testRule('alchemy-no-deprecated-resource', alchemyNoDeprecatedResource, {
  valid: `
    import * as Cloudflare from 'alchemy/Cloudflare'
    Cloudflare.Access.Application('Wiki', { type: 'bookmark' })
  `,
  invalid: `
    import * as Cloudflare from 'alchemy/Cloudflare'
    Cloudflare.Access.Bookmark('Wiki', { domain: 'wiki.example.com' })
  `,
  messageId: 'deprecated',
});
