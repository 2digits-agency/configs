import { testRule } from '../../rule-tester';

testRule('alchemy-no-deprecated-docker-constraints', {
  valid: [
    `
    import * as Docker from 'alchemy/Docker'
    Docker.Service('Api', { placement: { constraints: ['node.role==worker'] } })
  `,
  ],
  invalid: [
    {
      code: `
    import * as Docker from 'alchemy/Docker'
    Docker.Service('Api', { constraints: ['node.role==worker'] })
  `,
      errors: [{ messageId: 'constraints' }],
      output: `
    import * as Docker from 'alchemy/Docker'
    Docker.Service('Api', { placement: { constraints: ['node.role==worker'] } })
  `,
    },
  ],
});
