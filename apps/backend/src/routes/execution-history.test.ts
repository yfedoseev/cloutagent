import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Execution, ExecutionSummary } from '@cloutagent/types';
import { createExecutionHistoryRoutes } from './execution-history';

// Mock ExecutionHistoryService
const mockHistoryService = {
  saveExecution: vi.fn(),
  getExecution: vi.fn(),
  listExecutions: vi.fn(),
  deleteExecution: vi.fn(),
  deleteAllExecutions: vi.fn(),
  getStatistics: vi.fn(),
};

// Test data
const mockExecution: Execution = {
  id: 'exec-test-123',
  projectId: 'test-project',
  status: 'completed',
  input: 'Test prompt',
  output: 'Test response',
  startedAt: new Date('2024-01-01T10:00:00Z'),
  completedAt: new Date('2024-01-01T10:00:05Z'),
  duration: 5000,
  tokenUsage: { input: 100, output: 50, total: 150 },
  costUSD: 0.001,
  steps: [],
  retryCount: 0,
};

const mockSummary: ExecutionSummary = {
  id: mockExecution.id,
  projectId: mockExecution.projectId,
  status: mockExecution.status,
  startedAt: mockExecution.startedAt,
  completedAt: mockExecution.completedAt,
  duration: mockExecution.duration,
  tokenUsage: mockExecution.tokenUsage,
  costUSD: mockExecution.costUSD,
};

// JSON-serialized version (dates as strings)
const mockSummaryJSON = {
  id: mockSummary.id,
  projectId: mockSummary.projectId,
  status: mockSummary.status,
  startedAt: mockSummary.startedAt.toISOString(),
  completedAt: mockSummary.completedAt?.toISOString(),
  duration: mockSummary.duration,
  tokenUsage: mockSummary.tokenUsage,
  costUSD: mockSummary.costUSD,
};

const createApp = () => {
  const app = express();
  app.use(express.json());

  // Mount execution history routes
  const router = createExecutionHistoryRoutes(mockHistoryService as any);
  app.use('/api/projects/:projectId/executions', router);

  return app;
};

