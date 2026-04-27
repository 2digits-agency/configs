import { randomUUID } from 'node:crypto';

import type {
  AssistantMessageInfo,
  AssistantTextPart,
  CompletedAssistantMessageInfo,
  Config,
  GenerationState,
  PendingMessage,
  ToolCallState,
  TraceState,
} from './types.js';
import {
  getAssistantOutput,
  getErrorMessage,
  getPendingKey,
  getPrompt,
  getToolKey,
  getTraceName,
} from './utilities.js';

export function createSessionState(config: Config) {
  const pendingMessages = new Map<string, PendingMessage>();
  const activeMessages = new Map<string, PendingMessage>();
  const traceStates = new Map<string, TraceState>();
  const toolCalls = new Map<string, ToolCallState>();
  const generationTools = new Map<string, Array<string>>();
  const assistantOutputs = new Map<string, { order: Array<string>; parts: Map<string, string> }>();
  const generationStates = new Map<string, GenerationState>();
  const currentGenerationIDs = new Map<string, string>();
  const completedAssistantMessages = new Set<string>();

  function clearSessionState(sessionID: string): void {
    traceStates.delete(sessionID);
    activeMessages.delete(sessionID);
    currentGenerationIDs.delete(sessionID);

    for (const [pendingKey, pending] of pendingMessages.entries()) {
      if (pending.sessionID === sessionID) {
        pendingMessages.delete(pendingKey);
      }
    }

    const generationSpanIDs = new Set<string>();

    for (const [assistantMessageID, generation] of generationStates.entries()) {
      if (generation.sessionID !== sessionID) {
        continue;
      }

      generationSpanIDs.add(generation.spanID);
      generationStates.delete(assistantMessageID);
      assistantOutputs.delete(assistantMessageID);
      completedAssistantMessages.delete(assistantMessageID);
    }

    for (const spanID of generationSpanIDs) {
      generationTools.delete(spanID);
    }

    for (const [toolKey, toolCall] of toolCalls.entries()) {
      if (toolCall.sessionID === sessionID) {
        toolCalls.delete(toolKey);
      }
    }
  }

  function getTraceState(sessionID: string): TraceState | undefined {
    return traceStates.get(sessionID);
  }

  function getTraceSessionIDs(): Array<string> {
    return [...traceStates.keys()];
  }

  function getOrCreateTraceState(sessionID: string, agentName: string | undefined, startedAt: number): TraceState {
    const traceState = traceStates.get(sessionID) ?? {
      agentName: agentName ?? config.projectName,
      errorMessage: undefined,
      hasError: false,
      inputState: undefined,
      lastActivityAt: startedAt,
      lastTraceCapturedAt: undefined,
      outputState: undefined,
      sessionID,
      startedAt,
      totalCostUsd: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      traceID: randomUUID(),
      traceName: undefined,
    };

    traceState.agentName = agentName ?? traceState.agentName;
    traceState.lastActivityAt = startedAt;
    traceStates.set(sessionID, traceState);

    return traceState;
  }

  function beginPrompt(
    input: { sessionID: string; agent?: string },
    output: { message: { id: string }; parts: Array<{ type: string; text?: string; synthetic?: boolean }> },
  ): void {
    const startedAt = Date.now();
    const traceState = getOrCreateTraceState(input.sessionID, input.agent, startedAt);
    const prompt = getPrompt(output.parts);
    const pending: PendingMessage = {
      agentName: input.agent ?? config.projectName,
      prompt,
      sessionID: input.sessionID,
      traceID: traceState.traceID,
      spanID: randomUUID(),
      startedAt,
      userMessageID: output.message.id,
    };

    traceState.inputState ??= prompt;
    traceState.traceName ??= getTraceName(prompt);

    pendingMessages.set(getPendingKey(input.sessionID, output.message.id), pending);
    activeMessages.set(input.sessionID, pending);
    currentGenerationIDs.delete(input.sessionID);
  }

  function storeAssistantOutput(part: AssistantTextPart): void {
    const state = assistantOutputs.get(part.messageID) ?? { order: [], parts: new Map<string, string>() };

    if (!state.parts.has(part.id)) {
      state.order.push(part.id);
    }
    state.parts.set(part.id, part.text);
    assistantOutputs.set(part.messageID, state);
  }

  function getAssistantOutputForMessage(messageID: string): string | undefined {
    return getAssistantOutput(assistantOutputs.get(messageID));
  }

  function markSessionError(sessionID: string, error: unknown): void {
    const traceState = traceStates.get(sessionID);

    if (!traceState) {
      return;
    }

    traceState.hasError = true;
    traceState.errorMessage = getErrorMessage(error);
    traceState.lastActivityAt = Date.now();
  }

  function getPendingAssistantMessage(info: {
    id: string;
    parentID: string;
    sessionID: string;
  }): { pending: PendingMessage; pendingKey: string; traceState: TraceState } | undefined {
    const pendingKey = getPendingKey(info.sessionID, info.parentID);
    const pending = pendingMessages.get(pendingKey) ?? activeMessages.get(info.sessionID);
    const traceState = traceStates.get(info.sessionID);

    if (!pending || !traceState) {
      return undefined;
    }

    return { pending, pendingKey, traceState };
  }

  function getOrCreateGenerationState(info: {
    id: string;
    parentID: string;
    sessionID: string;
  }): { generation: GenerationState; pending: PendingMessage; pendingKey: string; traceState: TraceState } | undefined {
    const resolved = getPendingAssistantMessage(info);

    if (!resolved) {
      return undefined;
    }

    const existing = generationStates.get(info.id);

    if (existing) {
      return { generation: existing, ...resolved };
    }

    const currentGenerationID = currentGenerationIDs.get(info.sessionID);
    const spanID = currentGenerationID && currentGenerationID !== info.id ? randomUUID() : resolved.pending.spanID;
    const generation: GenerationState = {
      assistantMessageID: info.id,
      pendingKey: resolved.pendingKey,
      sessionID: info.sessionID,
      spanID,
      traceID: resolved.pending.traceID,
    };

    resolved.pending.spanID = spanID;
    generationStates.set(info.id, generation);
    currentGenerationIDs.set(info.sessionID, info.id);

    return { generation, ...resolved };
  }

  function updateTraceStateFromAssistantMessage(
    traceState: TraceState,
    pending: PendingMessage,
    info: {
      mode: string;
      time: { completed: number };
      cost: number;
      tokens: { input: number; output: number };
      output?: string;
      error?: unknown;
    },
  ): string | undefined {
    traceState.agentName = info.mode || pending.agentName;
    traceState.lastActivityAt = info.time.completed;
    traceState.totalCostUsd += info.cost;
    traceState.totalInputTokens += info.tokens.input;
    traceState.totalOutputTokens += info.tokens.output;

    const errorMessage = getErrorMessage(info.error);

    traceState.outputState = info.output ?? errorMessage ?? traceState.outputState;

    if (errorMessage) {
      traceState.hasError = true;
      traceState.errorMessage = errorMessage;
    }

    return errorMessage;
  }

  function hasCompletedAssistantMessage(messageID: string): boolean {
    return completedAssistantMessages.has(messageID);
  }

  function markAssistantMessageCompleted(messageID: string): void {
    completedAssistantMessages.add(messageID);
  }

  function cleanupAssistantMessage(messageID: string, generationSpanID: string): void {
    assistantOutputs.delete(messageID);
    generationTools.delete(generationSpanID);
  }

  function getActiveMessage(sessionID: string): PendingMessage | undefined {
    return activeMessages.get(sessionID);
  }

  function setToolCall(sessionID: string, callID: string, toolCall: ToolCallState): void {
    toolCalls.set(getToolKey(sessionID, callID), toolCall);
  }

  function takeToolCall(sessionID: string, callID: string): ToolCallState | undefined {
    const toolKey = getToolKey(sessionID, callID);
    const toolCall = toolCalls.get(toolKey);

    if (!toolCall) {
      return undefined;
    }

    toolCalls.delete(toolKey);

    return toolCall;
  }

  function recordGenerationToolCall(spanID: string, tool: string): void {
    const tools = generationTools.get(spanID) ?? [];

    tools.push(tool);
    generationTools.set(spanID, tools);
  }

  function getGenerationToolProperties(spanID: string): {
    toolsCalled?: Array<string>;
    toolCallCount?: number;
  } {
    const tools = generationTools.get(spanID);

    if (!tools || tools.length === 0) {
      return {};
    }

    return {
      toolsCalled: [...new Set(tools)],
      toolCallCount: tools.length,
    };
  }

  function shouldCompleteAssistantMessage(info: AssistantMessageInfo): info is CompletedAssistantMessageInfo {
    return info.role === 'assistant' && Boolean(info.time.completed) && !completedAssistantMessages.has(info.id);
  }

  return {
    beginPrompt,
    clearSessionState,
    cleanupAssistantMessage,
    getActiveMessage,
    getAssistantOutputForMessage,
    getGenerationToolProperties,
    getOrCreateGenerationState,
    getTraceState,
    getTraceSessionIDs,
    getOrCreateTraceState,
    hasCompletedAssistantMessage,
    markAssistantMessageCompleted,
    markSessionError,
    recordGenerationToolCall,
    setToolCall,
    shouldCompleteAssistantMessage,
    storeAssistantOutput,
    takeToolCall,
    updateTraceStateFromAssistantMessage,
  };
}
