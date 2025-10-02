import { Router } from 'express';
import { ErrorRecoveryService } from '../services/ErrorRecoveryService';

export function createErrorRecoveryRoutes(
  recoveryService: ErrorRecoveryService,
): Router {
  const router = Router({ mergeParams: true });

  // GET /api/projects/:projectId/recovery - List recoverable executions
  router.get('/', async (req, res) => {
    try {
      const { projectId } = req.params;
      const states = await recoveryService.listRecoverableExecutions(projectId);
      res.json({ recoveryStates: states });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GET /api/projects/:projectId/recovery/:executionId - Get recovery state
  router.get('/:executionId', async (req, res) => {
    try {
      const { projectId, executionId } = req.params;
      const state = await recoveryService.loadRecoveryState(projectId, executionId);

      if (!state) {
        return res.status(404).json({ error: 'Recovery state not found' });
      }

      res.json({ recoveryState: state });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // DELETE /api/projects/:projectId/recovery/:executionId - Delete recovery state
  router.delete('/:executionId', async (req, res) => {
    try {
      const { projectId, executionId } = req.params;
      await recoveryService.deleteRecoveryState(projectId, executionId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // POST /api/projects/:projectId/recovery/cleanup - Clean old states
  router.post('/cleanup', async (req, res) => {
    try {
      const { projectId } = req.params;
      const { maxAgeDays = 7 } = req.body;

      const deletedCount = await recoveryService.cleanupOldRecoveryStates(
        projectId,
        maxAgeDays,
      );

      res.json({ deletedCount });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
