# Phase 4: Execution & Monitoring - Execution Plan

**Timeline**: Weeks 7-8
**Focus**: Real-time Execution, Streaming, Monitoring
**Goal**: Enable live agent execution with real-time feedback, streaming updates, and comprehensive monitoring

## Overview

Phase 4 implements the execution engine and monitoring infrastructure. This phase delivers:
- **Streaming Execution**: Real-time agent execution with Server-Sent Events (SSE)
- **Execution Controls**: Start, stop, pause, resume workflows
- **Live Monitoring**: Real-time token usage, costs, and progress tracking
- **Execution History**: Persistent logs and replay capabilities
- **Error Recovery**: Automatic retry and manual intervention options

## Interface Contracts

### IC-015: Execution Engine Interface

**Purpose**: Define execution lifecycle and control mechanisms

```typescript
// packages/types/src/execution.ts

export type ExecutionStatus =
  | 'queued'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ExecutionConfig {
  projectId: string;
  workflowVersion?: string; // For versioning support
  input: string; // User prompt
  context?: Record<string, any>;
  options?: {
    maxRetries?: number;
    timeout?: number; // milliseconds
    streaming?: boolean;
    saveHistory?: boolean;
  };
}

export interface Execution {
  id: string;
  projectId: string;
  status: ExecutionStatus;
  input: string;
  output?: string;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  costUSD: number;
  steps: ExecutionStep[];
  retryCount: number;
}

export interface ExecutionStep {
  id: string;
  nodeId: string;
  nodeType: 'agent' | 'subagent' | 'hook' | 'mcp';
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  input?: any;
  output?: any;
  error?: string;
  tokenUsage?: {
    input: number;
    output: number;
  };
}

export interface ExecutionControl {
  executionId: string;
  action: 'pause' | 'resume' | 'cancel';
  reason?: string;
}

export interface ExecutionResult {
  execution: Execution;
  success: boolean;
  output?: string;
  error?: string;
}
```

**API Endpoints**:
```typescript
// POST /api/projects/{projectId}/execute
// Body: ExecutionConfig
// Response: { executionId: string }

// POST /api/executions/{executionId}/control
// Body: ExecutionControl
// Response: { success: boolean }

// GET /api/executions/{executionId}
// Response: Execution

// GET /api/projects/{projectId}/executions
// Query: ?limit=20&offset=0&status=completed
// Response: { executions: Execution[], total: number }
```

---

### IC-016: Server-Sent Events (SSE) Interface

**Purpose**: Define real-time streaming protocol for execution updates

```typescript
// packages/types/src/streaming.ts

export type SSEEventType =
  | 'execution:started'
  | 'execution:progress'
  | 'execution:step'
  | 'execution:output'
  | 'execution:token-usage'
  | 'execution:completed'
  | 'execution:failed'
  | 'execution:cancelled';

export interface SSEEvent<T = any> {
  type: SSEEventType;
  timestamp: Date;
  executionId: string;
  data: T;
}

export interface ExecutionStartedEvent {
  execution: Execution;
}

export interface ExecutionProgressEvent {
  progress: number; // 0-100
  currentStep: string; // Node ID
  totalSteps: number;
  completedSteps: number;
  message?: string;
}

export interface ExecutionStepEvent {
  step: ExecutionStep;
}

export interface ExecutionOutputEvent {
  chunk: string; // Partial output
  complete: boolean;
}

export interface ExecutionTokenUsageEvent {
  nodeId: string;
  tokenUsage: {
    input: number;
    output: number;
  };
  costUSD: number;
  cumulativeCost: number;
}

export interface ExecutionCompletedEvent {
  execution: Execution;
  output: string;
  totalDuration: number;
  totalCost: number;
}

export interface ExecutionFailedEvent {
  execution: Execution;
  error: string;
  failedStep?: ExecutionStep;
  retryable: boolean;
}
```

**SSE Endpoint**:
```typescript
// GET /api/executions/{executionId}/stream
// Headers: Accept: text/event-stream
// Response: Stream of SSEEvent<T>

// SSE message format:
// event: execution:progress
// data: {"progress": 45, "currentStep": "agent-001", ...}
// id: msg-123
//
```

---

### IC-017: Execution History Interface

**Purpose**: Define persistent storage and retrieval of execution logs

