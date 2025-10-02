import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnvValidator } from './env-validator';
import type { EnvVarConfig } from '@cloutagent/types';

describe('EnvValidator', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validate', () => {
    it('should validate required environment variables', () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';
      process.env.PORT = '3001';

      const schema: Record<string, EnvVarConfig> = {
        ANTHROPIC_API_KEY: { required: true, type: 'string' },
        PORT: { required: true, type: 'number' },
      };

      const validator = new EnvValidator();
      const result = validator.validate(schema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.values.ANTHROPIC_API_KEY).toBe('test-api-key');
      expect(result.values.PORT).toBe(3001);
    });

    it('should fail on missing required variables', () => {
      delete process.env.ANTHROPIC_API_KEY;

      const schema: Record<string, EnvVarConfig> = {
        ANTHROPIC_API_KEY: { required: true, type: 'string' },
      };

      const validator = new EnvValidator();
      const result = validator.validate(schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'ANTHROPIC_API_KEY is required but not set',
      );
    });

    it('should use default values for optional variables', () => {
      delete process.env.PORT;
      delete process.env.NODE_ENV;

      const schema: Record<string, EnvVarConfig> = {
        PORT: { required: false, type: 'number', default: 3001 },
        NODE_ENV: { required: false, type: 'string', default: 'development' },
      };

      const validator = new EnvValidator();
      const result = validator.validate(schema);

      expect(result.isValid).toBe(true);
      expect(result.values.PORT).toBe(3001);
      expect(result.values.NODE_ENV).toBe('development');
    });

    it('should validate type conversion', () => {
      process.env.PORT = '3001';
      process.env.DEBUG = 'true';
      process.env.MAX_RETRIES = '5';

      const schema: Record<string, EnvVarConfig> = {
        PORT: { required: true, type: 'number' },
        DEBUG: { required: true, type: 'boolean' },
        MAX_RETRIES: { required: true, type: 'number' },
      };

      const validator = new EnvValidator();
      const result = validator.validate(schema);

      expect(result.isValid).toBe(true);
      expect(result.values.PORT).toBe(3001);
      expect(result.values.DEBUG).toBe(true);
      expect(result.values.MAX_RETRIES).toBe(5);
    });

    it('should fail on invalid type conversion', () => {
      process.env.PORT = 'not-a-number';

      const schema: Record<string, EnvVarConfig> = {
        PORT: { required: true, type: 'number' },
      };

      const validator = new EnvValidator();
      const result = validator.validate(schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('PORT must be a valid number');
    });

    it('should support custom validators', () => {
      process.env.API_URL = 'http://localhost:3000';

      const schema: Record<string, EnvVarConfig> = {
        API_URL: {
          required: true,
          type: 'string',
          validator: (value: string) => value.startsWith('http'),
        },
      };

      const validator = new EnvValidator();
      const result = validator.validate(schema);

      expect(result.isValid).toBe(true);
    });

    it('should fail custom validation', () => {
      process.env.API_URL = 'invalid-url';

      const schema: Record<string, EnvVarConfig> = {
        API_URL: {
          required: true,
          type: 'string',
          validator: (value: string) => value.startsWith('http'),
        },
      };

      const validator = new EnvValidator();
      const result = validator.validate(schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('API_URL failed custom validation');
    });

    it('should provide helpful error messages', () => {
      delete process.env.REQUIRED_VAR;
      process.env.INVALID_NUMBER = 'abc';

      const schema: Record<string, EnvVarConfig> = {
        REQUIRED_VAR: { required: true, type: 'string' },
        INVALID_NUMBER: { required: true, type: 'number' },
      };

      const validator = new EnvValidator();
      const result = validator.validate(schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('REQUIRED_VAR is required but not set');
      expect(result.errors).toContain('INVALID_NUMBER must be a valid number');
    });
  });

  describe('get methods', () => {
    it('should get validated values', () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      process.env.PORT = '3001';

      const schema: Record<string, EnvVarConfig> = {
        ANTHROPIC_API_KEY: { required: true, type: 'string' },
        PORT: { required: true, type: 'number' },
      };

      const validator = new EnvValidator();
      validator.validate(schema);

      expect(validator.get('ANTHROPIC_API_KEY')).toBe('test-key');
      expect(validator.get('PORT')).toBe(3001);
    });

    it('should get number values with type safety', () => {
      process.env.PORT = '3001';

      const schema: Record<string, EnvVarConfig> = {
        PORT: { required: true, type: 'number' },
      };

      const validator = new EnvValidator();
      validator.validate(schema);

      const port = validator.getNumber('PORT');
      expect(port).toBe(3001);
      expect(typeof port).toBe('number');
    });

    it('should get boolean values with type safety', () => {
      process.env.DEBUG = 'true';

      const schema: Record<string, EnvVarConfig> = {
        DEBUG: { required: true, type: 'boolean' },
      };

      const validator = new EnvValidator();
      validator.validate(schema);

      const debug = validator.getBoolean('DEBUG');
      expect(debug).toBe(true);
      expect(typeof debug).toBe('boolean');
    });
  });
});
