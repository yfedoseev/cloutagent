import { Router } from 'express';
import { TestModeEngine } from '../services/TestModeEngine';

export function createTestModeRoutes(): Router {
  const router = Router({ mergeParams: true });
  const testEngine = new TestModeEngine();

  // POST /api/projects/:projectId/test - Test execute workflow
  router.post('/', async (req, res) => {
    try {
      const { projectId } = req.params;
      const { input, workflow } = req.body;

      if (!workflow) {
        return res.status(400).json({ error: 'Workflow is required' });
      }

      const config: ExecutionConfig = {
        projectId,
        input: input || 'Test input',
        options: { testMode: true },
      };

      const result = await testEngine.testExecute(config, workflow);
      res.json({ result });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // POST /api/projects/:projectId/test/dry-run - Dry run (estimate only)
  router.post('/dry-run', async (req, res) => {
    try {
      const { workflow } = req.body;

      if (!workflow) {
        return res.status(400).json({ error: 'Workflow is required' });
      }

      const result = await testEngine.dryRun(workflow);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
