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
import type { AssistantMessageInfo, TraceState } from './types.js';

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

  const sessionWindowMs = config.sessionWindowMinutes * 60_000;

  async function captureTrace(traceState: TraceState): Promise<void> {
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

  async function onAssistantMessageUpdated(info: AssistantMessageInfo) {
    const resolved = state.getOrCreateGenerationState(info);

    if (!state.shouldCompleteAssistantMessage(info)) {
      return;
    }

    state.markAssistantMessageCompleted(info.id);

    if (!resolved) {
      return;
    }

    const { generation, pending, traceState } = resolved;

    const output = state.getAssistantOutputForMessage(info.id);

    const errorMessage = state.updateTraceStateFromAssistantMessage(traceState, pending, { ...info, output });

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
    switch (event.type) {
      case 'message.part.updated': {
        const { part } = event.properties;

        if (part.type === 'text') {
          state.storeAssistantOutput(part);
        }

        break;
      }

      case 'session.deleted': {
        await flushTrace(event.properties.info.id);

        break;
      }

      case 'session.error': {
        const { error, sessionID } = event.properties;

        if (sessionID) {
          state.markSessionError(sessionID, error);
        }

        break;
      }

      case 'message.updated': {
        const { info } = event.properties;

        if (info.role === 'assistant') {
          await onAssistantMessageUpdated(info);
        }

        break;
      }
    }
  }

  return {
    'chat.message': async (input, output) => {
      const existingTrace = state.getTraceState(input.sessionID);

      if (
        existingTrace &&
        (config.traceGrouping === 'message' || Date.now() - existingTrace.lastActivityAt >= sessionWindowMs)
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

      const now = Date.now();

      const traceState = state.getTraceState(toolCall.sessionID);

      if (traceState) {
        traceState.lastActivityAt = now;
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
          latency: Math.max(0, now - toolCall.startedAt) / 1000,
        }),
      );

      return Promise.resolve();
    },

    event: async ({ event }) => onEvent(event),
  } satisfies Hooks;
};

export default plugin;
