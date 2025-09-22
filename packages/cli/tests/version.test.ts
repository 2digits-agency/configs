import { describe, expect, it } from '@effect/vitest';

import { moduleVersion } from '../src/internal/version';

describe('version', () => {
  it('should export moduleVersion', () => {
    expect(moduleVersion).toBeDefined();
    expect(typeof moduleVersion).toBe('string');
  });

  it('should have a valid version format', () => {
    // Check if it's a valid semver-like format (e.g., "1.0.0" or "1.0.0-beta.1") or build-time placeholder
    const semverRegex = /^\d+\.\d+\.\d+(-[\w.-]+)?$/;
    const buildPlaceholder = '__REPLACE_VERSION__';
    
    expect(moduleVersion === buildPlaceholder || semverRegex.test(moduleVersion)).toBe(true);
  });

  it('should not be empty', () => {
    expect(moduleVersion.length).toBeGreaterThan(0);
  });
});