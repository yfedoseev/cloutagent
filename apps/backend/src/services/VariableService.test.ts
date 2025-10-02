import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { VariableService } from './VariableService';

describe('VariableService', () => {
  let service: VariableService;
  const testDir = path.join(process.cwd(), 'test-projects');
  const testProjectId = 'test-project-123';

  beforeEach(async () => {
    service = new VariableService(testDir);
    // Clean up before each test
    await fs.rm(testDir, { recursive: true, force: true });
  });

  afterEach(async () => {
    // Cleanup test files
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('create', () => {
    it('should create variable with auto-generated ID', async () => {
      const variable = await service.createVariable(testProjectId, {
        name: 'test_var',
        type: 'string',
        value: 'hello',
        scope: 'global',
        encrypted: false,
      });

      expect(variable.id).toBeDefined();
      expect(variable.id).toMatch(/^var-\d+-[a-z0-9]+$/);
      expect(variable.name).toBe('test_var');
      expect(variable.value).toBe('hello');
    });

    it('should validate type on creation', async () => {
      await expect(
        service.createVariable(testProjectId, {
          name: 'test_var',
          type: 'number',
          value: 'not a number',
          scope: 'global',
          encrypted: false,
        }),
      ).rejects.toThrow('Value type mismatch. Expected number');
    });

    it('should reject invalid variable names (must be alphanumeric + underscore)', async () => {
      await expect(
        service.createVariable(testProjectId, {
          name: 'test-var',
          type: 'string',
          value: 'hello',
          scope: 'global',
          encrypted: false,
        }),
      ).rejects.toThrow('Variable name must be alphanumeric with underscores');

      await expect(
        service.createVariable(testProjectId, {
          name: '123var',
          type: 'string',
          value: 'hello',
          scope: 'global',
          encrypted: false,
        }),
      ).rejects.toThrow('Variable name must be alphanumeric with underscores');

      await expect(
        service.createVariable(testProjectId, {
          name: 'test var',
          type: 'string',
          value: 'hello',
          scope: 'global',
          encrypted: false,
        }),
      ).rejects.toThrow('Variable name must be alphanumeric with underscores');
    });

    it('should create with correct timestamps', async () => {
      const before = new Date();
      const variable = await service.createVariable(testProjectId, {
        name: 'test_var',
        type: 'string',
        value: 'hello',
        scope: 'global',
        encrypted: false,
      });
      const after = new Date();

      expect(new Date(variable.createdAt).getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(new Date(variable.createdAt).getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
      expect(new Date(variable.updatedAt).getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(new Date(variable.updatedAt).getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
    });

    it('should persist to filesystem', async () => {
      const variable = await service.createVariable(testProjectId, {
        name: 'test_var',
        type: 'string',
        value: 'hello',
        scope: 'global',
        encrypted: false,
      });

      const filePath = path.join(testDir, testProjectId, 'variables.json');
      const content = await fs.readFile(filePath, 'utf-8');
      const variables = JSON.parse(content);

      expect(variables).toHaveLength(1);
      expect(variables[0].id).toBe(variable.id);
      expect(variables[0].name).toBe('test_var');
    });

    it('should prevent duplicate names in same scope', async () => {
      await service.createVariable(testProjectId, {
        name: 'test_var',
        type: 'string',
        value: 'hello',
        scope: 'global',
        encrypted: false,
      });

      await expect(
        service.createVariable(testProjectId, {
          name: 'test_var',
          type: 'string',
          value: 'world',
          scope: 'global',
          encrypted: false,
        }),
      ).rejects.toThrow('Variable "test_var" already exists in global scope');
    });

    it('should allow same name in different scopes', async () => {
      const global = await service.createVariable(testProjectId, {
        name: 'test_var',
        type: 'string',
        value: 'global',
        scope: 'global',
        encrypted: false,
      });

      const node = await service.createVariable(testProjectId, {
        name: 'test_var',
        type: 'string',
        value: 'node',
        scope: 'node',
        encrypted: false,
        nodeId: 'node-1',
      });

      expect(global.id).not.toBe(node.id);
      expect(global.scope).toBe('global');
      expect(node.scope).toBe('node');
    });

    it('should require encrypted flag for secret type', async () => {
      await expect(
        service.createVariable(testProjectId, {
          name: 'api_key',
          type: 'secret',
          value: 'sk-1234567890',
          scope: 'global',
          encrypted: false,
        }),
      ).rejects.toThrow('Secret variables must be encrypted');
    });

    it('should allow valid identifier names', async () => {
      const validNames = [
        'test_var',
        '_private',
        'camelCase',
        'CONSTANT',
        'var123',
      ];

      for (const name of validNames) {
        const variable = await service.createVariable(testProjectId, {
          name,
          type: 'string',
          value: 'test',
          scope: 'global',
          encrypted: false,
        });

        expect(variable.name).toBe(name);
      }
    });
  });

  describe('update', () => {
    it('should update variable value', async () => {
      const variable = await service.createVariable(testProjectId, {
        name: 'test_var',
        type: 'string',
        value: 'hello',
        scope: 'global',
        encrypted: false,
      });

      const updated = await service.updateVariable(testProjectId, variable.id, {
        value: 'world',
      });

      expect(updated.value).toBe('world');
      expect(updated.id).toBe(variable.id);
    });

    it('should validate type on update', async () => {
      const variable = await service.createVariable(testProjectId, {
        name: 'test_var',
        type: 'number',
        value: 42,
        scope: 'global',
        encrypted: false,
      });

      await expect(
        service.updateVariable(testProjectId, variable.id, {
          value: 'not a number',
        }),
      ).rejects.toThrow('Value type mismatch. Expected number');
    });

    it('should update updatedAt timestamp', async () => {
      const variable = await service.createVariable(testProjectId, {
        name: 'test_var',
        type: 'string',
        value: 'hello',
        scope: 'global',
        encrypted: false,
      });

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await service.updateVariable(testProjectId, variable.id, {
        value: 'world',
      });

      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
        new Date(variable.updatedAt).getTime(),
      );
    });

    it('should persist changes to filesystem', async () => {
      const variable = await service.createVariable(testProjectId, {
        name: 'test_var',
        type: 'string',
        value: 'hello',
        scope: 'global',
        encrypted: false,
      });

      await service.updateVariable(testProjectId, variable.id, {
        value: 'world',
      });

      const filePath = path.join(testDir, testProjectId, 'variables.json');
      const content = await fs.readFile(filePath, 'utf-8');
      const variables = JSON.parse(content);

      expect(variables[0].value).toBe('world');
    });

    it('should reject type mismatch updates', async () => {
      const variable = await service.createVariable(testProjectId, {
        name: 'test_var',
        type: 'boolean',
        value: true,
        scope: 'global',
        encrypted: false,
      });

      await expect(
        service.updateVariable(testProjectId, variable.id, {
          value: 'not a boolean',
        }),
      ).rejects.toThrow('Value type mismatch. Expected boolean');
    });

    it('should throw error if variable not found', async () => {
      await expect(
        service.updateVariable(testProjectId, 'non-existent-id', {
          value: 'test',
        }),
      ).rejects.toThrow('Variable not found');
    });
  });

  describe('delete', () => {
    it('should delete variable by ID', async () => {
      const variable = await service.createVariable(testProjectId, {
        name: 'test_var',
        type: 'string',
        value: 'hello',
        scope: 'global',
        encrypted: false,
      });

      const deleted = await service.deleteVariable(testProjectId, variable.id);

      expect(deleted).toBe(true);

      const variables = await service.listVariables(testProjectId);
      expect(variables).toHaveLength(0);
    });

    it('should return false if variable not found', async () => {
      const deleted = await service.deleteVariable(
        testProjectId,
        'non-existent-id',
      );

      expect(deleted).toBe(false);
    });

    it('should remove from filesystem', async () => {
      const variable = await service.createVariable(testProjectId, {
        name: 'test_var',
        type: 'string',
        value: 'hello',
        scope: 'global',
        encrypted: false,
      });

      await service.deleteVariable(testProjectId, variable.id);

      const filePath = path.join(testDir, testProjectId, 'variables.json');
      const content = await fs.readFile(filePath, 'utf-8');
      const variables = JSON.parse(content);

      expect(variables).toHaveLength(0);
    });
  });

  describe('list', () => {
    it('should list all variables for project', async () => {
      await service.createVariable(testProjectId, {
        name: 'var1',
        type: 'string',
        value: 'hello',
        scope: 'global',
        encrypted: false,
      });

      await service.createVariable(testProjectId, {
        name: 'var2',
        type: 'number',
        value: 42,
        scope: 'global',
        encrypted: false,
      });

      const variables = await service.listVariables(testProjectId);

      expect(variables).toHaveLength(2);
      expect(variables.map(v => v.name)).toContain('var1');
      expect(variables.map(v => v.name)).toContain('var2');
    });

    it('should return empty array if no variables', async () => {
      const variables = await service.listVariables(testProjectId);

      expect(variables).toEqual([]);
    });

    it('should filter by scope if provided', async () => {
      await service.createVariable(testProjectId, {
        name: 'global_var',
        type: 'string',
        value: 'hello',
        scope: 'global',
        encrypted: false,
      });

      await service.createVariable(testProjectId, {
        name: 'node_var',
        type: 'string',
        value: 'world',
        scope: 'node',
        encrypted: false,
        nodeId: 'node-1',
      });

      const globalVars = await service.listVariables(testProjectId, 'global');
      const nodeVars = await service.listVariables(testProjectId, 'node');

      expect(globalVars).toHaveLength(1);
      expect(globalVars[0].name).toBe('global_var');

      expect(nodeVars).toHaveLength(1);
      expect(nodeVars[0].name).toBe('node_var');
    });
  });

  describe('validation', () => {
    it('should validate string type', async () => {
      const variable = await service.createVariable(testProjectId, {
        name: 'str_var',
        type: 'string',
        value: 'hello world',
        scope: 'global',
        encrypted: false,
      });

      expect(variable.value).toBe('hello world');
    });

    it('should validate number type', async () => {
      const variable = await service.createVariable(testProjectId, {
        name: 'num_var',
        type: 'number',
        value: 42.5,
        scope: 'global',
        encrypted: false,
      });

      expect(variable.value).toBe(42.5);
    });

    it('should validate boolean type', async () => {
      const variable = await service.createVariable(testProjectId, {
        name: 'bool_var',
        type: 'boolean',
        value: true,
        scope: 'global',
        encrypted: false,
      });

      expect(variable.value).toBe(true);
    });

    it('should validate object type', async () => {
      const obj = { key: 'value', nested: { data: 123 } };
      const variable = await service.createVariable(testProjectId, {
        name: 'obj_var',
        type: 'object',
        value: obj,
        scope: 'global',
        encrypted: false,
      });

      expect(variable.value).toEqual(obj);
    });

    it('should validate array type', async () => {
      const arr = [1, 2, 'three', { four: 4 }];
      const variable = await service.createVariable(testProjectId, {
        name: 'arr_var',
        type: 'array',
        value: arr,
        scope: 'global',
        encrypted: false,
      });

      expect(variable.value).toEqual(arr);
    });

    it('should reject invalid types', async () => {
      await expect(
        service.createVariable(testProjectId, {
          name: 'test',
          type: 'array',
          value: { not: 'array' },
          scope: 'global',
          encrypted: false,
        }),
      ).rejects.toThrow('Value type mismatch. Expected array');
    });

    it('should reject NaN for number type', async () => {
      await expect(
        service.createVariable(testProjectId, {
          name: 'test',
          type: 'number',
          value: NaN,
          scope: 'global',
          encrypted: false,
        }),
      ).rejects.toThrow('Value type mismatch. Expected number');
    });

    it('should reject null for object type', async () => {
      await expect(
        service.createVariable(testProjectId, {
          name: 'test',
          type: 'object',
          value: null,
          scope: 'global',
          encrypted: false,
        }),
      ).rejects.toThrow('Value type mismatch. Expected object');
    });
  });

  describe('scope', () => {
    it('should get variables by global scope', async () => {
      await service.createVariable(testProjectId, {
        name: 'global1',
        type: 'string',
        value: 'value1',
        scope: 'global',
        encrypted: false,
      });

      await service.createVariable(testProjectId, {
        name: 'global2',
        type: 'string',
        value: 'value2',
        scope: 'global',
        encrypted: false,
      });

      const scope = await service.getVariableScope(testProjectId);

      expect(Object.keys(scope.global)).toHaveLength(2);
      expect(scope.global['global1']).toBeDefined();
      expect(scope.global['global2']).toBeDefined();
    });

    it('should get variables by node scope', async () => {
      await service.createVariable(testProjectId, {
        name: 'node_var1',
        type: 'string',
        value: 'value1',
        scope: 'node',
        encrypted: false,
        nodeId: 'node-1',
      });

      await service.createVariable(testProjectId, {
        name: 'node_var2',
        type: 'string',
        value: 'value2',
        scope: 'node',
        encrypted: false,
        nodeId: 'node-2',
      });

      const scope = await service.getVariableScope(testProjectId);

      expect(Object.keys(scope.node)).toHaveLength(2);
      expect(scope.node['node-1']['node_var1']).toBeDefined();
      expect(scope.node['node-2']['node_var2']).toBeDefined();
    });

    it('should get variables by execution scope', async () => {
      await service.createVariable(testProjectId, {
        name: 'exec_var',
        type: 'string',
        value: 'value',
        scope: 'execution',
        encrypted: false,
      });

      const scope = await service.getVariableScope(testProjectId, 'exec-123');

      expect(Object.keys(scope.execution)).toHaveLength(1);
      expect(scope.execution['exec_var']).toBeDefined();
    });

    it('should organize variables into VariableScope structure', async () => {
      await service.createVariable(testProjectId, {
        name: 'global_var',
        type: 'string',
        value: 'global',
        scope: 'global',
        encrypted: false,
      });

      await service.createVariable(testProjectId, {
        name: 'node_var',
        type: 'string',
        value: 'node',
        scope: 'node',
        encrypted: false,
        nodeId: 'node-1',
      });

      await service.createVariable(testProjectId, {
        name: 'exec_var',
        type: 'string',
        value: 'exec',
        scope: 'execution',
        encrypted: false,
      });

      const scope = await service.getVariableScope(testProjectId, 'exec-123');

      expect(scope.global).toBeDefined();
      expect(scope.node).toBeDefined();
      expect(scope.execution).toBeDefined();

      expect(scope.global['global_var'].value).toBe('global');
      expect(scope.node['node-1']['node_var'].value).toBe('node');
      expect(scope.execution['exec_var'].value).toBe('exec');
    });
  });
});
