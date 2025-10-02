import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { WorkflowService } from '../services/WorkflowService';
import { createWorkflowRoutes } from './workflows';
import { WorkflowData } from '@cloutagent/types';

describe('Workflow Routes', () => {
  let app: Express;
  let workflowService: WorkflowService;

  beforeEach(() => {
    // Create Express app
    app = express();
    app.use(express.json());

    // Create workflow service
    workflowService = new WorkflowService('./test-projects');

    // Mount routes
    app.use(
      '/api/projects/:projectId/workflow',
      createWorkflowRoutes(workflowService),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/projects/:projectId/workflow/save', () => {
    it('should save workflow successfully', async () => {
      const workflow: WorkflowData = {
        nodes: [
          {
            id: 'node-1',
            type: 'agent',
            data: { config: {} },
            position: { x: 0, y: 0 },
          },
        ],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: '1.0.0',
      };

      vi.spyOn(workflowService, 'saveWorkflow').mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/projects/test-project/workflow/save')
        .send(workflow)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Workflow saved',
      });
      expect(workflowService.saveWorkflow).toHaveBeenCalledWith(
        'test-project',
        workflow,
      );
    });

    it('should return 400 on validation error', async () => {
      const invalidWorkflow = {
        nodes: [{ id: 'invalid' }], // Missing required fields
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      };

      vi.spyOn(workflowService, 'saveWorkflow').mockRejectedValue(
        new Error('Invalid node structure'),
      );

      const response = await request(app)
        .post('/api/projects/test-project/workflow/save')
        .send(invalidWorkflow)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid node structure',
      });
    });

    it('should handle large workflows', async () => {
      const largeWorkflow: WorkflowData = {
        nodes: Array.from({ length: 100 }, (_, i) => ({
          id: `node-${i}`,
          type: 'agent' as const,
          data: { config: {} },
          position: { x: i * 100, y: i * 100 },
        })),
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: '1.0.0',
      };

      vi.spyOn(workflowService, 'saveWorkflow').mockResolvedValue(undefined);

      await request(app)
        .post('/api/projects/test-project/workflow/save')
        .send(largeWorkflow)
        .expect(200);

      expect(workflowService.saveWorkflow).toHaveBeenCalledWith(
        'test-project',
        largeWorkflow,
      );
    });
  });

  describe('GET /api/projects/:projectId/workflow', () => {
    it('should load workflow successfully', async () => {
      const workflow: WorkflowData = {
        nodes: [
          {
            id: 'node-1',
            type: 'agent',
            data: { config: {} },
            position: { x: 0, y: 0 },
          },
        ],
        edges: [],
        viewport: { x: 100, y: 200, zoom: 1.5 },
        version: '1.0.0',
      };

      vi.spyOn(workflowService, 'loadWorkflow').mockResolvedValue(workflow);

      const response = await request(app)
        .get('/api/projects/test-project/workflow')
        .expect(200);

      expect(response.body).toEqual({ workflow });
      expect(workflowService.loadWorkflow).toHaveBeenCalledWith('test-project');
    });

    it('should return empty workflow if not found', async () => {
      const emptyWorkflow: WorkflowData = {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: '1.0.0',
      };

      vi.spyOn(workflowService, 'loadWorkflow').mockResolvedValue(
        emptyWorkflow,
      );

      const response = await request(app)
        .get('/api/projects/non-existent/workflow')
        .expect(200);

      expect(response.body).toEqual({ workflow: emptyWorkflow });
    });

    it('should return 500 on server error', async () => {
      vi.spyOn(workflowService, 'loadWorkflow').mockRejectedValue(
        new Error('Database connection failed'),
      );

      const response = await request(app)
        .get('/api/projects/test-project/workflow')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Database connection failed',
      });
    });
  });

  describe('POST /api/projects/:projectId/workflow/autosave', () => {
    it('should autosave workflow successfully', async () => {
      const workflow: WorkflowData = {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: '1.0.0',
      };

      vi.spyOn(workflowService, 'autosaveWorkflow').mockResolvedValue(
        undefined,
      );

      const response = await request(app)
        .post('/api/projects/test-project/workflow/autosave')
        .send(workflow)
        .expect(200);

      expect(response.body).toEqual({ success: true });
      expect(workflowService.autosaveWorkflow).toHaveBeenCalledWith(
        'test-project',
        workflow,
      );
    });

    it('should handle autosave errors gracefully', async () => {
      const workflow: WorkflowData = {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: '1.0.0',
      };

      vi.spyOn(workflowService, 'autosaveWorkflow').mockRejectedValue(
        new Error('Disk full'),
      );

      const response = await request(app)
        .post('/api/projects/test-project/workflow/autosave')
        .send(workflow)
        .expect(500);

      expect(response.body).toEqual({ error: 'Disk full' });
    });

    it('should accept partial workflow data for autosave', async () => {
      const partialWorkflow = {
        nodes: [],
        edges: [],
        viewport: { x: 50, y: 50, zoom: 1 },
        version: '1.0.0',
      };

      vi.spyOn(workflowService, 'autosaveWorkflow').mockResolvedValue(
        undefined,
      );

      await request(app)
        .post('/api/projects/test-project/workflow/autosave')
        .send(partialWorkflow)
        .expect(200);
    });
  });

  describe('Edge cases', () => {
    it('should handle missing request body', async () => {
      const response = await request(app)
        .post('/api/projects/test-project/workflow/save')
        .send()
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/projects/test-project/workflow/save')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toBeDefined();
    });

    it('should handle special characters in project ID', async () => {
      const workflow: WorkflowData = {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: '1.0.0',
      };

      vi.spyOn(workflowService, 'saveWorkflow').mockResolvedValue(undefined);

      await request(app)
        .post('/api/projects/project-with-dashes-123/workflow/save')
        .send(workflow)
        .expect(200);

      expect(workflowService.saveWorkflow).toHaveBeenCalledWith(
        'project-with-dashes-123',
        workflow,
      );
    });
  });
});
