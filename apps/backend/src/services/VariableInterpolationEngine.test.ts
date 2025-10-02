import { describe, it, expect, beforeEach } from 'vitest';
import { VariableInterpolationEngine } from './VariableInterpolationEngine';
import type { VariableScope } from '@cloutagent/types';

describe('VariableInterpolationEngine', () => {
  let engine: VariableInterpolationEngine;

  beforeEach(() => {
    engine = new VariableInterpolationEngine();
  });

  describe('interpolate', () => {
    it('should replace simple variable', () => {
      const template = 'Hello {{name}}!';
      const scope: VariableScope = {
        global: { name: 'Alice' },
        node: {},
        execution: {},
      };

      const result = engine.interpolate(template, scope);
      expect(result).toBe('Hello Alice!');
    });

    it('should replace multiple variables', () => {
      const template = '{{greeting}} {{name}}, you are {{age}} years old.';
      const scope: VariableScope = {
        global: { greeting: 'Hello', name: 'Bob', age: 30 },
        node: {},
        execution: {},
      };

      const result = engine.interpolate(template, scope);
      expect(result).toBe('Hello Bob, you are 30 years old.');
    });

    it('should handle scoped variables', () => {
      const template = 'Global: {{global.key}}, Node: {{node.value}}';
      const scope: VariableScope = {
        global: { key: 'global-key' } as any,
        node: { value: 'node-value' } as any,
        execution: {},
      };

      const result = engine.interpolate(template, scope);
      expect(result).toBe('Global: global-key, Node: node-value');
    });

    it('should prioritize execution > node > global', () => {
      const template = 'Value: {{key}}';
      const scope: VariableScope = {
        global: { key: 'global' },
        node: { key: 'node' },
        execution: { key: 'execution' },
      };

      const result = engine.interpolate(template, scope);
      expect(result).toBe('Value: execution');
    });

    it('should handle missing variables with empty string', () => {
      const template = 'Hello {{missing}}!';
      const scope: VariableScope = {
        global: {},
        node: {},
        execution: {},
      };

      const result = engine.interpolate(template, scope);
      expect(result).toBe('Hello !');
    });

    it('should keep undefined variables if keepUndefined=true', () => {
      const template = 'Hello {{missing}}!';
      const scope: VariableScope = {
        global: {},
        node: {},
        execution: {},
      };

      const result = engine.interpolate(template, scope, { keepUndefined: true });
      expect(result).toBe('Hello {{missing}}!');
    });

    it('should throw error in strict mode for missing variable', () => {
      const template = 'Hello {{missing}}!';
      const scope: VariableScope = {
        global: {},
        node: {},
        execution: {},
      };

      expect(() => {
        engine.interpolate(template, scope, { strict: true });
      }).toThrow('Variable not found: missing');
    });

    it('should handle number variables', () => {
      const template = 'Count: {{count}}';
      const scope: VariableScope = {
        global: { count: 42 },
        node: {},
        execution: {},
      };

      const result = engine.interpolate(template, scope);
      expect(result).toBe('Count: 42');
    });

    it('should handle boolean variables', () => {
      const template = 'Enabled: {{enabled}}';
      const scope: VariableScope = {
        global: { enabled: true },
        node: {},
        execution: {},
      };

      const result = engine.interpolate(template, scope);
      expect(result).toBe('Enabled: true');
    });

    it('should handle object variables with JSON', () => {
      const template = 'Config: {{config}}';
      const scope: VariableScope = {
        global: { config: { key: 'value', nested: { foo: 'bar' } } },
        node: {},
        execution: {},
      };

      const result = engine.interpolate(template, scope);
      expect(result).toBe('Config: {"key":"value","nested":{"foo":"bar"}}');
    });

    it('should handle array variables with JSON', () => {
      const template = 'Items: {{items}}';
      const scope: VariableScope = {
        global: { items: ['a', 'b', 'c'] },
        node: {},
        execution: {},
      };

      const result = engine.interpolate(template, scope);
      expect(result).toBe('Items: ["a","b","c"]');
    });

    it('should handle whitespace in variable names', () => {
      const template = 'Hello {{ name }}!';
      const scope: VariableScope = {
        global: { name: 'Alice' },
        node: {},
        execution: {},
      };

      const result = engine.interpolate(template, scope);
      expect(result).toBe('Hello Alice!');
    });

    it('should handle execution scope explicitly', () => {
      const template = 'Runtime: {{execution.value}}';
      const scope: VariableScope = {
        global: {},
        node: {},
        execution: { value: 'runtime-value' },
      };

      const result = engine.interpolate(template, scope);
      expect(result).toBe('Runtime: runtime-value');
    });
  });

  describe('validateTemplate', () => {
    it('should return empty array for valid template', () => {
      const template = 'Hello {{name}}!';
      const scope: VariableScope = {
        global: { name: 'Alice' },
        node: {},
        execution: {},
      };

      const errors = engine.validateTemplate(template, scope);
      expect(errors).toEqual([]);
    });

    it('should return errors for missing variables', () => {
      const template = 'Hello {{missing1}} and {{missing2}}!';
      const scope: VariableScope = {
        global: {},
        node: {},
        execution: {},
      };

      const errors = engine.validateTemplate(template, scope);
      expect(errors).toHaveLength(2);
      expect(errors[0]).toContain('missing1');
      expect(errors[1]).toContain('missing2');
    });

    it('should validate scoped variables', () => {
      const template = 'Value: {{global.missing}}';
      const scope: VariableScope = {
        global: {},
        node: {},
        execution: {},
      };

      const errors = engine.validateTemplate(template, scope);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('global.missing');
    });
  });

  describe('extractVariables', () => {
    it('should extract all variable references', () => {
      const template = 'Hello {{name}}, your {{global.role}} is {{node.status}}.';

      const variables = engine.extractVariables(template);

      expect(variables).toEqual(['name', 'global.role', 'node.status']);
    });

    it('should return empty array for no variables', () => {
      const template = 'No variables here';

      const variables = engine.extractVariables(template);

      expect(variables).toEqual([]);
    });

    it('should extract variables with whitespace', () => {
      const template = 'Hello {{ name }}, {{ role }}';

      const variables = engine.extractVariables(template);

      expect(variables).toEqual(['name', 'role']);
    });
  });

  describe('hasVariables', () => {
    it('should return true if template has variables', () => {
      expect(engine.hasVariables('Hello {{name}}')).toBe(true);
    });

    it('should return false if template has no variables', () => {
      expect(engine.hasVariables('Hello world')).toBe(false);
    });

    it('should detect variables with whitespace', () => {
      expect(engine.hasVariables('Hello {{ name }}')).toBe(true);
    });
  });

  describe('interpolateObject', () => {
    it('should interpolate string properties', () => {
      const obj = {
        greeting: 'Hello {{name}}',
        message: 'You are {{age}} years old',
      };
      const scope: VariableScope = {
        global: { name: 'Alice', age: 25 },
        node: {},
        execution: {},
      };

      const result = engine.interpolateObject(obj, scope);

      expect(result.greeting).toBe('Hello Alice');
      expect(result.message).toBe('You are 25 years old');
    });

    it('should interpolate nested objects', () => {
      const obj = {
        user: {
          name: '{{userName}}',
          settings: {
            theme: '{{theme}}',
          },
        },
      };
      const scope: VariableScope = {
        global: { userName: 'Bob', theme: 'dark' },
        node: {},
        execution: {},
      };

      const result = engine.interpolateObject(obj, scope);

      expect(result.user.name).toBe('Bob');
      expect(result.user.settings.theme).toBe('dark');
    });

    it('should interpolate arrays', () => {
      const obj = {
        messages: ['Hello {{name}}', 'Goodbye {{name}}'],
      };
      const scope: VariableScope = {
        global: { name: 'Charlie' },
        node: {},
        execution: {},
      };

      const result = engine.interpolateObject(obj, scope);

      expect(result.messages[0]).toBe('Hello Charlie');
      expect(result.messages[1]).toBe('Goodbye Charlie');
    });

    it('should preserve non-string values', () => {
      const obj = {
        count: 42,
        enabled: true,
        config: { key: 'value' },
      };
      const scope: VariableScope = {
        global: {},
        node: {},
        execution: {},
      };

      const result = engine.interpolateObject(obj, scope);

      expect(result.count).toBe(42);
      expect(result.enabled).toBe(true);
      expect(result.config).toEqual({ key: 'value' });
    });

    it('should handle null values', () => {
      const obj = {
        value: null,
      };
      const scope: VariableScope = {
        global: {},
        node: {},
        execution: {},
      };

      const result = engine.interpolateObject(obj, scope);

      expect(result.value).toBe(null);
    });
  });
});
