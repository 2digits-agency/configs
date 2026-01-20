import { describe, expect, it } from '@effect/vitest';

import { TloApiError, TloAuthError, TloNetworkError, TloParseError } from '../src/schemas/errors.js';

describe('TloErrors', () => {
  describe('TloApiError', () => {
    it('is tagged correctly', () => {
      const error = new TloApiError({ message: 'API failed', endpoint: '/test' });

      expect(error._tag).toBe('TloApiError');
      expect(error.message).toBe('API failed');
      expect(error.endpoint).toBe('/test');
    });
  });

  describe('TloAuthError', () => {
    it('is tagged correctly', () => {
      const error = new TloAuthError({ message: 'Session expired' });

      expect(error._tag).toBe('TloAuthError');
      expect(error.message).toBe('Session expired');
    });
  });

  describe('TloNetworkError', () => {
    it('is tagged correctly', () => {
      const error = new TloNetworkError({
        message: 'Connection refused',
        endpoint: '/api',
        cause: new Error('ECONNREFUSED'),
      });

      expect(error._tag).toBe('TloNetworkError');
      expect(error.message).toBe('Connection refused');
      expect(error.endpoint).toBe('/api');
    });
  });

  describe('TloParseError', () => {
    it('is tagged correctly', () => {
      const error = new TloParseError({ message: 'Invalid JSON' });

      expect(error._tag).toBe('TloParseError');
      expect(error.message).toBe('Invalid JSON');
    });
  });
});
