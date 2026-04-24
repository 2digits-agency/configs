/* eslint-disable sonar/no-duplicate-string */
import { describe, expect, it } from 'vite-plus/test';

import { createSessionState } from '../src/state.js';
import type { Config } from '../src/types.js';

const config: Config = {
  apiKey: 'key',
  host: 'https://eu.i.posthog.com',
  enabled: true,
  privacyMode: false,
  traceGrouping: 'message',
  sessionWindowMinutes: 60,
  maxAttributeLength: 1000,
  projectName: 'project',
  customProperties: {},
};

describe(createSessionState, () => {
  it('creates prompt, generation, and tool state for a session', () => {
    const state = createSessionState(config);

    state.beginPrompt(
      { sessionID: 'session-1', agent: 'agent-1' },
      {
        message: { id: 'user-1' },
        parts: [{ type: 'text', text: 'hello world' }],
      },
    );

    const trace = state.getTraceState('session-1');
    const pending = state.getActiveMessage('session-1');

    expect(trace?.agentName).toBe('agent-1');
    expect(trace?.traceName).toBe('hello world');
    expect(pending?.prompt).toBe('hello world');

    const generation = state.getOrCreateGenerationState({
      id: 'assistant-1',
      parentID: 'user-1',
      sessionID: 'session-1',
    });

    expect(generation).toBeDefined();

    if (!generation) {
      throw new Error('expected generation state');
    }

    expect(generation.generation.assistantMessageID).toBe('assistant-1');

    state.recordGenerationToolCall(generation.generation.spanID, 'bash');
    state.recordGenerationToolCall(generation.generation.spanID, 'read');

    expect(state.getGenerationToolProperties(generation.generation.spanID)).toEqual({
      toolsCalled: ['bash', 'read'],
      toolCallCount: 2,
    });

    state.setToolCall('session-1', 'call-1', {
      args: { cmd: 'ls' },
      parentSpanID: generation.generation.spanID,
      sessionID: 'session-1',
      startedAt: 1,
      traceID: generation.generation.traceID,
    });

    expect(state.takeToolCall('session-1', 'call-1')?.parentSpanID).toBe(generation.generation.spanID);
  });

  it('accumulates assistant message totals and clears per-session state', () => {
    const state = createSessionState(config);

    state.beginPrompt(
      { sessionID: 'session-1', agent: 'agent-1' },
      {
        message: { id: 'user-1' },
        parts: [{ type: 'text', text: 'hello world' }],
      },
    );

    const resolved = state.getOrCreateGenerationState({
      id: 'assistant-1',
      parentID: 'user-1',
      sessionID: 'session-1',
    });

    expect(resolved).toBeDefined();

    if (!resolved) {
      throw new Error('expected resolved generation state');
    }

    state.storeAssistantOutput({ id: 'part-1', messageID: 'assistant-1', text: 'response' });

    const errorMessage = state.updateTraceStateFromAssistantMessage(resolved.traceState, resolved.pending, {
      mode: 'build',
      time: { completed: 100 },
      cost: 1.5,
      tokens: { input: 10, output: 15 },
    });

    expect(errorMessage).toBeUndefined();
    expect(state.getAssistantOutputForMessage('assistant-1')).toBe('response');
    expect(resolved.traceState.totalInputTokens).toBe(10);
    expect(resolved.traceState.totalOutputTokens).toBe(15);
    expect(resolved.traceState.totalCostUsd).toBe(1.5);

    state.clearSessionState('session-1');

    expect(state.getTraceState('session-1')).toBeUndefined();
    expect(state.getActiveMessage('session-1')).toBeUndefined();
    expect(state.getTraceSessionIDs()).toEqual([]);
  });
});
