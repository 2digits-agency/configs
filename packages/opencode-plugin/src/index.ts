import type { Hooks, PluginInput } from '@opencode-ai/plugin';
import markdown from 'dedent';

import { loadRules } from './rules' with { type: 'macro' };
import { createFeedbackIssue } from './tools/createFeedbackIssue';

const FIX_COMMAND_TEMPLATE = markdown`
Submit feedback about something the agent did wrong or could improve.

## Instructions

1. Ask clarifying questions to understand:
   - What specifically went wrong?
   - What should have happened instead?
   - Is this a recurring pattern or one-off?

2. Use the \`create_feedback_issue\` tool with:
   - **title**: Concise description of the issue
   - **feedback**: Detailed explanation of what went wrong
   - **context**: Relevant code/conversation snippets (optional)
   - **suggestedRule**: If obvious, propose a rule to prevent this (optional)

3. Return the issue URL so user can track/discuss

## User Input

<Feedback>
  $ARGUMENTS
</Feedback>
`;

// eslint-disable-next-line ts/require-await
export default async function plugin(ctx: PluginInput): Promise<Hooks> {
  return {
    // eslint-disable-next-line ts/require-await
    config: async (config) => {
      config.command = config.command ?? {};
      config.command.fix = {
        description: 'Submit feedback about agent behavior to improve shared rules',
        template: FIX_COMMAND_TEMPLATE,
      };
    },

    // eslint-disable-next-line ts/require-await
    'experimental.chat.system.transform': async (_input, output) => {
      const rules = loadRules();

      output.system.push(markdown`
Instructions from: @2digits/opencode-plugin

${rules}
`);
    },

    tool: {
      create_feedback_issue: createFeedbackIssue(ctx),
    },
  };
}
