import { tool, type Hooks, type Plugin, type PluginInput } from '@opencode-ai/plugin';

import { loadRules } from './rules';

interface FeedbackArgs {
  title: string;
  feedback: string;
  context?: string;
  suggestedRule?: string;
}

function formatIssueBody(args: FeedbackArgs): string {
  const sections = [
    '## Feedback',
    '',
    args.feedback,
    args.context ? `\n## Context\n\n\`\`\`\n${args.context}\n\`\`\`` : '',
    args.suggestedRule ? `\n## Suggested Rule\n\n${args.suggestedRule}` : '',
    '\n---\n\n_Created via `/fix` command in OpenCode_',
  ];
  return sections.filter(Boolean).join('\n');
}

const FIX_COMMAND_TEMPLATE = `Submit feedback about something the agent did wrong or could improve.

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
</Feedback>`;
function getProjectLabel(ctx: PluginInput): string {
  const project = ctx.project as { name?: string };
  if (project.name) return project.name;
  return ctx.directory.split('/').filter(Boolean).pop() ?? 'unknown-project';
}

const plugin: Plugin = async (ctx: PluginInput): Promise<Hooks> => {
  const projectLabel = getProjectLabel(ctx);

  return {
    config: async (config) => {
      config.command = config.command ?? {};
      config.command.fix = {
        description: 'Submit feedback about agent behavior to improve shared rules',
        template: FIX_COMMAND_TEMPLATE,
        subtask: true,
      };
    },

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
          const labels = `agent-feedback,project:${projectLabel}`;

          const result = await ctx.$`gh issue create \
            --repo 2digits-agency/configs \
            --title ${title} \
            --body ${body} \
            --label ${labels}`.text();

          return `Created issue: ${result.trim()}`;
        },
      }),
    },
  };
};

export default plugin;
