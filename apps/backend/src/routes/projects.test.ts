import type { Project } from '@cloutagent/types';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createProjectsRouter } from './projects';

// Mock storage service
const mockStorage = {
  create: vi.fn(),
  read: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  exists: vi.fn(),
};

// Mock auth middleware
const mockAuth = {
  generateAPIKey: vi.fn(),
  hashAPIKey: vi.fn(),
  validateAPIKey: vi.fn(),
  authenticate: vi.fn((req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ error: 'Missing API key' });
    }
    // Attach mock project for authenticated requests
    (req as any).project = mockProject;
    next();
  }),
};

// Test data
const mockProject: Project = {
  id: 'test-project-id',
  name: 'Test Project',
  description: 'A test project',
  agent: {
    id: 'agent-1',
    name: 'Test Agent',
    systemPrompt: 'You are a test agent',
    model: 'claude-sonnet-4-5',
    temperature: 0.7,
    maxTokens: 4096,
    enabledTools: [],
  },
  subagents: [],
  hooks: [],
  mcps: [],
  apiKey: 'hashed-api-key',
  limits: {
    maxTokens: 100000,
    maxCost: 10.0,
    timeout: 300000,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const createApp = () => {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Create router with mocked dependencies
  const projectsRouter = createProjectsRouter(mockStorage, mockAuth);
  app.use('/api/projects', projectsRouter);

  return app;
};

describe('Project API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  describe('POST /api/projects', () => {
    it('should create project and return 201 with project and apiKey', async () => {
      const newProject = {
        name: 'New Project',
        description: 'A new project',
        agent: {
          name: 'Test Agent',
          systemPrompt: 'You are a test agent',
          model: 'claude-sonnet-4-5',
          temperature: 0.7,
          maxTokens: 4096,
          enabledTools: [],
        },
        limits: {
          maxTokens: 100000,
          maxCost: 10.0,
          timeout: 300000,
        },
      };

      const generatedApiKey = 'cla_test-api-key-123';
      mockAuth.generateAPIKey.mockReturnValue(generatedApiKey);
      mockAuth.hashAPIKey.mockResolvedValue('hashed-api-key');
      mockStorage.create.mockResolvedValue(mockProject);

      const response = await request(app)
        .post('/api/projects')
        .send(newProject)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('project');
      expect(response.body).toHaveProperty('apiKey');
      expect(response.body.apiKey).toBe(generatedApiKey);
      expect(response.body.project.id).toBe(mockProject.id);
      expect(mockStorage.create).toHaveBeenCalled();
    });

    it('should return 400 for invalid input', async () => {
      const invalidProject = {
        name: '', // Invalid: empty name
      };

      const response = await request(app)
        .post('/api/projects')
        .send(invalidProject)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(mockStorage.create).not.toHaveBeenCalled();
    });

    it('should return 500 for storage errors', async () => {
      const newProject = {
        name: 'New Project',
        agent: {
          name: 'Test Agent',
          systemPrompt: 'You are a test agent',
          model: 'claude-sonnet-4-5',
          temperature: 0.7,
          maxTokens: 4096,
          enabledTools: [],
        },
      };

      mockAuth.generateAPIKey.mockReturnValue('cla_test-key');
      mockAuth.hashAPIKey.mockResolvedValue('hashed-key');
      mockStorage.create.mockRejectedValue(new Error('Storage error'));

      const response = await request(app)
        .post('/api/projects')
        .send(newProject)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/projects', () => {
    it('should list all projects and return 200', async () => {
      const projects = [mockProject];
      mockStorage.list.mockResolvedValue(projects);

      const response = await request(app)
        .get('/api/projects')
        .set('x-api-key', 'valid-api-key')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('projects');
      expect(Array.isArray(response.body.projects)).toBe(true);
      expect(response.body.projects).toHaveLength(1);
      expect(mockStorage.list).toHaveBeenCalled();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/projects')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(mockStorage.list).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return project for valid ID and return 200', async () => {
      mockStorage.read.mockResolvedValue(mockProject);

      const response = await request(app)
        .get(`/api/projects/${mockProject.id}`)
        .set('x-api-key', 'valid-api-key')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('project');
      expect(response.body.project.id).toBe(mockProject.id);
      expect(mockStorage.read).toHaveBeenCalledWith(mockProject.id);
    });

    it('should return 404 for non-existent project', async () => {
      mockStorage.read.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/projects/non-existent-id')
        .set('x-api-key', 'valid-api-key')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/projects/${mockProject.id}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(mockStorage.read).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update project and return 200', async () => {
      const updates = {
        name: 'Updated Project Name',
        description: 'Updated description',
      };

      const updatedProject = { ...mockProject, ...updates };
      mockStorage.update.mockResolvedValue(updatedProject);

      const response = await request(app)
        .put(`/api/projects/${mockProject.id}`)
        .set('x-api-key', 'valid-api-key')
        .send(updates)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('project');
      expect(response.body.project.name).toBe(updates.name);
      expect(mockStorage.update).toHaveBeenCalledWith(mockProject.id, updates);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put(`/api/projects/${mockProject.id}`)
        .send({ name: 'Updated' })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(mockStorage.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete project and return 204', async () => {
      mockStorage.delete.mockResolvedValue(undefined);

      await request(app)
        .delete(`/api/projects/${mockProject.id}`)
        .set('x-api-key', 'valid-api-key')
        .expect(204);

      expect(mockStorage.delete).toHaveBeenCalledWith(mockProject.id);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/api/projects/${mockProject.id}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(mockStorage.delete).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/projects/:id/workflow', () => {
    it('should save workflow and return 200', async () => {
      const workflow = {
        steps: [{ type: 'agent', config: { prompt: 'Test workflow' } }],
      };

      const updatedProject = {
        ...mockProject,
        workflow,
      };

      mockStorage.update.mockResolvedValue(updatedProject);

      const response = await request(app)
        .post(`/api/projects/${mockProject.id}/workflow`)
        .set('x-api-key', 'valid-api-key')
        .send(workflow)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('project');
      expect(mockStorage.update).toHaveBeenCalled();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post(`/api/projects/${mockProject.id}/workflow`)
        .send({ steps: [] })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(mockStorage.update).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/projects/:id/workflow', () => {
    it('should return workflow and return 200', async () => {
      const projectWithWorkflow = {
        ...mockProject,
        workflow: {
          steps: [{ type: 'agent', config: { prompt: 'Test' } }],
        },
      };

      mockStorage.read.mockResolvedValue(projectWithWorkflow);

      const response = await request(app)
        .get(`/api/projects/${mockProject.id}/workflow`)
        .set('x-api-key', 'valid-api-key')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('workflow');
      expect(mockStorage.read).toHaveBeenCalledWith(mockProject.id);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/projects/${mockProject.id}/workflow`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(mockStorage.read).not.toHaveBeenCalled();
    });
  });
});

describe('Health Check', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Add health check route directly
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });
    });
  });

  it('should return 200 with status ok', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('timestamp');
  });
});
