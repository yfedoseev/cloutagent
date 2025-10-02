import fs from 'fs/promises';
import path from 'path';
import type { Execution, ExecutionSummary, ExecutionStatus } from '@cloutagent/types';

export class ExecutionHistoryService {
  /**
   * Save execution result to filesystem
   * Storage: projects/{projectId}/executions/{executionId}.json
   */
  async saveExecution(projectId: string, execution: Execution): Promise<void> {
    const executionsDir = path.join(
      process.cwd(),
      'projects',
      projectId,
      'executions',
    );
    await fs.mkdir(executionsDir, { recursive: true });

    const executionPath = path.join(executionsDir, `${execution.id}.json`);

    // Atomic write using temp file
    const tempPath = `${executionPath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(execution, null, 2), 'utf-8');
    await fs.rename(tempPath, executionPath);
  }

  /**
   * Get execution by ID
   */
  async getExecution(
    projectId: string,
    executionId: string,
  ): Promise<Execution | null> {
    const executionPath = path.join(
      process.cwd(),
      'projects',
      projectId,
      'executions',
      `${executionId}.json`,
    );

    try {
      const content = await fs.readFile(executionPath, 'utf-8');
      return JSON.parse(content) as Execution;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * List executions for a project with pagination and filtering
   * @param limit - Max number of results (default 50)
   * @param offset - Skip first N results (default 0)
   * @param status - Filter by status (optional)
   */
  async listExecutions(
    projectId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: ExecutionStatus;
    },
  ): Promise<{ executions: ExecutionSummary[]; total: number }> {
    const executionsDir = path.join(
      process.cwd(),
      'projects',
      projectId,
      'executions',
    );

    try {
      const files = await fs.readdir(executionsDir);

      // Load all executions and convert to summaries
      const executions = await Promise.all(
        files
          .filter(f => f.endsWith('.json'))
          .map(async f => {
            const content = await fs.readFile(
              path.join(executionsDir, f),
              'utf-8',
            );
            const exec = JSON.parse(content) as Execution;

            // Return summary (not full execution)
            return {
              id: exec.id,
              projectId: exec.projectId,
              status: exec.status,
              startedAt: exec.startedAt,
              completedAt: exec.completedAt,
              duration: exec.duration,
              tokenUsage: exec.tokenUsage,
              costUSD: exec.costUSD,
              error: exec.error,
            } as ExecutionSummary;
          }),
      );

      // Filter by status if provided
      const filtered = options?.status
        ? executions.filter(e => e.status === options.status)
        : executions;

      // Sort by startedAt descending (newest first)
      filtered.sort((a, b) => {
        const aTime = new Date(a.startedAt).getTime();
        const bTime = new Date(b.startedAt).getTime();
        return bTime - aTime;
      });

      // Paginate
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const paginated = filtered.slice(offset, offset + limit);

      return {
        executions: paginated,
        total: filtered.length,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { executions: [], total: 0 };
      }
      throw error;
    }
  }

  /**
   * Delete execution by ID
   */
  async deleteExecution(projectId: string, executionId: string): Promise<void> {
    const executionPath = path.join(
      process.cwd(),
      'projects',
      projectId,
      'executions',
      `${executionId}.json`,
    );

    try {
      await fs.unlink(executionPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
      // Silently ignore if file doesn't exist
    }
  }

  /**
   * Delete all executions for a project
   */
  async deleteAllExecutions(projectId: string): Promise<number> {
    const executionsDir = path.join(
      process.cwd(),
      'projects',
      projectId,
      'executions',
    );

    try {
      const files = await fs.readdir(executionsDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      await Promise.all(
        jsonFiles.map(f => fs.unlink(path.join(executionsDir, f))),
      );

      return jsonFiles.length;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return 0;
      }
      throw error;
    }
  }

  /**
   * Get execution statistics for a project
   */
  async getStatistics(projectId: string): Promise<{
    totalExecutions: number;
    completed: number;
    failed: number;
    running: number;
    totalCostUSD: number;
    totalTokens: number;
  }> {
    const { executions } = await this.listExecutions(projectId, {
      limit: 10000,
    });

    return {
      totalExecutions: executions.length,
      completed: executions.filter(e => e.status === 'completed').length,
      failed: executions.filter(e => e.status === 'failed').length,
      running: executions.filter(e => e.status === 'running').length,
      totalCostUSD: executions.reduce((sum, e) => sum + (e.costUSD || 0), 0),
      totalTokens: executions.reduce(
        (sum, e) => sum + (e.tokenUsage?.total || 0),
        0,
      ),
    };
  }
}
