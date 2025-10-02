import { EventEmitter } from 'events';

import type {
  Execution,
  ExecutionConfig,
  ExecutionStep,
  WorkflowGraph,
  Node,
  HookType,
  HookExecutionContext,
  SubagentExecutionRequest,
  SubagentExecutionResponse,
} from '@cloutagent/types';
import type { HookExecutionService } from './HookExecutionService';
import type { VariableService } from './VariableService';
import type { ExecutionHistoryService } from './ExecutionHistoryService';
import type { ErrorRecoveryService } from './ErrorRecoveryService';
import { VariableInterpolationEngine } from './VariableInterpolationEngine';
import { WorkflowValidationEngine } from './WorkflowValidationEngine';

interface IClaudeSDKService {
  createAgent(config: Record<string, unknown>): {
    run(input: string, options?: {
      onChunk?: (chunk: string) => void;
      onToolCall?: (toolName: string, toolArgs: unknown) => Promise<void>;
      onToolResult?: (toolName: string, toolResult: unknown) => Promise<void>;
    }): Promise<{
      output: string;
      usage: {
        input: number;
        output: number;
        total: number;
      };
    }>;
  };
}

interface ISubagentService {
  executeBatch(requests: SubagentExecutionRequest[]): Promise<SubagentExecutionResponse[]>;
}

export class ExecutionEngine extends EventEmitter {
  private activeExecutions = new Map<string, Execution>();
  private interpolationEngine = new VariableInterpolationEngine();
  private validationEngine = new WorkflowValidationEngine();

  constructor(
    private claudeSDK: IClaudeSDKService,
    private subagentService: ISubagentService,
    private hookService: HookExecutionService,
    private variableService?: VariableService,
    private historyService?: ExecutionHistoryService,
    private recoveryService?: ErrorRecoveryService,
  ) {
    super();
  }

