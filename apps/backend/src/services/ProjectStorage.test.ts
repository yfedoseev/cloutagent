import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { ProjectStorage } from './ProjectStorage';

describe('ProjectStorage', () => {
  let storage: ProjectStorage;
  let testDir: string;

  beforeEach(async () => {
    // Create temporary directory for tests
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cloutagent-test-'));
    storage = new ProjectStorage(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('create', () => {
    it('should create a new project with generated ID and timestamps', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'A test project',
        agent: {
          id: 'agent-1',
          name: 'Test Agent',
          systemPrompt: 'You are a helpful assistant',
          model: 'claude-sonnet-4-5' as const,
          temperature: 0.7,
          maxTokens: 1000,
          enabledTools: ['read', 'write'],
        },
        subagents: [],
        hooks: [],
        mcps: [],
        apiKey: 'test-api-key',
        limits: {
          maxTokens: 10000,
          maxCost: 1.0,
          timeout: 30000,
        },
      };

      const project = await storage.create(projectData);

      expect(project.id).toBeDefined();
      expect(project.id).toMatch(
        /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i,
      );
      expect(project.name).toBe(projectData.name);
      expect(project.description).toBe(projectData.description);
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
      expect(new Date(project.createdAt)).toBeInstanceOf(Date);
      expect(new Date(project.updatedAt)).toBeInstanceOf(Date);
    });

    it('should create project directory and metadata.json file', async () => {
      const projectData = {
        name: 'Test Project',
        agent: {
          id: 'agent-1',
          name: 'Test Agent',
          systemPrompt: 'You are a helpful assistant',
          model: 'claude-sonnet-4-5' as const,
          temperature: 0.7,
          maxTokens: 1000,
          enabledTools: [],
        },
        subagents: [],
        hooks: [],
        mcps: [],
        apiKey: 'test-api-key',
        limits: {
          maxTokens: 10000,
          maxCost: 1.0,
          timeout: 30000,
        },
      };

      const project = await storage.create(projectData);

      const projectDir = path.join(testDir, project.id);
      const metadataPath = path.join(projectDir, 'metadata.json');

      const dirExists = await fs
        .stat(projectDir)
        .then(() => true)
        .catch(() => false);
      const fileExists = await fs
        .stat(metadataPath)
        .then(() => true)
        .catch(() => false);

      expect(dirExists).toBe(true);
      expect(fileExists).toBe(true);

      const content = await fs.readFile(metadataPath, 'utf-8');
      const savedProject = JSON.parse(content);
      expect(savedProject.id).toBe(project.id);
      expect(savedProject.name).toBe(project.name);
    });

    it('should write valid formatted JSON', async () => {
      const projectData = {
        name: 'Test Project',
        agent: {
          id: 'agent-1',
          name: 'Test Agent',
          systemPrompt: 'You are a helpful assistant',
          model: 'claude-sonnet-4-5' as const,
          temperature: 0.7,
          maxTokens: 1000,
          enabledTools: [],
        },
        subagents: [],
        hooks: [],
        mcps: [],
        apiKey: 'test-api-key',
        limits: {
          maxTokens: 10000,
          maxCost: 1.0,
          timeout: 30000,
        },
      };

      const project = await storage.create(projectData);
      const metadataPath = path.join(testDir, project.id, 'metadata.json');
      const content = await fs.readFile(metadataPath, 'utf-8');

      // Should be pretty-printed
      expect(content).toContain('\n');
      expect(content).toContain('  '); // Indentation

      // Should be valid JSON
      expect(() => JSON.parse(content)).not.toThrow();
    });
  });

  describe('read', () => {
    it('should return null for non-existent project', async () => {
      const project = await storage.read('non-existent-id');
      expect(project).toBeNull();
    });

    it('should return project for valid ID', async () => {
      const projectData = {
        name: 'Test Project',
        agent: {
          id: 'agent-1',
          name: 'Test Agent',
          systemPrompt: 'You are a helpful assistant',
          model: 'claude-sonnet-4-5' as const,
          temperature: 0.7,
          maxTokens: 1000,
          enabledTools: [],
        },
        subagents: [],
        hooks: [],
        mcps: [],
        apiKey: 'test-api-key',
        limits: {
          maxTokens: 10000,
          maxCost: 1.0,
          timeout: 30000,
        },
      };

      const created = await storage.create(projectData);
      const retrieved = await storage.read(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.name).toBe(created.name);
      expect(retrieved!.description).toBe(created.description);
    });

    it('should handle malformed JSON gracefully', async () => {
      const projectId = 'test-malformed';
      const projectDir = path.join(testDir, projectId);
      await fs.mkdir(projectDir, { recursive: true });
      await fs.writeFile(
        path.join(projectDir, 'metadata.json'),
        'invalid json{',
      );

      const project = await storage.read(projectId);
      expect(project).toBeNull();
    });
  });

  describe('update', () => {
    it('should update only specified fields', async () => {
      const projectData = {
        name: 'Original Name',
        description: 'Original Description',
        agent: {
          id: 'agent-1',
          name: 'Test Agent',
          systemPrompt: 'You are a helpful assistant',
          model: 'claude-sonnet-4-5' as const,
          temperature: 0.7,
          maxTokens: 1000,
          enabledTools: [],
        },
        subagents: [],
        hooks: [],
        mcps: [],
        apiKey: 'test-api-key',
        limits: {
          maxTokens: 10000,
          maxCost: 1.0,
          timeout: 30000,
        },
      };

      const created = await storage.create(projectData);
      const originalUpdatedAt = created.updatedAt;

      // Wait a bit to ensure updatedAt changes
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await storage.update(created.id, {
        name: 'Updated Name',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Original Description');
      expect(updated.id).toBe(created.id);
      expect(updated.createdAt).toBe(created.createdAt);
      expect(updated.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should throw error for non-existent project', async () => {
      await expect(
        storage.update('non-existent-id', { name: 'Updated' }),
      ).rejects.toThrow();
    });

    it('should update updatedAt timestamp', async () => {
      const projectData = {
        name: 'Test Project',
        agent: {
          id: 'agent-1',
          name: 'Test Agent',
          systemPrompt: 'You are a helpful assistant',
          model: 'claude-sonnet-4-5' as const,
          temperature: 0.7,
          maxTokens: 1000,
          enabledTools: [],
        },
        subagents: [],
        hooks: [],
        mcps: [],
        apiKey: 'test-api-key',
        limits: {
          maxTokens: 10000,
          maxCost: 1.0,
          timeout: 30000,
        },
      };

      const created = await storage.create(projectData);
      await new Promise(resolve => setTimeout(resolve, 10));
      const updated = await storage.update(created.id, { name: 'Updated' });

      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
        new Date(created.updatedAt).getTime(),
      );
    });
  });

  describe('delete', () => {
    it('should delete project and remove directory', async () => {
      const projectData = {
        name: 'Test Project',
        agent: {
          id: 'agent-1',
          name: 'Test Agent',
          systemPrompt: 'You are a helpful assistant',
          model: 'claude-sonnet-4-5' as const,
          temperature: 0.7,
          maxTokens: 1000,
          enabledTools: [],
        },
        subagents: [],
        hooks: [],
        mcps: [],
        apiKey: 'test-api-key',
        limits: {
          maxTokens: 10000,
          maxCost: 1.0,
          timeout: 30000,
        },
      };

      const created = await storage.create(projectData);
      const projectDir = path.join(testDir, created.id);

      await storage.delete(created.id);

      const exists = await fs
        .stat(projectDir)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(false);

      const project = await storage.read(created.id);
      expect(project).toBeNull();
    });

    it('should not throw error for non-existent project', async () => {
      await expect(storage.delete('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('list', () => {
    it('should return all projects sorted by updatedAt (newest first)', async () => {
      const project1Data = {
        name: 'Project 1',
        agent: {
          id: 'agent-1',
          name: 'Agent 1',
          systemPrompt: 'Prompt',
          model: 'claude-sonnet-4-5' as const,
          temperature: 0.7,
          maxTokens: 1000,
          enabledTools: [],
        },
        subagents: [],
        hooks: [],
        mcps: [],
        apiKey: 'key-1',
        limits: { maxTokens: 10000, maxCost: 1.0, timeout: 30000 },
      };

      const project2Data = {
        name: 'Project 2',
        agent: {
          id: 'agent-2',
          name: 'Agent 2',
          systemPrompt: 'Prompt',
          model: 'claude-sonnet-4-5' as const,
          temperature: 0.7,
          maxTokens: 1000,
          enabledTools: [],
        },
        subagents: [],
        hooks: [],
        mcps: [],
        apiKey: 'key-2',
        limits: { maxTokens: 10000, maxCost: 1.0, timeout: 30000 },
      };

      const p1 = await storage.create(project1Data);
      await new Promise(resolve => setTimeout(resolve, 10));
      const p2 = await storage.create(project2Data);

      const projects = await storage.list();

      expect(projects).toHaveLength(2);
      expect(projects[0].id).toBe(p2.id); // Newest first
      expect(projects[1].id).toBe(p1.id);
    });

    it('should return empty array when no projects exist', async () => {
      const projects = await storage.list();
      expect(projects).toEqual([]);
    });

    it('should skip invalid projects', async () => {
      // Create a valid project
      const validData = {
        name: 'Valid Project',
        agent: {
          id: 'agent-1',
          name: 'Agent',
          systemPrompt: 'Prompt',
          model: 'claude-sonnet-4-5' as const,
          temperature: 0.7,
          maxTokens: 1000,
          enabledTools: [],
        },
        subagents: [],
        hooks: [],
        mcps: [],
        apiKey: 'key',
        limits: { maxTokens: 10000, maxCost: 1.0, timeout: 30000 },
      };

      await storage.create(validData);

      // Create an invalid project directory with malformed JSON
      const invalidDir = path.join(testDir, 'invalid-project');
      await fs.mkdir(invalidDir, { recursive: true });
      await fs.writeFile(path.join(invalidDir, 'metadata.json'), 'invalid{');

      const projects = await storage.list();
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('Valid Project');
    });
  });

  describe('exists', () => {
    it('should return true for existing project', async () => {
      const projectData = {
        name: 'Test Project',
        agent: {
          id: 'agent-1',
          name: 'Test Agent',
          systemPrompt: 'You are a helpful assistant',
          model: 'claude-sonnet-4-5' as const,
          temperature: 0.7,
          maxTokens: 1000,
          enabledTools: [],
        },
        subagents: [],
        hooks: [],
        mcps: [],
        apiKey: 'test-api-key',
        limits: {
          maxTokens: 10000,
          maxCost: 1.0,
          timeout: 30000,
        },
      };

      const project = await storage.create(projectData);
      const exists = await storage.exists(project.id);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent project', async () => {
      const exists = await storage.exists('non-existent-id');
      expect(exists).toBe(false);
    });
  });

  describe('concurrent access', () => {
    it('should handle concurrent writes safely with atomic operations', async () => {
      const projectData = {
        name: 'Test Project',
        agent: {
          id: 'agent-1',
          name: 'Test Agent',
          systemPrompt: 'You are a helpful assistant',
          model: 'claude-sonnet-4-5' as const,
          temperature: 0.7,
          maxTokens: 1000,
          enabledTools: [],
        },
        subagents: [],
        hooks: [],
        mcps: [],
        apiKey: 'test-api-key',
        limits: {
          maxTokens: 10000,
          maxCost: 1.0,
          timeout: 30000,
        },
      };

      const project = await storage.create(projectData);

      // Perform concurrent updates
      const updates = await Promise.all([
        storage.update(project.id, { name: 'Update 1' }),
        storage.update(project.id, { description: 'Update 2' }),
        storage.update(project.id, { name: 'Update 3' }),
      ]);

      // All updates should complete without errors
      expect(updates).toHaveLength(3);

      // Final state should be consistent
      const final = await storage.read(project.id);
      expect(final).not.toBeNull();
      expect(final!.name).toBeDefined();
    });
  });

  describe('data validation', () => {
    it('should preserve all project fields on round-trip', async () => {
      const projectData = {
        name: 'Complete Project',
        description: 'Full test data',
        agent: {
          id: 'agent-1',
          name: 'Test Agent',
          systemPrompt: 'You are a helpful assistant',
          model: 'claude-sonnet-4-5' as const,
          temperature: 0.8,
          maxTokens: 2000,
          enabledTools: ['read', 'write', 'execute'],
        },
        subagents: [
          {
            id: 'sub-1',
            name: 'Subagent 1',
            type: 'research',
            prompt: 'Research prompt',
            tools: ['search'],
            parallel: true,
            maxParallelInstances: 3,
          },
        ],
        hooks: [
          {
            id: 'hook-1',
            name: 'Pre-execution hook',
            type: 'pre-execution' as const,
            enabled: true,
          },
        ],
        mcps: [
          {
            id: 'mcp-1',
            name: 'Test MCP',
            type: 'url' as const,
            connection: 'http://localhost:8000',
            enabled: true,
            tools: ['custom-tool'],
          },
        ],
        apiKey: 'test-api-key-123',
        limits: {
          maxTokens: 50000,
          maxCost: 5.0,
          timeout: 60000,
        },
      };

      const created = await storage.create(projectData);
      const retrieved = await storage.read(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.name).toBe(projectData.name);
      expect(retrieved!.description).toBe(projectData.description);
      expect(retrieved!.agent).toEqual(projectData.agent);
      expect(retrieved!.subagents).toEqual(projectData.subagents);
      expect(retrieved!.hooks).toEqual(projectData.hooks);
      expect(retrieved!.mcps).toEqual(projectData.mcps);
      expect(retrieved!.apiKey).toBe(projectData.apiKey);
      expect(retrieved!.limits).toEqual(projectData.limits);
    });
  });
});
