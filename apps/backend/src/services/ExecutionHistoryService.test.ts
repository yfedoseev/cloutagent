import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { ExecutionHistoryService } from './ExecutionHistoryService';
import type { Execution } from '@cloutagent/types';

describe('ExecutionHistoryService', () => {
  let service: ExecutionHistoryService;
  const testProjectId = `test-proj-${Date.now()}`;

  beforeEach(() => {
    service = new ExecutionHistoryService();
  });

  afterEach(async () => {
    // Cleanup test data
    const projectPath = path.join(process.cwd(), 'projects', testProjectId);
    await fs.rm(projectPath, { recursive: true, force: true });
  });

  describe('saveExecution', () => {
    it('should save execution to filesystem with atomic write', async () => {
      const execution: Execution = {
        id: 'exec-1',
        projectId: testProjectId,
        status: 'completed',
        input: 'Test input',
        output: 'Test output',
        startedAt: new Date(),
        completedAt: new Date(),
        duration: 1000,
        tokenUsage: { input: 100, output: 50, total: 150 },
        costUSD: 0.001,
        steps: [],
        retryCount: 0,
      };

      await service.saveExecution(testProjectId, execution);

      const saved = await service.getExecution(testProjectId, 'exec-1');
      expect(saved).not.toBeNull();
      expect(saved?.id).toBe('exec-1');
      expect(saved?.output).toBe('Test output');
      expect(saved?.input).toBe('Test input');
    });

    it('should create directories recursively if they do not exist', async () => {
      const execution: Execution = {
        id: 'exec-new',
        projectId: testProjectId,
        status: 'completed',
        input: 'Test',
        startedAt: new Date(),
        tokenUsage: { input: 100, output: 50, total: 150 },
        costUSD: 0.001,
        steps: [],
        retryCount: 0,
      };

      await service.saveExecution(testProjectId, execution);

      const executionsDir = path.join(
        process.cwd(),
        'projects',
        testProjectId,
        'executions',
      );
      const dirExists = await fs.stat(executionsDir).then(() => true).catch(() => false);
      expect(dirExists).toBe(true);
    });

    it('should overwrite existing execution with same ID', async () => {
      const execution1: Execution = {
        id: 'exec-overwrite',
        projectId: testProjectId,
        status: 'running',
        input: 'First version',
        startedAt: new Date(),
        tokenUsage: { input: 100, output: 50, total: 150 },
        costUSD: 0.001,
        steps: [],
        retryCount: 0,
      };

      const execution2: Execution = {
        id: 'exec-overwrite',
        projectId: testProjectId,
        status: 'completed',
        input: 'Updated version',
        startedAt: new Date(),
        completedAt: new Date(),
        duration: 2000,
        tokenUsage: { input: 200, output: 100, total: 300 },
        costUSD: 0.002,
        steps: [],
        retryCount: 1,
      };

      await service.saveExecution(testProjectId, execution1);
      await service.saveExecution(testProjectId, execution2);

      const saved = await service.getExecution(testProjectId, 'exec-overwrite');
      expect(saved?.input).toBe('Updated version');
      expect(saved?.status).toBe('completed');
      expect(saved?.retryCount).toBe(1);
    });
  });

  describe('getExecution', () => {
    it('should retrieve execution by ID', async () => {
      const execution: Execution = {
        id: 'exec-get',
        projectId: testProjectId,
        status: 'completed',
        input: 'Retrieve me',
        startedAt: new Date(),
        tokenUsage: { input: 100, output: 50, total: 150 },
        costUSD: 0.001,
        steps: [],
        retryCount: 0,
      };

      await service.saveExecution(testProjectId, execution);
      const retrieved = await service.getExecution(testProjectId, 'exec-get');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe('exec-get');
      expect(retrieved?.input).toBe('Retrieve me');
    });

    it('should return null for non-existent execution', async () => {
      const execution = await service.getExecution(testProjectId, 'non-existent');
      expect(execution).toBeNull();
    });

    it('should throw error for invalid JSON file', async () => {
      const executionsDir = path.join(process.cwd(), 'projects', testProjectId, 'executions');
      await fs.mkdir(executionsDir, { recursive: true });
      await fs.writeFile(path.join(executionsDir, 'invalid.json'), 'invalid json');

      await expect(service.getExecution(testProjectId, 'invalid')).rejects.toThrow();
    });
  });

  describe('listExecutions', () => {
    beforeEach(async () => {
      // Create 10 test executions with different statuses and timestamps
      for (let i = 0; i < 10; i++) {
        const execution: Execution = {
          id: `exec-${i}`,
          projectId: testProjectId,
          status: i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'failed' : 'running',
          input: `Test input ${i}`,
          startedAt: new Date(Date.now() - i * 1000),
          completedAt: i % 3 !== 2 ? new Date(Date.now() - i * 1000 + 500) : undefined,
          duration: i % 3 !== 2 ? 500 : undefined,
          tokenUsage: { input: 100 + i * 10, output: 50 + i * 5, total: 150 + i * 15 },
          costUSD: 0.001 * (i + 1),
          error: i % 3 === 1 ? `Error ${i}` : undefined,
          steps: [],
          retryCount: 0,
        };
        await service.saveExecution(testProjectId, execution);
      }
    });

    it('should list all executions sorted by startedAt descending', async () => {
      const { executions, total } = await service.listExecutions(testProjectId);

      expect(total).toBe(10);
      expect(executions).toHaveLength(10);
      // Should be sorted newest first (exec-0 is newest)
      expect(executions[0].id).toBe('exec-0');
      expect(executions[9].id).toBe('exec-9');
    });

    it('should paginate results correctly', async () => {
      const page1 = await service.listExecutions(testProjectId, { limit: 3, offset: 0 });
      const page2 = await service.listExecutions(testProjectId, { limit: 3, offset: 3 });

      expect(page1.executions).toHaveLength(3);
      expect(page2.executions).toHaveLength(3);
      expect(page1.total).toBe(10);
      expect(page2.total).toBe(10);
      expect(page1.executions[0].id).toBe('exec-0');
      expect(page2.executions[0].id).toBe('exec-3');
    });

    it('should filter executions by status', async () => {
      const completed = await service.listExecutions(testProjectId, { status: 'completed' });
      const failed = await service.listExecutions(testProjectId, { status: 'failed' });
      const running = await service.listExecutions(testProjectId, { status: 'running' });

      expect(completed.executions.every(e => e.status === 'completed')).toBe(true);
      expect(failed.executions.every(e => e.status === 'failed')).toBe(true);
      expect(running.executions.every(e => e.status === 'running')).toBe(true);

      // Verify counts: 0,3,6,9 = completed, 1,4,7 = failed, 2,5,8 = running
      expect(completed.executions).toHaveLength(4);
      expect(failed.executions).toHaveLength(3);
      expect(running.executions).toHaveLength(3);
    });

    it('should return execution summaries, not full executions', async () => {
      const { executions } = await service.listExecutions(testProjectId);

      executions.forEach(summary => {
        expect(summary).toHaveProperty('id');
        expect(summary).toHaveProperty('projectId');
        expect(summary).toHaveProperty('status');
        expect(summary).toHaveProperty('startedAt');
        expect(summary).toHaveProperty('tokenUsage');
        expect(summary).toHaveProperty('costUSD');
        // Should NOT have input/output/steps
        expect(summary).not.toHaveProperty('input');
        expect(summary).not.toHaveProperty('output');
        expect(summary).not.toHaveProperty('steps');
      });
    });

    it('should return empty array for project with no executions', async () => {
      const { executions, total } = await service.listExecutions('non-existent-project');

      expect(executions).toEqual([]);
      expect(total).toBe(0);
    });

    it('should use default pagination values', async () => {
      const { executions } = await service.listExecutions(testProjectId);

      expect(executions).toHaveLength(10); // Less than default limit of 50
    });
  });

  describe('deleteExecution', () => {
    it('should delete execution by ID', async () => {
      const execution: Execution = {
        id: 'exec-delete',
        projectId: testProjectId,
        status: 'completed',
        input: 'Delete me',
        startedAt: new Date(),
        tokenUsage: { input: 100, output: 50, total: 150 },
        costUSD: 0.001,
        steps: [],
        retryCount: 0,
      };

      await service.saveExecution(testProjectId, execution);
      await service.deleteExecution(testProjectId, 'exec-delete');

      const deleted = await service.getExecution(testProjectId, 'exec-delete');
      expect(deleted).toBeNull();
    });

    it('should not throw error when deleting non-existent execution', async () => {
      await expect(
        service.deleteExecution(testProjectId, 'non-existent'),
      ).resolves.not.toThrow();
    });
  });

  describe('deleteAllExecutions', () => {
    it('should delete all executions for a project', async () => {
      // Create 5 executions
      for (let i = 0; i < 5; i++) {
        await service.saveExecution(testProjectId, {
          id: `exec-${i}`,
          projectId: testProjectId,
          status: 'completed',
          input: 'Test',
          startedAt: new Date(),
          tokenUsage: { input: 100, output: 50, total: 150 },
          costUSD: 0.001,
          steps: [],
          retryCount: 0,
        });
      }

      const count = await service.deleteAllExecutions(testProjectId);

      expect(count).toBe(5);

      const { executions } = await service.listExecutions(testProjectId);
      expect(executions).toHaveLength(0);
    });

    it('should return 0 when project has no executions', async () => {
      const count = await service.deleteAllExecutions('non-existent-project');
      expect(count).toBe(0);
    });
  });

  describe('getStatistics', () => {
    beforeEach(async () => {
      // Create test executions with known values
      const executions: Execution[] = [
        {
          id: 'exec-stat-1',
          projectId: testProjectId,
          status: 'completed',
          input: 'Test',
          startedAt: new Date(),
          tokenUsage: { input: 1000, output: 500, total: 1500 },
          costUSD: 0.01,
          steps: [],
          retryCount: 0,
        },
        {
          id: 'exec-stat-2',
          projectId: testProjectId,
          status: 'completed',
          input: 'Test',
          startedAt: new Date(),
          tokenUsage: { input: 2000, output: 1000, total: 3000 },
          costUSD: 0.02,
          steps: [],
          retryCount: 0,
        },
        {
          id: 'exec-stat-3',
          projectId: testProjectId,
          status: 'failed',
          input: 'Test',
          error: 'Error occurred',
          startedAt: new Date(),
          tokenUsage: { input: 500, output: 250, total: 750 },
          costUSD: 0.005,
          steps: [],
          retryCount: 1,
        },
        {
          id: 'exec-stat-4',
          projectId: testProjectId,
          status: 'running',
          input: 'Test',
          startedAt: new Date(),
          tokenUsage: { input: 100, output: 50, total: 150 },
          costUSD: 0.001,
          steps: [],
          retryCount: 0,
        },
      ];

      for (const execution of executions) {
        await service.saveExecution(testProjectId, execution);
      }
    });

    it('should calculate statistics correctly', async () => {
      const stats = await service.getStatistics(testProjectId);

      expect(stats.totalExecutions).toBe(4);
      expect(stats.completed).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.running).toBe(1);
      expect(stats.totalCostUSD).toBe(0.036);
      expect(stats.totalTokens).toBe(5400); // 1500 + 3000 + 750 + 150
    });

    it('should return zero statistics for project with no executions', async () => {
      const stats = await service.getStatistics('non-existent-project');

      expect(stats.totalExecutions).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.running).toBe(0);
      expect(stats.totalCostUSD).toBe(0);
      expect(stats.totalTokens).toBe(0);
    });

    it('should handle executions without cost', async () => {
      await service.saveExecution(testProjectId, {
        id: 'exec-no-cost',
        projectId: testProjectId,
        status: 'completed',
        input: 'Test',
        startedAt: new Date(),
        tokenUsage: { input: 100, output: 50, total: 150 },
        costUSD: 0,
        steps: [],
        retryCount: 0,
      });

      const stats = await service.getStatistics(testProjectId);

      expect(stats.totalExecutions).toBe(5);
      // Use toBeCloseTo for floating point comparison
      expect(stats.totalCostUSD).toBeCloseTo(0.036, 3);
    });
  });
});
