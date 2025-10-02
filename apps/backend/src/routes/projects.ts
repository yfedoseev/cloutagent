import type { Project } from '@cloutagent/types';
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Validation schemas
const agentConfigSchema = z.object({
  name: z.string().min(1).max(100),
  systemPrompt: z.string().min(1),
  model: z.enum(['claude-sonnet-4-5', 'claude-opus-4']),
  temperature: z.number().min(0).max(1).default(0.7),
  maxTokens: z.number().min(1).max(200000).default(4096),
  enabledTools: z.array(z.string()).default([]),
});

const subagentConfigSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  prompt: z.string().min(1),
  tools: z.array(z.string()).default([]),
  parallel: z.boolean().default(false),
  maxParallelInstances: z.number().optional(),
});

const hookConfigSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['pre-execution', 'post-execution', 'tool-call', 'error']),
  enabled: z.boolean().default(true),
});

const mcpConfigSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['url', 'npx', 'uvx']),
  connection: z.string().min(1),
  enabled: z.boolean().default(true),
  tools: z.array(z.string()).default([]),
});

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  agent: agentConfigSchema,
  subagents: z.array(subagentConfigSchema).default([]),
  hooks: z.array(hookConfigSchema).default([]),
  mcps: z.array(mcpConfigSchema).default([]),
  limits: z
    .object({
      maxTokens: z.number().min(1).default(100000),
      maxCost: z.number().min(0).default(10.0),
      timeout: z.number().min(1000).default(300000),
    })
    .default({}),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  agent: agentConfigSchema.optional(),
  subagents: z.array(subagentConfigSchema).optional(),
  hooks: z.array(hookConfigSchema).optional(),
  mcps: z.array(mcpConfigSchema).optional(),
  limits: z
    .object({
      maxTokens: z.number().min(1).optional(),
      maxCost: z.number().min(0).optional(),
      timeout: z.number().min(1000).optional(),
    })
    .optional(),
});

const workflowSchema = z.object({
  steps: z.array(
    z.object({
      type: z.string(),
      config: z.record(z.any()),
    }),
  ),
});

// Error handling wrapper
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Factory function to create router with dependencies
export function createProjectsRouter(storage: any, auth: any) {
  const router = Router();

  // POST /api/projects - Create new project
  router.post(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      try {
        // Validate request body
        const validatedData = createProjectSchema.parse(req.body);

        // Generate API key
        const apiKey = auth.generateAPIKey();
        const hashedApiKey = await auth.hashAPIKey(apiKey);

        // Create project with storage
        const projectData = {
          name: validatedData.name,
          description: validatedData.description,
          agent: {
            ...validatedData.agent,
            id: `agent-${Date.now()}`,
          },
          subagents: validatedData.subagents.map((sa, idx) => ({
            ...sa,
            id: `subagent-${Date.now()}-${idx}`,
          })),
          hooks: validatedData.hooks.map((h, idx) => ({
            ...h,
            id: `hook-${Date.now()}-${idx}`,
          })),
          mcps: validatedData.mcps.map((m, idx) => ({
            ...m,
            id: `mcp-${Date.now()}-${idx}`,
          })),
          apiKey: hashedApiKey,
          limits: {
            maxTokens: validatedData.limits?.maxTokens ?? 100000,
            maxCost: validatedData.limits?.maxCost ?? 10.0,
            timeout: validatedData.limits?.timeout ?? 300000,
          },
        };

        const project = await storage.create(projectData);

        // Return project and API key (only time it's visible)
        res.status(201).json({
          project,
          apiKey, // Plain text API key, only shown once
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            error: 'Validation error',
            details: error.errors,
          });
        }
        throw error;
      }
    }),
  );

  // GET /api/projects - List all projects
  router.get(
    '/',
    auth.authenticate,
    asyncHandler(async (req: Request, res: Response) => {
      const projects = await storage.list();

      // Don't return API keys in list
      const sanitizedProjects = projects.map((p: Project) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));

      res.json({ projects: sanitizedProjects });
    }),
  );

  // GET /api/projects/:id - Get project by ID
  router.get(
    '/:id',
    auth.authenticate,
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const project = await storage.read(id);

      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
        });
      }

      res.json({ project });
    }),
  );

  // PUT /api/projects/:id - Update project
  router.put(
    '/:id',
    auth.authenticate,
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const validatedData = updateProjectSchema.parse(req.body);

        const project = await storage.update(id, validatedData);

        res.json({ project });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            error: 'Validation error',
            details: error.errors,
          });
        }
        throw error;
      }
    }),
  );

  // DELETE /api/projects/:id - Delete project
  router.delete(
    '/:id',
    auth.authenticate,
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      await storage.delete(id);

      res.status(204).send();
    }),
  );

  // POST /api/projects/:id/workflow - Save workflow
  router.post(
    '/:id/workflow',
    auth.authenticate,
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const validatedWorkflow = workflowSchema.parse(req.body);

        const project = await storage.update(id, {
          workflow: validatedWorkflow,
        });

        res.json({ project });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            error: 'Validation error',
            details: error.errors,
          });
        }
        throw error;
      }
    }),
  );

  // GET /api/projects/:id/workflow - Get workflow
  router.get(
    '/:id/workflow',
    auth.authenticate,
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const project = await storage.read(id);

      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
        });
      }

      res.json({
        workflow: (project as any).workflow || null,
      });
    }),
  );

  // Error handling middleware
  router.use(
    (error: Error, req: Request, res: Response, _next: NextFunction) => {
      console.error('Route error:', error);

      res.status(500).json({
        error: 'Internal server error',
        message:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    },
  );

  return router;
}

// Default export for backward compatibility
export default createProjectsRouter;
