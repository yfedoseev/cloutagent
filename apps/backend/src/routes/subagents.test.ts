import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createSubagentRoutes } from './subagents';
import type { SubagentConfig } from '@cloutagent/types';

describe('Subagent Routes', () => {
  let app: express.Application;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      listConfigs: vi.fn(),
      createConfig: vi.fn(),
      getConfig: vi.fn(),
      updateConfig: vi.fn(),
      deleteConfig: vi.fn(),
      executeBatch: vi.fn(),
    };

    app = express();
    app.use(express.json());
    app.use('/api/projects/:projectId/subagents', createSubagentRoutes(mockService));
  });

  describe('GET /api/projects/:projectId/subagents', () => {
    it('should list all subagent configs for a project', async () => {
      const mockConfigs: SubagentConfig[] = [
        {
          id: 'sub-1',
          type: 'frontend-engineer',
          name: 'UI Builder',
          prompt: 'Build UI components',
          createdAt: '2025-10-01T00:00:00Z',
          updatedAt: '2025-10-01T00:00:00Z',
        },
        {
          id: 'sub-2',
          type: 'backend-engineer',
          name: 'API Builder',
          prompt: 'Build REST APIs',
          createdAt: '2025-10-01T00:00:00Z',
          updatedAt: '2025-10-01T00:00:00Z',
        },
      ];

      mockService.listConfigs.mockResolvedValue(mockConfigs);

      const res = await request(app).get('/api/projects/proj-1/subagents');

      expect(res.status).toBe(200);
      expect(res.body.configs).toHaveLength(2);
      expect(res.body.configs[0].id).toBe('sub-1');
      expect(mockService.listConfigs).toHaveBeenCalledWith('proj-1');
    });

    it('should return empty array when no configs exist', async () => {
      mockService.listConfigs.mockResolvedValue([]);

      const res = await request(app).get('/api/projects/proj-1/subagents');

      expect(res.status).toBe(200);
      expect(res.body.configs).toHaveLength(0);
    });

    it('should handle service errors', async () => {
      mockService.listConfigs.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/api/projects/proj-1/subagents');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Database error');
    });
  });

  describe('POST /api/projects/:projectId/subagents', () => {
    it('should create a new subagent config', async () => {
      const newConfig = {
        type: 'backend-engineer' as const,
        name: 'API Builder',
        prompt: 'Build REST APIs',
        timeout: 60000,
      };

      const createdConfig: SubagentConfig = {
        id: 'sub-2',
        ...newConfig,
        createdAt: '2025-10-01T00:00:00Z',
        updatedAt: '2025-10-01T00:00:00Z',
      };

      mockService.createConfig.mockResolvedValue(createdConfig);

      const res = await request(app)
        .post('/api/projects/proj-1/subagents')
        .send(newConfig);

      expect(res.status).toBe(201);
      expect(res.body.config.id).toBe('sub-2');
      expect(res.body.config.name).toBe('API Builder');
      expect(mockService.createConfig).toHaveBeenCalledWith('proj-1', newConfig);
    });

    it('should validate required fields', async () => {
      mockService.createConfig.mockRejectedValue(new Error('Missing required field: type'));

      const res = await request(app)
        .post('/api/projects/proj-1/subagents')
        .send({ name: 'Invalid' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required field');
    });

    it('should reject invalid subagent types', async () => {
      mockService.createConfig.mockRejectedValue(new Error('Invalid subagent type: invalid-type'));

      const res = await request(app)
        .post('/api/projects/proj-1/subagents')
        .send({
          type: 'invalid-type',
          name: 'Invalid',
          prompt: 'Test',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid subagent type');
    });
  });

  describe('GET /api/projects/:projectId/subagents/:subagentId', () => {
    it('should get a specific subagent config', async () => {
      const mockConfig: SubagentConfig = {
        id: 'sub-1',
        type: 'ml-engineer',
        name: 'ML Model Builder',
        prompt: 'Build ML models',
        createdAt: '2025-10-01T00:00:00Z',
        updatedAt: '2025-10-01T00:00:00Z',
      };

      mockService.getConfig.mockResolvedValue(mockConfig);

      const res = await request(app).get('/api/projects/proj-1/subagents/sub-1');

      expect(res.status).toBe(200);
      expect(res.body.config.id).toBe('sub-1');
      expect(res.body.config.type).toBe('ml-engineer');
      expect(mockService.getConfig).toHaveBeenCalledWith('proj-1', 'sub-1');
    });

    it('should return 404 for non-existent config', async () => {
      mockService.getConfig.mockResolvedValue(null);

      const res = await request(app).get('/api/projects/proj-1/subagents/non-existent');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Subagent config not found');
    });

    it('should handle service errors', async () => {
      mockService.getConfig.mockRejectedValue(new Error('File read error'));

      const res = await request(app).get('/api/projects/proj-1/subagents/sub-1');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('File read error');
    });
  });

  describe('PUT /api/projects/:projectId/subagents/:subagentId', () => {
    it('should update a subagent config', async () => {
      const updatedConfig: SubagentConfig = {
        id: 'sub-1',
        type: 'frontend-engineer',
        name: 'Updated UI Builder',
        prompt: 'Build modern UI components',
        timeout: 120000,
        createdAt: '2025-10-01T00:00:00Z',
        updatedAt: '2025-10-01T01:00:00Z',
      };

      mockService.updateConfig.mockResolvedValue(updatedConfig);

      const res = await request(app)
        .put('/api/projects/proj-1/subagents/sub-1')
        .send({ name: 'Updated UI Builder', timeout: 120000 });

      expect(res.status).toBe(200);
      expect(res.body.config.name).toBe('Updated UI Builder');
      expect(res.body.config.timeout).toBe(120000);
      expect(mockService.updateConfig).toHaveBeenCalledWith('proj-1', 'sub-1', {
        name: 'Updated UI Builder',
        timeout: 120000,
      });
    });

    it('should handle non-existent config updates', async () => {
      mockService.updateConfig.mockRejectedValue(new Error('Subagent config not found: sub-999'));

      const res = await request(app)
        .put('/api/projects/proj-1/subagents/sub-999')
        .send({ name: 'Updated' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('not found');
    });
  });

  describe('DELETE /api/projects/:projectId/subagents/:subagentId', () => {
    it('should delete a subagent config', async () => {
      mockService.deleteConfig.mockResolvedValue(undefined);

      const res = await request(app).delete('/api/projects/proj-1/subagents/sub-1');

      expect(res.status).toBe(204);
      expect(mockService.deleteConfig).toHaveBeenCalledWith('proj-1', 'sub-1');
    });

    it('should handle deletion errors gracefully', async () => {
      mockService.deleteConfig.mockRejectedValue(new Error('Permission denied'));

      const res = await request(app).delete('/api/projects/proj-1/subagents/sub-1');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Permission denied');
    });
  });

  describe('POST /api/projects/:projectId/subagents/batch', () => {
    it('should execute a batch of subagent requests', async () => {
      const requests = [
        { subagentId: 'sub-1', prompt: 'Build login UI', type: 'frontend-engineer', parentAgentId: 'agent-1' },
        { subagentId: 'sub-2', prompt: 'Build auth API', type: 'backend-engineer', parentAgentId: 'agent-1' },
      ];

      const results = [
        { subagentId: 'sub-1', status: 'completed' as const, result: 'Login UI built', executionTime: 1500, tokenUsage: { input: 100, output: 200 } },
        { subagentId: 'sub-2', status: 'completed' as const, result: 'Auth API built', executionTime: 2000, tokenUsage: { input: 150, output: 250 } },
      ];

      mockService.executeBatch.mockResolvedValue(results);

      const res = await request(app)
        .post('/api/projects/proj-1/subagents/batch')
        .send({ requests });

      expect(res.status).toBe(200);
      expect(res.body.results).toHaveLength(2);
      expect(res.body.results[0].status).toBe('completed');
      expect(mockService.executeBatch).toHaveBeenCalledWith(requests);
    });

    it('should handle batch execution errors', async () => {
      mockService.executeBatch.mockRejectedValue(new Error('Batch execution failed'));

      const res = await request(app)
        .post('/api/projects/proj-1/subagents/batch')
        .send({ requests: [] });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Batch execution failed');
    });
  });
});
