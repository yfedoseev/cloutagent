import bcrypt from 'bcrypt';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Project } from '@cloutagent/types';

import { createProjectsRouter } from '../../apps/backend/src/routes/projects';
import { ProjectStorage } from '../../apps/backend/src/services/ProjectStorage';
import { SecretManager } from '../../apps/backend/src/services/SecretManager';
import {
  cleanupTestProjects,
  createTestProjectData,
  generateTestAPIKey,
  getTestProjectRoot,
} from '../helpers/testHelpers';

import './setup';

/**
 * API Integration Tests
 *
 * Tests complete API flows from HTTP request to filesystem storage
 */

describe('API Integration Tests', () => {
  let app: express.Application;
  let storage: ProjectStorage;
  let secretManager: SecretManager;
  let testApiKey: string;
  let hashedApiKey: string;

  beforeEach(async () => {
    await cleanupTestProjects();

    // Initialize services with test configuration
    const testRoot = getTestProjectRoot();

    // Set PROJECT_ROOT for SecretManager
    process.env.PROJECT_ROOT = testRoot;

    storage = new ProjectStorage(testRoot);

    // Use test encryption key from environment
    const encryptionKey =
      process.env.SECRET_ENCRYPTION_KEY ||
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    secretManager = new SecretManager(encryptionKey);

    // Generate test API key
    testApiKey = generateTestAPIKey();
    hashedApiKey = await bcrypt.hash(testApiKey, 10);

    // Create test auth middleware
    const mockAuth = {
      generateAPIKey: () => testApiKey,
      hashAPIKey: async (key: string) => bcrypt.hash(key, 10),
      validateAPIKey: async (provided: string, hashed: string) =>
        bcrypt.compare(provided, hashed),
      authenticate: async (req: any, res: any, next: any) => {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
          return res.status(401).json({ error: 'Missing API key' });
        }
        // For test purposes, accept any non-empty API key
        next();
      },
    };

    // Create Express app
    app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json({ limit: '10mb' }));

    // Mount routes
    const projectsRouter = createProjectsRouter(storage, mockAuth);
    app.use('/api/v1/projects', projectsRouter);

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
  });

  describe('POST /api/v1/projects - Create Project', () => {
    it('should create project and return 201 with project and API key', async () => {
      const projectData = {
        name: 'Integration Test Project',
        description: 'Created via integration test',
        agent: {
          name: 'Test Agent',
          systemPrompt: 'You are a test agent',
          model: 'claude-sonnet-4-5' as const,
          temperature: 0.7,
          maxTokens: 4096,
          enabledTools: ['bash', 'read', 'write'],
        },
        limits: {
          maxTokens: 100000,
          maxCost: 10.0,
          timeout: 300000,
        },
      };

      const response = await request(app)
        .post('/api/v1/projects')
        .send(projectData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('project');
      expect(response.body).toHaveProperty('apiKey');
      expect(response.body.project.name).toBe(projectData.name);
      expect(response.body.project.description).toBe(projectData.description);
      expect(response.body.project.id).toBeDefined();
      expect(response.body.project.createdAt).toBeDefined();
      expect(response.body.project.updatedAt).toBeDefined();
      expect(response.body.apiKey).toMatch(/^cla_test_/);

      // Verify project exists in storage
      const storedProject = await storage.read(response.body.project.id);
      expect(storedProject).not.toBeNull();
      expect(storedProject?.name).toBe(projectData.name);
    });

    it('should return 400 for invalid input (missing required fields)', async () => {
      const invalidData = {
        name: '', // Empty name is invalid
      };

      const response = await request(app)
        .post('/api/v1/projects')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Validation error');
    });

    it('should return 400 for invalid model name', async () => {
      const invalidData = {
        name: 'Test Project',
        agent: {
          name: 'Test Agent',
          systemPrompt: 'Test',
          model: 'invalid-model', // Invalid model
          temperature: 0.7,
          maxTokens: 4096,
          enabledTools: [],
        },
      };

      const response = await request(app)
        .post('/api/v1/projects')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should create project with subagents and hooks', async () => {
      const projectData = {
        name: 'Complex Project',
        description: 'Project with subagents and hooks',
        agent: {
          name: 'Main Agent',
          systemPrompt: 'You are the main agent',
          model: 'claude-sonnet-4-5' as const,
          temperature: 0.7,
          maxTokens: 4096,
          enabledTools: [],
        },
        subagents: [
          {
            name: 'Code Agent',
            type: 'code',
            prompt: 'Write code',
            tools: ['bash', 'write'],
            parallel: false,
          },
          {
            name: 'Test Agent',
            type: 'test',
            prompt: 'Write tests',
            tools: ['read', 'write'],
            parallel: true,
            maxParallelInstances: 3,
          },
        ],
        hooks: [
          {
            name: 'Pre-execution logger',
            type: 'pre-execution' as const,
            enabled: true,
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/projects')
        .send(projectData)
        .expect(201);

      expect(response.body.project.subagents).toHaveLength(2);
      expect(response.body.project.hooks).toHaveLength(1);
      expect(response.body.project.subagents[0].name).toBe('Code Agent');
      expect(response.body.project.hooks[0].type).toBe('pre-execution');
    });
  });

  describe('GET /api/v1/projects - List Projects', () => {
    it('should list all projects', async () => {
      // Create 3 test projects
      const project1 = await storage.create(
        createTestProjectData({ name: 'Project 1' }),
      );
      const project2 = await storage.create(
        createTestProjectData({ name: 'Project 2' }),
      );
      const project3 = await storage.create(
        createTestProjectData({ name: 'Project 3' }),
      );

      const response = await request(app)
        .get('/api/v1/projects')
        .set('x-api-key', testApiKey)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('projects');
      expect(Array.isArray(response.body.projects)).toBe(true);
      expect(response.body.projects).toHaveLength(3);

      // Verify API keys are not returned in list
      response.body.projects.forEach((project: any) => {
        expect(project.apiKey).toBeUndefined();
      });
    });

    it('should return empty array when no projects exist', async () => {
      const response = await request(app)
        .get('/api/v1/projects')
        .set('x-api-key', testApiKey)
        .expect(200);

      expect(response.body.projects).toEqual([]);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/projects')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Missing API key');
    });
  });

  describe('GET /api/v1/projects/:id - Get Project by ID', () => {
    it('should return project for valid ID', async () => {
      const project = await storage.create(
        createTestProjectData({ name: 'Test Project' }),
      );

      const response = await request(app)
        .get(`/api/v1/projects/${project.id}`)
        .set('x-api-key', testApiKey)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('project');
      expect(response.body.project.id).toBe(project.id);
      expect(response.body.project.name).toBe('Test Project');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/v1/projects/non-existent-id')
        .set('x-api-key', testApiKey)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });

    it('should require authentication', async () => {
      const project = await storage.create(createTestProjectData());

      const response = await request(app)
        .get(`/api/v1/projects/${project.id}`)
        .expect(401);

      expect(response.body.error).toContain('Missing API key');
    });
  });

  describe('PUT /api/v1/projects/:id - Update Project', () => {
    it('should update project successfully', async () => {
      const project = await storage.create(
        createTestProjectData({ name: 'Original Name' }),
      );

      const updates = {
        name: 'Updated Name',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/v1/projects/${project.id}`)
        .set('x-api-key', testApiKey)
        .send(updates)
        .expect(200);

      expect(response.body.project.name).toBe('Updated Name');
      expect(response.body.project.description).toBe('Updated description');

      // Verify in storage
      const storedProject = await storage.read(project.id);
      expect(storedProject?.name).toBe('Updated Name');
    });

    it('should update agent configuration', async () => {
      const project = await storage.create(createTestProjectData());

      const updates = {
        agent: {
          name: 'Updated Agent',
          systemPrompt: 'Updated prompt',
          model: 'claude-opus-4' as const,
          temperature: 0.5,
          maxTokens: 8192,
          enabledTools: ['bash'],
        },
      };

      const response = await request(app)
        .put(`/api/v1/projects/${project.id}`)
        .set('x-api-key', testApiKey)
        .send(updates)
        .expect(200);

      expect(response.body.project.agent.model).toBe('claude-opus-4');
      expect(response.body.project.agent.temperature).toBe(0.5);
    });

    it('should return 400 for invalid updates', async () => {
      const project = await storage.create(createTestProjectData());

      const invalidUpdates = {
        agent: {
          name: 'Test',
          systemPrompt: 'Test',
          model: 'invalid-model',
          temperature: 0.7,
          maxTokens: 4096,
          enabledTools: [],
        },
      };

      const response = await request(app)
        .put(`/api/v1/projects/${project.id}`)
        .set('x-api-key', testApiKey)
        .send(invalidUpdates)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/v1/projects/:id - Delete Project', () => {
    it('should delete project successfully', async () => {
      const project = await storage.create(createTestProjectData());

      await request(app)
        .delete(`/api/v1/projects/${project.id}`)
        .set('x-api-key', testApiKey)
        .expect(204);

      // Verify project is deleted
      const storedProject = await storage.read(project.id);
      expect(storedProject).toBeNull();
    });

    it('should require authentication', async () => {
      const project = await storage.create(createTestProjectData());

      await request(app).delete(`/api/v1/projects/${project.id}`).expect(401);
    });
  });

  describe('Workflow Management', () => {
    it('should save workflow to project', async () => {
      const project = await storage.create(createTestProjectData());

      const workflow = {
        steps: [
          { type: 'agent', config: { prompt: 'Step 1' } },
          { type: 'tool', config: { tool: 'bash', command: 'ls' } },
        ],
      };

      const response = await request(app)
        .post(`/api/v1/projects/${project.id}/workflow`)
        .set('x-api-key', testApiKey)
        .send(workflow)
        .expect(200);

      expect(response.body.project).toHaveProperty('workflow');
    });

    it('should retrieve workflow from project', async () => {
      const project = await storage.create(createTestProjectData());

      const workflow = {
        steps: [{ type: 'agent', config: { prompt: 'Test' } }],
      };

      await storage.update(project.id, { workflow } as any);

      const response = await request(app)
        .get(`/api/v1/projects/${project.id}/workflow`)
        .set('x-api-key', testApiKey)
        .expect(200);

      expect(response.body).toHaveProperty('workflow');
      expect(response.body.workflow.steps).toHaveLength(1);
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
