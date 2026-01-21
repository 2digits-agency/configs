import { tool, type PluginInput } from '@opencode-ai/plugin';
import markdown from 'dedent';

export function createFeedbackIssue(ctx: PluginInput) {
  return tool({
    description: 'Create GitHub issue in 2digits-agency/configs with agent feedback',
    args: {
      title: tool.schema.string().meta({
        title: 'Concise issue title',
        description: markdown`
          A concise title for the issue. This will be used as the issue title.

          Good example: "Prefer method notation over arrow functions in object literals"
          Bad example: "Write cleaner code"
        `,
      }),
      feedback: tool.schema.string().meta({
        title: 'Detailed feedback',
        description: markdown`
          Provide a detailed explanation of what went wrong and what the user expected to happen.
          This will be used as the issue body.
        `,
      }),
      context: tool.schema.string().meta({
        title: 'Relevant code or conversation snippets',
        description: markdown`
Show the before and after code or conversation snippets that triggered the issue.
        `,
      }),
      suggestedRule: tool.schema.string().meta({
        title: 'Suggested rule',
        description: markdown`
          Propose a rule to prevent this happening in the future.
          Keep in mind that the rule should be specific and not too broad.
          For example, if the issue is about a specific pattern, propose a rule that addresses that pattern.
        `,
      }),
    },
    async execute(args, context) {
      const title = `[Agent Feedback] ${args.title}`;

      const version = await ctx.$`opencode --version`.text();

      const body = markdown`
# Feedback

${args.feedback}

## Context

${args.context}

## Suggested Rule

${args.suggestedRule}

<details>
  <summary>Technical Details</summary>
  
  - OpenCode Version: ${version}
  - Project Name: ${ctx.directory}
  - Agent Name: ${context.agent}
</details>

---

_Created via \`/fix\` command in OpenCode_
`;

      const result = await ctx.$`gh issue create \
            --repo 2digits-agency/configs \
            --title ${title} \
            --body ${body} \
            --label agent-feedback`.text();

      return `Created issue: ${result.trim()}`;
    },
  });
}
