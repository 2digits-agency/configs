import { alchemyNoDeprecatedDockerConstraints } from '../../../src/rules/alchemy/alchemy-no-deprecated-docker-constraints';
import { testRule } from '../../rule-tester';

testRule('alchemy-no-deprecated-docker-constraints', alchemyNoDeprecatedDockerConstraints, {
  valid: `
    import * as Docker from 'alchemy/Docker'
    Docker.Service('Api', { placement: { constraints: ['node.role==worker'] } })
  `,
  invalid: `
    import * as Docker from 'alchemy/Docker'
    Docker.Service('Api', { constraints: ['node.role==worker'] })
  `,
  messageId: 'constraints',
});
