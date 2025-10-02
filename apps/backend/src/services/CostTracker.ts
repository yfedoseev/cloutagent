import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  ICostTracker,
  TokenUsage,
  CostLimits,
  LimitCheckResult,
} from '@cloutagent/types';

interface ExecutionCostData {
  executionId: string;
  tokens: TokenUsage;
  cost: number;
  timestamp: string;
}

interface ProjectCostData {
  projectId: string;
  totalCost: number;
  executions: Record<string, ExecutionCostData>;
}

export class CostTracker implements ICostTracker {
  private executions = new Map<string, { tokens: TokenUsage; cost: number }>();

  // Claude Sonnet 4.5 pricing per 1M tokens
  private readonly PRICING = {
    input: 3.0,
    output: 15.0,
  };

  constructor(private costsDir: string = '/app/costs') {}

  calculateCost(usage: TokenUsage): number {
    const inputCost = (usage.input / 1_000_000) * this.PRICING.input;
    const outputCost = (usage.output / 1_000_000) * this.PRICING.output;
    return inputCost + outputCost;
  }

  trackTokens(executionId: string, usage: TokenUsage): void {
    const existing = this.executions.get(executionId);

    if (existing) {
      // Accumulate tokens
      existing.tokens.input += usage.input;
      existing.tokens.output += usage.output;
      existing.tokens.total = existing.tokens.input + existing.tokens.output;
      existing.cost = this.calculateCost(existing.tokens);
    } else {
      const tokens: TokenUsage = {
        input: usage.input,
        output: usage.output,
        total: usage.input + usage.output,
      };
      this.executions.set(executionId, {
        tokens,
        cost: this.calculateCost(tokens),
      });
    }
  }

  checkLimits(executionId: string, limits: CostLimits): LimitCheckResult {
    const execution = this.executions.get(executionId);

    if (!execution) {
      return { withinLimits: true };
    }

    // Check token limit
    if (limits.maxTokens !== undefined) {
      const totalTokens =
        execution.tokens.total ||
        execution.tokens.input + execution.tokens.output;

      if (totalTokens > limits.maxTokens) {
        return {
          withinLimits: false,
          exceeded: {
            type: 'tokens',
            current: totalTokens,
            limit: limits.maxTokens,
          },
        };
      }
    }

    // Check cost limit
    if (limits.maxCost !== undefined) {
      if (execution.cost > limits.maxCost) {
        return {
          withinLimits: false,
          exceeded: {
            type: 'cost',
            current: execution.cost,
            limit: limits.maxCost,
          },
        };
      }
    }

    return { withinLimits: true };
  }

  getExecutionCost(executionId: string): number {
    const execution = this.executions.get(executionId);
    return execution?.cost || 0;
  }

  async getProjectTotalCost(projectId: string): Promise<number> {
    try {
      const projectCostFile = path.join(this.costsDir, `${projectId}.json`);
      const fileContent = await fs.readFile(projectCostFile, 'utf-8');
      const data: ProjectCostData = JSON.parse(fileContent);
      return data.totalCost || 0;
    } catch (error) {
      // File doesn't exist or is corrupted
      return 0;
    }
  }

  async saveProjectCost(projectId: string, executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return;
    }

    await fs.mkdir(this.costsDir, { recursive: true });

    const projectCostFile = path.join(this.costsDir, `${projectId}.json`);

    let projectData: ProjectCostData;

    try {
      const fileContent = await fs.readFile(projectCostFile, 'utf-8');
      projectData = JSON.parse(fileContent);
    } catch (error) {
      // File doesn't exist, create new
      projectData = {
        projectId,
        totalCost: 0,
        executions: {},
      };
    }

    // Add or update execution cost
    projectData.executions[executionId] = {
      executionId,
      tokens: execution.tokens,
      cost: execution.cost,
      timestamp: new Date().toISOString(),
    };

    // Recalculate total cost
    projectData.totalCost = Object.values(projectData.executions).reduce(
      (sum, exec) => sum + exec.cost,
      0,
    );

    await fs.writeFile(
      projectCostFile,
      JSON.stringify(projectData, null, 2),
      'utf-8',
    );
  }
}
