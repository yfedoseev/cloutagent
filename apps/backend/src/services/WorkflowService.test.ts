import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { WorkflowService } from './WorkflowService';
import { WorkflowData } from '@cloutagent/types';

describe('WorkflowService', () => {
  let workflowService: WorkflowService;
  const testProjectsDir = path.join(process.cwd(), 'test-projects');
  const testProjectId = 'test-project-123';

  beforeEach(async () => {
    workflowService = new WorkflowService(testProjectsDir);
    // Clean up test directory
    await fs.rm(testProjectsDir, { recursive: true, force: true });
    await fs.mkdir(testProjectsDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up after tests
    await fs.rm(testProjectsDir, { recursive: true, force: true });
  });

  describe('saveWorkflow', () => {
    it('should save workflow to project file', async () => {
      const workflow: WorkflowData = {
        nodes: [
          {
            id: 'node-1',
            type: 'agent',
            data: { config: { name: 'Test Agent' } },
            position: { x: 100, y: 100 },
          },
        ],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: '1.0.0',
      };

      await workflowService.saveWorkflow(testProjectId, workflow);

      const workflowPath = path.join(
        testProjectsDir,
        testProjectId,
        'workflow.json',
      );
      const savedContent = await fs.readFile(workflowPath, 'utf-8');
      const savedWorkflow = JSON.parse(savedContent);

      expect(savedWorkflow).toEqual(workflow);
    });

    it('should update project updatedAt timestamp', async () => {
      const workflow: WorkflowData = {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: '1.0.0',
      };

      // Create initial metadata
      const metadataPath = path.join(
        testProjectsDir,
        testProjectId,
        'metadata.json',
      );
      await fs.mkdir(path.dirname(metadataPath), { recursive: true });
      await fs.writeFile(
        metadataPath,
        JSON.stringify({
          id: testProjectId,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        }),
        'utf-8',
      );

      await workflowService.saveWorkflow(testProjectId, workflow);

      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
      expect(metadata.updatedAt).not.toBe('2025-01-01T00:00:00.000Z');
    });

    it('should create atomic write (temp file + rename)', async () => {
      const workflow: WorkflowData = {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: '1.0.0',
      };

      await workflowService.saveWorkflow(testProjectId, workflow);

      // Verify temp file doesn't exist after save
      const tempPath = path.join(
        testProjectsDir,
        testProjectId,
        'workflow.json.tmp',
      );
      await expect(fs.access(tempPath)).rejects.toThrow();
    });

    it('should validate nodes have required fields', async () => {
      const invalidWorkflow: any = {
        nodes: [{ id: 'node-1' }], // Missing type and position
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: '1.0.0',
      };

      await expect(
        workflowService.saveWorkflow(testProjectId, invalidWorkflow),
      ).rejects.toThrow('Invalid node structure');
    });

    it('should validate edges reference valid nodes', async () => {
      const invalidWorkflow: WorkflowData = {
        nodes: [
          {
            id: 'node-1',
            type: 'agent',
            data: {},
            position: { x: 0, y: 0 },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-999', // Non-existent node
          },
        ],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: '1.0.0',
      };

      await expect(
        workflowService.saveWorkflow(testProjectId, invalidWorkflow),
      ).rejects.toThrow('Edge references non-existent node');
    });

    it('should save viewport settings', async () => {
      const workflow: WorkflowData = {
        nodes: [],
        edges: [],
        viewport: { x: 150, y: 250, zoom: 1.5 },
        version: '1.0.0',
      };

      await workflowService.saveWorkflow(testProjectId, workflow);

      const loaded = await workflowService.loadWorkflow(testProjectId);
      expect(loaded?.viewport).toEqual({ x: 150, y: 250, zoom: 1.5 });
    });

    it('should add version if not present', async () => {
      const workflowWithoutVersion: any = {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      };

      await workflowService.saveWorkflow(
        testProjectId,
        workflowWithoutVersion,
      );

      const loaded = await workflowService.loadWorkflow(testProjectId);
      expect(loaded?.version).toBe('1.0.0');
    });
  });

  describe('loadWorkflow', () => {
    it('should load workflow from project', async () => {
      const workflow: WorkflowData = {
        nodes: [
          {
            id: 'node-1',
            type: 'agent',
            data: { config: { name: 'Test' } },
            position: { x: 0, y: 0 },
          },
        ],
        edges: [{ id: 'edge-1', source: 'node-1', target: 'node-1' }],
        viewport: { x: 100, y: 200, zoom: 0.8 },
        version: '1.0.0',
      };

      await workflowService.saveWorkflow(testProjectId, workflow);
      const loaded = await workflowService.loadWorkflow(testProjectId);

      expect(loaded).toEqual(workflow);
    });

    it('should return empty workflow if project not found', async () => {
      const loaded = await workflowService.loadWorkflow('non-existent-project');

      expect(loaded).toEqual({
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: '1.0.0',
      });
    });

    it('should handle missing workflow gracefully', async () => {
      const loaded = await workflowService.loadWorkflow(testProjectId);

      expect(loaded).toEqual({
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: '1.0.0',
      });
    });

    it('should validate loaded workflow structure', async () => {
      // Manually create invalid workflow file
      const workflowPath = path.join(
        testProjectsDir,
        testProjectId,
        'workflow.json',
      );
      await fs.mkdir(path.dirname(workflowPath), { recursive: true });
      await fs.writeFile(
        workflowPath,
        JSON.stringify({
          nodes: [{ id: 'invalid' }], // Missing required fields
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
        }),
        'utf-8',
      );

      await expect(
        workflowService.loadWorkflow(testProjectId),
      ).rejects.toThrow('Invalid node structure');
    });
  });

  describe('autosaveWorkflow', () => {
    it('should create autosave backup file', async () => {
      const workflow: WorkflowData = {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: '1.0.0',
      };

      await workflowService.autosaveWorkflow(testProjectId, workflow);

      const autosavePath = path.join(
        testProjectsDir,
        testProjectId,
        'workflow.autosave.json',
      );
      const autosaveContent = await fs.readFile(autosavePath, 'utf-8');
      const autosaveWorkflow = JSON.parse(autosaveContent);

      expect(autosaveWorkflow).toEqual(workflow);
    });

    it('should not update project metadata', async () => {
      const workflow: WorkflowData = {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: '1.0.0',
      };

      const metadataPath = path.join(
        testProjectsDir,
        testProjectId,
        'metadata.json',
      );
      await fs.mkdir(path.dirname(metadataPath), { recursive: true });
      const originalTime = '2025-01-01T00:00:00.000Z';
      await fs.writeFile(
        metadataPath,
        JSON.stringify({
          id: testProjectId,
          createdAt: originalTime,
          updatedAt: originalTime,
        }),
        'utf-8',
      );

      await workflowService.autosaveWorkflow(testProjectId, workflow);

      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
      expect(metadata.updatedAt).toBe(originalTime);
    });
  });

  describe('validation', () => {
    it('should reject invalid node structures - missing id', async () => {
      const invalidWorkflow: any = {
        nodes: [
          { type: 'agent', data: {}, position: { x: 0, y: 0 } }, // Missing id
        ],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: '1.0.0',
      };

      await expect(
        workflowService.saveWorkflow(testProjectId, invalidWorkflow),
      ).rejects.toThrow('Invalid node structure');
    });

    it('should reject invalid edge structures - missing source', async () => {
      const invalidWorkflow: any = {
        nodes: [
          {
            id: 'node-1',
            type: 'agent',
            data: {},
            position: { x: 0, y: 0 },
          },
        ],
        edges: [{ id: 'edge-1', target: 'node-1' }], // Missing source
        viewport: { x: 0, y: 0, zoom: 1 },
        version: '1.0.0',
      };

      await expect(
        workflowService.saveWorkflow(testProjectId, invalidWorkflow),
      ).rejects.toThrow('Invalid edge structure');
    });

    it('should reject invalid viewport', async () => {
      const invalidWorkflow: any = {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0 }, // Missing zoom
        version: '1.0.0',
      };

      await expect(
        workflowService.saveWorkflow(testProjectId, invalidWorkflow),
      ).rejects.toThrow('Invalid viewport structure');
    });

    it('should reject non-array nodes', async () => {
      const invalidWorkflow: any = {
        nodes: {},
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        version: '1.0.0',
      };

      await expect(
        workflowService.saveWorkflow(testProjectId, invalidWorkflow),
      ).rejects.toThrow('Workflow nodes must be an array');
    });

    it('should reject non-array edges', async () => {
      const invalidWorkflow: any = {
        nodes: [],
        edges: {},
        viewport: { x: 0, y: 0, zoom: 1 },
        version: '1.0.0',
      };

      await expect(
        workflowService.saveWorkflow(testProjectId, invalidWorkflow),
      ).rejects.toThrow('Workflow edges must be an array');
    });
  });

  describe('getWorkflowVersions', () => {
    it('should return empty array if no versions exist', async () => {
      const versions = await workflowService.getWorkflowVersions(testProjectId);
      expect(versions).toEqual([]);
    });

    it('should list saved versions in reverse chronological order', async () => {
      const versionsDir = path.join(
        testProjectsDir,
        testProjectId,
        'versions',
      );
      await fs.mkdir(versionsDir, { recursive: true });

      await fs.writeFile(
        path.join(versionsDir, '2025-01-01.json'),
        '{}',
        'utf-8',
      );
      await fs.writeFile(
        path.join(versionsDir, '2025-01-02.json'),
        '{}',
        'utf-8',
      );
      await fs.writeFile(
        path.join(versionsDir, '2025-01-03.json'),
        '{}',
        'utf-8',
      );

      const versions = await workflowService.getWorkflowVersions(testProjectId);
      expect(versions).toEqual([
        '2025-01-03.json',
        '2025-01-02.json',
        '2025-01-01.json',
      ]);
    });
  });
});