describe('Execution History API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  describe('GET /api/projects/:projectId/executions', () => {
    it('should list executions with default pagination', async () => {
      const mockResult = {
        executions: [mockSummary],
        total: 1,
      };

      mockHistoryService.listExecutions.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/projects/test-project/executions')
        .expect('Content-Type', /json/)
        .expect(200);

      // JSON serialization converts dates to strings
      expect(response.body).toEqual({
        executions: [mockSummaryJSON],
        total: 1,
      });
      expect(mockHistoryService.listExecutions).toHaveBeenCalledWith(
        'test-project',
        { limit: 50, offset: 0 },
      );
    });

    it('should list executions with custom pagination', async () => {
      const mockResult = {
        executions: [mockSummary],
        total: 100,
      };

      mockHistoryService.listExecutions.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/projects/test-project/executions?limit=10&offset=20')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        executions: [mockSummaryJSON],
        total: 100,
      });
      expect(mockHistoryService.listExecutions).toHaveBeenCalledWith(
        'test-project',
        { limit: 10, offset: 20 },
      );
    });

    it('should filter executions by status', async () => {
      const mockResult = {
        executions: [mockSummary],
        total: 1,
      };

      mockHistoryService.listExecutions.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/projects/test-project/executions?status=completed')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        executions: [mockSummaryJSON],
        total: 1,
      });
      expect(mockHistoryService.listExecutions).toHaveBeenCalledWith(
        'test-project',
        { limit: 50, offset: 0, status: 'completed' },
      );
    });

    it('should return 500 on service error', async () => {
      mockHistoryService.listExecutions.mockRejectedValue(
        new Error('Database error'),
      );

      const response = await request(app)
        .get('/api/projects/test-project/executions')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Database error');
    });
  });

  describe('GET /api/projects/:projectId/executions/:executionId', () => {
    it('should return execution by ID', async () => {
      mockHistoryService.getExecution.mockResolvedValue(mockExecution);

      const response = await request(app)
        .get('/api/projects/test-project/executions/exec-test-123')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('execution');
      expect(response.body.execution.id).toBe('exec-test-123');
      expect(mockHistoryService.getExecution).toHaveBeenCalledWith(
        'test-project',
        'exec-test-123',
      );
    });

    it('should return 404 for non-existent execution', async () => {
      mockHistoryService.getExecution.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/projects/test-project/executions/non-existent')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Execution not found');
    });

    it('should return 500 on service error', async () => {
      mockHistoryService.getExecution.mockRejectedValue(
        new Error('Read error'),
      );

      const response = await request(app)
        .get('/api/projects/test-project/executions/exec-123')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Read error');
    });
  });

  describe('DELETE /api/projects/:projectId/executions/:executionId', () => {
    it('should delete execution and return 204', async () => {
      mockHistoryService.deleteExecution.mockResolvedValue(undefined);

      await request(app)
        .delete('/api/projects/test-project/executions/exec-test-123')
        .expect(204);

      expect(mockHistoryService.deleteExecution).toHaveBeenCalledWith(
        'test-project',
        'exec-test-123',
      );
    });

    it('should return 500 on service error', async () => {
      mockHistoryService.deleteExecution.mockRejectedValue(
        new Error('Delete error'),
      );

      const response = await request(app)
        .delete('/api/projects/test-project/executions/exec-123')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Delete error');
    });
  });

  describe('DELETE /api/projects/:projectId/executions', () => {
    it('should delete all executions and return count', async () => {
      mockHistoryService.deleteAllExecutions.mockResolvedValue(5);

      const response = await request(app)
        .delete('/api/projects/test-project/executions')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({ deleted: 5 });
      expect(mockHistoryService.deleteAllExecutions).toHaveBeenCalledWith(
        'test-project',
      );
    });

    it('should return 0 when no executions exist', async () => {
      mockHistoryService.deleteAllExecutions.mockResolvedValue(0);

      const response = await request(app)
        .delete('/api/projects/test-project/executions')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({ deleted: 0 });
    });

    it('should return 500 on service error', async () => {
      mockHistoryService.deleteAllExecutions.mockRejectedValue(
        new Error('Delete all error'),
      );

      const response = await request(app)
        .delete('/api/projects/test-project/executions')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Delete all error');
    });
  });

  describe('GET /api/projects/:projectId/executions/stats', () => {
    it('should return execution statistics', async () => {
      const mockStats = {
        totalExecutions: 100,
        completed: 85,
        failed: 10,
        running: 5,
        totalCostUSD: 5.42,
        totalTokens: 150000,
      };

      mockHistoryService.getStatistics.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/projects/test-project/executions/stats')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockStats);
      expect(mockHistoryService.getStatistics).toHaveBeenCalledWith(
        'test-project',
      );
    });

    it('should return zero statistics for project with no executions', async () => {
      const emptyStats = {
        totalExecutions: 0,
        completed: 0,
        failed: 0,
        running: 0,
        totalCostUSD: 0,
        totalTokens: 0,
      };

      mockHistoryService.getStatistics.mockResolvedValue(emptyStats);

      const response = await request(app)
        .get('/api/projects/test-project/executions/stats')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(emptyStats);
    });

    it('should return 500 on service error', async () => {
      mockHistoryService.getStatistics.mockRejectedValue(
        new Error('Stats error'),
      );

      const response = await request(app)
        .get('/api/projects/test-project/executions/stats')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Stats error');
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in project ID', async () => {
      mockHistoryService.listExecutions.mockResolvedValue({
        executions: [],
        total: 0,
      });

      await request(app)
        .get('/api/projects/project-with-dashes-123/executions')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(mockHistoryService.listExecutions).toHaveBeenCalledWith(
        'project-with-dashes-123',
        { limit: 50, offset: 0 },
      );
    });

    it('should handle invalid limit parameter', async () => {
      mockHistoryService.listExecutions.mockResolvedValue({
        executions: [],
        total: 0,
      });

      await request(app)
        .get('/api/projects/test-project/executions?limit=invalid')
        .expect('Content-Type', /json/)
        .expect(200);

      // Should parse as NaN and use as-is (service should handle invalid values)
      expect(mockHistoryService.listExecutions).toHaveBeenCalledWith(
        'test-project',
        expect.objectContaining({ offset: 0 }),
      );
    });
  });
});
