import { Router } from 'express';
import type { VariableService } from '../services/VariableService';
import { VariableInterpolationEngine } from '../services/VariableInterpolationEngine';

/**
 * Create Variable Management Routes
 * Implements REST API for CRUD operations on variables
 *
 * Routes:
 * - POST   /api/projects/:projectId/variables                    - Create variable
 * - GET    /api/projects/:projectId/variables                    - List variables (optional ?scope=global|node|execution)
 * - GET    /api/projects/:projectId/variables/scope              - Get variable scope structure
 * - POST   /api/projects/:projectId/variables/validate-template  - Validate template for interpolation
 * - PUT    /api/projects/:projectId/variables/:id                - Update variable
 * - DELETE /api/projects/:projectId/variables/:id                - Delete variable
 */
export function createVariableRoutes(variableService: VariableService): Router {
  const router = Router({ mergeParams: true }); // To get projectId from parent
  const interpolationEngine = new VariableInterpolationEngine();

  /**
   * GET /scope - Get variable scope structure
   * Must be defined before /:variableId to avoid route conflict
   */
  router.get('/scope', async (req, res) => {
    try {
      const { projectId } = req.params;
      const { executionId } = req.query;

      const scope = await variableService.getVariableScope(
        projectId,
        executionId as string | undefined,
      );

      res.json(scope);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /validate-template - Validate template for interpolation
   * Must be defined before /:variableId to avoid route conflict
   */
  router.post('/validate-template', async (req, res) => {
    try {
      const { projectId } = req.params;
      const { template, executionId } = req.body;

      if (!template) {
        return res.status(400).json({ error: 'Template is required' });
      }

      const scope = await variableService.getVariableScope(
        projectId,
        executionId as string | undefined,
      );

      const errors = interpolationEngine.validateTemplate(template, scope);

      res.json({
        valid: errors.length === 0,
        errors,
        variables: interpolationEngine.extractVariables(template),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST / - Create variable
   */
  router.post('/', async (req, res) => {
    try {
      const { projectId } = req.params;
      const variable = await variableService.createVariable(
        projectId,
        req.body,
      );
      res.status(201).json(variable);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  });

  /**
   * GET / - List variables
   */
  router.get('/', async (req, res) => {
    try {
      const { projectId } = req.params;
      const { scope } = req.query;

      const variables = await variableService.listVariables(
        projectId,
        scope as 'global' | 'node' | 'execution' | undefined,
      );

      res.json({ variables });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * PUT /:variableId - Update variable
   */
  router.put('/:variableId', async (req, res) => {
    try {
      const { projectId, variableId } = req.params;
      const variable = await variableService.updateVariable(
        projectId,
        variableId,
        {
          value: req.body.value,
        },
      );
      res.json(variable);
    } catch (error: any) {
      if (error.message === 'Variable not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  });

  /**
   * DELETE /:variableId - Delete variable
   */
  router.delete('/:variableId', async (req, res) => {
    try {
      const { projectId, variableId } = req.params;
      const deleted = await variableService.deleteVariable(
        projectId,
        variableId,
      );

      if (!deleted) {
        res.status(404).json({ error: 'Variable not found' });
      } else {
        res.status(204).send();
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
