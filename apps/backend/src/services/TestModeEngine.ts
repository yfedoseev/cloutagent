import { EventEmitter } from 'events';
import type {
  ExecutionConfig,
  ExecutionResult,
  WorkflowGraph,
  Node,
  TokenUsage,
} from '@cloutagent/types';

export class TestModeEngine extends EventEmitter {
  /**
   * Execute workflow in test mode (no actual API calls)
   * Simulates execution and validates workflow structure
   */
  async testExecute(
    config: ExecutionConfig,
    workflow: WorkflowGraph,
  ): Promise<ExecutionResult> {
    const executionId = `test-exec-${Date.now()}`;
    const startTime = Date.now();

    const execution: ExecutionResult = {
      id: executionId,
      projectId: config.projectId,
      status: 'running',
      startedAt: new Date().toISOString(),
      steps: [],
      tokenUsage: { input: 0, output: 0, total: 0 },
      costUSD: 0,
    };

    this.emit('test:started', { executionId, projectId: config.projectId });

    try {
      // Small delay to ensure duration is measurable
      await this.simulateDelay(10);

      // Step 1: Validate workflow structure
      this.emit('test:step', { executionId, step: 'validation', status: 'running' });

      const agentNode = workflow.nodes.find(n => n.type === 'agent');
      if (!agentNode) {
        throw new Error('No agent node found in workflow');
      }

      execution.steps.push({
        type: 'validation',
        status: 'completed',
        message: 'Workflow structure validated',
        timestamp: new Date().toISOString(),
      });

      // Step 2: Simulate pre-execution hooks
      const preHooks = workflow.nodes.filter(
        n => n.type === 'hook' && n.data?.config?.type === 'pre-execution',
      );

      if (preHooks.length > 0) {
        this.emit('test:step', { executionId, step: 'pre-hooks', status: 'running' });

        await this.simulateDelay(100);

        execution.steps.push({
          type: 'hook',
          status: 'completed',
          message: `Simulated ${preHooks.length} pre-execution hook(s)`,
          timestamp: new Date().toISOString(),
        });
      }

      // Step 3: Simulate main agent execution
      this.emit('test:step', { executionId, step: 'agent', status: 'running' });

      const mockOutput = this.generateMockOutput(agentNode, config.input);
      const mockTokenUsage = this.estimateTokenUsage(agentNode, config.input);

      await this.simulateStreamingOutput(executionId, mockOutput);

      execution.steps.push({
        type: 'agent',
        status: 'completed',
        message: 'Agent execution simulated',
        timestamp: new Date().toISOString(),
      });

      execution.tokenUsage.input += mockTokenUsage.input;
      execution.tokenUsage.output += mockTokenUsage.output;

      // Step 4: Simulate subagent execution (parallel)
      const subagents = this.getConnectedSubagents(workflow, agentNode.id);

      if (subagents.length > 0) {
        this.emit('test:step', { executionId, step: 'subagents', status: 'running' });

        await this.simulateDelay(200);

        for (const subagent of subagents) {
          const subagentTokens = this.estimateTokenUsage(subagent, 'subagent task');
          execution.tokenUsage.input += subagentTokens.input;
          execution.tokenUsage.output += subagentTokens.output;
        }

        execution.steps.push({
          type: 'subagent',
          status: 'completed',
          message: `Simulated ${subagents.length} subagent(s) in parallel`,
          timestamp: new Date().toISOString(),
        });
      }

      // Step 5: Simulate post-execution hooks
      const postHooks = workflow.nodes.filter(
        n => n.type === 'hook' && n.data?.config?.type === 'post-execution',
      );

      if (postHooks.length > 0) {
        this.emit('test:step', { executionId, step: 'post-hooks', status: 'running' });

        await this.simulateDelay(100);

        execution.steps.push({
          type: 'hook',
          status: 'completed',
          message: `Simulated ${postHooks.length} post-execution hook(s)`,
          timestamp: new Date().toISOString(),
        });
      }

      // Calculate final metrics
      execution.tokenUsage.total = execution.tokenUsage.input + execution.tokenUsage.output;
      execution.costUSD = this.calculateCost(execution.tokenUsage);
      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
      execution.duration = Date.now() - startTime;
      execution.output = mockOutput;

      this.emit('test:completed', { executionId, result: execution });

      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.error = (error as Error).message;
      execution.completedAt = new Date().toISOString();
      execution.duration = Date.now() - startTime;

      this.emit('test:failed', { executionId, error: execution.error });

      return execution;
    }
  }

