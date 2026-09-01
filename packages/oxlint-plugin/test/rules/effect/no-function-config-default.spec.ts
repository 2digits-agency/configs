import { noFunctionConfigDefault } from '../../../src/rules/effect/no-function-config-default';
import { testRule } from '../../rule-tester';

testRule('no-function-config-default', noFunctionConfigDefault, {
  valid: `
    import * as Config from 'effect/Config'
    Config.withDefault(config, makeDefault())
  `,
  invalid: `
    import * as Config from 'effect/Config'
    Config.withDefault(config, () => makeDefault())
  `,
  messageId: 'functionDefault',
});
