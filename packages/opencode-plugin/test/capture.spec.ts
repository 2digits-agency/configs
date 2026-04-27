import { describe, expect, it } from 'vite-plus/test';

import { buildGenerationProperties, buildToolSpanProperties, buildTraceProperties } from '../src/capture.js';
import type { Config, GenerationState, PendingMessage, TraceState } from '../src/types.js';

const config: Config = {
  apiKey: 'key',
  host: 'https://eu.i.posthog.com',
  enabled: true,
  privacyMode: false,
  traceGrouping: 'message',
  sessionWindowMinutes: 60,
  maxAttributeLength: 1000,
  projectName: 'project',
  customProperties: { env: 'test' },
};

const traceState: TraceState = {
  agentName: 'build',
  hasError: false,
  inputState: 'hello',
  lastActivityAt: 20,
  outputState: 'done',
  sessionID: 'session-1',
  startedAt: 10,
  totalCostUsd: 2,
  totalInputTokens: 10,
  totalOutputTokens: 20,
  traceID: 'trace-1',
  traceName: 'trace name',
};

describe('property builders', () => {
  it('builds trace properties', () => {
    expect(buildTraceProperties(config, traceState, 12)).toMatchObject({
      $ai_trace_id: 'trace-1',
      $ai_session_id: 'session-1',
      $ai_latency: 12,
      $ai_input_state: 'hello',
      $ai_output_state: 'done',
      $ai_total_cost_usd: 2,
      $ai_agent_name: 'build',
      env: 'test',
    });
  });

  it('builds generation properties with tools and prompt/output', () => {
    const pending: PendingMessage = {
      agentName: 'build',
      prompt: 'hello',
      sessionID: 'session-1',
      traceID: 'trace-1',
      spanID: 'span-1',
      startedAt: 10,
      userMessageID: 'user-1',
    };
    const generation: GenerationState = {
      assistantMessageID: 'assistant-1',
      pendingKey: 'session-1:user-1',
      sessionID: 'session-1',
      spanID: 'span-1',
      traceID: 'trace-1',
    };

    expect(
      buildGenerationProperties({
        config,
        pending,
        generation,
        traceState,
        info: {
          id: 'assistant-1',
          role: 'assistant',
          parentID: 'user-1',
          sessionID: 'session-1',
          modelID: 'gpt-5.4',
          providerID: 'openai',
          mode: 'build',
          finish: 'tool-calls',
          cost: 1.2,
          time: { created: 10, completed: 25 },
          tokens: {
            input: 10,
            output: 20,
            reasoning: 5,
            cache: { read: 2, write: 3 },
          },
        },
        errorMessage: undefined,
        output: 'done',
        toolsCalled: ['bash'],
        toolCallCount: 1,
      }),
    ).toMatchObject({
      $ai_trace_id: 'trace-1',
      $ai_span_id: 'span-1',
      $ai_model: 'gpt-5.4',
      $ai_stop_reason: 'tool_calls',
      $ai_tools_called: ['bash'],
      $ai_tool_call_count: 1,
      $ai_input: [{ role: 'user', content: 'hello' }],
      $ai_output_choices: [{ role: 'assistant', content: 'done' }],
    });
  });

  it('builds tool span properties and redacts input/output state', () => {
    const properties = buildToolSpanProperties({
      config,
      toolCall: {
        args: { token: 'secret', keep: 'ok' },
        parentSpanID: 'parent-1',
        sessionID: 'session-1',
        startedAt: 10,
        traceID: 'trace-1',
      },
      traceState,
      toolName: 'bash',
      output: { password: 'secret', result: 'ok' },
      latency: 1.5,
    });

    expect(properties).toMatchObject({
      $ai_trace_id: 'trace-1',
      $ai_parent_id: 'parent-1',
      $ai_span_name: 'bash',
      $ai_latency: 1.5,
    });

    expect(properties.$ai_input_state).toBe('{"token":"[REDACTED]","keep":"ok"}');
    expect(properties.$ai_output_state).toBe('{"password":"[REDACTED]","result":"ok"}');
  });
});