  /**
   * Generate mock output based on agent configuration
   */
  private generateMockOutput(agentNode: Node, input: string): string {
    const systemPrompt = agentNode.data?.config?.systemPrompt || '';

    return [
      '[TEST MODE - Simulated Output]',
      '',
      `System Prompt: ${systemPrompt.substring(0, 100)}${systemPrompt.length > 100 ? '...' : ''}`,
      `User Input: ${input}`,
      '',
      'This is a simulated response. In production mode, Claude would process your input',
      'according to the system prompt and generate a real response.',
      '',
      `Model: ${agentNode.data?.config?.model || 'claude-sonnet-4-5'}`,
      `Temperature: ${agentNode.data?.config?.temperature ?? 1.0}`,
      `Max Tokens: ${agentNode.data?.config?.maxTokens || 4096}`,
    ].join('\n');
  }

  /**
   * Estimate token usage based on prompt and config
   */
  private estimateTokenUsage(node: Node, input: string): TokenUsage {
    const systemPrompt = node.data?.config?.systemPrompt || '';
    const maxTokens = node.data?.config?.maxTokens || 4096;

    // Rough estimation: 1 token ≈ 4 characters
    const inputTokens = Math.ceil((systemPrompt.length + input.length) / 4);
    const outputTokens = Math.min(Math.ceil(maxTokens / 2), 500); // Estimate 50% of max or 500

    return {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens,
    };
  }

  /**
   * Calculate cost based on token usage
   * Claude Sonnet 4.5: $3/1M input, $15/1M output
   */
  private calculateCost(tokenUsage: TokenUsage): number {
    const inputCost = (tokenUsage.input / 1_000_000) * 3.0;
    const outputCost = (tokenUsage.output / 1_000_000) * 15.0;
    return inputCost + outputCost;
  }

  /**
   * Get subagents connected to agent node
   */
  private getConnectedSubagents(workflow: WorkflowGraph, agentId: string): Node[] {
    const connectedIds = workflow.edges
      ?.filter(e => e.source === agentId)
      .map(e => e.target) || [];

    return workflow.nodes.filter(
      n => n.type === 'subagent' && connectedIds.includes(n.id),
    );
  }

  /**
   * Simulate streaming output with delays
   */
  private async simulateStreamingOutput(executionId: string, output: string): Promise<void> {
    const chunks = output.split('\n');

    for (const chunk of chunks) {
      await this.simulateDelay(50);
      this.emit('test:output', { executionId, chunk: `${chunk}\n` });
    }
  }

  /**
   * Simulate delay (async sleep)
   */
  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Dry run validation - checks workflow without executing
   */
  async dryRun(workflow: WorkflowGraph): Promise<{
    valid: boolean;
    estimatedCost: number;
    estimatedTokens: number;
    estimatedDuration: number;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Basic validation
    if (!workflow.nodes || workflow.nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }

    const agentNode = workflow.nodes.find(n => n.type === 'agent');
    if (!agentNode) {
      errors.push('Workflow must have an agent node');
    }

    // Estimate costs and duration
    let estimatedTokens = 0;
    let estimatedDuration = 0;

    if (agentNode) {
      const agentTokens = this.estimateTokenUsage(agentNode, 'test input');
      estimatedTokens += agentTokens.total;
      estimatedDuration += 2000; // 2 seconds for agent

      const subagents = this.getConnectedSubagents(workflow, agentNode.id);
      for (const subagent of subagents) {
        const subTokens = this.estimateTokenUsage(subagent, 'subagent task');
        estimatedTokens += subTokens.total;
      }

      // Subagents run in parallel, add max 3 seconds
      if (subagents.length > 0) {
        estimatedDuration += 3000;
      }

      // Add time for hooks (100ms each)
      const hooks = workflow.nodes.filter(n => n.type === 'hook');
      estimatedDuration += hooks.length * 100;
    }

    const estimatedCost = this.calculateCost({
      input: estimatedTokens / 2,
      output: estimatedTokens / 2,
      total: estimatedTokens,
    });

    return {
      valid: errors.length === 0,
      estimatedCost,
      estimatedTokens,
      estimatedDuration,
      errors,
    };
  }
}
