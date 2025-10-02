import fs from 'fs/promises';
import path from 'path';
import type { ExecutionResult, ErrorRecoveryState } from '@cloutagent/types';

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number; // milliseconds
  exponentialBackoff: boolean;
}

export class ErrorRecoveryService {
  private readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true,
  };

  /**
   * Save error recovery state for later retry
   */
  async saveRecoveryState(
    projectId: string,
    executionId: string,
    state: ErrorRecoveryState,
  ): Promise<void> {
    const recoveryDir = path.join(process.cwd(), 'projects', projectId, 'recovery');
    await fs.mkdir(recoveryDir, { recursive: true });

    const recoveryPath = path.join(recoveryDir, `${executionId}.json`);
    const tempPath = `${recoveryPath}.tmp`;

    await fs.writeFile(tempPath, JSON.stringify(state, null, 2), 'utf-8');
    await fs.rename(tempPath, recoveryPath);
  }

  /**
   * Load recovery state for an execution
   */
  async loadRecoveryState(
    projectId: string,
    executionId: string,
  ): Promise<ErrorRecoveryState | null> {
    const recoveryPath = path.join(
      process.cwd(),
      'projects',
      projectId,
      'recovery',
      `${executionId}.json`,
    );

    try {
      const content = await fs.readFile(recoveryPath, 'utf-8');
      return JSON.parse(content) as ErrorRecoveryState;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  /**
   * Delete recovery state (after successful retry or manual deletion)
   */
  async deleteRecoveryState(projectId: string, executionId: string): Promise<void> {
    const recoveryPath = path.join(
      process.cwd(),
      'projects',
      projectId,
      'recovery',
      `${executionId}.json`,
    );

    try {
      await fs.unlink(recoveryPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * List all recoverable executions for a project
   */
  async listRecoverableExecutions(projectId: string): Promise<ErrorRecoveryState[]> {
    const recoveryDir = path.join(process.cwd(), 'projects', projectId, 'recovery');

    try {
      const files = await fs.readdir(recoveryDir);
      const states = await Promise.all(
        files
          .filter(f => f.endsWith('.json'))
          .map(async f => {
            const content = await fs.readFile(path.join(recoveryDir, f), 'utf-8');
            return JSON.parse(content) as ErrorRecoveryState;
          }),
      );

      // Sort by timestamp descending (newest first)
      return states.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
  }

  /**
   * Determine if error is retryable
   */
  isRetryableError(error: Error): boolean {
    const retryableMessages = [
      'rate limit',
      'timeout',
      'network',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      '429',
      '500',
      '502',
      '503',
      '504',
    ];

    const errorMessage = error.message.toLowerCase();
    return retryableMessages.some(msg => errorMessage.includes(msg.toLowerCase()));
  }

  /**
   * Calculate retry delay with optional exponential backoff
   */
  calculateRetryDelay(
    attemptNumber: number,
    config: RetryConfig = this.DEFAULT_RETRY_CONFIG,
  ): number {
    if (config.exponentialBackoff) {
      // 1s, 2s, 4s, 8s, ...
      return config.retryDelay * Math.pow(2, attemptNumber - 1);
    }
    return config.retryDelay;
  }

  /**
   * Execute with automatic retry on retryable errors
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig = this.DEFAULT_RETRY_CONFIG,
    onRetry?: (attempt: number, error: Error) => void,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Only retry if error is retryable and not last attempt
        if (!this.isRetryableError(lastError) || attempt === config.maxRetries) {
          throw lastError;
        }

        // Calculate delay and notify
        const delay = this.calculateRetryDelay(attempt, config);
        onRetry?.(attempt, lastError);

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Create recovery checkpoint for long-running executions
   */
  createCheckpoint(execution: Partial<ExecutionResult>): ErrorRecoveryState {
    return {
      executionId: execution.id!,
      projectId: execution.projectId!,
      timestamp: new Date().toISOString(),
      lastSuccessfulStep: execution.steps?.[execution.steps.length - 1],
      completedSteps: execution.steps || [],
      partialOutput: execution.output,
      tokenUsageSnapshot: execution.tokenUsage || { input: 0, output: 0, total: 0 },
      error: execution.error,
      retryCount: 0,
    };
  }

  /**
   * Clean up old recovery states (older than 7 days)
   */
  async cleanupOldRecoveryStates(projectId: string, maxAgeDays: number = 7): Promise<number> {
    const recoveryDir = path.join(process.cwd(), 'projects', projectId, 'recovery');
    const cutoffTime = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

    try {
      const files = await fs.readdir(recoveryDir);
      let deletedCount = 0;

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(recoveryDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const state = JSON.parse(content) as ErrorRecoveryState;

        if (new Date(state.timestamp).getTime() < cutoffTime) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 0;
      throw error;
    }
  }
}