```typescript
// packages/types/src/history.ts

export interface ExecutionHistory {
  id: string;
  executionId: string;
  projectId: string;
  timestamp: Date;
  logs: ExecutionLog[];
  metadata: {
    userAgent?: string;
    ip?: string;
    workflowSnapshot?: WorkflowGraph; // Snapshot of workflow at execution time
  };
}

export interface ExecutionLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string; // Node ID or system
  message: string;
  data?: any;
}

export interface ExecutionReplay {
  historyId: string;
  playbackSpeed: number; // 1.0 = real-time, 2.0 = 2x speed
}

export interface ExecutionStats {
  projectId: string;
  period: {
    start: Date;
    end: Date;
  };
  stats: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageDuration: number;
    totalTokens: number;
    totalCostUSD: number;
  };
  byStatus: Record<ExecutionStatus, number>;
  byNode: Record<string, {
    executions: number;
    averageDuration: number;
    tokenUsage: number;
  }>;
}
```

**API Endpoints**:
```typescript
// GET /api/executions/{executionId}/history
// Response: ExecutionHistory

// GET /api/executions/{executionId}/logs
// Query: ?level=error&limit=100
// Response: { logs: ExecutionLog[] }

// GET /api/projects/{projectId}/stats
// Query: ?start=2025-01-01&end=2025-01-31
// Response: ExecutionStats

// POST /api/executions/{executionId}/replay
// Body: ExecutionReplay
// Response: SSE stream of historical events
```

---

### IC-018: Error Recovery Interface

**Purpose**: Define error handling, retry logic, and manual intervention

```typescript
// packages/types/src/recovery.ts

export interface ErrorContext {
  executionId: string;
  stepId: string;
  nodeId: string;
  error: {
    message: string;
    code: string;
    stack?: string;
    retryable: boolean;
  };
  attemptNumber: number;
  maxRetries: number;
}

export interface RetryPolicy {
  enabled: boolean;
  maxRetries: number;
  backoff: {
    type: 'exponential' | 'linear' | 'fixed';
    initialDelay: number; // milliseconds
    maxDelay: number;
    multiplier?: number; // For exponential
  };
  retryableErrors: string[]; // Error codes to retry
}

export interface ManualIntervention {
  executionId: string;
  stepId: string;
  action: 'retry' | 'skip' | 'modify-input' | 'cancel';
  modifiedInput?: any; // For modify-input action
  reason: string;
}

export interface RecoveryResult {
  success: boolean;
  action: string;
  message: string;
  newExecutionId?: string; // If retry created new execution
}
```

**API Endpoints**:
```typescript
// POST /api/executions/{executionId}/retry
// Body: { stepId?: string } // Retry specific step or entire execution
// Response: RecoveryResult

// POST /api/executions/{executionId}/intervene
// Body: ManualIntervention
// Response: RecoveryResult

// GET /api/executions/{executionId}/recovery-options
// Response: { actions: string[], recommendations: string[] }
```

---

## Tasks

### TASK-032: Execution Engine Core

**Agent**: backend-engineer
**Priority**: P0
**Estimated Time**: 8 hours
**Dependencies**: TASK-005 (Claude SDK), TASK-022 (Subagent Service), TASK-024 (Hook Service), IC-015

**Description**: Implement core execution engine with workflow orchestration and step-by-step execution.

