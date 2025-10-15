/**
 * Claude Agent SDK Types
 *
 * These types define the contract between ExecutionEngine and ClaudeSDKService
 */

// ============================================================================
// Agent Configuration
// ============================================================================

export interface AgentConfig {
  id: string;
  name: string;
  model: ClaudeModel;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  enabledTools: string[];
  mcpServers?: MCPServerConfig[];
}

export type ClaudeModel =
  | 'claude-sonnet-4-5'
  | 'claude-opus-4'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-opus-20240229';

export interface Agent {
  id: string;
  name: string;
  config: AgentConfig;
  mcpConnections?: MCPConnection[];
}

// ============================================================================
// Execution Options & Results
// ============================================================================

export interface ExecutionOptions {
  timeout?: number;
  maxTokens?: number;
  variables?: Record<string, string>;
  streaming?: boolean;
  userId?: string;
  conversationId?: string;
}

export interface SDKExecutionResult {
  id: string;
  status: 'completed' | 'failed' | 'timeout';
  result?: string;
  cost: {
    promptTokens: number;
    completionTokens: number;
    totalCost: number;
  };
  duration: number;
  error?: string;
  toolCalls?: ToolCallResult[];
}

export interface ToolCallResult {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output: string;
  duration: number;
  success: boolean;
  error?: string;
}

// ============================================================================
// Streaming
// ============================================================================

export type StreamChunk =
  | { type: 'content'; content: string }
  | { type: 'tool_call'; toolCall: ToolCall }
  | { type: 'tool_result'; toolResult: ToolCallResult }
  | { type: 'error'; error: string }
  | { type: 'done'; result: SDKExecutionResult };

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

// ============================================================================
// MCP Protocol Types
// ============================================================================

export interface MCPServerConfig {
  id: string;
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  transport: 'stdio' | 'sse';
  url?: string; // For SSE transport
}

export interface MCPConnection {
  serverId: string;
  serverName: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  tools: MCPTool[];
  error?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, MCPToolProperty>;
    required?: string[];
  };
}

export interface MCPToolProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  enum?: string[];
  items?: MCPToolProperty;
  properties?: Record<string, MCPToolProperty>;
}

// ============================================================================
// MCP Client Interface
// ============================================================================

export interface IMCPClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  discoverTools(): Promise<MCPTool[]>;
  executeTool(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<ToolCallResult>;
  checkHealth(): Promise<boolean>;
  getStatus(): 'connected' | 'connecting' | 'disconnected' | 'error';
}

// ============================================================================
// MCP Client Pool Interface
// ============================================================================

export interface IMCPClientPool {
  addServer(config: MCPServerConfig): Promise<MCPConnection>;
  removeServer(serverId: string): Promise<void>;
  getAllTools(): Promise<MCPTool[]>;
  executeTool(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<ToolCallResult>;
  getConnections(): Promise<MCPConnection[]>;
  getClient(serverId: string): IMCPClient | undefined;
  healthCheck(): Promise<Record<string, boolean>>;
}

// ============================================================================
// Error Types
// ============================================================================

export class ClaudeSDKError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ClaudeSDKError';
  }
}

export class MCPError extends Error {
  constructor(
    message: string,
    public serverId: string,
    public code: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

// ============================================================================
// JSON-RPC 2.0 Types for MCP Protocol
// ============================================================================

export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface JSONRPCNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}
