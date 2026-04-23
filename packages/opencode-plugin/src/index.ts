import { randomUUID } from 'node:crypto';
import { basename } from 'node:path';

import type { Hooks, Plugin } from '@opencode-ai/plugin';

const DEFAULT_HOST = 'https://eu.i.posthog.com';
const DEFAULT_MAX_ATTRIBUTE_LENGTH = 12_000;
const DEFAULT_SESSION_WINDOW_MINUTES = 60;
const LIB_NAME = '@2digits/opencode-plugin';
const FRAMEWORK = 'opencode';
const SENSITIVE_KEY_PATTERN =
  /(api[-_]?key|token|secret|password|authorization|cookie|session|bearer|x-api-key|credential)/i;

type TraceGrouping = 'message' | 'session';

type Config = {
  apiKey: string;
  host: string;
  enabled: boolean;
  privacyMode: boolean;
  traceGrouping: TraceGrouping;
  sessionWindowMinutes: number;
  maxAttributeLength: number;
  distinctId: string;
  projectName: string;
  customProperties: Record<string, unknown>;
};

type PendingMessage = {
  agentName: string;
  prompt: string | null;
  sessionID: string;
  traceID: string;
  spanID: string;
  startedAt: number;
  userMessageID: string;
};

type TraceState = {
  agentName: string;
  errorMessage: string | null;
  hasError: boolean;
  lastActivityAt: number;
  sessionID: string;
  startedAt: number;
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  traceID: string;
};

type ToolCallState = {
  args: unknown;
  parentSpanID: string | null;
  sessionID: string;
  startedAt: number;
  traceID: string;
};

type AssistantOutputState = {
  order: Array<string>;
  parts: Map<string, string>;
};

type PostHogClient = {
  capture(input: { distinctId: string; event: string; properties: Record<string, unknown> }): void;
  shutdown(): Promise<void>;
};

function now(): number {
  return Date.now();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeStringify(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function truncate(value: string, maxLength: number): string {
  if (maxLength <= 0) return '';
  if (value.length <= maxLength) return value;

  const omitted = value.length - maxLength;
  return `${value.slice(0, maxLength)}...[truncated ${omitted} chars]`;
}

function redactSensitive(value: unknown, seen: WeakSet<object>, depth: number): unknown {
  if (depth > 8) return '[DepthLimit]';
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item, seen, depth + 1));
  }

  const output: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    output[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : redactSensitive(nested, seen, depth + 1);
  }

  return output;
}

function serializeAttribute(value: unknown, maxLength: number): string | null {
  if (value === undefined || value === null) return null;

  const redacted = redactSensitive(value, new WeakSet<object>(), 0);
  if (typeof redacted === 'string') return truncate(redacted, maxLength);

  const json = safeStringify(redacted);
  return json ? truncate(json, maxLength) : null;
}

function parseTraceGrouping(value: string | undefined): TraceGrouping {
  return value === 'session' ? 'session' : 'message';
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseCustomProperties(value: string | undefined): Record<string, unknown> {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? parsed : {};
  } catch {
    console.warn(`${LIB_NAME}: ignoring invalid POSTHOG_LLMA_CUSTOM_PROPERTIES JSON`);
    return {};
  }
}

function getProjectName(directory: string): string {
  const value = basename(directory);
  return value.length > 0 ? value : 'opencode-project';
}

function getDistinctId(config: Config): string {
  return config.distinctId.length > 0 ? config.distinctId : config.projectName;
}

function getPendingKey(sessionID: string, messageID: string): string {
  return `${sessionID}:${messageID}`;
}

function getToolKey(sessionID: string, callID: string): string {
  return `${sessionID}:${callID}`;
}

function mapStopReason(finish: string | undefined, hasError: boolean): string | null {
  if (hasError) return 'error';
  if (!finish) return null;
  if (finish === 'tool-calls') return 'tool_calls';
  return finish;
}

function getErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (isRecord(error)) {
    if (typeof error.message === 'string') return error.message;
    if (isRecord(error.data) && typeof error.data.message === 'string') return error.data.message;
    if (typeof error.name === 'string') return error.name;
  }

  return safeStringify(error) ?? null;
}

function getPrompt(parts: Array<{ type: string; text?: string; synthetic?: boolean }>): string | null {
  const prompt = parts
    .filter((part) => part.type === 'text' && !part.synthetic && typeof part.text === 'string')
    .map((part) => part.text ?? '')
    .join('\n')
    .trim();

  return prompt.length > 0 ? prompt : null;
}

function getAssistantOutput(state: AssistantOutputState | undefined): string | null {
  if (!state) return null;

  const output = state.order
    .map((partID) => state.parts.get(partID) ?? '')
    .join('\n')
    .trim();

  return output.length > 0 ? output : null;
}

function buildInputMessages(prompt: string | null, privacyMode: boolean): Array<{ role: 'user'; content: string }> | null {
  if (privacyMode || !prompt) return null;
  return [{ role: 'user', content: prompt }];
}

function buildOutputChoices(
  output: string | null,
  errorMessage: string | null,
  privacyMode: boolean,
): Array<{ role: 'assistant'; content: string }> | null {
  if (privacyMode) return null;
  if (output) return [{ role: 'assistant', content: output }];
  if (errorMessage) return [{ role: 'assistant', content: errorMessage }];
  return null;
}

