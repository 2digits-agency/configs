import nodePath from 'node:path';

import { SENSITIVE_KEY_PATTERN } from './constants.js';
import type { AssistantOutputState, Config, PromptPart, TraceGrouping } from './types.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeStringify(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

export function truncate(value: string, maxLength: number): string {
  if (maxLength <= 0) {
    return '';
  }
  if (value.length <= maxLength) {
    return value;
  }

  const omitted = value.length - maxLength;

  return `${value.slice(0, maxLength)}...[truncated ${omitted} chars]`;
}

export function redactSensitive(value: unknown, seen: WeakSet<object>, depth: number): unknown {
  if (depth > 8) {
    return '[DepthLimit]';
  }
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value !== 'object') {
    return value;
  }
  if (seen.has(value)) {
    return '[Circular]';
  }

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

export function serializeAttribute(value: unknown, maxLength: number): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const redacted = redactSensitive(value, new WeakSet<object>(), 0);

  if (typeof redacted === 'string') {
    return truncate(redacted, maxLength);
  }

  const json = safeStringify(redacted);

  return json ? truncate(json, maxLength) : undefined;
}

export function parseTraceGrouping(value: string | undefined): TraceGrouping {
  return value === 'session' ? 'session' : 'message';
}

export function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseCustomProperties(value: string | undefined): Record<string, unknown> {
  if (!value) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(value);

    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function isValidCustomPropertiesJson(value: string | undefined): boolean {
  if (!value) {
    return true;
  }

  try {
    return isRecord(JSON.parse(value));
  } catch {
    return false;
  }
}

export function parseDistinctId(value: string | undefined): string | undefined {
  const distinctId = value?.trim();

  if (!distinctId) {
    return undefined;
  }

  return distinctId;
}

export function getProjectName(directory: string): string {
  const value = nodePath.basename(directory);

  return value.length > 0 ? value : 'opencode-project';
}

export function getTraceName(prompt: string | undefined): string | undefined {
  if (!prompt) {
    return undefined;
  }

  const traceName = prompt.replaceAll(/\s+/g, ' ').trim();

  if (!traceName) {
    return undefined;
  }

  return traceName.slice(0, 120);
}

export function getDistinctId(config: Config, sessionID: string): string {
  return config.distinctId ?? config.gitEmail ?? sessionID;
}

export function getPendingKey(sessionID: string, messageID: string): string {
  return `${sessionID}:${messageID}`;
}

export function getToolKey(sessionID: string, callID: string): string {
  return `${sessionID}:${callID}`;
}

export function mapStopReason(finish: string | undefined, hasError: boolean): string | undefined {
  if (hasError) {
    return 'error';
  }
  if (!finish) {
    return undefined;
  }
  if (finish === 'tool-calls') {
    return 'tool_calls';
  }

  return finish;
}

export function getErrorMessage(error: unknown): string | undefined {
  if (!error) {
    return undefined;
  }
  if (isRecord(error)) {
    if (typeof error.message === 'string') {
      return error.message;
    }
    if (isRecord(error.data) && typeof error.data.message === 'string') {
      return error.data.message;
    }
    if (typeof error.name === 'string') {
      return error.name;
    }
  }

  return safeStringify(error);
}

export function getPrompt(parts: Array<PromptPart>): string | undefined {
  const textParts = new Array<string>();

  for (const part of parts) {
    if (part.type === 'text' && !part.synthetic && typeof part.text === 'string') {
      textParts.push(part.text);
    }
  }

  const prompt = textParts.join('\n').trim();

  return prompt.length > 0 ? prompt : undefined;
}

export function getAssistantOutput(state: AssistantOutputState | undefined): string | undefined {
  if (!state) {
    return undefined;
  }

  const output = state.order
    .map((partID) => state.parts.get(partID) ?? '')
    .join('\n')
    .trim();

  return output.length > 0 ? output : undefined;
}

export function buildInputMessages(
  prompt: string | undefined,
  privacyMode: boolean,
): Array<{ role: 'user'; content: string }> | undefined {
  if (privacyMode || !prompt) {
    return undefined;
  }

  return [{ role: 'user', content: prompt }];
}

export function buildOutputChoices(
  output: string | undefined,
  errorMessage: string | undefined,
  privacyMode: boolean,
): Array<{ role: 'assistant'; content: string }> | undefined {
  if (privacyMode) {
    return undefined;
  }
  if (output) {
    return [{ role: 'assistant', content: output }];
  }
  if (errorMessage) {
    return [{ role: 'assistant', content: errorMessage }];
  }

  return undefined;
}
