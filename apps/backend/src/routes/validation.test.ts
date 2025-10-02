import { describe, it, expect, beforeAll } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { createValidationRoutes } from './validation';
import type { WorkflowGraph } from '@cloutagent/types';

describe('Validation Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/projects/:projectId/validate', createValidationRoutes());
  });

  describe('POST /api/projects/:projectId/validate', () => {
    it('should return 400 if workflow is missing', async () => {
      const response = await request(app)
        .post('/api/projects/test-project/validate')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Workflow is required');
    });

    it('should validate workflow and return errors', async () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: { config: {} }, // Missing model and systemPrompt
          },
        ],
        edges: [],
      };

      const response = await request(app)
        .post('/api/projects/test-project/validate')
        .send({ workflow });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should validate and pass valid workflow', async () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: {
                model: 'claude-sonnet-4-5',
                systemPrompt: 'You are helpful',
              },
            },
          },
          {
            id: 'sub-1',
            type: 'subagent',
            data: {
              config: {
                type: 'frontend-engineer',
                prompt: 'Build UI',
              },
            },
          },
        ],
        edges: [{ id: 'e1', source: 'agent-1', target: 'sub-1' }],
      };

      const response = await request(app)
        .post('/api/projects/test-project/validate')
        .send({ workflow });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.errors).toHaveLength(0);
    });

    it('should return warnings for optimization issues', async () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: {
                model: 'claude-sonnet-4-5',
                systemPrompt: 'You are helpful',
              },
            },
          },
        ],
        edges: [],
      };

      const response = await request(app)
        .post('/api/projects/test-project/validate')
        .send({ workflow });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.warnings).toBeInstanceOf(Array);
      expect(response.body.warnings.some((w: any) => w.type === 'optimization')).toBe(
        true,
      );
    });

    it('should detect circular dependencies', async () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: {
                model: 'claude-sonnet-4-5',
                systemPrompt: 'Test',
              },
            },
          },
          { id: 'sub-1', type: 'subagent', data: { config: {} } },
          { id: 'sub-2', type: 'subagent', data: { config: {} } },
        ],
        edges: [
          { id: 'e1', source: 'agent-1', target: 'sub-1' },
          { id: 'e2', source: 'sub-1', target: 'sub-2' },
          { id: 'e3', source: 'sub-2', target: 'sub-1' }, // Cycle
        ],
      };

      const response = await request(app)
        .post('/api/projects/test-project/validate')
        .send({ workflow });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
      expect(
        response.body.errors.some((e: any) => e.message.includes('Circular dependency')),
      ).toBe(true);
    });
  });

  describe('POST /api/projects/:projectId/validate/field', () => {
    it('should return 400 if field is missing', async () => {
      const response = await request(app)
        .post('/api/projects/test-project/validate/field')
        .send({ value: 'test' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Field name is required');
    });

    it('should validate systemPrompt field', async () => {
      const response = await request(app)
        .post('/api/projects/test-project/validate/field')
        .send({ field: 'systemPrompt', value: '' });

      expect(response.status).toBe(200);
      expect(response.body.error).not.toBeNull();
      expect(response.body.error.message).toContain('cannot be empty');
    });

    it('should validate model field', async () => {
      const response = await request(app)
        .post('/api/projects/test-project/validate/field')
        .send({ field: 'model', value: 'gpt-4' });

      expect(response.status).toBe(200);
      expect(response.body.error).not.toBeNull();
      expect(response.body.error.message).toContain('Invalid model');
    });

    it('should validate temperature field', async () => {
      const response = await request(app)
        .post('/api/projects/test-project/validate/field')
        .send({ field: 'temperature', value: 1.5 });

      expect(response.status).toBe(200);
      expect(response.body.error).not.toBeNull();
      expect(response.body.error.message).toContain('between 0 and 1');
    });

    it('should validate maxTokens field', async () => {
      const response = await request(app)
        .post('/api/projects/test-project/validate/field')
        .send({ field: 'maxTokens', value: 0 });

      expect(response.status).toBe(200);
      expect(response.body.error).not.toBeNull();
      expect(response.body.error.message).toContain('between 1 and 200,000');
    });

    it('should return null for valid field', async () => {
      const response = await request(app)
        .post('/api/projects/test-project/validate/field')
        .send({ field: 'model', value: 'claude-sonnet-4-5' });

      expect(response.status).toBe(200);
      expect(response.body.error).toBeNull();
    });

    it('should return null for unknown field', async () => {
      const response = await request(app)
        .post('/api/projects/test-project/validate/field')
        .send({ field: 'unknownField', value: 'test' });

      expect(response.status).toBe(200);
      expect(response.body.error).toBeNull();
    });
  });
});