**Implementation Skeleton**:
```typescript
// apps/backend/src/services/ExecutionEngine.ts

import {
  Execution,
  ExecutionConfig,
  ExecutionStep,
  ExecutionStatus,
  WorkflowGraph,
} from '@cloutagent/types';
import { ClaudeSDKService } from './ClaudeSDKService';
import { SubagentService } from './SubagentService';
import { HookExecutionService } from './HookExecutionService';
import { EventEmitter } from 'events';

export class ExecutionEngine extends EventEmitter {
  private activeExecutions = new Map<string, Execution>();

  constructor(
    private claudeSDK: ClaudeSDKService,
    private subagentService: SubagentService,
    private hookService: HookExecutionService
  ) {
    super();
  }

  async execute(
    config: ExecutionConfig,
    workflow: WorkflowGraph
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
    this.emit('execution:started', { execution });

    try {
      // Update status to running
      execution.status = 'running';

      // Execute pre-execution hooks
      await this.executeHooks(workflow, 'pre-execution', execution);

      // Find main agent node
      const agentNode = workflow.nodes.find(n => n.type === 'agent');
      if (!agentNode) {
        throw new Error('No agent node found in workflow');
      }

      // Execute agent with streaming
      const agentResult = await this.executeAgent(
        agentNode,
        config,
        execution
      );

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
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();

      this.emit('execution:completed', { execution, output: agentResult.output });

      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();

      // Execute error hooks
      await this.executeHooks(workflow, 'on-error', execution, { error });

      this.emit('execution:failed', {
        execution,
        error: error.message,
        retryable: this.isRetryable(error),
      });

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
    execution: Execution
  ): Promise<{ output: string; tokenUsage: any }> {
    const step: ExecutionStep = {
      id: this.generateStepId(),
      nodeId: node.id,
      nodeType: 'agent',
      status: 'running',
      startedAt: new Date(),
    };

    execution.steps.push(step);
    this.emit('execution:step', { step });

    try {
      // Execute pre-tool-call hooks
      await this.executeHooks(execution.workflow, 'pre-tool-call', execution);

      // Create agent and run
      const agent = this.claudeSDK.createAgent(node.data.config);

      const result = await agent.run(config.input, {
        onChunk: (chunk) => {
          this.emit('execution:output', {
            executionId: execution.id,
            chunk,
            complete: false,
          });
        },
        onToolCall: async (toolName, toolArgs) => {
          // Execute post-tool-call hooks
          await this.executeHooks(execution.workflow, 'post-tool-call', execution, {
            toolName,
            toolArgs,
          });
        },
      });

      // Update token usage
      execution.tokenUsage.input += result.usage.input;
      execution.tokenUsage.output += result.usage.output;
      execution.tokenUsage.total += result.usage.total;
      execution.costUSD += this.calculateCost(result.usage);

      this.emit('execution:token-usage', {
        nodeId: node.id,
        tokenUsage: result.usage,
        costUSD: execution.costUSD,
        cumulativeCost: execution.costUSD,
      });

      step.status = 'completed';
      step.completedAt = new Date();
      step.duration = step.completedAt.getTime() - step.startedAt.getTime();
      step.output = result.output;
      step.tokenUsage = result.usage;

      return { output: result.output, tokenUsage: result.usage };
    } catch (error) {
      step.status = 'failed';
      step.error = error.message;
      step.completedAt = new Date();
      throw error;
    }
  }

  private async executeSubagents(
    nodes: Node[],
    execution: Execution
  ): Promise<void> {
    const requests = nodes.map(node => ({
      subagentId: node.id,
      type: node.data.config.type,
      prompt: node.data.config.prompt,
      parentAgentId: execution.id,
    }));

    const results = await this.subagentService.executeBatch(requests);

    // Track token usage
    results.forEach(result => {
      execution.tokenUsage.input += result.tokenUsage.input;
      execution.tokenUsage.output += result.tokenUsage.output;
      execution.tokenUsage.total += result.tokenUsage.input + result.tokenUsage.output;
    });
  }

  private async executeHooks(
    workflow: WorkflowGraph,
    hookType: string,
    execution: Execution,
    payload?: any
  ): Promise<void> {
    const hooks = workflow.nodes
      .filter(n => n.type === 'hook' && n.data.config.type === hookType)
      .map(n => n.data.config);

    if (hooks.length === 0) return;

    await this.hookService.executeHookChain(hooks, {
      hookType,
      executionId: execution.id,
      payload,
      context: {},
    });
  }

  private findConnectedSubagents(agentId: string, workflow: WorkflowGraph): Node[] {
    const connectedNodeIds = workflow.edges
      .filter(e => e.source === agentId)
      .map(e => e.target);

    return workflow.nodes.filter(
      n => n.type === 'subagent' && connectedNodeIds.includes(n.id)
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
```

**Acceptance Criteria**:
- [ ] Workflow execution follows node graph correctly
- [ ] Pre/post execution hooks execute at right times
- [ ] Subagents execute in parallel
- [ ] Token usage tracked accurately for all nodes
- [ ] Cost calculation matches Claude API pricing
- [ ] Pause/resume/cancel controls work correctly
- [ ] Event emitter streams real-time updates
- [ ] Error handling captures and propagates errors

**Test Cases**:
```typescript
describe('ExecutionEngine', () => {
  it('should execute complete workflow', async () => {
    const config: ExecutionConfig = {
      projectId: 'proj-001',
      input: 'Build a login form',
      options: { streaming: true },
    };

    const execution = await engine.execute(config, workflow);

    expect(execution.status).toBe('completed');
    expect(execution.output).toBeTruthy();
    expect(execution.tokenUsage.total).toBeGreaterThan(0);
  });

  it('should execute subagents in parallel', async () => {
    const workflow = createWorkflowWithSubagents(3);

    const startTime = Date.now();
    const execution = await engine.execute(config, workflow);
    const duration = Date.now() - startTime;

    expect(execution.steps.filter(s => s.nodeType === 'subagent')).toHaveLength(3);
    expect(duration).toBeLessThan(10000); // Parallel should be fast
  });

  it('should pause and resume execution', async () => {
    const promise = engine.execute(config, workflow);

    await delay(100);
    await engine.pause(execution.id);

    expect(execution.status).toBe('paused');

    await engine.resume(execution.id);
    const result = await promise;

    expect(result.status).toBe('completed');
  });
});
```

---

### TASK-033: Server-Sent Events (SSE) Service

**Agent**: backend-engineer
**Priority**: P0
**Estimated Time**: 5 hours
**Dependencies**: TASK-032 (Execution Engine), IC-016

