import { Router, Request, Response } from 'express';
import { WorkflowService } from '../services/WorkflowService';
import { WorkflowData } from '@cloutagent/types';

/**
 * Create workflow routes for save/load/autosave operations
 * @param workflowService - Instance of WorkflowService
 * @returns Express Router with workflow endpoints
 */
export function createWorkflowRoutes(workflowService: WorkflowService): Router {
  const router = Router({ mergeParams: true });

  /**
   * POST /save - Save workflow to project
   * Body: WorkflowData
   * Response: { success: true, message: string } | { error: string }
   */
  router.post('/save', async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const workflow = req.body as WorkflowData;

      await workflowService.saveWorkflow(projectId, workflow);

      res.json({ success: true, message: 'Workflow saved' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * GET / - Load workflow from project
   * Response: { workflow: WorkflowData } | { error: string }
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const workflow = await workflowService.loadWorkflow(projectId);

      res.json({ workflow });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /autosave - Autosave workflow (background save)
   * Body: WorkflowData
   * Response: { success: true } | { error: string }
   */
  router.post('/autosave', async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const workflow = req.body as WorkflowData;

      await workflowService.autosaveWorkflow(projectId, workflow);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
