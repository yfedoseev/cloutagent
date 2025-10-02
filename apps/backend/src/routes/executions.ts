import { Router } from 'express';
import { SSEService } from '../services/SSEService';

export function createExecutionRoutes(sseService: SSEService): Router {
  const router = Router();

  // SSE stream endpoint - Real-time execution monitoring
  router.get('/:executionId/stream', (req, res) => {
    const { executionId } = req.params;

    // TODO: In production, verify:
    // 1. Execution exists
    // 2. User has permission to view this execution
    // 3. Execution is active or recently completed

    // Subscribe to execution events
    sseService.subscribe(executionId, res);
  });

  // TODO: Future endpoints for execution management
  // POST   /api/executions                     - Create new execution
  // GET    /api/executions/:executionId        - Get execution status
  // POST   /api/executions/:executionId/pause  - Pause execution
  // POST   /api/executions/:executionId/resume - Resume execution
  // POST   /api/executions/:executionId/cancel - Cancel execution

  return router;
}