**Description**: Implement SSE endpoint for real-time execution streaming.

**Implementation Skeleton**:
```typescript
// apps/backend/src/services/SSEService.ts

import { Response } from 'express';
import { SSEEvent, SSEEventType } from '@cloutagent/types';
import { EventEmitter } from 'events';

export class SSEService {
  private clients = new Map<string, Set<Response>>();

  constructor(private executionEngine: EventEmitter) {
    this.setupEngineListeners();
  }

  subscribe(executionId: string, res: Response): void {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection message
    this.sendEvent(res, {
      type: 'connection:established',
      timestamp: new Date(),
      executionId,
      data: { message: 'Connected to execution stream' },
    });

    // Track client
    if (!this.clients.has(executionId)) {
      this.clients.set(executionId, new Set());
    }
    this.clients.get(executionId)!.add(res);

    // Handle client disconnect
    res.on('close', () => {
      this.unsubscribe(executionId, res);
    });
  }

  unsubscribe(executionId: string, res: Response): void {
    const clients = this.clients.get(executionId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        this.clients.delete(executionId);
      }
    }
  }

  private setupEngineListeners(): void {
    this.executionEngine.on('execution:started', (data) => {
      this.broadcast(data.execution.id, {
        type: 'execution:started',
        timestamp: new Date(),
        executionId: data.execution.id,
        data,
      });
    });

    this.executionEngine.on('execution:step', (data) => {
      this.broadcast(data.step.executionId, {
        type: 'execution:step',
        timestamp: new Date(),
        executionId: data.step.executionId,
        data,
      });
    });

    this.executionEngine.on('execution:output', (data) => {
      this.broadcast(data.executionId, {
        type: 'execution:output',
        timestamp: new Date(),
        executionId: data.executionId,
        data,
      });
    });

    this.executionEngine.on('execution:token-usage', (data) => {
      this.broadcast(data.executionId, {
        type: 'execution:token-usage',
        timestamp: new Date(),
        executionId: data.executionId,
        data,
      });
    });

    this.executionEngine.on('execution:completed', (data) => {
      this.broadcast(data.execution.id, {
        type: 'execution:completed',
        timestamp: new Date(),
        executionId: data.execution.id,
        data,
      });
    });

    this.executionEngine.on('execution:failed', (data) => {
      this.broadcast(data.execution.id, {
        type: 'execution:failed',
        timestamp: new Date(),
        executionId: data.execution.id,
        data,
      });
    });
  }

  private broadcast(executionId: string, event: SSEEvent): void {
    const clients = this.clients.get(executionId);
    if (!clients) return;

    clients.forEach(res => {
      this.sendEvent(res, event);
    });
  }

  private sendEvent(res: Response, event: SSEEvent): void {
    const formattedEvent = [
      `event: ${event.type}`,
      `data: ${JSON.stringify(event.data)}`,
      `id: ${Date.now()}`,
      '',
      '',
    ].join('\n');

    res.write(formattedEvent);
  }
}

// apps/backend/src/routes/executions.ts

import { Router } from 'express';
import { SSEService } from '../services/SSEService';

export function createExecutionRoutes(sseService: SSEService): Router {
  const router = Router();

  router.get('/:executionId/stream', (req, res) => {
    const { executionId } = req.params;

    // Verify execution exists
    // ... validation code ...

    sseService.subscribe(executionId, res);
  });

  return router;
}
```

**Acceptance Criteria**:
- [ ] SSE connection establishes correctly
- [ ] All execution events streamed in real-time
- [ ] Client disconnection handled gracefully
- [ ] No memory leaks from stale connections
- [ ] Multiple clients can subscribe to same execution
- [ ] Event IDs sequential for replay
- [ ] Proper CORS headers for cross-origin requests

**Test Cases**:
```typescript
describe('SSEService', () => {
  it('should stream execution events', async () => {
    const events: SSEEvent[] = [];

    const stream = await fetch(`/api/executions/${executionId}/stream`);
    const reader = stream.body.getReader();

    const timeout = setTimeout(() => reader.cancel(), 5000);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const event = parseSSEEvent(value);
      events.push(event);
    }

    clearTimeout(timeout);

    expect(events).toContainEqual(
      expect.objectContaining({ type: 'execution:started' })
    );
    expect(events).toContainEqual(
      expect.objectContaining({ type: 'execution:completed' })
    );
  });
});
```

---

### TASK-034: Execution History Storage

**Agent**: backend-engineer
**Priority**: P1
**Estimated Time**: 4 hours
**Dependencies**: TASK-001 (File Storage), IC-017

**Description**: Implement persistent execution history with log storage and retrieval.

