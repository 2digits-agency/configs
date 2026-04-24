import { PostHog } from 'posthog-node';

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

export function buildTraceProperties(config: Config, traceState: TraceState, latency: number): Record<string, unknown> {
  return {
    $ai_trace_id: traceState.traceID,
    $ai_session_id: traceState.sessionID,
    $ai_latency: latency,
    $ai_total_input_tokens: traceState.totalInputTokens,
    $ai_total_output_tokens: traceState.totalOutputTokens,
    $ai_is_error: traceState.hasError,
    $ai_error: traceState.errorMessage,
    $ai_span_name: traceState.traceName,
    $ai_lib: LIB_NAME,
    $ai_framework: FRAMEWORK,
    $ai_project_name: config.projectName,
    $ai_agent_name: traceState.agentName,
    ...config.customProperties,
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
    $ai_stop_reason: mapStopReason(info.finish, Boolean(info.error)),
    $ai_is_error: Boolean(info.error),
    $ai_error: errorMessage,
    $ai_tools_called: toolsCalled,
    $ai_tool_call_count: toolCallCount,
    cache_read_input_tokens: info.tokens.cache.read,
    cache_creation_input_tokens: info.tokens.cache.write,
    $ai_lib: LIB_NAME,
    $ai_framework: FRAMEWORK,
    $ai_project_name: config.projectName,
    $ai_agent_name: traceState.agentName,
    ...config.customProperties,
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
    $ai_input_state: config.privacyMode ? undefined : serializeAttribute(toolCall.args, config.maxAttributeLength),
    $ai_output_state: config.privacyMode ? undefined : serializeAttribute(output, config.maxAttributeLength),
    $ai_latency: latency,
    $ai_is_error: false,
    $ai_error: undefined,
    $ai_lib: LIB_NAME,
    $ai_framework: FRAMEWORK,
    $ai_project_name: config.projectName,
    $ai_agent_name: traceState?.agentName ?? config.projectName,
    ...config.customProperties,
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

  function capture(event: string, sessionID: string, properties: Record<string, unknown>) {
    const posthog = ensureClient();

    if (!posthog) {
      return;
    }

    posthog.capture({
      distinctId: getDistinctId(config, sessionID),
      event,
      properties,
    });
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

    process.once('beforeExit', () => {
      void onShutdown();
    });
    process.once('SIGINT', () => {
      void onShutdown();
    });
    process.once('SIGTERM', () => {
      void onShutdown();
    });
  }

  return {
    capture,
    registerShutdown,
    shutdown,
  };
}
