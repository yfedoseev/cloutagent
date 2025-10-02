import { Router, Request, Response, NextFunction } from 'express';
import type { ExecutionHistoryService } from '../services/ExecutionHistoryService';

// Error handling wrapper
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export function createExecutionHistoryRoutes(
  historyService: ExecutionHistoryService,
): Router {
  const router = Router({ mergeParams: true });

  // GET /api/projects/:projectId/executions/stats - Get statistics (must be before /:executionId)
  router.get(
    '/stats',
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const { projectId } = req.params;
        const stats = await historyService.getStatistics(projectId);
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    }),
  );

  // GET /api/projects/:projectId/executions - List executions
  router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const { projectId } = req.params;
        const limit = req.query.limit
          ? parseInt(req.query.limit as string)
          : 50;
        const offset = req.query.offset
          ? parseInt(req.query.offset as string)
          : 0;
        const status = req.query.status as any;

        const result = await historyService.listExecutions(projectId, {
          limit,
          offset,
          status,
        });

        res.json(result);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    }),
  );

  // GET /api/projects/:projectId/executions/:executionId - Get execution
  router.get(
    '/:executionId',
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const { projectId, executionId } = req.params;
        const execution = await historyService.getExecution(
          projectId,
          executionId,
        );

        if (!execution) {
          return res.status(404).json({ error: 'Execution not found' });
        }

        res.json({ execution });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    }),
  );

  // DELETE /api/projects/:projectId/executions/:executionId - Delete execution
  router.delete(
    '/:executionId',
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const { projectId, executionId } = req.params;
        await historyService.deleteExecution(projectId, executionId);
        res.status(204).send();
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    }),
  );

  // DELETE /api/projects/:projectId/executions - Delete all executions
  router.delete(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const { projectId } = req.params;
        const count = await historyService.deleteAllExecutions(projectId);
        res.json({ deleted: count });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    }),
  );

  return router;
}