**Implementation Skeleton**:
```typescript
// apps/backend/src/services/ExecutionHistoryService.ts

import { promises as fs } from 'fs';
import path from 'path';
import {
  Execution,
  ExecutionHistory,
  ExecutionLog,
  ExecutionStats,
} from '@cloutagent/types';

export class ExecutionHistoryService {
  private readonly historyDir: string;

  constructor(baseDir: string = './executions') {
    this.historyDir = baseDir;
  }

  async saveExecution(execution: Execution): Promise<void> {
    const projectDir = path.join(this.historyDir, execution.projectId);
    await fs.mkdir(projectDir, { recursive: true });

    const filePath = path.join(projectDir, `${execution.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(execution, null, 2), 'utf-8');
  }

  async getExecution(executionId: string): Promise<Execution | null> {
    // Search across all project directories
    const projects = await fs.readdir(this.historyDir);

    for (const projectId of projects) {
      const filePath = path.join(this.historyDir, projectId, `${executionId}.json`);

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
      } catch {
        continue;
      }
    }

    return null;
  }

  async listExecutions(
    projectId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: ExecutionStatus;
    } = {}
  ): Promise<{ executions: Execution[]; total: number }> {
    const projectDir = path.join(this.historyDir, projectId);

    try {
      const files = await fs.readdir(projectDir);

      const executions = await Promise.all(
        files
          .filter(f => f.endsWith('.json'))
          .map(async f => {
            const content = await fs.readFile(
              path.join(projectDir, f),
              'utf-8'
            );
            return JSON.parse(content) as Execution;
          })
      );

      // Filter by status
      let filtered = executions;
      if (options.status) {
        filtered = executions.filter(e => e.status === options.status);
      }

      // Sort by startedAt descending
      filtered.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

      // Paginate
      const offset = options.offset || 0;
      const limit = options.limit || 20;
      const paginated = filtered.slice(offset, offset + limit);

      return {
        executions: paginated,
        total: filtered.length,
      };
    } catch {
      return { executions: [], total: 0 };
    }
  }

  async appendLog(executionId: string, log: ExecutionLog): Promise<void> {
    const execution = await this.getExecution(executionId);
    if (!execution) return;

    const logsPath = path.join(
      this.historyDir,
      execution.projectId,
      `${executionId}.logs.jsonl`
    );

    await fs.appendFile(logsPath, JSON.stringify(log) + '\n', 'utf-8');
  }

  async getLogs(
    executionId: string,
    options: { level?: string; limit?: number } = {}
  ): Promise<ExecutionLog[]> {
    const execution = await this.getExecution(executionId);
    if (!execution) return [];

    const logsPath = path.join(
      this.historyDir,
      execution.projectId,
      `${executionId}.logs.jsonl`
    );

    try {
      const content = await fs.readFile(logsPath, 'utf-8');
      const logs = content
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line) as ExecutionLog);

      // Filter by level
      let filtered = logs;
      if (options.level) {
        filtered = logs.filter(l => l.level === options.level);
      }

      // Limit
      if (options.limit) {
        filtered = filtered.slice(0, options.limit);
      }

      return filtered;
    } catch {
      return [];
    }
  }

  async getStats(
    projectId: string,
    period: { start: Date; end: Date }
  ): Promise<ExecutionStats> {
    const { executions } = await this.listExecutions(projectId, {});

    const filtered = executions.filter(
      e => e.startedAt >= period.start && e.startedAt <= period.end
    );

    const successful = filtered.filter(e => e.status === 'completed');
    const failed = filtered.filter(e => e.status === 'failed');

    const totalDuration = filtered.reduce((sum, e) => sum + (e.duration || 0), 0);
    const totalTokens = filtered.reduce((sum, e) => sum + e.tokenUsage.total, 0);
    const totalCost = filtered.reduce((sum, e) => sum + e.costUSD, 0);

    return {
      projectId,
      period,
      stats: {
        totalExecutions: filtered.length,
        successfulExecutions: successful.length,
        failedExecutions: failed.length,
        averageDuration: totalDuration / filtered.length || 0,
        totalTokens,
        totalCostUSD: totalCost,
      },
      byStatus: {
        completed: successful.length,
        failed: failed.length,
        cancelled: filtered.filter(e => e.status === 'cancelled').length,
        running: 0,
        paused: 0,
        queued: 0,
      },
      byNode: this.aggregateByNode(filtered),
    };
  }

  private aggregateByNode(executions: Execution[]): Record<string, any> {
    const byNode: Record<string, any> = {};

    executions.forEach(execution => {
      execution.steps.forEach(step => {
        if (!byNode[step.nodeId]) {
          byNode[step.nodeId] = {
            executions: 0,
            averageDuration: 0,
            tokenUsage: 0,
          };
        }

        byNode[step.nodeId].executions++;
        byNode[step.nodeId].averageDuration += step.duration || 0;
        byNode[step.nodeId].tokenUsage +=
          (step.tokenUsage?.input || 0) + (step.tokenUsage?.output || 0);
      });
    });

    // Calculate averages
    Object.values(byNode).forEach((node: any) => {
      node.averageDuration /= node.executions;
    });

    return byNode;
  }
}
```

**Acceptance Criteria**:
- [ ] Execution saved to filesystem after completion
- [ ] Logs stored in JSONL format for streaming
- [ ] List executions with pagination and filtering
- [ ] Stats aggregation by status and node
- [ ] Efficient retrieval (no loading all files)
- [ ] Thread-safe file writes

---

### TASK-035: Live Execution Monitor UI

**Agent**: frontend-engineer
**Priority**: P0
**Estimated Time**: 6 hours
**Dependencies**: TASK-033 (SSE Service), IC-016

**Description**: Create real-time execution monitor with SSE integration.

**Implementation Skeleton**:
```typescript
// apps/frontend/src/components/ExecutionMonitor.tsx

