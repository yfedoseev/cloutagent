import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { ErrorRecoveryService } from './ErrorRecoveryService';
import type { ErrorRecoveryState } from '@cloutagent/types';

describe('ErrorRecoveryService', () => {
  let service: ErrorRecoveryService;
  const testProjectId = `test-proj-${Date.now()}`;

  beforeEach(() => {
    service = new ErrorRecoveryService();
  });

  afterEach(async () => {
    const projectPath = path.join(process.cwd(), 'projects', testProjectId);
    await fs.rm(projectPath, { recursive: true, force: true });
  });

  describe('saveRecoveryState', () => {
    it('should save recovery state to filesystem', async () => {
      const state: ErrorRecoveryState = {
        executionId: 'exec-1',
        projectId: testProjectId,
        timestamp: new Date().toISOString(),
        completedSteps: [],
        tokenUsageSnapshot: { input: 100, output: 50, total: 150 },
        retryCount: 0,
      };

      await service.saveRecoveryState(testProjectId, 'exec-1', state);

      const loaded = await service.loadRecoveryState(testProjectId, 'exec-1');
      expect(loaded).not.toBeNull();
      expect(loaded?.executionId).toBe('exec-1');
      expect(loaded?.tokenUsageSnapshot.total).toBe(150);
    });

    it('should use atomic write with temp file', async () => {
      const state: ErrorRecoveryState = {
        executionId: 'exec-2',
        projectId: testProjectId,
        timestamp: new Date().toISOString(),
        completedSteps: [],
        tokenUsageSnapshot: { input: 0, output: 0, total: 0 },
        retryCount: 0,
      };

      await service.saveRecoveryState(testProjectId, 'exec-2', state);

      // Verify temp file is cleaned up
      const recoveryDir = path.join(process.cwd(), 'projects', testProjectId, 'recovery');
      const files = await fs.readdir(recoveryDir);
      const tempFiles = files.filter(f => f.endsWith('.tmp'));
      expect(tempFiles).toHaveLength(0);
    });

    it('should create recovery directory if it does not exist', async () => {
      const state: ErrorRecoveryState = {
        executionId: 'exec-3',
        projectId: testProjectId,
        timestamp: new Date().toISOString(),
        completedSteps: [],
        tokenUsageSnapshot: { input: 0, output: 0, total: 0 },
        retryCount: 0,
      };

      await service.saveRecoveryState(testProjectId, 'exec-3', state);

      const recoveryDir = path.join(process.cwd(), 'projects', testProjectId, 'recovery');
      const stat = await fs.stat(recoveryDir);
      expect(stat.isDirectory()).toBe(true);
    });
  });

  describe('loadRecoveryState', () => {
    it('should load recovery state from filesystem', async () => {
      const state: ErrorRecoveryState = {
        executionId: 'exec-4',
        projectId: testProjectId,
        timestamp: new Date().toISOString(),
        completedSteps: [{
          id: 'step-1',
          nodeId: 'node-1',
          type: 'agent',
          status: 'completed',
          output: 'test output',
        }],
        tokenUsageSnapshot: { input: 200, output: 100, total: 300 },
        retryCount: 1,
      };

      await service.saveRecoveryState(testProjectId, 'exec-4', state);
      const loaded = await service.loadRecoveryState(testProjectId, 'exec-4');

      expect(loaded).not.toBeNull();
      expect(loaded?.executionId).toBe('exec-4');
      expect(loaded?.retryCount).toBe(1);
      expect(loaded?.completedSteps).toHaveLength(1);
      expect(loaded?.completedSteps[0].output).toBe('test output');
    });

    it('should return null for non-existent recovery state', async () => {
      const loaded = await service.loadRecoveryState(testProjectId, 'non-existent');
      expect(loaded).toBeNull();
    });

    it('should throw error for invalid JSON', async () => {
      const recoveryDir = path.join(process.cwd(), 'projects', testProjectId, 'recovery');
      await fs.mkdir(recoveryDir, { recursive: true });
      const recoveryPath = path.join(recoveryDir, 'invalid.json');
      await fs.writeFile(recoveryPath, 'invalid json', 'utf-8');

      await expect(service.loadRecoveryState(testProjectId, 'invalid')).rejects.toThrow();
    });
  });

  describe('deleteRecoveryState', () => {
    it('should delete recovery state from filesystem', async () => {
      const state: ErrorRecoveryState = {
        executionId: 'exec-5',
        projectId: testProjectId,
        timestamp: new Date().toISOString(),
        completedSteps: [],
        tokenUsageSnapshot: { input: 0, output: 0, total: 0 },
        retryCount: 0,
      };

      await service.saveRecoveryState(testProjectId, 'exec-5', state);
      await service.deleteRecoveryState(testProjectId, 'exec-5');

      const loaded = await service.loadRecoveryState(testProjectId, 'exec-5');
      expect(loaded).toBeNull();
    });

    it('should not throw error if recovery state does not exist', async () => {
      await expect(
        service.deleteRecoveryState(testProjectId, 'non-existent'),
      ).resolves.toBeUndefined();
    });
  });

  describe('listRecoverableExecutions', () => {
    it('should list all recovery states', async () => {
      await service.saveRecoveryState(testProjectId, 'exec-1', {
        executionId: 'exec-1',
        projectId: testProjectId,
        timestamp: new Date(Date.now() - 1000).toISOString(),
        completedSteps: [],
        tokenUsageSnapshot: { input: 0, output: 0, total: 0 },
        retryCount: 0,
      });

      await service.saveRecoveryState(testProjectId, 'exec-2', {
        executionId: 'exec-2',
        projectId: testProjectId,
        timestamp: new Date().toISOString(),
        completedSteps: [],
        tokenUsageSnapshot: { input: 0, output: 0, total: 0 },
        retryCount: 0,
      });

      const states = await service.listRecoverableExecutions(testProjectId);

      expect(states).toHaveLength(2);
    });

    it('should sort states by timestamp descending (newest first)', async () => {
      const now = Date.now();

      await service.saveRecoveryState(testProjectId, 'exec-old', {
        executionId: 'exec-old',
        projectId: testProjectId,
        timestamp: new Date(now - 5000).toISOString(),
        completedSteps: [],
        tokenUsageSnapshot: { input: 0, output: 0, total: 0 },
        retryCount: 0,
      });

      await service.saveRecoveryState(testProjectId, 'exec-new', {
        executionId: 'exec-new',
        projectId: testProjectId,
        timestamp: new Date(now).toISOString(),
        completedSteps: [],
        tokenUsageSnapshot: { input: 0, output: 0, total: 0 },
        retryCount: 0,
      });

      const states = await service.listRecoverableExecutions(testProjectId);

      expect(states[0].executionId).toBe('exec-new');
      expect(states[1].executionId).toBe('exec-old');
    });

    it('should return empty array for non-existent project', async () => {
      const states = await service.listRecoverableExecutions('non-existent-project');
      expect(states).toHaveLength(0);
    });
  });

  describe('isRetryableError', () => {
    it('should identify rate limit errors as retryable', () => {
      const error = new Error('Rate limit exceeded');
      expect(service.isRetryableError(error)).toBe(true);
    });

    it('should identify timeout errors as retryable', () => {
      const error = new Error('Request timeout');
      expect(service.isRetryableError(error)).toBe(true);
    });

    it('should identify network errors as retryable', () => {
      expect(service.isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
      expect(service.isRetryableError(new Error('ETIMEDOUT'))).toBe(true);
      expect(service.isRetryableError(new Error('ENOTFOUND'))).toBe(true);
    });

    it('should identify HTTP 429 as retryable', () => {
      const error = new Error('HTTP 429: Too Many Requests');
      expect(service.isRetryableError(error)).toBe(true);
    });

    it('should identify 5xx errors as retryable', () => {
      expect(service.isRetryableError(new Error('HTTP 500'))).toBe(true);
      expect(service.isRetryableError(new Error('HTTP 502'))).toBe(true);
      expect(service.isRetryableError(new Error('HTTP 503'))).toBe(true);
      expect(service.isRetryableError(new Error('HTTP 504'))).toBe(true);
    });

    it('should not identify validation errors as retryable', () => {
      const error = new Error('Invalid workflow');
      expect(service.isRetryableError(error)).toBe(false);
    });

    it('should not identify authentication errors as retryable', () => {
      const error = new Error('Unauthorized');
      expect(service.isRetryableError(error)).toBe(false);
    });

    it('should not identify 4xx errors (except 429) as retryable', () => {
      expect(service.isRetryableError(new Error('HTTP 400'))).toBe(false);
      expect(service.isRetryableError(new Error('HTTP 401'))).toBe(false);
      expect(service.isRetryableError(new Error('HTTP 404'))).toBe(false);
    });
  });

  describe('calculateRetryDelay', () => {
    it('should use exponential backoff by default', () => {
      const delay1 = service.calculateRetryDelay(1);
      const delay2 = service.calculateRetryDelay(2);
      const delay3 = service.calculateRetryDelay(3);
      const delay4 = service.calculateRetryDelay(4);

      expect(delay1).toBe(1000);  // 1s * 2^0 = 1s
      expect(delay2).toBe(2000);  // 1s * 2^1 = 2s
      expect(delay3).toBe(4000);  // 1s * 2^2 = 4s
      expect(delay4).toBe(8000);  // 1s * 2^3 = 8s
    });

    it('should use fixed delay when exponentialBackoff is false', () => {
      const config = { maxRetries: 3, retryDelay: 1000, exponentialBackoff: false };

      const delay1 = service.calculateRetryDelay(1, config);
      const delay2 = service.calculateRetryDelay(2, config);
      const delay3 = service.calculateRetryDelay(3, config);

      expect(delay1).toBe(1000);
      expect(delay2).toBe(1000);
      expect(delay3).toBe(1000);
    });

    it('should respect custom retry delay', () => {
      const config = { maxRetries: 3, retryDelay: 500, exponentialBackoff: true };

      const delay1 = service.calculateRetryDelay(1, config);
      const delay2 = service.calculateRetryDelay(2, config);

      expect(delay1).toBe(500);   // 500ms
      expect(delay2).toBe(1000);  // 1s
    });
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await service.executeWithRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable error', async () => {
      let attempts = 0;
      const fn = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Rate limit exceeded');
        }
        return 'success';
      });

      const result = await service.executeWithRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable error', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Invalid input'));

      await expect(service.executeWithRetry(fn)).rejects.toThrow('Invalid input');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback on retry', async () => {
      let attempts = 0;
      const fn = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Timeout');
        }
        return 'success';
      });

      const onRetry = vi.fn();

      await service.executeWithRetry(fn, undefined, onRetry);

      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should throw last error after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('ETIMEDOUT'));

      const config = { maxRetries: 2, retryDelay: 100, exponentialBackoff: false };

      await expect(service.executeWithRetry(fn, config)).rejects.toThrow('ETIMEDOUT');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should respect custom retry config', async () => {
      let attempts = 0;
      const fn = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 5) {
          throw new Error('Network error');
        }
        return 'success';
      });

      const config = { maxRetries: 5, retryDelay: 100, exponentialBackoff: false };

      const result = await service.executeWithRetry(fn, config);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(5);
    });
  });

  describe('createCheckpoint', () => {
    it('should create recovery checkpoint from execution', () => {
      const execution = {
        id: 'exec-1',
        projectId: testProjectId,
        status: 'failed' as const,
        steps: [
          { id: 'step-1', status: 'completed' as const, output: 'result 1' },
          { id: 'step-2', status: 'completed' as const, output: 'result 2' },
        ],
        output: 'partial output',
        tokenUsage: { input: 500, output: 300, total: 800 },
        error: 'Something went wrong',
      };

      const checkpoint = service.createCheckpoint(execution);

      expect(checkpoint.executionId).toBe('exec-1');
      expect(checkpoint.projectId).toBe(testProjectId);
      expect(checkpoint.lastSuccessfulStep?.id).toBe('step-2');
      expect(checkpoint.completedSteps).toHaveLength(2);
      expect(checkpoint.partialOutput).toBe('partial output');
      expect(checkpoint.tokenUsageSnapshot.total).toBe(800);
      expect(checkpoint.error).toBe('Something went wrong');
      expect(checkpoint.retryCount).toBe(0);
    });

    it('should handle execution with no steps', () => {
      const execution = {
        id: 'exec-2',
        projectId: testProjectId,
        status: 'failed' as const,
        steps: [],
        tokenUsage: { input: 0, output: 0, total: 0 },
      };

      const checkpoint = service.createCheckpoint(execution);

      expect(checkpoint.lastSuccessfulStep).toBeUndefined();
      expect(checkpoint.completedSteps).toHaveLength(0);
    });
  });

  describe('cleanupOldRecoveryStates', () => {
    it('should delete old recovery states', async () => {
      const oldState: ErrorRecoveryState = {
        executionId: 'old-exec',
        projectId: testProjectId,
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        completedSteps: [],
        tokenUsageSnapshot: { input: 0, output: 0, total: 0 },
        retryCount: 0,
      };

      const recentState: ErrorRecoveryState = {
        executionId: 'recent-exec',
        projectId: testProjectId,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        completedSteps: [],
        tokenUsageSnapshot: { input: 0, output: 0, total: 0 },
        retryCount: 0,
      };

      await service.saveRecoveryState(testProjectId, 'old-exec', oldState);
      await service.saveRecoveryState(testProjectId, 'recent-exec', recentState);

      const deletedCount = await service.cleanupOldRecoveryStates(testProjectId, 7);

      expect(deletedCount).toBe(1);

      const oldLoaded = await service.loadRecoveryState(testProjectId, 'old-exec');
      expect(oldLoaded).toBeNull();

      const recentLoaded = await service.loadRecoveryState(testProjectId, 'recent-exec');
      expect(recentLoaded).not.toBeNull();
    });

    it('should return 0 for non-existent project', async () => {
      const deletedCount = await service.cleanupOldRecoveryStates('non-existent', 7);
      expect(deletedCount).toBe(0);
    });

    it('should respect custom max age', async () => {
      const state: ErrorRecoveryState = {
        executionId: 'exec-1',
        projectId: testProjectId,
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        completedSteps: [],
        tokenUsageSnapshot: { input: 0, output: 0, total: 0 },
        retryCount: 0,
      };

      await service.saveRecoveryState(testProjectId, 'exec-1', state);

      // Should not delete (max age is 7 days)
      let deletedCount = await service.cleanupOldRecoveryStates(testProjectId, 7);
      expect(deletedCount).toBe(0);

      // Should delete (max age is 3 days)
      deletedCount = await service.cleanupOldRecoveryStates(testProjectId, 3);
      expect(deletedCount).toBe(1);
    });
  });
});
