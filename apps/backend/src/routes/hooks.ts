import { Router, Request, Response } from 'express';
import { HookExecutionService } from '../services/HookExecutionService';
import type { HookConfig, HookExecutionContext, HookType } from '@cloutagent/types';

export function createHookRoutes(hookService: HookExecutionService): Router {
  const router = Router();

  // Validate hook code
  router.post('/validate', async (req: Request, res: Response) => {
    try {
      const { code, type } = req.body;

      // Validate required parameters
      if (!code || !type) {
        res.status(400).json({
          error: 'Missing required parameters: code and type are required',
        });
        return;
      }

      const validation = hookService.validateHookCode(code as string, type as HookType);

      res.json(validation);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(400).json({ error: errorMessage });
    }
  });

  // Execute hook (for testing)
  router.post('/execute', async (req: Request, res: Response) => {
    try {
      const { hook, context } = req.body;

      // Validate required parameters
      if (!hook || !context) {
        res.status(400).json({
          error: 'Missing required parameters: hook and context are required',
        });
        return;
      }

      const result = await hookService.executeHook(
        hook as HookConfig,
        context as HookExecutionContext,
      );

      res.json(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: errorMessage });
    }
  });

  return router;
}