import { useEffect, useState } from 'react';
import { Execution, SSEEvent } from '@cloutagent/types';

export function ExecutionMonitor({ executionId }: { executionId: string }) {
  const [execution, setExecution] = useState<Execution | null>(null);
  const [outputChunks, setOutputChunks] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to SSE stream
    const eventSource = new EventSource(
      `/api/executions/${executionId}/stream`
    );

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.addEventListener('execution:started', (e) => {
      const event: SSEEvent = JSON.parse(e.data);
      setExecution(event.data.execution);
    });

    eventSource.addEventListener('execution:output', (e) => {
      const event: SSEEvent = JSON.parse(e.data);
      setOutputChunks(prev => [...prev, event.data.chunk]);
    });

    eventSource.addEventListener('execution:token-usage', (e) => {
      const event: SSEEvent = JSON.parse(e.data);
      setExecution(prev => ({
        ...prev!,
        tokenUsage: {
          ...prev!.tokenUsage,
          total: prev!.tokenUsage.total + event.data.tokenUsage.input + event.data.tokenUsage.output,
        },
        costUSD: event.data.cumulativeCost,
      }));
    });

    eventSource.addEventListener('execution:completed', (e) => {
      const event: SSEEvent = JSON.parse(e.data);
      setExecution(event.data.execution);
      eventSource.close();
    });

    eventSource.addEventListener('execution:failed', (e) => {
      const event: SSEEvent = JSON.parse(e.data);
      setExecution(event.data.execution);
      eventSource.close();
    });

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [executionId]);

  if (!execution) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Connecting to execution...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
          }`} />

          <h2 className="text-lg font-semibold">
            Execution {executionId.slice(0, 8)}
          </h2>

          <StatusBadge status={execution.status} />
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            🪙 {execution.tokenUsage.total.toLocaleString()} tokens
          </div>

          <div className="text-sm text-gray-400">
            💰 ${execution.costUSD.toFixed(4)}
          </div>

          {execution.duration && (
            <div className="text-sm text-gray-400">
              ⏱️ {(execution.duration / 1000).toFixed(1)}s
            </div>
          )}
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm">
          {outputChunks.join('')}
          {execution.status === 'running' && (
            <span className="animate-pulse">▊</span>
          )}
        </div>
      </div>

      {/* Steps Timeline */}
      <div className="border-t border-gray-700 p-4">
        <h3 className="text-sm font-semibold mb-3">Execution Steps</h3>
        <div className="space-y-2">
          {execution.steps.map(step => (
            <StepCard key={step.id} step={step} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ExecutionStatus }) {
  const config = {
    queued: { bg: 'bg-gray-700', text: 'Queued', icon: '⏳' },
    running: { bg: 'bg-blue-600 animate-pulse', text: 'Running', icon: '▶️' },
    completed: { bg: 'bg-green-600', text: 'Completed', icon: '✅' },
    failed: { bg: 'bg-red-600', text: 'Failed', icon: '❌' },
    cancelled: { bg: 'bg-yellow-600', text: 'Cancelled', icon: '⏹️' },
    paused: { bg: 'bg-orange-600', text: 'Paused', icon: '⏸️' },
  };

  const { bg, text, icon } = config[status];

  return (
    <div className={`px-3 py-1 rounded-full ${bg} text-white text-sm font-medium`}>
      {icon} {text}
    </div>
  );
}

function StepCard({ step }: { step: ExecutionStep }) {
  const statusColors = {
    running: 'border-blue-500',
    completed: 'border-green-500',
    failed: 'border-red-500',
  };

  return (
    <div className={`
      p-3 rounded bg-gray-800 border-l-4 ${statusColors[step.status] || 'border-gray-700'}
    `}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-sm">{step.nodeType}</span>
        {step.duration && (
          <span className="text-xs text-gray-400">
            {step.duration}ms
          </span>
        )}
      </div>

      {step.error && (
        <div className="text-xs text-red-400 mt-1">
          ❌ {step.error}
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] SSE connection established automatically
- [ ] Real-time output streaming with cursor animation
- [ ] Token usage and cost update live
- [ ] Step timeline shows progress
- [ ] Connection status indicator
- [ ] Status badge updates in real-time
- [ ] Automatic reconnection on disconnect

---

### TASK-036: Error Recovery Service

**Agent**: backend-engineer
**Priority**: P1
**Estimated Time**: 5 hours
**Dependencies**: TASK-032 (Execution Engine), IC-018

**Description**: Implement retry logic and manual intervention capabilities.

**Implementation Skeleton**:
```typescript
// apps/backend/src/services/ErrorRecoveryService.ts