  async execute(
    config: ExecutionConfig,
    workflow: WorkflowGraph,
  ): Promise<Execution> {
    const execution: Execution = {
      id: this.generateExecutionId(),
      projectId: config.projectId,
      status: 'queued',
      input: config.input,
      startedAt: new Date(),
      tokenUsage: { input: 0, output: 0, total: 0 },
      costUSD: 0,
      steps: [],
      retryCount: 0,
    };

    this.activeExecutions.set(execution.id, execution);
    this.emit('execution:started', {
      executionId: execution.id,
      projectId: config.projectId,
      timestamp: execution.startedAt,
    });

    try {
      // Validate workflow before execution
      const validationResult = this.validationEngine.validate(workflow);

      if (!validationResult.valid) {
        const errorMessages = validationResult.errors.map(e => e.message).join('; ');
        throw new Error(`Workflow validation failed: ${errorMessages}`);
      }

      // Execute validation fail hooks if there are warnings
      if (validationResult.warnings.length > 0) {
        await this.executeHooks(workflow, 'on-validation-fail', execution, {
          warnings: validationResult.warnings,
        });
      }

      // Update status to running
      execution.status = 'running';

      // Get variable scope if variableService is available
      const variableScope = this.variableService
        ? await this.variableService.getVariableScope(config.projectId, execution.id)
        : null;

      // Execute pre-execution hooks
      await this.executeHooks(workflow, 'pre-execution', execution);

      // Find main agent node
      const agentNode = workflow.nodes.find(n => n.type === 'agent');
      if (!agentNode) {
        throw new Error('No agent node found in workflow');
      }

      // Interpolate system prompt if variables exist
      if (variableScope && agentNode.data.config.systemPrompt) {
        agentNode.data.config.systemPrompt = this.interpolationEngine.interpolate(
          agentNode.data.config.systemPrompt as string,
          variableScope,
        );
      }

      // Interpolate user input
      let userInput = config.input;
      if (variableScope && userInput) {
        userInput = this.interpolationEngine.interpolate(
          userInput,
          variableScope,
        );
      }

      // Execute agent with retry if recovery service is available
      let agentResult;
      if (this.recoveryService) {
        agentResult = await this.recoveryService.executeWithRetry(
          () => this.executeAgent(agentNode, { ...config, input: userInput }, execution),
          { maxRetries: 3, retryDelay: 1000, exponentialBackoff: true },
          (attempt, error) => {
            this.emit('execution:retry', {
              executionId: execution.id,
              attempt,
              error: error.message,
            });
          },
        );
      } else {
        agentResult = await this.executeAgent(agentNode, { ...config, input: userInput }, execution);
      }

      // Execute subagents if any (in parallel)
      const subagentNodes = this.findConnectedSubagents(agentNode.id, workflow);
      if (subagentNodes.length > 0) {
        await this.executeSubagents(subagentNodes, execution);
      }

      // Execute post-execution hooks
      await this.executeHooks(workflow, 'post-execution', execution);

      // Mark as completed
      execution.status = 'completed';
      execution.output = agentResult.output;
      execution.completedAt = new Date();
      execution.duration =
        execution.completedAt.getTime() - execution.startedAt.getTime();

      this.emit('execution:completed', {
        executionId: execution.id,
        result: execution,
      });

      // Auto-save execution to history if service is available
      if (this.historyService && config.options?.saveHistory !== false) {
        await this.historyService.saveExecution(config.projectId, execution);
      }

      return execution;
    } catch (error: unknown) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.completedAt = new Date();
      execution.duration =
        execution.completedAt.getTime() - execution.startedAt.getTime();

      // Save recovery state on failure if recovery service is available
      if (this.recoveryService) {
        const checkpoint = this.recoveryService.createCheckpoint(execution);
        await this.recoveryService.saveRecoveryState(
          config.projectId,
          execution.id,
          checkpoint,
        );
      }

      // Execute error hooks
      await this.executeHooks(workflow, 'on-error', execution, { error });

      this.emit('execution:failed', {
        executionId: execution.id,
        error: error instanceof Error ? error.message : String(error),
      });

      // Auto-save failed execution to history if service is available
      if (this.historyService && config.options?.saveHistory !== false) {
        await this.historyService.saveExecution(config.projectId, execution);
      }

      return execution;
    } finally {
      this.activeExecutions.delete(execution.id);
    }
  }

  async pause(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution || execution.status !== 'running') {
      return false;
    }

    execution.status = 'paused';
    this.emit('execution:paused', { executionId });
    return true;
  }

  async resume(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution || execution.status !== 'paused') {
      return false;
    }

    execution.status = 'running';
    this.emit('execution:resumed', { executionId });
    return true;
  }

  async cancel(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return false;
    }

    execution.status = 'cancelled';
    execution.completedAt = new Date();
    this.emit('execution:cancelled', { executionId });
    this.activeExecutions.delete(executionId);
    return true;
  }

  private async executeAgent(
    node: Node,
    config: ExecutionConfig,
    execution: Execution,
  ): Promise<{ output: string; tokenUsage: { input: number; output: number; total: number } }> {
    const step: ExecutionStep = {
      id: this.generateStepId(),
      nodeId: node.id,
      nodeType: 'agent',
      status: 'running',
      startedAt: new Date(),
    };

    execution.steps.push(step);
    this.emit('execution:step', {
      executionId: execution.id,
      step: 'agent-execution',
      status: 'running',
    });

    try {
      // Create agent and run
      const agent = this.claudeSDK.createAgent(node.data.config);

      const result = await agent.run(config.input, {
        onChunk: (chunk: string) => {
          this.emit('execution:output', {
            executionId: execution.id,
            chunk,
            complete: false,
          });
        },
        onToolCall: async (toolName: string, toolArgs: unknown) => {
          // Execute pre-tool-call hooks
          const workflow = this.getWorkflowForExecution(execution.id);
          if (workflow) {
            await this.executeHooks(workflow, 'pre-tool-call', execution, {
              toolName,
              toolArgs,
            });
          }
        },
        onToolResult: async (toolName: string, toolResult: unknown) => {
          // Execute post-tool-call hooks
          const workflow = this.getWorkflowForExecution(execution.id);
          if (workflow) {
            await this.executeHooks(workflow, 'post-tool-call', execution, {
              toolName,
              toolResult,
            });
          }
        },
      });

      // Update token usage
      execution.tokenUsage.input += result.usage.input;
      execution.tokenUsage.output += result.usage.output;
      execution.tokenUsage.total += result.usage.total;
      execution.costUSD = this.calculateCost(execution.tokenUsage);

      this.emit('execution:token-usage', {
        executionId: execution.id,
        usage: {
          input: execution.tokenUsage.input,
          output: execution.tokenUsage.output,
          total: execution.tokenUsage.total,
        },
      });

      step.status = 'completed';
      step.completedAt = new Date();
      step.duration = step.completedAt.getTime() - step.startedAt.getTime();
      step.output = result.output;
      step.tokenUsage = result.usage;

      return { output: result.output, tokenUsage: result.usage };
    } catch (error: unknown) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : String(error);
      step.completedAt = new Date();
      throw error;
    }
  }

  // Helper to get workflow for execution (simplified - in real implementation would be stored)
  private getWorkflowForExecution(_executionId: string): WorkflowGraph | null {
    // In production, this would retrieve the workflow from storage
    // For now, return null as it's not critical for the integration
    return null;
  }

  private async executeSubagents(
    nodes: Node[],
    execution: Execution,
  ): Promise<void> {
    const requests = nodes.map(node => ({
      subagentId: node.id,
      type: node.data.config.type,
      prompt: node.data.config.prompt,
      parentAgentId: execution.id,
    }));

    this.emit('execution:step', {
      executionId: execution.id,
      step: 'subagents',
      status: 'running',
    });

    const results = await this.subagentService.executeBatch(requests);

    // Track token usage
    results.forEach((result) => {
      execution.tokenUsage.input += result.tokenUsage.input;
      execution.tokenUsage.output += result.tokenUsage.output;
      execution.tokenUsage.total +=
        result.tokenUsage.input + result.tokenUsage.output;
    });

    // Update cost after adding all subagent tokens
    execution.costUSD = this.calculateCost(execution.tokenUsage);
  }

  private async executeHooks(
    workflow: WorkflowGraph,
    hookType: HookType,
    execution: Execution,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    const hooks = workflow.nodes
      .filter(n => n.type === 'hook' && n.data.config.type === hookType)
      .map(n => n.data.config);

    if (hooks.length === 0) return;

    // Emit step event for hooks
    this.emit('execution:step', {
      executionId: execution.id,
      step: hookType === 'pre-execution' ? 'pre-hooks' : hookType === 'post-execution' ? 'post-hooks' : hookType,
      status: 'running',
    });

    const context: HookExecutionContext = {
      hookType,
      agentId: execution.id,
      projectId: execution.projectId,
      timestamp: new Date(),
      payload: payload || {},
      context: {},
    };

    const results = await this.hookService.executeHookChain(hooks, context);

    // Emit hook execution results
    this.emit('hooks:executed', {
      hookType,
      executionId: execution.id,
      results,
    });
  }

  private findConnectedSubagents(
    agentId: string,
    workflow: WorkflowGraph,
  ): Node[] {
    const connectedNodeIds = workflow.edges
      .filter(e => e.source === agentId)
      .map(e => e.target);

    return workflow.nodes.filter(
      n => n.type === 'subagent' && connectedNodeIds.includes(n.id),
    );
  }

  private isRetryable(error: Error): boolean {
    const retryableErrors = ['TIMEOUT', 'RATE_LIMIT', 'SERVICE_UNAVAILABLE'];
    return retryableErrors.some(code => error.message.includes(code));
  }

  private calculateCost(usage: { input: number; output: number }): number {
    // Claude Sonnet 4.5 pricing
    const INPUT_COST_PER_1M = 3.0;
    const OUTPUT_COST_PER_1M = 15.0;

    const inputCost = (usage.input / 1_000_000) * INPUT_COST_PER_1M;
    const outputCost = (usage.output / 1_000_000) * OUTPUT_COST_PER_1M;

    return inputCost + outputCost;
  }

  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateStepId(): string {
    return `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
