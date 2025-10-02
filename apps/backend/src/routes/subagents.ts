import { Router } from 'express';
import type { SubagentService } from '../services/SubagentService';

export function createSubagentRoutes(subagentService: SubagentService): Router {
  const router = Router({ mergeParams: true }); // Access :projectId

  // GET /api/projects/:projectId/subagents - List all subagent configs
  router.get('/', async (req, res) => {
    try {
      const { projectId } = req.params;
      const configs = await subagentService.listConfigs(projectId);
      res.json({ configs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/projects/:projectId/subagents - Create subagent config
  router.post('/', async (req, res) => {
    try {
      const { projectId } = req.params;
      const config = await subagentService.createConfig(projectId, req.body);
      res.status(201).json({ config });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // GET /api/projects/:projectId/subagents/:subagentId - Get config
  router.get('/:subagentId', async (req, res) => {
    try {
      const { projectId, subagentId } = req.params;
      const config = await subagentService.getConfig(projectId, subagentId);
      if (!config) {
        return res.status(404).json({ error: 'Subagent config not found' });
      }
      res.json({ config });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/projects/:projectId/subagents/:subagentId - Update config
  router.put('/:subagentId', async (req, res) => {
    try {
      const { projectId, subagentId } = req.params;
      const config = await subagentService.updateConfig(
        projectId,
        subagentId,
        req.body,
      );
      res.json({ config });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // DELETE /api/projects/:projectId/subagents/:subagentId - Delete config
  router.delete('/:subagentId', async (req, res) => {
    try {
      const { projectId, subagentId } = req.params;
      await subagentService.deleteConfig(projectId, subagentId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/projects/:projectId/subagents/batch - Execute batch
  router.post('/batch', async (req, res) => {
    try {
      const { requests } = req.body;
      const results = await subagentService.executeBatch(requests);
      res.json({ results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