import {
  ErrorContext,
  RetryPolicy,
  ManualIntervention,
  RecoveryResult,
} from '@cloutagent/types';
import { ExecutionEngine } from './ExecutionEngine';

export class ErrorRecoveryService {
  private defaultRetryPolicy: RetryPolicy = {
    enabled: true,
    maxRetries: 3,
    backoff: {
      type: 'exponential',
      initialDelay: 1000,
      maxDelay: 30000,
      multiplier: 2,
    },
    retryableErrors: [
      'RATE_LIMIT_EXCEEDED',
      'SERVICE_UNAVAILABLE',
      'TIMEOUT',
      'NETWORK_ERROR',
    ],
  };

  constructor(private executionEngine: ExecutionEngine) {}

  async retry(
    executionId: string,
    stepId?: string
  ): Promise<RecoveryResult> {
    const execution = await this.getExecution(executionId);

    if (!execution) {
      return {
        success: false,
        action: 'retry',
        message: 'Execution not found',
      };
    }

    // Check if retryable
    if (execution.retryCount >= this.defaultRetryPolicy.maxRetries) {
      return {
        success: false,
        action: 'retry',
        message: `Max retries (${this.defaultRetryPolicy.maxRetries}) exceeded`,
      };
    }

    // Calculate backoff delay
    const delay = this.calculateBackoff(
      execution.retryCount,
      this.defaultRetryPolicy.backoff
    );

    await new Promise(resolve => setTimeout(resolve, delay));

    // Retry entire execution
    const newExecution = await this.executionEngine.execute(
      {
        projectId: execution.projectId,
        input: execution.input,
      },
      execution.workflow
    );

    return {
      success: newExecution.status === 'completed',
      action: 'retry',
      message: `Retry attempt ${execution.retryCount + 1}`,
      newExecutionId: newExecution.id,
    };
  }

  async intervene(intervention: ManualIntervention): Promise<RecoveryResult> {
    const execution = await this.getExecution(intervention.executionId);

    if (!execution) {
      return {
        success: false,
        action: intervention.action,
        message: 'Execution not found',
      };
    }

    switch (intervention.action) {
      case 'retry':
        return this.retry(intervention.executionId, intervention.stepId);

      case 'skip':
        // Mark step as skipped and continue
        const step = execution.steps.find(s => s.id === intervention.stepId);
        if (step) {
          step.status = 'completed';
          step.output = 'Skipped by manual intervention';
        }

        return {
          success: true,
          action: 'skip',
          message: `Step ${intervention.stepId} skipped`,
        };

      case 'modify-input':
        // Re-execute with modified input
        const newExecution = await this.executionEngine.execute(
          {
            projectId: execution.projectId,
            input: intervention.modifiedInput,
          },
          execution.workflow
        );

        return {
          success: newExecution.status === 'completed',
          action: 'modify-input',
          message: 'Execution re-run with modified input',
          newExecutionId: newExecution.id,
        };

      case 'cancel':
        await this.executionEngine.cancel(intervention.executionId);

        return {
          success: true,
          action: 'cancel',
          message: `Execution cancelled: ${intervention.reason}`,
        };

      default:
        return {
          success: false,
          action: intervention.action,
          message: 'Unknown intervention action',
        };
    }
  }

  getRecoveryOptions(error: ErrorContext): {
    actions: string[];
    recommendations: string[];
  } {
    const actions: string[] = ['retry', 'modify-input', 'cancel'];
    const recommendations: string[] = [];

    if (error.error.retryable && error.attemptNumber < error.maxRetries) {
      recommendations.push('Automatic retry recommended');
    }

    if (error.error.code === 'RATE_LIMIT_EXCEEDED') {
      recommendations.push('Wait before retrying');
      recommendations.push('Reduce request rate');
    }

    if (error.error.code === 'INVALID_INPUT') {
      recommendations.push('Modify input and retry');
      actions.unshift('modify-input');
    }

    if (error.error.code === 'TIMEOUT') {
      recommendations.push('Increase timeout');
      recommendations.push('Simplify task');
    }

    return { actions, recommendations };
  }

