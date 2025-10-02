import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createVariableRoutes } from './variables';
import type { Variable } from '@cloutagent/types';

// Mock VariableService
const mockVariableService = {
  createVariable: vi.fn(),
  updateVariable: vi.fn(),
  deleteVariable: vi.fn(),
  listVariables: vi.fn(),
  getVariableScope: vi.fn(),
} as any;

// Test data
const mockVariable: Variable = {
  id: 'var-123',
  name: 'test_var',
  type: 'string',
  value: 'hello world',
  description: 'A test variable',
  scope: 'global',
  encrypted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Variable API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup express app with routes
    app = express();
    app.use(express.json());

    // Mount variable routes under /api/projects/:projectId/variables
    const router = express.Router();
    router.use(
      '/projects/:projectId/variables',
      createVariableRoutes(mockVariableService),
    );
    app.use('/api', router);
  });

  describe('POST /api/projects/:projectId/variables', () => {
    it('should create variable with valid data', async () => {
      mockVariableService.createVariable.mockResolvedValue(mockVariable);

      const response = await request(app)
        .post('/api/projects/test-project/variables')
        .send({
          name: 'test_var',
          type: 'string',
          value: 'hello world',
          scope: 'global',
          encrypted: false,
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe('var-123');
      expect(response.body.name).toBe('test_var');
      expect(mockVariableService.createVariable).toHaveBeenCalledWith(
        'test-project',
        {
          name: 'test_var',
          type: 'string',
          value: 'hello world',
          scope: 'global',
          encrypted: false,
        },
      );
    });

    it('should return 400 for invalid variable name', async () => {
      mockVariableService.createVariable.mockRejectedValue(
        new Error('Variable name must be alphanumeric with underscores'),
      );

      const response = await request(app)
        .post('/api/projects/test-project/variables')
        .send({
          name: 'test-var',
          type: 'string',
          value: 'hello',
          scope: 'global',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        'Variable name must be alphanumeric with underscores',
      );
    });

    it('should return 400 for type mismatch', async () => {
      mockVariableService.createVariable.mockRejectedValue(
        new Error('Value type mismatch. Expected number'),
      );

      const response = await request(app)
        .post('/api/projects/test-project/variables')
        .send({
          name: 'test_var',
          type: 'number',
          value: 'not a number',
          scope: 'global',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Value type mismatch. Expected number');
    });

    it('should return 409 for duplicate name in scope', async () => {
      mockVariableService.createVariable.mockRejectedValue(
        new Error('Variable "test_var" already exists in global scope'),
      );

      const response = await request(app)
        .post('/api/projects/test-project/variables')
        .send({
          name: 'test_var',
          type: 'string',
          value: 'hello',
          scope: 'global',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('GET /api/projects/:projectId/variables', () => {
    it('should list all variables', async () => {
      const variables = [mockVariable];
      mockVariableService.listVariables.mockResolvedValue(variables);

      const response = await request(app).get(
        '/api/projects/test-project/variables',
      );

      expect(response.status).toBe(200);
      expect(response.body.variables).toHaveLength(1);
      expect(response.body.variables[0].name).toBe('test_var');
      expect(mockVariableService.listVariables).toHaveBeenCalledWith(
        'test-project',
        undefined,
      );
    });

    it('should filter by scope query param', async () => {
      const globalVars = [mockVariable];
      mockVariableService.listVariables.mockResolvedValue(globalVars);

      const response = await request(app).get(
        '/api/projects/test-project/variables?scope=global',
      );

      expect(response.status).toBe(200);
      expect(response.body.variables).toHaveLength(1);
      expect(mockVariableService.listVariables).toHaveBeenCalledWith(
        'test-project',
        'global',
      );
    });

    it('should return empty array if no variables', async () => {
      mockVariableService.listVariables.mockResolvedValue([]);

      const response = await request(app).get(
        '/api/projects/test-project/variables',
      );

      expect(response.status).toBe(200);
      expect(response.body.variables).toEqual([]);
    });
  });

  describe('PUT /api/projects/:projectId/variables/:variableId', () => {
    it('should update variable value', async () => {
      const updatedVariable = {
        ...mockVariable,
        value: 'new value',
        updatedAt: new Date(),
      };
      mockVariableService.updateVariable.mockResolvedValue(updatedVariable);

      const response = await request(app)
        .put('/api/projects/test-project/variables/var-123')
        .send({ value: 'new value' });

      expect(response.status).toBe(200);
      expect(response.body.value).toBe('new value');
      expect(mockVariableService.updateVariable).toHaveBeenCalledWith(
        'test-project',
        'var-123',
        {
          value: 'new value',
        },
      );
    });

    it('should return 404 if variable not found', async () => {
      mockVariableService.updateVariable.mockRejectedValue(
        new Error('Variable not found'),
      );

      const response = await request(app)
        .put('/api/projects/test-project/variables/non-existent')
        .send({ value: 'test' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Variable not found');
    });

    it('should return 400 for type mismatch', async () => {
      mockVariableService.updateVariable.mockRejectedValue(
        new Error('Value type mismatch. Expected number'),
      );

      const response = await request(app)
        .put('/api/projects/test-project/variables/var-123')
        .send({ value: 'not a number' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Value type mismatch. Expected number');
    });
  });

  describe('DELETE /api/projects/:projectId/variables/:variableId', () => {
    it('should delete variable', async () => {
      mockVariableService.deleteVariable.mockResolvedValue(true);

      const response = await request(app).delete(
        '/api/projects/test-project/variables/var-123',
      );

      expect(response.status).toBe(204);
      expect(mockVariableService.deleteVariable).toHaveBeenCalledWith(
        'test-project',
        'var-123',
      );
    });

    it('should return 404 if not found', async () => {
      mockVariableService.deleteVariable.mockResolvedValue(false);

      const response = await request(app).delete(
        '/api/projects/test-project/variables/non-existent',
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Variable not found');
    });
  });

  describe('GET /api/projects/:projectId/variables/scope', () => {
    it('should get variable scope structure', async () => {
      const scope = {
        global: { test_var: mockVariable },
        node: {},
        execution: {},
      };
      mockVariableService.getVariableScope.mockResolvedValue(scope);

      const response = await request(app).get(
        '/api/projects/test-project/variables/scope',
      );

      expect(response.status).toBe(200);
      expect(response.body.global).toBeDefined();
      expect(response.body.node).toBeDefined();
      expect(response.body.execution).toBeDefined();
      expect(mockVariableService.getVariableScope).toHaveBeenCalledWith(
        'test-project',
        undefined,
      );
    });

    it('should filter by executionId query param', async () => {
      const scope = {
        global: {},
        node: {},
        execution: { exec_var: mockVariable },
      };
      mockVariableService.getVariableScope.mockResolvedValue(scope);

      const response = await request(app).get(
        '/api/projects/test-project/variables/scope?executionId=exec-123',
      );

      expect(response.status).toBe(200);
      expect(mockVariableService.getVariableScope).toHaveBeenCalledWith(
        'test-project',
        'exec-123',
      );
    });
  });
});
