// Agent types
export interface AgentConfig {
  id: string;
  name: string;
  systemPrompt: string;
  model: 'claude-sonnet-4-5' | 'claude-opus-4';
  temperature: number;
  maxTokens: number;
  enabledTools: string[];
}

// Subagent types
export interface SubagentConfig {
  id: string;
  type: 'frontend-engineer' | 'backend-engineer' | 'database-engineer' | 'ml-engineer' | 'ui-ux-designer' | 'software-engineer-test' | 'infrastructure-engineer' | 'general-purpose';
  name: string;
  prompt: string;
  timeout?: number;
  parentAgentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubagentExecutionRequest {
  subagentId: string;
  prompt: string;
  context?: Record<string, any>;
  parentAgentId: string;
  type?: string;
  timeout?: number;
}

export interface SubagentExecutionResponse {
  subagentId: string;
  result: string;
  executionTime: number;
  tokenUsage: {
    input: number;
    output: number;
  };
  status: 'completed' | 'failed';
  error?: string;
}

// Hook types (IC-012)
export type HookType =
  | 'pre-execution'
  | 'post-execution'
  | 'pre-tool-call'
  | 'post-tool-call'
  | 'on-error'
  | 'on-validation-fail';

export interface HookConfig {
  id: string;
  name: string;
  type: HookType;
  enabled: boolean;
  condition?: string; // JavaScript expression
  action: {
    type: 'log' | 'notify' | 'transform' | 'validate' | 'custom';
    code: string; // JavaScript code
  };
  order: number;
}

export interface HookExecutionContext {
  hookType: HookType;
  agentId: string;
  projectId: string;
  timestamp: Date;
  payload: {
    input?: any;
    output?: any;
    error?: any;
    toolName?: string;
    toolArgs?: any;
  };
  context: Record<string, any>;
}

export interface HookExecutionResult {
  hookId: string;
  success: boolean;
  output?: any;
  error?: string;
  modifiedContext?: Record<string, any>;
  shouldContinue: boolean;
}

export interface HookValidationResult {
  valid: boolean;
  errors?: string[];
}

// MCP types
export interface MCPConfig {
  id: string;
  name: string;
  type: 'url' | 'npx' | 'uvx';
  connection: string;
  enabled: boolean;
  tools: string[];
}

// Execution types
export type ExecutionStatus =
  | 'queued'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ExecutionConfig {
  projectId: string;
  workflowVersion?: string;
  input: string;
  context?: Record<string, any>;
  options?: {
    maxRetries?: number;
    timeout?: number;
    streaming?: boolean;
    saveHistory?: boolean;
    testMode?: boolean; // TASK-040: Enable test mode execution
  };
}

// Token usage type
export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

export interface ExecutionStep {
  id?: string;
  nodeId?: string;
  type?: 'validation' | 'hook' | 'agent' | 'subagent' | 'mcp';
  nodeType?: 'agent' | 'subagent' | 'hook' | 'mcp';
  status?: ExecutionStatus;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  input?: any;
  output?: any;
  error?: string;
  message?: string; // TASK-040: Test mode step message
  timestamp?: string; // TASK-040: Test mode timestamp
  tokenUsage?: {
    input: number;
    output: number;
  };
}

export interface Execution {
  id: string;
  projectId: string;
  status: ExecutionStatus;
  input?: string;
  output?: string;
  error?: string;
  startedAt?: Date | string;
  completedAt?: Date | string;
  duration?: number;
  tokenUsage: TokenUsage;
  costUSD: number;
  steps: ExecutionStep[];
  retryCount?: number;
}

// Alias for test mode and execution results
export type ExecutionResult = Execution;

export interface ExecutionSummary {
  id: string;
  projectId: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  costUSD: number;
  error?: string;
}

export interface ExecutionParams {
  version?: string;
  variables?: Record<string, string>;
  streaming?: boolean;
  limits?: {
    maxTokens?: number;
    maxCost?: number;
    timeout?: number;
  };
}

export interface ExecutionEvent {
  type:
    | 'start'
    | 'agent_start'
    | 'tool_call'
    | 'tool_result'
    | 'thinking'
    | 'cost_update'
    | 'complete'
    | 'error';
  timestamp: string;
  data?: any;
}

// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  agent: AgentConfig;
  subagents: SubagentConfig[];
  hooks: HookConfig[];
  mcps: MCPConfig[];
  apiKey: string;
  limits: {
    maxTokens: number;
    maxCost: number;
    timeout: number;
  };
  workflow?: WorkflowData; // Optional workflow data for save/load
  createdAt: string;
  updatedAt: string;
}

// Workflow types
export interface Node {
  id: string;
  type: 'agent' | 'subagent' | 'hook' | 'mcp';
  data: {
    config: any;
  };
  position?: { x: number; y: number };
}

export interface Edge {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowGraph {
  nodes: Node[];
  edges: Edge[];
}

// Workflow storage types for save/load functionality (TASK-021)
import type { Variable } from './variables';

export interface WorkflowData {
  nodes: Node[];
  edges: Edge[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  variables?: Variable[];
  version: string; // Format version for future compatibility
}

// Claude SDK Service types
export interface Agent {
  id: string;
  name: string;
  config: {
    model: string;
    systemPrompt: string;
    temperature: number;
    maxTokens: number;
    enabledTools: string[];
  };
}

export interface ExecutionOptions {
  timeout?: number;
  maxTokens?: number;
  variables?: Record<string, string>;
}

export interface SDKExecutionResult {
  id: string;
  status: 'completed' | 'failed' | 'cancelled';
  result?: string;
  cost: {
    promptTokens: number;
    completionTokens: number;
    totalCost: number;
  };
  duration: number;
  error?: string;
}

export interface ClaudeSDKService {
  createAgent(config: AgentConfig): Promise<Agent>;
  executeAgent(
    agent: Agent,
    input: string,
    options?: ExecutionOptions
  ): Promise<SDKExecutionResult>;
  streamExecution(
    agent: Agent,
    input: string,
    onChunk: (chunk: string) => void,
    options?: ExecutionOptions
  ): Promise<SDKExecutionResult>;
}

// API response types
export interface APIResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// SSE Event types for real-time execution monitoring
export type SSEEventType =
  | 'connection:established'
  | 'execution:started'
  | 'execution:progress'
  | 'execution:step'
  | 'execution:output'
  | 'execution:token-usage'
  | 'execution:completed'
  | 'execution:failed'
  | 'execution:paused'
  | 'execution:resumed'
  | 'execution:cancelled';

export interface SSEEvent<T = any> {
  type: SSEEventType;
  timestamp: Date;
  executionId: string;
  data: T;
}

// Validation types (TASK-028)
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ValidationError {
  type: 'structure' | 'agent' | 'connection' | 'configuration' | 'optimization';
  severity: 'error' | 'warning';
  message: string;
  nodeId?: string;
  nodeIds?: string[];
  edgeId?: string;
}

// Error Recovery types (TASK-036)
export interface ErrorRecoveryState {
  executionId: string;
  projectId: string;
  timestamp: string;
  lastSuccessfulStep?: ExecutionStep;
  completedSteps: ExecutionStep[];
  partialOutput?: string;
  tokenUsageSnapshot: TokenUsage;
  error?: string;
  retryCount: number;
}

// Re-export canvas types
export * from './canvas';
export * from './nodes';
export * from './property-panel';
export * from './canvas-actions';
export * from './auth';
export * from './cost';
export * from './env';
export * from './variables';
export * from './claude-sdk';
