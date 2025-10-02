import { describe, it, expect } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { createTestModeRoutes } from './test-mode';
import type { WorkflowGraph } from '@cloutagent/types';

describe('Test Mode Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/projects/:projectId/test', createTestModeRoutes());
  });

  describe('POST /api/projects/:projectId/test', () => {
    it('should return 400 if workflow is missing', async () => {
      const response = await request(app)
        .post('/api/projects/test-proj/test')
        .send({ input: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Workflow is required');
    });

    it('should execute workflow in test mode', async () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: {
                model: 'claude-sonnet-4-5',
                systemPrompt: 'You are a helpful assistant',
              },
            },
          },
        ],
        edges: [],
      };

      const response = await request(app)
        .post('/api/projects/test-proj/test')
        .send({ input: 'Hello', workflow });

      expect(response.status).toBe(200);
      expect(response.body.result).toBeDefined();
      expect(response.body.result.status).toBe('completed');
      expect(response.body.result.output).toContain('[TEST MODE - Simulated Output]');
      expect(response.body.result.tokenUsage).toBeDefined();
      expect(response.body.result.costUSD).toBeGreaterThan(0);
    });

    it('should use default input if not provided', async () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: { config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } },
          },
        ],
        edges: [],
      };

      const response = await request(app)
        .post('/api/projects/test-proj/test')
        .send({ workflow });

      expect(response.status).toBe(200);
      expect(response.body.result).toBeDefined();
      expect(response.body.result.status).toBe('completed');
    });

    it('should return error for invalid workflow', async () => {
      const workflow: WorkflowGraph = {
        nodes: [], // No agent node
        edges: [],
      };

      const response = await request(app)
        .post('/api/projects/test-proj/test')
        .send({ input: 'Test', workflow });

      expect(response.status).toBe(200);
      expect(response.body.result.status).toBe('failed');
      expect(response.body.result.error).toContain('No agent node');
    });

    it('should include projectId in result', async () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: { config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } },
          },
        ],
        edges: [],
      };

      const response = await request(app)
        .post('/api/projects/my-project-123/test')
        .send({ input: 'Test', workflow });

      expect(response.status).toBe(200);
      expect(response.body.result.projectId).toBe('my-project-123');
    });
  });

  describe('POST /api/projects/:projectId/test/dry-run', () => {
    it('should return 400 if workflow is missing', async () => {
      const response = await request(app)
        .post('/api/projects/test-proj/test/dry-run')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Workflow is required');
    });

    it('should return estimates for valid workflow', async () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: { config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } },
          },
        ],
        edges: [],
      };

      const response = await request(app)
        .post('/api/projects/test-proj/test/dry-run')
        .send({ workflow });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.estimatedCost).toBeGreaterThan(0);
      expect(response.body.estimatedTokens).toBeGreaterThan(0);
      expect(response.body.estimatedDuration).toBeGreaterThan(0);
      expect(response.body.errors).toHaveLength(0);
    });

    it('should return errors for invalid workflow', async () => {
      const workflow: WorkflowGraph = {
        nodes: [],
        edges: [],
      };

      const response = await request(app)
        .post('/api/projects/test-proj/test/dry-run')
        .send({ workflow });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should estimate with subagents', async () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: { config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } },
          },
          {
            id: 'sub-1',
            type: 'subagent',
            data: { config: { type: 'frontend-engineer' } },
          },
        ],
        edges: [{ id: 'e1', source: 'agent-1', target: 'sub-1' }],
      };

      const response = await request(app)
        .post('/api/projects/test-proj/test/dry-run')
        .send({ workflow });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      // Duration should include subagent parallel execution time
      expect(response.body.estimatedDuration).toBeGreaterThanOrEqual(5000);
    });

    it('should estimate with hooks', async () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: { config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } },
          },
          { id: 'hook-1', type: 'hook', data: {} },
          { id: 'hook-2', type: 'hook', data: {} },
        ],
        edges: [],
      };

      const response = await request(app)
        .post('/api/projects/test-proj/test/dry-run')
        .send({ workflow });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      // Duration should include 2 hooks × 100ms = 200ms
      expect(response.body.estimatedDuration).toBeGreaterThanOrEqual(2200);
    });
  });

  describe('error handling', () => {
    it('should handle workflow errors in execution result', async () => {
      // Invalid workflow structure will be handled by test engine
      const response = await request(app)
        .post('/api/projects/test-proj/test')
        .send({
          workflow: {
            nodes: null, // This will cause an error in the engine
            edges: [],
          },
        });

      // The engine catches errors and returns them in the result, not as 500
      expect(response.status).toBe(200);
      expect(response.body.result.status).toBe('failed');
      expect(response.body.result.error).toBeDefined();
    });
  });
});
