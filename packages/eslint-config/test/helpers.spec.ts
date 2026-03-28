import { describe, expect, it } from 'vite-plus/test';

import { enabled, extractConfig } from '../src/factory';

describe(enabled, () => {
  it('returns true when passed true', () => {
    expect(enabled(true)).toBeTruthy();
  });

  it('returns false when passed false', () => {
    expect(enabled(false)).toBeFalsy();
  });

  it('returns false when passed undefined without default', () => {
    expect(enabled(undefined)).toBeFalsy();
  });

  it('returns default value when passed undefined', () => {
    expect(enabled(undefined, true)).toBeTruthy();
    expect(enabled(undefined, false)).toBeFalsy();
  });

  it('returns enable property from object', () => {
    expect(enabled({ enable: true })).toBeTruthy();
    expect(enabled({ enable: false })).toBeFalsy();
  });

  it('uses default when object has no enable property', () => {
    expect(enabled({}, true)).toBeTruthy();
    expect(enabled({}, false)).toBeFalsy();
    expect(enabled({})).toBeFalsy();
  });

  it('object enable property takes precedence over default', () => {
    expect(enabled({ enable: true }, false)).toBeTruthy();
    expect(enabled({ enable: false }, true)).toBeFalsy();
  });
});

describe(extractConfig, () => {
  it('returns empty object for true', () => {
    expect(extractConfig(true)).toEqual({});
  });

  it('returns empty object for false', () => {
    expect(extractConfig(false)).toEqual({});
  });

  it('returns empty object for undefined', () => {
    expect(extractConfig(undefined)).toEqual({});
  });

  it('strips enable property from object', () => {
    expect(extractConfig({ enable: true, foo: 'bar' })).toEqual({ foo: 'bar' });
    expect(extractConfig({ enable: false, foo: 'bar' })).toEqual({ foo: 'bar' });
  });

  it('returns object as-is when no enable property', () => {
    expect(extractConfig({ foo: 'bar', baz: 123 })).toEqual({ foo: 'bar', baz: 123 });
  });

  it('handles empty object', () => {
    expect(extractConfig({})).toEqual({});
  });

  it('handles nested objects', () => {
    const input = { enable: true, nested: { deep: 'value' } };

    expect(extractConfig(input)).toEqual({ nested: { deep: 'value' } });
  });
});
