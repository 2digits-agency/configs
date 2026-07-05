import type { Hooks, Plugin } from '@opencode-ai/plugin';

import {
  buildGenerationProperties,
  buildToolSpanProperties,
  buildTraceProperties,
  createCaptureManager,
} from './capture.js';
import { buildConfig } from './config.js';
import { LIB_NAME } from './constants.js';
import { createSessionState } from './state.js';
import type { CompletedAssistantMessageInfo } from './types.js';

const plugin: Plugin = async (ctx) => {
  const config = await buildConfig(ctx);

  if (!config.enabled) {
    return {};
  }

  if (!config.apiKey) {
    console.warn(`${LIB_NAME}: missing POSTHOG_API_KEY, analytics disabled`);

    return {};
  }

  const state = createSessionState(config);
  const capture = createCaptureManager(config);

  async function captureTrace(traceState: NonNullable<ReturnType<typeof state.getTraceState>>): Promise<void> {
    if (traceState.lastTraceCapturedAt === traceState.lastActivityAt) {
      return;
    }

    const latency = Math.max(0, traceState.lastActivityAt - traceState.startedAt) / 1000;

    await capture.captureImmediate(
      '$ai_trace',
      traceState.sessionID,
      buildTraceProperties(config, traceState, latency),
    );
    traceState.lastTraceCapturedAt = traceState.lastActivityAt;
  }

  async function flushTrace(sessionID: string) {
    const traceState = state.getTraceState(sessionID);

    if (!traceState) {
      return;
    }

    await captureTrace(traceState);
    state.clearSessionState(sessionID);
  }

  async function shutdown(): Promise<void> {
    await Promise.all(state.getTraceSessionIDs().map((sessionID) => flushTrace(sessionID)));

    await capture.shutdown();
  }

  capture.registerShutdown(shutdown);

  async function completeAssistantMessage(info: CompletedAssistantMessageInfo) {
    const resolved = state.getOrCreateGenerationState(info);

    if (!resolved) {
      return;
    }

    const { generation, pending, traceState } = resolved;
    const output = state.getAssistantOutputForMessage(info.id);
    const errorMessage = state.updateTraceStateFromAssistantMessage(traceState, pending, {
      mode: info.mode,
      time: { completed: info.time.completed },
      cost: info.cost,
      tokens: {
        input: info.tokens.input,
        output: info.tokens.output,
      },
      output,
      error: info.error,
    });
    const { toolsCalled, toolCallCount } = state.getGenerationToolProperties(generation.spanID);

    capture.capture(
      '$ai_generation',
      info.sessionID,
      buildGenerationProperties({
        config,
        pending,
        generation,
        traceState,
        info,
        errorMessage,
        output,
        toolsCalled,
        toolCallCount,
      }),
    );
    await captureTrace(traceState);

    state.cleanupAssistantMessage(info.id, generation.spanID);
  }

  async function onEvent(event: Parameters<NonNullable<Hooks['event']>>[0]['event']) {
    if (event.type === 'message.part.updated') {
      const { properties } = event;
      const { part } = properties;

      if (part.type === 'text') {
        state.storeAssistantOutput(part);
      }

      return;
    }

    if (event.type === 'session.deleted') {
      const { properties } = event;
      const { info } = properties;

      await flushTrace(info.id);

      return;
    }

    if (event.type === 'session.error') {
      const { properties } = event;
      const { error, sessionID } = properties;

      if (sessionID) {
        state.markSessionError(sessionID, error);
      }

      return;
    }

    if (event.type !== 'message.updated') {
      return;
    }

    const { properties } = event;
    const { info } = properties;

    if (info.role !== 'assistant') {
      return;
    }

    state.getOrCreateGenerationState(info);

    if (state.shouldCompleteAssistantMessage(info)) {
      state.markAssistantMessageCompleted(info.id);
      await completeAssistantMessage(info);
    }
  }

  return {
    'chat.message': async (input, output) => {
      const startedAt = Date.now();
      const existingTrace = state.getTraceState(input.sessionID);
      const sessionWindowMs = config.sessionWindowMinutes * 60_000;

      if (existingTrace && config.traceGrouping === 'message') {
        await flushTrace(input.sessionID);
      }

      if (
        existingTrace &&
        config.traceGrouping === 'session' &&
        startedAt - existingTrace.lastActivityAt >= sessionWindowMs
      ) {
        await flushTrace(input.sessionID);
      }

      state.beginPrompt(input, output);
    },

    'tool.execute.before': (input, output) => {
      const pending = state.getActiveMessage(input.sessionID);

      if (!pending) {
        return Promise.resolve();
      }

      state.setToolCall(input.sessionID, input.callID, {
        args: output.args,
        parentSpanID: pending.spanID,
        sessionID: input.sessionID,
        startedAt: Date.now(),
        traceID: pending.traceID,
      });
      state.recordGenerationToolCall(pending.spanID, input.tool);

      return Promise.resolve();
    },

    'tool.execute.after': (input, output) => {
      const toolCall = state.takeToolCall(input.sessionID, input.callID);

      if (!toolCall) {
        return Promise.resolve();
      }

      const traceState = state.getTraceState(toolCall.sessionID);

      if (traceState) {
        traceState.lastActivityAt = Date.now();
      }

      capture.capture(
        '$ai_span',
        toolCall.sessionID,
        buildToolSpanProperties({
          config,
          toolCall,
          traceState,
          toolName: input.tool,
          output,
          latency: Math.max(0, Date.now() - toolCall.startedAt) / 1000,
        }),
      );

      return Promise.resolve();
    },

    event: async ({ event }) => onEvent(event),
  } satisfies Hooks;
};

export default plugin;
