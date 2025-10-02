export interface TokenUsage {
  input: number;
  output: number;
  total?: number;
}

export interface CostLimits {
  maxTokens?: number;
  maxCost?: number;
}

export interface LimitCheckResult {
  withinLimits: boolean;
  exceeded?: {
    type: 'tokens' | 'cost';
    current: number;
    limit: number;
  };
}

export interface ICostTracker {
  trackTokens(executionId: string, usage: TokenUsage): void;
  calculateCost(usage: TokenUsage): number;
  checkLimits(executionId: string, limits: CostLimits): LimitCheckResult;
  getExecutionCost(executionId: string): number;
  getProjectTotalCost(projectId: string): number;
}

// Claude Sonnet 4.5 pricing (per 1M tokens)
export const CLAUDE_SONNET_4_5_PRICING = {
  input: 3.0, // $3.00 per 1M input tokens
  output: 15.0, // $15.00 per 1M output tokens
} as const;
