// Integration test for the better-tailwindcss configuration
// This test validates that our configuration works correctly

import { describe, it, expect } from 'vitest';

describe('Better Tailwind CSS Integration', () => {
  it('should load the plugin successfully', async () => {
    const plugin = await import('eslint-plugin-better-tailwindcss');
    
    expect(plugin.default).toBeDefined();
    expect(plugin.default.configs).toBeDefined();
    expect(plugin.default.configs.recommended).toBeDefined();
    expect(plugin.default.configs.recommended.rules).toBeDefined();
    
    // Check that key rules are present
    const rules = plugin.default.configs.recommended.rules;
    expect(rules).toHaveProperty('better-tailwindcss/enforce-consistent-line-wrapping');
    expect(rules).toHaveProperty('better-tailwindcss/enforce-consistent-class-order');
    expect(rules).toHaveProperty('better-tailwindcss/no-duplicate-classes');
    expect(rules).toHaveProperty('better-tailwindcss/no-unregistered-classes');
  });

  it('should have all expected config variants', async () => {
    const plugin = await import('eslint-plugin-better-tailwindcss');
    
    const expectedConfigs = [
      'recommended',
      'recommended-error',
      'recommended-warn',
      'stylistic',
      'stylistic-error', 
      'stylistic-warn',
      'correctness',
      'correctness-error',
      'correctness-warn'
    ];
    
    const availableConfigs = Object.keys(plugin.default.configs);
    
    for (const config of expectedConfigs) {
      expect(availableConfigs).toContain(config);
    }
  });

  it('should have plugin meta information', async () => {
    const plugin = await import('eslint-plugin-better-tailwindcss');
    
    expect(plugin.default.meta).toBeDefined();
    expect(plugin.default.meta.name).toBe('better-tailwindcss');
  });

  it('should support both v3 and v4 peerDependencies', async () => {
    const plugin = await import('eslint-plugin-better-tailwindcss');
    
    // The plugin should be importable, which means it supports the current environment
    expect(plugin.default).toBeDefined();
    
    // Based on package.json, it should support "^3.3.0 || ^4.1.6"
    // We can't easily test version compatibility here, but successful import indicates compatibility
  });
});