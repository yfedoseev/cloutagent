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
  name: string;
  type: string;
  prompt: string;
  tools: string[];
  parallel: boolean;
  maxParallelInstances?: number;
}

// Hook types
export type HookType = 'pre-execution' | 'post-execution' | 'tool-call' | 'error';

export interface HookConfig {
  id: string;
  name: string;
  type: HookType;
  enabled: boolean;
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
export type ExecutionStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

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
  type: 'start' | 'agent_start' | 'tool_call' | 'tool_result' | 'thinking' | 'cost_update' | 'complete' | 'error';
  timestamp: string;
  data?: any;
}

export interface Execution {
  id: string;
  projectId: string;
  status: ExecutionStatus;
  startTime: string;
  endTime?: string;
  cost?: {
    promptTokens: number;
    completionTokens: number;
    totalCost: number;
  };
  error?: string;
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
  createdAt: string;
  updatedAt: string;
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
