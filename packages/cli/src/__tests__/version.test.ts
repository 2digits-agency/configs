import { describe, it, expect } from 'vitest';
import { moduleVersion } from '../internal/version';

describe('version', () => {
  it('should export moduleVersion', () => {
    expect(moduleVersion).toBeDefined();
    expect(typeof moduleVersion).toBe('string');
  });

  it('should have a placeholder version that gets replaced during build', () => {
    // The version should be a string that gets replaced during the build process
    expect(moduleVersion).toBe('__REPLACE_VERSION__');
  });
});