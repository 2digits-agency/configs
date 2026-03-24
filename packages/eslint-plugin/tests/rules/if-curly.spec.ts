import parser from '@typescript-eslint/parser';
import { run, type InvalidTestCase, type ValidTestCase } from 'eslint-vitest-rule-tester';

import { ifCurly, RULE_NAME } from '../../src/rules/if-curly';

const javascript = String.raw;

const valids: Array<ValidTestCase> = [
  javascript`if (foo) {
    bar()
  }`,

  javascript`if (foo) {
    bar()
  } else {
    baz()
  }`,

  javascript`if (foo) {
    bar()
  } else if (baz) {
    qux()
  } else {
    quux()
  }`,

  javascript`if (foo) { bar() }`,

  javascript`if (a) {
    if (b) {
      c()
    }
  }`,
];

const invalids: Array<InvalidTestCase> = [
  {
    code: javascript`if (foo) bar()`,
    output: javascript`if (foo) {
  bar()
}`,
    errors: [{ messageId: 'missingCurly' }],
  },

  {
    code: javascript`if (foo)
  bar()`,
    output: javascript`if (foo)
  {
    bar()
  }`,
    errors: [{ messageId: 'missingCurly' }],
  },

  {
    code: javascript`if (foo) {
  bar()
} else baz()`,
    output: javascript`if (foo) {
  bar()
} else {
  baz()
}`,
    errors: [{ messageId: 'missingCurly' }],
  },

  {
    code: javascript`if (foo) bar()
else baz()`,
    output: javascript`if (foo) {
  bar()
}
else {
  baz()
}`,
    errors: [{ messageId: 'missingCurly' }, { messageId: 'missingCurly' }],
  },

  {
    code: javascript`if (a) if (b) c()`,
    output: javascript`if (a) {
  if (b) {
    c()
  }
}`,
    errors: [{ messageId: 'missingCurly' }, { messageId: 'missingCurly' }],
  },
];

await run({
  parser,
  name: RULE_NAME,
  rule: ifCurly,
  valid: valids,
  invalid: invalids,
});