  private calculateBackoff(
    attemptNumber: number,
    backoff: RetryPolicy['backoff']
  ): number {
    let delay: number;

    switch (backoff.type) {
      case 'exponential':
        delay = backoff.initialDelay * Math.pow(backoff.multiplier || 2, attemptNumber);
        break;

      case 'linear':
        delay = backoff.initialDelay * (attemptNumber + 1);
        break;

      case 'fixed':
      default:
        delay = backoff.initialDelay;
    }

    return Math.min(delay, backoff.maxDelay);
  }

  private async getExecution(executionId: string): Promise<any> {
    // Fetch from history service
    return null;
  }
}
```

**Acceptance Criteria**:
- [ ] Exponential backoff implemented correctly
- [ ] Max retries enforced
- [ ] Manual interventions (retry, skip, modify, cancel) work
- [ ] Recovery options suggest appropriate actions
- [ ] Error classification determines retryability
- [ ] Backoff delays prevent API rate limits

---

### TASK-037: Execution Controls UI

**Agent**: frontend-engineer
**Priority**: P1
**Estimated Time**: 3 hours
**Dependencies**: TASK-035 (Execution Monitor), IC-015

**Description**: Add pause/resume/cancel controls to execution monitor.

**Implementation Skeleton**:
```typescript
// apps/frontend/src/components/ExecutionControls.tsx

import { useState } from 'react';
import { ExecutionStatus } from '@cloutagent/types';

export function ExecutionControls({
  executionId,
  status,
  onStatusChange,
}: {
  executionId: string;
  status: ExecutionStatus;
  onStatusChange: (status: ExecutionStatus) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleControl = async (action: 'pause' | 'resume' | 'cancel') => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/executions/${executionId}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const newStatus = action === 'cancel' ? 'cancelled' : action === 'pause' ? 'paused' : 'running';
        onStatusChange(newStatus);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {status === 'running' && (
        <>
          <button
            onClick={() => handleControl('pause')}
            disabled={isLoading}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded font-medium"
          >
            ⏸️ Pause
          </button>

          <button
            onClick={() => handleControl('cancel')}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium"
          >
            ⏹️ Cancel
          </button>
        </>
      )}

      {status === 'paused' && (
        <button
          onClick={() => handleControl('resume')}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-medium"
        >
          ▶️ Resume
        </button>
      )}

      {(status === 'failed' || status === 'cancelled') && (
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
        >
          🔄 Retry
        </button>
      )}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Pause/resume/cancel buttons work correctly
- [ ] Buttons disabled during loading
- [ ] UI updates immediately on action
- [ ] Retry button available after failure
- [ ] Confirmation dialog for cancel action

---

## Testing Strategy

### Unit Tests
- Execution engine workflow orchestration
- SSE event broadcasting
- History storage and retrieval
- Error recovery retry logic

### Integration Tests
- End-to-end execution flow
- SSE streaming with multiple clients
- Execution history persistence
- Recovery after failures

### E2E Tests
- Execute workflow and monitor in real-time
- Pause/resume/cancel execution
- View execution history
- Retry failed execution

## Success Metrics

- [ ] Executions complete successfully (>95% uptime)
- [ ] SSE streaming latency <100ms
- [ ] History retrieval <500ms for 1000 executions
- [ ] Pause/resume works within 1 second
- [ ] Automatic retry reduces failures by 30%+
- [ ] Zero data loss in execution history

## Dependencies

### External Libraries
- None (uses native Node.js EventEmitter and SSE)

### Phase Dependencies
- Phase 1: File storage, Claude SDK
- Phase 2: ReactFlow canvas
- Phase 3: Subagent service, hook service

## Rollout Plan

1. **Week 7 Days 1-3**: Backend execution engine and SSE (TASK-032, TASK-033)
2. **Week 7 Days 4-5**: History storage and recovery (TASK-034, TASK-036)
3. **Week 8 Days 1-3**: Frontend monitor and controls (TASK-035, TASK-037)
4. **Week 8 Days 4-5**: Testing, bug fixes, performance optimization

## Notes

- **Performance**: SSE scales to 100+ concurrent connections per instance
- **Reliability**: Execution history provides audit trail and debugging
- **UX**: Real-time feedback crucial for user confidence
- **Cost Tracking**: Accurate token usage critical for pricing transparency
