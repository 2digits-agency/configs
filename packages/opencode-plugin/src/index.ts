import { tool, type Hooks, type PluginInput } from '@opencode-ai/plugin';
import markdown from 'dedent';

import { loadRules } from './rules' with { type: 'macro' };

interface FeedbackArgs {
  title: string;
  feedback: string;
  context?: string;
  suggestedRule?: string;
}

function formatIssueBody(args: FeedbackArgs): string {
  const sections = [
    markdown`
      ## Feedback

      ${args.feedback}
    `,
    args.context
      ? markdown`
          ## Context

          \`\`\`
          ${args.context}
          \`\`\`
        `
      : '',
    args.suggestedRule
      ? markdown`
          ## Suggested Rule

          ${args.suggestedRule}
        `
      : '',
    markdown`
      ---

      _Created via \`/fix\` command in OpenCode_
    `,
  ];

  return sections.filter(Boolean).join('\n\n');
}

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

      output.system.push(`Instructions from: @2digits/opencode-plugin\n${rules}`);
    },

    tool: {
      create_feedback_issue: tool({
        description: 'Create GitHub issue in 2digits-agency/configs with agent feedback',
        args: {
          title: tool.schema.string().describe('Concise issue title'),
          feedback: tool.schema.string().describe('Detailed feedback about what went wrong'),
          context: tool.schema.string().optional().describe('Relevant conversation context'),
          suggestedRule: tool.schema.string().optional().describe('Proposed rule to add'),
        },
        async execute(args) {
          const body = formatIssueBody(args);
          const title = `[Agent Feedback] ${args.title}`;

          const result = await ctx.$`gh issue create \
            --repo 2digits-agency/configs \
            --title ${title} \
            --body ${body} \
            --label agent-feedback`.text();

          return `Created issue: ${result.trim()}`;
        },
      }),
    },
  };
}
