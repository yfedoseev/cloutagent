import { Router } from 'express';
import { WorkflowValidationEngine } from '../services/WorkflowValidationEngine';
import type { WorkflowGraph } from '@cloutagent/types';

export function createValidationRoutes(): Router {
  const router = Router({ mergeParams: true });
  const validationEngine = new WorkflowValidationEngine();

  // POST /api/projects/:projectId/validate - Validate workflow
  router.post('/', async (req, res) => {
    try {
      const workflow: WorkflowGraph = req.body.workflow;

      if (!workflow) {
        return res.status(400).json({ error: 'Workflow is required' });
      }

      const result = validationEngine.validate(workflow);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // POST /api/projects/:projectId/validate/field - Validate single field
  router.post('/field', async (req, res) => {
    try {
      const { field, value } = req.body;

      if (!field) {
        return res.status(400).json({ error: 'Field name is required' });
      }

      const error = validationEngine.validateField(field, value);
      res.json({ error });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
