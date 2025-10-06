import { describe, it, expect } from 'vitest';

// Mock the dependencies for testing
const mockTailwindFunctions = ['classNames', 'clsx', 'cn'];
const mockFindUp = {
  file: (name, options) => {
    if (name === 'tailwind.config.ts') return '/mock/tailwind.config.ts';
    if (name === 'tailwind.config.js') return null;
    return null;
  }
};

const mockGetPackageInfo = (pkg) => {
  if (pkg === 'tailwindcss') {
    return Promise.resolve({ version: '4.1.0' });
  }
  return Promise.resolve(null);
};

const mockBetterTailwindcss = {
  configs: {
    recommended: {
      rules: {
        'better-tailwindcss/enforce-consistent-line-wrapping': 'warn',
        'better-tailwindcss/enforce-consistent-class-order': 'warn',
        'better-tailwindcss/no-duplicate-classes': 'warn',
        'better-tailwindcss/no-unregistered-classes': 'error',
      }
    }
  },
  meta: {
    name: 'better-tailwindcss'
  }
};

// Mock modules
vi.mock('empathic/find', () => mockFindUp);
vi.mock('local-pkg', () => ({ getPackageInfo: mockGetPackageInfo }));
vi.mock('pkg-types', () => ({ findWorkspaceDir: () => Promise.resolve('/mock/workspace') }));
vi.mock('eslint-plugin-better-tailwindcss', () => ({ default: mockBetterTailwindcss }));
vi.mock('@2digits/constants', () => ({ default: { tailwindFunctions: mockTailwindFunctions } }));

describe('Tailwind Configuration', () => {
  it('should detect Tailwind v4 and configure accordingly', async () => {
    // Import our config function
    const { tailwind } = await import('../src/configs/tailwind.ts');
    
    const config = await tailwind({});
    
    expect(config).toHaveLength(1);
    
    const tailwindConfig = config[0];
    
    // Verify basic structure
    expect(tailwindConfig.name).toBe('2digits:tailwind');
    expect(tailwindConfig.plugins).toHaveProperty('better-tailwindcss');
    
    // Verify settings for v4
    expect(tailwindConfig.settings).toHaveProperty('better-tailwindcss');
    expect(tailwindConfig.settings['better-tailwindcss']).toHaveProperty('callees');
    expect(tailwindConfig.settings['better-tailwindcss'].callees).toEqual(mockTailwindFunctions);
    
    // For v4, should use tailwindConfig (since our mock returns .ts file)
    expect(tailwindConfig.settings['better-tailwindcss']).toHaveProperty('tailwindConfig');
    expect(tailwindConfig.settings['better-tailwindcss'].tailwindConfig).toBe('/mock/tailwind.config.ts');
    
    // Verify rules are applied
    expect(tailwindConfig.rules).toEqual(mockBetterTailwindcss.configs.recommended.rules);
  });

  it('should handle v3 detection and configuration', async () => {
    // Mock v3 detection
    vi.mocked(mockGetPackageInfo).mockResolvedValueOnce({ version: '3.4.1' });
    
    const { tailwind } = await import('../src/configs/tailwind.ts');
    
    const config = await tailwind({});
    const tailwindConfig = config[0];
    
    // Should still use tailwindConfig for v3
    expect(tailwindConfig.settings['better-tailwindcss']).toHaveProperty('tailwindConfig');
  });

  it('should handle missing config gracefully', async () => {
    // Mock no config found
    vi.mocked(mockFindUp.file).mockReturnValue(null);
    
    const { tailwind } = await import('../src/configs/tailwind.ts');
    
    const config = await tailwind({});
    const tailwindConfig = config[0];
    
    // Should still have basic settings
    expect(tailwindConfig.settings['better-tailwindcss']).toHaveProperty('callees');
    expect(tailwindConfig.settings['better-tailwindcss'].callees).toEqual(mockTailwindFunctions);
  });

  it('should apply custom overrides', async () => {
    const { tailwind } = await import('../src/configs/tailwind.ts');
    
    const customOverrides = {
      'better-tailwindcss/enforce-consistent-line-wrapping': 'error',
      'better-tailwindcss/custom-rule': 'warn'
    };
    
    const config = await tailwind({ overrides: customOverrides });
    const tailwindConfig = config[0];
    
    // Should merge overrides with default rules
    expect(tailwindConfig.rules).toEqual({
      ...mockBetterTailwindcss.configs.recommended.rules,
      ...customOverrides
    });
  });

  it('should default to v3 on detection failure', async () => {
    // Mock package info failure
    vi.mocked(mockGetPackageInfo).mockRejectedValueOnce(new Error('Package not found'));
    
    const { tailwind } = await import('../src/configs/tailwind.ts');
    
    const config = await tailwind({});
    
    // Should not throw and should configure for v3 (default)
    expect(config).toHaveLength(1);
    expect(config[0].settings['better-tailwindcss']).toHaveProperty('callees');
  });
});