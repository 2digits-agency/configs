import { PostHog, type EventMessage } from 'posthog-node';

import { FRAMEWORK, LIB_NAME } from './constants.js';
import type {
  CompletedAssistantMessageInfo,
  Config,
  GenerationState,
  PendingMessage,
  ToolCallState,
  TraceState,
} from './types.js';
import {
  buildInputMessages,
  buildOutputChoices,
  getDistinctId,
  mapStopReason,
  serializeAttribute,
} from './utilities.js';

const shutdownEvents = ['beforeExit', 'SIGINT', 'SIGTERM'] as const;

function stateAttribute(config: Config, value: unknown): string | undefined {
  return config.privacyMode ? undefined : serializeAttribute(value, config.maxAttributeLength);
}

function sharedProperties(config: Config, agentName: string): Record<string, unknown> {
  return {
    $ai_lib: LIB_NAME,
    $ai_framework: FRAMEWORK,
    $ai_project_name: config.projectName,
    $ai_agent_name: agentName,
    ...config.customProperties,
  };
}

export function buildTraceProperties(config: Config, traceState: TraceState, latency: number): Record<string, unknown> {
  return {
    $ai_trace_id: traceState.traceID,
    $ai_session_id: traceState.sessionID,
    $ai_latency: latency,
    $ai_input_state: stateAttribute(config, traceState.inputState),
    $ai_output_state: stateAttribute(config, traceState.outputState),
    $ai_total_input_tokens: traceState.totalInputTokens,
    $ai_total_output_tokens: traceState.totalOutputTokens,
    $ai_total_cost_usd: traceState.totalCostUsd,
    $ai_is_error: traceState.hasError,
    $ai_error: traceState.errorMessage,
    $ai_span_name: traceState.traceName,
    ...sharedProperties(config, traceState.agentName),
  };
}

export function buildGenerationProperties(input: {
  config: Config;
  pending: PendingMessage;
  generation: GenerationState;
  traceState: TraceState;
  info: CompletedAssistantMessageInfo;
  errorMessage: string | undefined;
  output: string | undefined;
  toolsCalled?: Array<string>;
  toolCallCount?: number;
}): Record<string, unknown> {
  const { config, errorMessage, generation, info, output, pending, toolCallCount, toolsCalled, traceState } = input;

  const generationLatency = Math.max(0, info.time.completed - info.time.created) / 1000;

  const isError = Boolean(info.error);

  return {
    $ai_trace_id: generation.traceID,
    $ai_session_id: info.sessionID,
    $ai_span_id: generation.spanID,
    $ai_model: info.modelID,
    $ai_provider: info.providerID,
    $ai_input: buildInputMessages(pending.prompt, config.privacyMode),
    $ai_output_choices: buildOutputChoices(output, errorMessage, config.privacyMode),
    $ai_user_prompt: config.privacyMode ? undefined : pending.prompt,
    $ai_input_tokens: info.tokens.input,
    $ai_output_tokens: info.tokens.output,
    $ai_total_tokens:
      info.tokens.input + info.tokens.output + info.tokens.reasoning + info.tokens.cache.read + info.tokens.cache.write,
    $ai_latency: generationLatency,
    $ai_total_cost_usd: info.cost,
    $ai_stop_reason: mapStopReason(info.finish, isError),
    $ai_is_error: isError,
    $ai_error: errorMessage,
    $ai_tools_called: toolsCalled,
    $ai_tool_call_count: toolCallCount,
    cache_read_input_tokens: info.tokens.cache.read,
    cache_creation_input_tokens: info.tokens.cache.write,
    ...sharedProperties(config, traceState.agentName),
  };
}

export function buildToolSpanProperties(input: {
  config: Config;
  toolCall: ToolCallState;
  traceState: TraceState | undefined;
  toolName: string;
  output: unknown;
  latency: number;
}): Record<string, unknown> {
  const { config, latency, output, toolCall, toolName, traceState } = input;

  return {
    $ai_trace_id: toolCall.traceID,
    $ai_session_id: toolCall.sessionID,
    $ai_span_id: crypto.randomUUID(),
    $ai_parent_id: toolCall.parentSpanID,
    $ai_span_name: toolName,
    $ai_input_state: stateAttribute(config, toolCall.args),
    $ai_output_state: stateAttribute(config, output),
    $ai_latency: latency,
    $ai_is_error: false,
    $ai_error: undefined,
    ...sharedProperties(config, traceState?.agentName ?? config.projectName),
  };
}

export function createCaptureManager(config: Config) {
  let client: PostHog | undefined;

  let shutdownRegistered = false;

  function ensureClient(): PostHog | undefined {
    if (client) {
      return client;
    }

    try {
      client = new PostHog(config.apiKey, {
        host: config.host,
        flushAt: 20,
        flushInterval: 10_000,
      });

      return client;
    } catch (error) {
      console.error(`${LIB_NAME}: failed to initialize PostHog client`, error);

      return undefined;
    }
  }

  function eventMessage(event: string, sessionID: string, properties: Record<string, unknown>): EventMessage {
    return { distinctId: getDistinctId(config, sessionID), event, properties };
  }

  function capture(event: string, sessionID: string, properties: Record<string, unknown>) {
    ensureClient()?.capture(eventMessage(event, sessionID, properties));
  }

  async function captureImmediate(
    event: string,
    sessionID: string,
    properties: Record<string, unknown>,
  ): Promise<void> {
    await ensureClient()?.captureImmediate(eventMessage(event, sessionID, properties));
  }

  async function shutdown(): Promise<void> {
    if (!client) {
      return;
    }

    await client.shutdown();

    client = undefined;
  }

  function registerShutdown(onShutdown: () => Promise<void>): void {
    if (shutdownRegistered) {
      return;
    }

    shutdownRegistered = true;

    for (const event of shutdownEvents) {
      process.once(event, () => {
        void onShutdown();
      });
    }
  }

  return {
    capture,
    captureImmediate,
    registerShutdown,
    shutdown,
  };
}