export const plugin: Plugin = async (ctx) => {
  const projectName = getProjectName(ctx.worktree || ctx.directory);
  const config: Config = {
    apiKey: process.env.POSTHOG_API_KEY ?? '',
    host: process.env.POSTHOG_HOST ?? DEFAULT_HOST,
    enabled: process.env.POSTHOG_OPENCODE_ENABLED === 'true',
    privacyMode: process.env.POSTHOG_LLMA_PRIVACY_MODE === 'true',
    traceGrouping: parseTraceGrouping(process.env.POSTHOG_LLMA_TRACE_GROUPING),
    sessionWindowMinutes: parseNumber(process.env.POSTHOG_LLMA_SESSION_WINDOW_MINUTES, DEFAULT_SESSION_WINDOW_MINUTES),
    maxAttributeLength: parseNumber(process.env.POSTHOG_MAX_ATTRIBUTE_LENGTH, DEFAULT_MAX_ATTRIBUTE_LENGTH),
    distinctId: process.env.POSTHOG_LLMA_DISTINCT_ID ?? '',
    projectName,
    customProperties: parseCustomProperties(process.env.POSTHOG_LLMA_CUSTOM_PROPERTIES),
  };

  if (!config.enabled) return {};

  if (!config.apiKey) {
    console.warn(`${LIB_NAME}: missing POSTHOG_API_KEY, analytics disabled`);
    return {};
  }

  const pendingMessages = new Map<string, PendingMessage>();
  const activeMessages = new Map<string, PendingMessage>();
  const traceStates = new Map<string, TraceState>();
  const toolCalls = new Map<string, ToolCallState>();
  const assistantOutputs = new Map<string, AssistantOutputState>();
  const completedAssistantMessages = new Set<string>();

  let client: PostHogClient | null = null;
  let shutdownRegistered = false;

  async function ensureClient(): Promise<PostHogClient | null> {
    if (client) return client;

    try {
      const posthog = await import('posthog-node');
      client = new posthog.PostHog(config.apiKey, {
        host: config.host,
        flushAt: 20,
        flushInterval: 10_000,
      });
      return client;
    } catch (error) {
      console.error(`${LIB_NAME}: failed to initialize PostHog client`, error);
      return null;
    }
  }

  async function capture(event: string, properties: Record<string, unknown>): Promise<void> {
    const posthog = await ensureClient();
    if (!posthog) return;

    posthog.capture({
      distinctId: getDistinctId(config),
      event,
      properties,
    });
  }

  async function flushTrace(sessionID: string, traceState?: TraceState): Promise<void> {
    const state = traceState ?? traceStates.get(sessionID);
    if (!state) return;

    const latency = Math.max(0, state.lastActivityAt - state.startedAt) / 1000;

    await capture('$ai_trace', {
      $ai_trace_id: state.traceID,
      $ai_session_id: state.sessionID,
      $ai_latency: latency,
      $ai_total_input_tokens: state.totalInputTokens,
      $ai_total_output_tokens: state.totalOutputTokens,
      $ai_is_error: state.hasError,
      $ai_error: state.errorMessage,
      $ai_lib: LIB_NAME,
      $ai_framework: FRAMEWORK,
      $ai_project_name: config.projectName,
      $ai_agent_name: state.agentName,
      ...config.customProperties,
    });

    traceStates.delete(sessionID);
  }

  async function shutdown(): Promise<void> {
    const traceEntries = Array.from(traceStates.entries());
    for (const [sessionID, traceState] of traceEntries) {
      await flushTrace(sessionID, traceState);
    }

    if (client) {
      await client.shutdown();
      client = null;
    }
  }

  function registerShutdown(): void {
    if (shutdownRegistered) return;
    shutdownRegistered = true;

    process.once('beforeExit', () => {
      void shutdown();
    });
    process.once('SIGINT', () => {
      void shutdown();
    });
    process.once('SIGTERM', () => {
      void shutdown();
    });
  }

  registerShutdown();

  return {
    'chat.message': async (input, output) => {
      const startedAt = now();
      const existingTrace = traceStates.get(input.sessionID);
      const sessionWindowMs = config.sessionWindowMinutes * 60_000;

      if (existingTrace && config.traceGrouping === 'message') {
        await flushTrace(input.sessionID, existingTrace);
      }

      if (
        existingTrace &&
        config.traceGrouping === 'session' &&
        startedAt - existingTrace.lastActivityAt >= sessionWindowMs
      ) {
        await flushTrace(input.sessionID, existingTrace);
      }

      const traceState = traceStates.get(input.sessionID) ?? {
        agentName: input.agent ?? config.projectName,
        errorMessage: null,
        hasError: false,
        lastActivityAt: startedAt,
        sessionID: input.sessionID,
        startedAt,
        totalCostUsd: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        traceID: randomUUID(),
      };

      traceState.agentName = input.agent ?? traceState.agentName;
      traceState.lastActivityAt = startedAt;
      traceStates.set(input.sessionID, traceState);

      const pending: PendingMessage = {
        agentName: input.agent ?? config.projectName,
        prompt: getPrompt(output.parts),
        sessionID: input.sessionID,
        traceID: traceState.traceID,
        spanID: randomUUID(),
        startedAt,
        userMessageID: output.message.id,
      };

      pendingMessages.set(getPendingKey(input.sessionID, output.message.id), pending);
      activeMessages.set(input.sessionID, pending);
    },

    'tool.execute.before': async (input, output) => {
      const pending = activeMessages.get(input.sessionID);
      if (!pending) return;

      toolCalls.set(getToolKey(input.sessionID, input.callID), {
        args: output.args,
        parentSpanID: pending.spanID,
        sessionID: input.sessionID,
        startedAt: now(),
        traceID: pending.traceID,
      });
    },

    'tool.execute.after': async (input, output) => {
      const toolCall = toolCalls.get(getToolKey(input.sessionID, input.callID));
      if (!toolCall) return;

      toolCalls.delete(getToolKey(input.sessionID, input.callID));

      const traceState = traceStates.get(toolCall.sessionID);
      if (traceState) traceState.lastActivityAt = now();

      await capture('$ai_span', {
        $ai_trace_id: toolCall.traceID,
        $ai_session_id: toolCall.sessionID,
        $ai_span_id: randomUUID(),
        $ai_parent_id: toolCall.parentSpanID,
        $ai_span_name: input.tool,
        $ai_input_state: config.privacyMode ? null : serializeAttribute(toolCall.args, config.maxAttributeLength),
        $ai_output_state: config.privacyMode ? null : serializeAttribute(output, config.maxAttributeLength),
        $ai_latency: Math.max(0, now() - toolCall.startedAt) / 1000,
        $ai_is_error: false,
        $ai_error: null,
        $ai_lib: LIB_NAME,
        $ai_framework: FRAMEWORK,
        $ai_project_name: config.projectName,
        $ai_agent_name: traceState?.agentName ?? config.projectName,
        ...config.customProperties,
      });
    },

    event: async ({ event }) => {
      if (event.type === 'message.part.updated') {
        const { part } = event.properties;
        if (part.type !== 'text') return;

        const state = assistantOutputs.get(part.messageID) ?? { order: [], parts: new Map<string, string>() };
        if (!state.parts.has(part.id)) state.order.push(part.id);
        state.parts.set(part.id, part.text);
        assistantOutputs.set(part.messageID, state);
        return;
      }

      if (event.type === 'session.deleted') {
        await flushTrace(event.properties.info.id);
        return;
      }

      if (event.type === 'session.error') {
        const sessionID = event.properties.sessionID;
        if (!sessionID) return;

        const traceState = traceStates.get(sessionID);
        if (!traceState) return;

        traceState.hasError = true;
        traceState.errorMessage = getErrorMessage(event.properties.error);
        traceState.lastActivityAt = now();
        return;
      }

      if (event.type !== 'message.updated') return;

      const { info } = event.properties;
      if (info.role !== 'assistant' || !info.time.completed || completedAssistantMessages.has(info.id)) return;

      completedAssistantMessages.add(info.id);

      const pendingKey = getPendingKey(info.sessionID, info.parentID);
      const pending = pendingMessages.get(pendingKey) ?? activeMessages.get(info.sessionID);
      const traceState = traceStates.get(info.sessionID);
      if (!pending || !traceState) return;

      traceState.agentName = info.mode || pending.agentName;
      traceState.lastActivityAt = info.time.completed;
      traceState.totalCostUsd += info.cost;
      traceState.totalInputTokens += info.tokens.input;
      traceState.totalOutputTokens += info.tokens.output;

      const errorMessage = getErrorMessage(info.error);
      if (errorMessage) {
        traceState.hasError = true;
        traceState.errorMessage = errorMessage;
      }

      const output = getAssistantOutput(assistantOutputs.get(info.id));
      const generationLatency = Math.max(0, info.time.completed - info.time.created) / 1000;

      await capture('$ai_generation', {
        $ai_trace_id: pending.traceID,
        $ai_session_id: info.sessionID,
        $ai_span_id: pending.spanID,
        $ai_model: info.modelID,
        $ai_provider: info.providerID,
        $ai_input: buildInputMessages(pending.prompt, config.privacyMode),
        $ai_output_choices: buildOutputChoices(output, errorMessage, config.privacyMode),
        $ai_user_prompt: config.privacyMode ? null : pending.prompt,
        $ai_input_tokens: info.tokens.input,
        $ai_output_tokens: info.tokens.output,
        $ai_total_tokens:
          info.tokens.input +
          info.tokens.output +
          info.tokens.reasoning +
          info.tokens.cache.read +
          info.tokens.cache.write,
        $ai_latency: generationLatency,
        $ai_total_cost_usd: info.cost,
        $ai_stop_reason: mapStopReason(info.finish, Boolean(info.error)),
        $ai_is_error: Boolean(info.error),
        $ai_error: errorMessage,
        cache_read_input_tokens: info.tokens.cache.read,
        cache_creation_input_tokens: info.tokens.cache.write,
        $ai_lib: LIB_NAME,
        $ai_framework: FRAMEWORK,
        $ai_project_name: config.projectName,
        $ai_agent_name: traceState.agentName,
        ...config.customProperties,
      });

      pendingMessages.delete(pendingKey);
      activeMessages.delete(info.sessionID);
      assistantOutputs.delete(info.id);

      if (config.traceGrouping === 'message') {
        await flushTrace(info.sessionID, {
          ...traceState,
          lastActivityAt: info.time.completed,
          startedAt: pending.startedAt,
        });
      }
    },
  } satisfies Hooks;
};

export default plugin;
