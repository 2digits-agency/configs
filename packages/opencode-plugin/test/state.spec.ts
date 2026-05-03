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

type SessionState = ReturnType<typeof createSessionState>;

function beginPromptForSession(state: SessionState): void {
  state.beginPrompt(
    { sessionID: 'session-1', agent: 'agent-1' },
    {
      message: { id: 'user-1' },
      parts: [{ type: 'text', text: 'hello world' }],
    },
  );
}

function createGenerationForSession(state: SessionState) {
  const generation = state.getOrCreateGenerationState({
    id: 'assistant-1',
    parentID: 'user-1',
    sessionID: 'session-1',
  });

  if (!generation) {
    throw new Error('expected generation state');
  }

  return generation;
}

describe(createSessionState, () => {
  it('creates prompt state for a session', () => {
    const state = createSessionState(config);

    beginPromptForSession(state);

    const trace = state.getTraceState('session-1');
    const pending = state.getActiveMessage('session-1');

    expect(trace?.agentName).toBe('agent-1');
    expect(trace?.traceName).toBe('hello world');
    expect(pending?.prompt).toBe('hello world');
  });

  it('creates generation state for a session', () => {
    const state = createSessionState(config);

    beginPromptForSession(state);

    const generation = createGenerationForSession(state);

    expect(generation.generation.assistantMessageID).toBe('assistant-1');
  });

  it('records generation tool calls', () => {
    const state = createSessionState(config);

    beginPromptForSession(state);

    const generation = createGenerationForSession(state);

    state.recordGenerationToolCall(generation.generation.spanID, 'bash');
    state.recordGenerationToolCall(generation.generation.spanID, 'read');

    expect(state.getGenerationToolProperties(generation.generation.spanID)).toEqual({
      toolsCalled: ['bash', 'read'],
      toolCallCount: 2,
    });
  });

  it('stores tool calls until they are taken', () => {
    const state = createSessionState(config);

    beginPromptForSession(state);

    const generation = createGenerationForSession(state);

    state.setToolCall('session-1', 'call-1', {
      args: { cmd: 'ls' },
      parentSpanID: generation.generation.spanID,
      sessionID: 'session-1',
      startedAt: 1,
      traceID: generation.generation.traceID,
    });

    expect(state.takeToolCall('session-1', 'call-1')?.parentSpanID).toBe(generation.generation.spanID);
  });

  it('accumulates assistant message totals', () => {
    const state = createSessionState(config);

    beginPromptForSession(state);

    const resolved = createGenerationForSession(state);

    state.storeAssistantOutput({ id: 'part-1', messageID: 'assistant-1', text: 'response' });

    const errorMessage = state.updateTraceStateFromAssistantMessage(resolved.traceState, resolved.pending, {
      mode: 'build',
      time: { completed: 100 },
      cost: 1.5,
      tokens: { input: 10, output: 15 },
    });

    expect(errorMessage).toBeUndefined();
    expect(state.getAssistantOutputForMessage('assistant-1')).toBe('response');
    expect(resolved.traceState).toMatchObject({
      totalCostUsd: 1.5,
      totalInputTokens: 10,
      totalOutputTokens: 15,
    });
  });

  it('clears per-session state', () => {
    const state = createSessionState(config);

    beginPromptForSession(state);

    createGenerationForSession(state);

    state.clearSessionState('session-1');

    expect(state.getTraceState('session-1')).toBeUndefined();
    expect(state.getActiveMessage('session-1')).toBeUndefined();
    expect(state.getTraceSessionIDs()).toEqual([]);
  });
});
