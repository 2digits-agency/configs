export type TraceGrouping = 'message' | 'session';

export interface Config {
  apiKey: string;
  host: string;
  enabled: boolean;
  privacyMode: boolean;
  traceGrouping: TraceGrouping;
  sessionWindowMinutes: number;
  maxAttributeLength: number;
  distinctId?: string;
  gitEmail?: string;
  projectName: string;
  customProperties: Record<string, unknown>;
}

export interface PendingMessage {
  agentName: string;
  prompt?: string;
  sessionID: string;
  traceID: string;
  spanID: string;
  startedAt: number;
  userMessageID: string;
}

export interface TraceState {
  agentName: string;
  errorMessage?: string;
  hasError: boolean;
  inputState?: string;
  lastActivityAt: number;
  lastTraceCapturedAt?: number;
  outputState?: string;
  sessionID: string;
  startedAt: number;
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  traceID: string;
  traceName?: string;
}

export interface ToolCallState {
  args: unknown;
  parentSpanID?: string;
  sessionID: string;
  startedAt: number;
  traceID: string;
}

export interface AssistantOutputState {
  order: Array<string>;
  parts: Map<string, string>;
}

export interface GenerationState {
  assistantMessageID: string;
  pendingKey: string;
  sessionID: string;
  spanID: string;
  traceID: string;
}

export interface AssistantMessageInfo {
  id: string;
  role: string;
  parentID: string;
  sessionID: string;
  modelID: string;
  providerID: string;
  mode: string;
  finish?: string;
  error?: unknown;
  cost: number;
  time: { created: number; completed?: number };
  tokens: {
    input: number;
    output: number;
    reasoning: number;
    cache: { read: number; write: number };
  };
}

export interface CompletedAssistantMessageInfo extends AssistantMessageInfo {
  time: { created: number; completed: number };
}

export interface PromptPart {
  type: string;
  text?: string;
  synthetic?: boolean;
}

export interface AssistantTextPart {
  id: string;
  messageID: string;
  text: string;
}
