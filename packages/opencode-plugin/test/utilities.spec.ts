import { describe, expect, it } from 'vite-plus/test';

import {
  buildInputMessages,
  buildOutputChoices,
  getErrorMessage,
  getPrompt,
  getTraceName,
  isValidCustomPropertiesJson,
  mapStopReason,
  parseCustomProperties,
  parseNumber,
  redactSensitive,
  serializeAttribute,
  truncate,
} from '../src/utilities.js';

describe(truncate, () => {
  it('truncates long values with an omission suffix', () => {
    expect(truncate('abcdef', 3)).toBe('abc...[truncated 3 chars]');
  });
});

describe(redactSensitive, () => {
  it('redacts nested sensitive keys and circular references', () => {
    const value: Record<string, unknown> = {
      token: 'secret',
      nested: { apiKey: '123', keep: 'ok' },
    };

    value.self = value;

    expect(redactSensitive(value, new WeakSet<object>(), 0)).toEqual({
      token: '[REDACTED]',
      nested: { apiKey: '[REDACTED]', keep: 'ok' },
      self: '[Circular]',
    });
  });
});

describe(serializeAttribute, () => {
  it('serializes and redacts object values', () => {
    expect(serializeAttribute({ password: 'secret', keep: 'ok' }, 100)).toBe('{"password":"[REDACTED]","keep":"ok"}');
  });
});

describe(parseNumber, () => {
  it('falls back for invalid numbers', () => {
    expect(parseNumber('nope', 7)).toBe(7);
    expect(parseNumber('12', 7)).toBe(12);
  });
});

describe(parseCustomProperties, () => {
  it('returns parsed records and ignores invalid values', () => {
    expect(parseCustomProperties('{"foo":"bar"}')).toEqual({ foo: 'bar' });
    expect(parseCustomProperties('{')).toEqual({});
    expect(parseCustomProperties('[]')).toEqual({});
  });
});

describe(isValidCustomPropertiesJson, () => {
  it('accepts valid record json including an empty object', () => {
    expect(isValidCustomPropertiesJson('{"foo":"bar"}')).toBeTruthy();
    expect(isValidCustomPropertiesJson('{}')).toBeTruthy();
    expect(isValidCustomPropertiesJson('{')).toBeFalsy();
    expect(isValidCustomPropertiesJson('[]')).toBeFalsy();
  });
});

describe(getErrorMessage, () => {
  it('extracts message from nested error shapes', () => {
    expect(getErrorMessage({ data: { message: 'bad' } })).toBe('bad');
    expect(getErrorMessage({ name: 'Boom' })).toBe('Boom');
  });
});

describe(getPrompt, () => {
  it('joins non-synthetic text parts only', () => {
    expect(
      getPrompt([
        { type: 'text', text: 'hello' },
        { type: 'text', text: 'skip', synthetic: true },
        { type: 'other', text: 'nope' },
        { type: 'text', text: 'world' },
      ]),
    ).toBe('hello\nworld');
  });
});

describe(mapStopReason, () => {
  it('maps tool-calls and errors', () => {
    expect(mapStopReason('tool-calls', false)).toBe('tool_calls');
    expect(mapStopReason('stop', true)).toBe('error');
  });
});

describe(getTraceName, () => {
  it('normalizes whitespace and limits length', () => {
    expect(getTraceName('  hello   world  ')).toBe('hello world');
  });
});

describe('message builders', () => {
  it('omits content in privacy mode', () => {
    expect(buildInputMessages('hello', true)).toBeUndefined();
    expect(buildOutputChoices('hi', 'err', true)).toBeUndefined();
  });

  it('builds user and assistant messages when privacy mode is off', () => {
    expect(buildInputMessages('hello', false)).toEqual([{ role: 'user', content: 'hello' }]);
    expect(buildOutputChoices('hi', undefined, false)).toEqual([{ role: 'assistant', content: 'hi' }]);
  });
});
