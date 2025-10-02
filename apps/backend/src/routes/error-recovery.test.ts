import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { ErrorRecoveryService } from '../services/ErrorRecoveryService';
import { createErrorRecoveryRoutes } from './error-recovery';
import type { ErrorRecoveryState } from '@cloutagent/types';

describe('Error Recovery Routes', () => {
  let app: express.Application;
  let recoveryService: ErrorRecoveryService;
  const testProjectId = `test-proj-${Date.now()}`;

  beforeEach(() => {
    recoveryService = new ErrorRecoveryService();
    app = express();
    app.use(express.json());
    app.use(
      '/api/projects/:projectId/recovery',
      createErrorRecoveryRoutes(recoveryService),
    );
  });

  afterEach(async () => {
    const projectPath = path.join(process.cwd(), 'projects', testProjectId);
    await fs.rm(projectPath, { recursive: true, force: true });
  });

  describe('GET /api/projects/:projectId/recovery', () => {
    it('should list all recoverable executions', async () => {
      const state1: ErrorRecoveryState = {
        executionId: 'exec-1',
        projectId: testProjectId,
        timestamp: new Date().toISOString(),
        completedSteps: [],
        tokenUsageSnapshot: { input: 100, output: 50, total: 150 },
        retryCount: 0,
      };

      const state2: ErrorRecoveryState = {
        executionId: 'exec-2',
        projectId: testProjectId,
        timestamp: new Date().toISOString(),
        completedSteps: [],
        tokenUsageSnapshot: { input: 200, output: 100, total: 300 },
        retryCount: 1,
      };

      await recoveryService.saveRecoveryState(testProjectId, 'exec-1', state1);
      await recoveryService.saveRecoveryState(testProjectId, 'exec-2', state2);

      const response = await request(app)
        .get(`/api/projects/${testProjectId}/recovery`)
        .expect(200);

      expect(response.body.recoveryStates).toHaveLength(2);
      expect(response.body.recoveryStates[0].executionId).toBeDefined();
      expect(response.body.recoveryStates[1].executionId).toBeDefined();
    });

    it('should return empty array for project with no recovery states', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}/recovery`)
        .expect(200);

      expect(response.body.recoveryStates).toHaveLength(0);
    });

    it('should handle service errors', async () => {
      // Create invalid recovery directory to trigger error
      const recoveryDir = path.join(process.cwd(), 'projects', testProjectId, 'recovery');
      await fs.mkdir(recoveryDir, { recursive: true });
      await fs.writeFile(path.join(recoveryDir, 'invalid.json'), 'invalid json', 'utf-8');

      const response = await request(app)
        .get(`/api/projects/${testProjectId}/recovery`)
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/projects/:projectId/recovery/:executionId', () => {
    it('should get recovery state by execution ID', async () => {
      const state: ErrorRecoveryState = {
        executionId: 'exec-1',
        projectId: testProjectId,
        timestamp: new Date().toISOString(),
        completedSteps: [
          { id: 'step-1', status: 'completed' as const, output: 'result' },
        ],
        tokenUsageSnapshot: { input: 100, output: 50, total: 150 },
        retryCount: 2,
      };

      await recoveryService.saveRecoveryState(testProjectId, 'exec-1', state);

      const response = await request(app)
        .get(`/api/projects/${testProjectId}/recovery/exec-1`)
        .expect(200);

      expect(response.body.recoveryState.executionId).toBe('exec-1');
      expect(response.body.recoveryState.retryCount).toBe(2);
      expect(response.body.recoveryState.completedSteps).toHaveLength(1);
    });

    it('should return 404 for non-existent recovery state', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}/recovery/non-existent`)
        .expect(404);

      expect(response.body.error).toBe('Recovery state not found');
    });

    it('should handle service errors', async () => {
      // Create invalid recovery file
      const recoveryDir = path.join(process.cwd(), 'projects', testProjectId, 'recovery');
      await fs.mkdir(recoveryDir, { recursive: true });
      await fs.writeFile(path.join(recoveryDir, 'invalid.json'), 'invalid json', 'utf-8');

      const response = await request(app)
        .get(`/api/projects/${testProjectId}/recovery/invalid`)
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/projects/:projectId/recovery/:executionId', () => {
    it('should delete recovery state', async () => {
      const state: ErrorRecoveryState = {
        executionId: 'exec-1',
        projectId: testProjectId,
        timestamp: new Date().toISOString(),
        completedSteps: [],
        tokenUsageSnapshot: { input: 0, output: 0, total: 0 },
        retryCount: 0,
      };

      await recoveryService.saveRecoveryState(testProjectId, 'exec-1', state);

      await request(app)
        .delete(`/api/projects/${testProjectId}/recovery/exec-1`)
        .expect(204);

      const loaded = await recoveryService.loadRecoveryState(testProjectId, 'exec-1');
      expect(loaded).toBeNull();
    });

    it('should succeed even if recovery state does not exist', async () => {
      await request(app)
        .delete(`/api/projects/${testProjectId}/recovery/non-existent`)
        .expect(204);
    });
  });

  describe('POST /api/projects/:projectId/recovery/cleanup', () => {
    it('should cleanup old recovery states', async () => {
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
        timestamp: new Date().toISOString(),
        completedSteps: [],
        tokenUsageSnapshot: { input: 0, output: 0, total: 0 },
        retryCount: 0,
      };

      await recoveryService.saveRecoveryState(testProjectId, 'old-exec', oldState);
      await recoveryService.saveRecoveryState(testProjectId, 'recent-exec', recentState);

      const response = await request(app)
        .post(`/api/projects/${testProjectId}/recovery/cleanup`)
        .send({ maxAgeDays: 7 })
        .expect(200);

      expect(response.body.deletedCount).toBe(1);

      const oldLoaded = await recoveryService.loadRecoveryState(testProjectId, 'old-exec');
      expect(oldLoaded).toBeNull();

      const recentLoaded = await recoveryService.loadRecoveryState(testProjectId, 'recent-exec');
      expect(recentLoaded).not.toBeNull();
    });

    it('should use default maxAgeDays of 7 if not provided', async () => {
      const state: ErrorRecoveryState = {
        executionId: 'exec-1',
        projectId: testProjectId,
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        completedSteps: [],
        tokenUsageSnapshot: { input: 0, output: 0, total: 0 },
        retryCount: 0,
      };

      await recoveryService.saveRecoveryState(testProjectId, 'exec-1', state);

      const response = await request(app)
        .post(`/api/projects/${testProjectId}/recovery/cleanup`)
        .send({})
        .expect(200);

      expect(response.body.deletedCount).toBe(1);
    });

    it('should return 0 for project with no old states', async () => {
      const response = await request(app)
        .post(`/api/projects/${testProjectId}/recovery/cleanup`)
        .send({ maxAgeDays: 7 })
        .expect(200);

      expect(response.body.deletedCount).toBe(0);
    });

    it('should handle service errors', async () => {
      // Create invalid recovery directory to trigger error
      const recoveryDir = path.join(process.cwd(), 'projects', testProjectId, 'recovery');
      await fs.mkdir(recoveryDir, { recursive: true });
      await fs.writeFile(path.join(recoveryDir, 'invalid.json'), 'invalid json', 'utf-8');

      const response = await request(app)
        .post(`/api/projects/${testProjectId}/recovery/cleanup`)
        .send({ maxAgeDays: 7 })
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });
});
