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
  CloutAgentConfig,
  SSEEvent,
} from '@cloutagent/types';
import type { HookExecutionService } from './HookExecutionService';
import type { VariableService } from './VariableService';
import type { ExecutionHistoryService } from './ExecutionHistoryService';
import type { ErrorRecoveryService } from './ErrorRecoveryService';
import { VariableInterpolationEngine } from './VariableInterpolationEngine';
import { WorkflowValidationEngine } from './WorkflowValidationEngine';
import { ClaudeAgentSDKService } from './ClaudeAgentSDKService';

interface ISubagentService {
  executeBatch(requests: SubagentExecutionRequest[]): Promise<SubagentExecutionResponse[]>;
}

export class ExecutionEngine extends EventEmitter {
  private activeExecutions = new Map<string, Execution>();
  private interpolationEngine = new VariableInterpolationEngine();
  private validationEngine = new WorkflowValidationEngine();
  private workflowStorage = new Map<string, WorkflowGraph>();

  constructor(
    private claudeAgentSDK: ClaudeAgentSDKService,
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
    this.workflowStorage.set(execution.id, workflow);
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
      this.workflowStorage.delete(execution.id);
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
      // Convert node config to CloutAgentConfig
      const agentConfig: CloutAgentConfig = {
        id: node.id,
        name: node.data.config.name || 'Agent',
        model: this.mapModelName(node.data.config.model),
        systemPrompt: node.data.config.systemPrompt,
        temperature: node.data.config.temperature,
        maxTokens: node.data.config.maxTokens,
        maxTurns: node.data.config.maxTurns || 10,
      };

      let fullOutput = '';

      // Event handler for streaming
      const onEvent = async (event: SSEEvent) => {
        switch (event.type) {
          case 'execution:output': {
            // Stream output chunks
            fullOutput += event.data.chunk;
            this.emit('execution:output', {
              executionId: execution.id,
              chunk: event.data.chunk,
              complete: false,
            });
            break;
          }

          case 'execution:thinking': {
            // Emit thinking events
            this.emit('execution:thinking', {
              executionId: execution.id,
              status: event.data.status,
            });
            break;
          }

          case 'execution:tool-call': {
            // Execute pre-tool-call hooks
            const workflow = this.getWorkflowForExecution(execution.id);
            if (workflow) {
              await this.executeHooks(workflow, 'pre-tool-call', execution, {
                toolName: event.data.toolName,
                toolArgs: event.data.toolArgs,
              });
            }
            this.emit('execution:tool-call', {
              executionId: execution.id,
              toolName: event.data.toolName,
              toolId: event.data.toolId,
              toolArgs: event.data.toolArgs,
            });
            break;
          }

          case 'execution:tool-result': {
            // Execute post-tool-call hooks
            const wf = this.getWorkflowForExecution(execution.id);
            if (wf) {
              await this.executeHooks(wf, 'post-tool-call', execution, {
                toolId: event.data.toolId,
                toolResult: event.data.result,
              });
            }
            this.emit('execution:tool-result', {
              executionId: execution.id,
              toolId: event.data.toolId,
              result: event.data.result,
              isError: event.data.isError,
            });
            break;
          }

          case 'execution:cost-update': {
            // Emit cost updates
            this.emit('execution:cost-update', {
              executionId: execution.id,
              totalCostUSD: event.data.totalCostUSD,
              modelUsage: event.data.modelUsage,
            });
            break;
          }
        }
      };

      // Execute with Agent SDK
      const result = await this.claudeAgentSDK.streamExecution(
        agentConfig,
        config.input,
        onEvent,
      );

      // Update execution with results
      execution.tokenUsage.input += result.cost.promptTokens;
      execution.tokenUsage.output += result.cost.completionTokens;
      execution.tokenUsage.total += result.cost.promptTokens + result.cost.completionTokens;
      execution.costUSD += result.cost.totalCost;

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
      step.output = result.result || fullOutput;
      step.tokenUsage = {
        input: result.cost.promptTokens,
        output: result.cost.completionTokens,
      };

      return {
        output: result.result || fullOutput,
        tokenUsage: {
          input: result.cost.promptTokens,
          output: result.cost.completionTokens,
          total: result.cost.promptTokens + result.cost.completionTokens,
        },
      };
    } catch (error: unknown) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : String(error);
      step.completedAt = new Date();
      throw error;
    }
  }

  private mapModelName(model: string): 'sonnet' | 'opus' | 'haiku' {
    // Map old model names to new simplified names
    if (model.includes('opus')) return 'opus';
    if (model.includes('haiku')) return 'haiku';
    return 'sonnet'; // Default to sonnet
  }

  // Helper to get workflow for execution
  private getWorkflowForExecution(executionId: string): WorkflowGraph | null {
    return this.workflowStorage.get(executionId) || null;
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

    // Note: Cost is tracked by Agent SDK, subagent costs would need separate tracking
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

  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateStepId(): string {
    return `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
