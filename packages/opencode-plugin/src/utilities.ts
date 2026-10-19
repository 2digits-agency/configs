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

export function redactSensitive(value: unknown, ancestors: WeakSet<object>, depth: number): unknown {
  if (depth > 8) {
    return '[DepthLimit]';
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  if (ancestors.has(value)) {
    return '[Circular]';
  }

  ancestors.add(value);

  const output = Array.isArray(value)
    ? value.map((item) => redactSensitive(item, ancestors, depth + 1))
    : Object.fromEntries(
        Object.entries(value).map(([key, nested]) => [
          key,
          SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : redactSensitive(nested, ancestors, depth + 1),
        ]),
      );

  // Only objects on the current path are circular, not values that are referenced more than once.
  ancestors.delete(value);

  return output;
}

export function serializeAttribute(value: unknown, maxLength: number): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const redacted = redactSensitive(value, new WeakSet<object>(), 0);

  const text = typeof redacted === 'string' ? redacted : safeStringify(redacted);

  return text === undefined ? undefined : truncate(text, maxLength);
}

export function parseTraceGrouping(value: string | undefined): TraceGrouping {
  return value === 'session' ? 'session' : 'message';
}

export function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// Returns `undefined` when the value is set but is not a JSON object.
export function parseCustomProperties(value: string | undefined): Record<string, unknown> | undefined {
  if (!value) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(value);

    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function parseDistinctId(value: string | undefined): string | undefined {
  const distinctId = value?.trim();

  return distinctId === '' ? undefined : distinctId;
}

export function getProjectName(directory: string): string {
  const value = nodePath.basename(directory);

  return value.length > 0 ? value : 'opencode-project';
}

export function getTraceName(prompt: string | undefined): string | undefined {
  const traceName = prompt?.replaceAll(/\s+/g, ' ').trim().slice(0, 120);

  return traceName === '' ? undefined : traceName;
}

export function getDistinctId(config: Config, sessionID: string): string {
  return config.distinctId ?? config.gitEmail ?? sessionID;
}

export function sessionKey(sessionID: string, id: string): string {
  return `${sessionID}:${id}`;
}

export function mapStopReason(finish: string | undefined, hasError: boolean): string | undefined {
  if (hasError) {
    return 'error';
  }

  if (finish === 'tool-calls') {
    return 'tool_calls';
  }

  return finish === '' ? undefined : finish;
}

export function getErrorMessage(error: unknown): string | undefined {
  if (!error) {
    return undefined;
  }

  if (typeof error === 'string') {
    return error;
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

function joinText(texts: Iterable<string>): string | undefined {
  const text = [...texts].join('\n').trim();

  return text.length > 0 ? text : undefined;
}

export function getPrompt(parts: Array<PromptPart>): string | undefined {
  return joinText(
    parts
      .filter((part) => part.type === 'text' && !part.synthetic && typeof part.text === 'string')
      .map((part) => part.text ?? ''),
  );
}

export function getAssistantOutput(state: AssistantOutputState | undefined): string | undefined {
  return state && joinText(state.parts.values());
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
