# Claude Agent SDK & MCP Integration - Implementation Plan

**Project:** CloutAgent Production Readiness
**Epic:** Core Execution Engine
**Timeline:** 8-10 weeks (2 sprints of 4-5 weeks each)
**Team Size:** 4-5 engineers
**Priority:** P0 - Critical (Showstopper)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Interface Definitions](#interface-definitions)
4. [Task Breakdown](#task-breakdown)
5. [Dependencies & Critical Path](#dependencies--critical-path)
6. [Testing Strategy](#testing-strategy)
7. [Rollout Plan](#rollout-plan)

---

## Executive Summary

### Problem Statement

CloutAgent currently has mocked Claude SDK and no MCP execution capabilities. This blocks:
- Real AI workflow execution
- MCP server integration
- Production deployments
- Customer trust and adoption

### Solution

Implement full Claude Agent SDK integration with MCP protocol support, enabling:
- ✅ Real Claude API execution (Anthropic SDK)
- ✅ MCP server connections and tool discovery
- ✅ MCP tool execution within agent workflows
- ✅ Streaming responses with token tracking
- ✅ Error handling and retry logic
- ✅ Cost calculation and limits

### Success Metrics

1. **Functionality**: 100% of workflows execute with real Claude API
2. **Reliability**: 99.5% success rate on valid workflows
3. **Performance**: <2s latency for first token, <30s for complete execution
4. **Cost Accuracy**: ±1% accuracy in cost calculations
5. **MCP Support**: Connect to 5+ popular MCP servers (filesystem, web, database, etc.)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CloutAgent Backend                       │
│                                                               │
│  ┌────────────────┐      ┌──────────────────┐              │
│  │  ExecutionEngine│─────▶│ClaudeSDKService  │              │
│  │                 │      │                  │              │
│  │  - Workflow     │      │  - Agent Create  │              │
│  │    Execution    │      │  - Execute       │              │
│  │  - Node         │      │  - Stream        │              │
│  │    Orchestration│      │  - Cost Track    │              │
│  └────────────────┘      └──────────────────┘              │
│          │                         │                         │
│          │                         ├──────────┐             │
│          │                         │          │             │
│          ▼                         ▼          ▼             │
│  ┌────────────────┐      ┌─────────────┐  ┌──────────────┐│
│  │ MCPNodeExecutor│      │AnthropicSDK │  │MCPClientPool ││
│  │                │      │             │  │              ││
│  │  - MCP Tool    │      │  - Messages │  │  - Servers   ││
│  │    Integration │      │  - Streaming│  │  - Tools     ││
│  │  - Server Mgmt │      │  - Tools    │  │  - Health    ││
│  └────────────────┘      └─────────────┘  └──────────────┘│
│          │                         │          │             │
│          └─────────────────────────┴──────────┘             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   External Services            │
              │                                │
              │  - Anthropic API               │
              │  - MCP Servers (stdio/SSE)     │
              │    * filesystem                │
              │    * web-search                │
              │    * database                  │
              │    * custom servers            │
              └───────────────────────────────┘
```

### Data Flow

```
User Request
    │
    ▼
┌─────────────────────────────────────────────────┐
│ 1. ExecutionEngine receives workflow            │
│    - Validates workflow                          │
│    - Prepares execution context                  │
└─────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────┐
│ 2. Agent Node Processing                         │
│    - Load agent configuration                    │
│    - Connect to MCP servers (if configured)      │
│    - Discover available MCP tools                │
└─────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────┐
│ 3. ClaudeSDKService.executeAgent()               │
│    - Build messages with system prompt           │
│    - Add MCP tools to tool definitions           │
│    - Call Anthropic API with streaming           │
└─────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────┐
│ 4. Response Processing                           │
│    - Stream tokens to client (SSE)               │
│    - Handle tool calls (MCP execution)           │
│    - Track tokens and calculate cost             │
│    - Save execution results                      │
└─────────────────────────────────────────────────┘
    │
    ▼
Return Results to Client
```

---

## Interface Definitions

### 1. Core Type Definitions

**File:** `packages/types/src/claude-sdk.ts`

```typescript
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
```

### 2. ClaudeSDKService Interface

**File:** `apps/backend/src/services/ClaudeSDKService.ts`

```typescript
/**
 * ClaudeSDKService Interface
 *
 * Main service for Claude Agent SDK integration
 */

export interface IClaudeSDKService {
  /**
   * Create and configure an agent
   *
   * @param config - Agent configuration
   * @returns Promise<Agent> - Created agent instance
   * @throws ClaudeSDKError if API key missing or invalid config
   */
  createAgent(config: AgentConfig): Promise<Agent>;

  /**
   * Execute agent with input (non-streaming)
   *
   * @param agent - Agent to execute
   * @param input - User input/prompt
   * @param options - Execution options
   * @returns Promise<SDKExecutionResult> - Execution result
   */
  executeAgent(
    agent: Agent,
    input: string,
    options?: ExecutionOptions,
  ): Promise<SDKExecutionResult>;

  /**
   * Execute agent with streaming
   *
   * @param agent - Agent to execute
   * @param input - User input/prompt
   * @param onChunk - Callback for each stream chunk
   * @param options - Execution options
   * @returns Promise<SDKExecutionResult> - Final execution result
   */
  streamExecution(
    agent: Agent,
    input: string,
    onChunk: (chunk: StreamChunk) => void,
    options?: ExecutionOptions,
  ): Promise<SDKExecutionResult>;

  /**
   * Get agent by ID
   *
   * @param agentId - Agent identifier
   * @returns Agent | undefined
   */
  getAgent(agentId: string): Agent | undefined;

  /**
   * Delete agent
   *
   * @param agentId - Agent identifier
   * @returns boolean - Success status
   */
  deleteAgent(agentId: string): boolean;
}
```

### 3. MCP Client Interface

**File:** `apps/backend/src/services/mcp/MCPClient.ts`

```typescript
/**
 * MCPClient Interface
 *
 * Handles connection and communication with a single MCP server
 */

export interface IMCPClient {
  /**
   * Connect to MCP server
   *
   * @returns Promise<void>
   * @throws MCPError if connection fails
   */
  connect(): Promise<void>;

  /**
   * Disconnect from MCP server
   *
   * @returns Promise<void>
   */
  disconnect(): Promise<void>;

  /**
   * Discover available tools from server
   *
   * @returns Promise<MCPTool[]> - List of available tools
   * @throws MCPError if discovery fails
   */
  discoverTools(): Promise<MCPTool[]>;

  /**
   * Execute a tool on the MCP server
   *
   * @param toolName - Name of tool to execute
   * @param args - Tool arguments
   * @returns Promise<ToolCallResult> - Tool execution result
   * @throws MCPError if execution fails
   */
  executeTool(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<ToolCallResult>;

  /**
   * Check server health
   *
   * @returns Promise<boolean> - Server health status
   */
  checkHealth(): Promise<boolean>;

  /**
   * Get current connection status
   *
   * @returns ConnectionStatus
   */
  getStatus(): 'connected' | 'connecting' | 'disconnected' | 'error';
}
```

### 4. MCP Client Pool Interface

**File:** `apps/backend/src/services/mcp/MCPClientPool.ts`

```typescript
/**
 * MCPClientPool Interface
 *
 * Manages multiple MCP server connections
 */

export interface IMCPClientPool {
  /**
   * Add and connect to an MCP server
   *
   * @param config - Server configuration
   * @returns Promise<MCPConnection> - Connection details
   * @throws MCPError if connection fails
   */
  addServer(config: MCPServerConfig): Promise<MCPConnection>;

  /**
   * Remove and disconnect from MCP server
   *
   * @param serverId - Server identifier
   * @returns Promise<void>
   */
  removeServer(serverId: string): Promise<void>;

  /**
   * Get all tools from all connected servers
   *
   * @returns Promise<MCPTool[]> - Aggregated tool list
   */
  getAllTools(): Promise<MCPTool[]>;

  /**
   * Execute a tool by name (finds correct server)
   *
   * @param toolName - Tool name
   * @param args - Tool arguments
   * @returns Promise<ToolCallResult> - Execution result
   * @throws MCPError if tool not found or execution fails
   */
  executeTool(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<ToolCallResult>;

  /**
   * Get connection status for all servers
   *
   * @returns Promise<MCPConnection[]> - All connections
   */
  getConnections(): Promise<MCPConnection[]>;

  /**
   * Get client for specific server
   *
   * @param serverId - Server identifier
   * @returns IMCPClient | undefined
   */
  getClient(serverId: string): IMCPClient | undefined;

  /**
   * Health check for all servers
   *
   * @returns Promise<Record<string, boolean>> - Server health map
   */
  healthCheck(): Promise<Record<string, boolean>>;
}
```

---

## Task Breakdown

### Sprint 1: Foundation (Weeks 1-5)

---

#### Task 1.1: Anthropic SDK Integration - Base Implementation

**Title:** Integrate Anthropic SDK for Basic Claude API Calls

**Engineer:** Backend Engineer 1
**Priority:** P0
**Estimated Time:** 1 week
**Dependencies:** None

**Description:**

Replace the mocked `executeWithSDK` and `streamWithSDK` methods with real Anthropic SDK integration. Implement basic message creation, API calling, and response handling without tool support initially.

**Technical Requirements:**

1. Install and configure `@anthropic-ai/sdk` package
2. Implement message creation from agent config and user input
3. Handle streaming and non-streaming responses
4. Implement token counting and cost calculation
5. Add proper error handling for API errors (rate limits, timeouts, invalid requests)
6. Implement retry logic with exponential backoff

**Implementation Details:**

```typescript
// packages/types/src/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnthropicResponse {
  id: string;
  content: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
}
```

```typescript
// apps/backend/src/services/ClaudeSDKService.ts
import Anthropic from '@anthropic-ai/sdk';

private anthropic: Anthropic;

constructor() {
  this.anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

private async executeWithSDK(
  agent: Agent,
  input: string,
  systemPrompt: string,
  maxTokens: number,
): Promise<{
  output: string;
  promptTokens: number;
  completionTokens: number;
}> {
  const response = await this.anthropic.messages.create({
    model: agent.config.model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: input,
      },
    ],
    temperature: agent.config.temperature,
  });

  return {
    output: this.extractTextContent(response.content),
    promptTokens: response.usage.input_tokens,
    completionTokens: response.usage.output_tokens,
  };
}

private extractTextContent(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('');
}
```

**Acceptance Criteria:**

- [ ] Anthropic SDK installed and configured
- [ ] Non-streaming execution works with real API
- [ ] Streaming execution works with real API
- [ ] Token counting matches API response
- [ ] Cost calculation accurate to ±1%
- [ ] Error handling covers all API error types
- [ ] Retry logic implements exponential backoff (3 retries max)
- [ ] Unit tests cover happy path and error cases
- [ ] Integration test with real API (manual, not CI)

**Testing:**

```typescript
// apps/backend/src/services/__tests__/ClaudeSDKService.test.ts
describe('ClaudeSDKService - Anthropic Integration', () => {
  it('should execute non-streaming request successfully', async () => {
    const service = new ClaudeSDKService();
    const agent = await service.createAgent({
      id: 'test-agent',
      name: 'Test Agent',
      model: 'claude-sonnet-4-5',
      systemPrompt: 'You are a helpful assistant.',
      temperature: 0.7,
      maxTokens: 1024,
      enabledTools: [],
    });

    const result = await service.executeAgent(
      agent,
      'Say hello in 5 words',
    );

    expect(result.status).toBe('completed');
    expect(result.result).toBeDefined();
    expect(result.cost.totalCost).toBeGreaterThan(0);
    expect(result.duration).toBeGreaterThan(0);
  });

  it('should handle API errors gracefully', async () => {
    // Test with invalid API key
    process.env.ANTHROPIC_API_KEY = 'invalid-key';
    const service = new ClaudeSDKService();

    const agent = await service.createAgent({...});
    const result = await service.executeAgent(agent, 'test');

    expect(result.status).toBe('failed');
    expect(result.error).toContain('authentication');
  });
});
```

**Documentation:**

- Update `apps/backend/README.md` with Anthropic API setup instructions
- Document environment variables required
- Add example usage in code comments

---

#### Task 1.2: Streaming Implementation with Token Tracking

**Title:** Implement Real-Time Streaming with Progress Tracking

**Engineer:** Backend Engineer 1
**Priority:** P0
**Estimated Time:** 3 days
**Dependencies:** Task 1.1

**Description:**

Enhance streaming implementation to properly handle Anthropic's streaming API with real-time token tracking, partial response handling, and client notification via Server-Sent Events.

**Technical Requirements:**

1. Implement Anthropic streaming API integration
2. Parse and handle stream events (content_block_start, content_block_delta, message_stop)
3. Emit typed `StreamChunk` events to clients
4. Track tokens in real-time as they stream
5. Handle stream interruptions and errors
6. Implement backpressure handling

**Implementation Details:**

```typescript
private async streamWithSDK(
  agent: Agent,
  input: string,
  systemPrompt: string,
  maxTokens: number,
  onChunk: (chunk: StreamChunk) => void,
): Promise<{
  output: string;
  promptTokens: number;
  completionTokens: number;
}> {
  let fullOutput = '';
  let inputTokens = 0;
  let outputTokens = 0;

  const stream = await this.anthropic.messages.stream({
    model: agent.config.model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: input,
      },
    ],
    temperature: agent.config.temperature,
  });

  stream.on('text', (text) => {
    fullOutput += text;
    onChunk({ type: 'content', content: text });
  });

  stream.on('message', (message) => {
    inputTokens = message.usage.input_tokens;
    outputTokens = message.usage.output_tokens;
  });

  stream.on('error', (error) => {
    onChunk({
      type: 'error',
      error: error.message,
    });
    throw error;
  });

  await stream.finalMessage();

  return {
    output: fullOutput,
    promptTokens: inputTokens,
    completionTokens: outputTokens,
  };
}
```

**Acceptance Criteria:**

- [ ] Streaming works with real-time token delivery
- [ ] StreamChunk types properly emitted (content, tool_call, tool_result, error, done)
- [ ] Token tracking updates in real-time
- [ ] Stream errors handled gracefully
- [ ] Client receives SSE events correctly
- [ ] Backpressure prevents memory issues
- [ ] Integration tests with simulated slow clients

**Testing:**

```typescript
it('should stream responses in real-time', async () => {
  const chunks: StreamChunk[] = [];
  const service = new ClaudeSDKService();
  const agent = await service.createAgent({...});

  await service.streamExecution(
    agent,
    'Count from 1 to 5',
    (chunk) => chunks.push(chunk),
  );

  expect(chunks.length).toBeGreaterThan(5);
  expect(chunks.filter(c => c.type === 'content').length).toBeGreaterThan(0);
  expect(chunks[chunks.length - 1].type).toBe('done');
});
```

---

#### Task 1.3: MCP Protocol Client - Stdio Transport

**Title:** Implement MCP Client with Stdio Transport

**Engineer:** Backend Engineer 2
**Priority:** P0
**Estimated Time:** 1.5 weeks
**Dependencies:** None (can work in parallel with Task 1.1)

**Description:**

Create MCP protocol client that can spawn and communicate with MCP servers using stdio transport. Implement JSON-RPC 2.0 message handling, tool discovery, and tool execution.

**Technical Requirements:**

1. Implement JSON-RPC 2.0 client for MCP protocol
2. Handle stdio transport (spawn child process, manage stdin/stdout)
3. Implement MCP handshake and initialization
4. Tool discovery via `tools/list` method
5. Tool execution via `tools/call` method
6. Process lifecycle management (spawn, restart, cleanup)
7. Error handling for process crashes

**Implementation Details:**

```typescript
// apps/backend/src/services/mcp/MCPClient.ts
import { spawn, ChildProcess } from 'child_process';

export class MCPClient implements IMCPClient {
  private process: ChildProcess | null = null;
  private messageId = 0;
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>();
  private status: 'connected' | 'connecting' | 'disconnected' | 'error' = 'disconnected';

  constructor(private config: MCPServerConfig) {}

  async connect(): Promise<void> {
    this.status = 'connecting';

    try {
      // Spawn MCP server process
      this.process = spawn(this.config.command, this.config.args, {
        env: { ...process.env, ...this.config.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Handle stdout (responses)
      this.process.stdout?.on('data', (data) => {
        this.handleResponse(data.toString());
      });

      // Handle stderr (errors/logs)
      this.process.stderr?.on('data', (data) => {
        console.error(`[MCP ${this.config.name}] ${data.toString()}`);
      });

      // Handle process exit
      this.process.on('exit', (code) => {
        console.log(`[MCP ${this.config.name}] Process exited with code ${code}`);
        this.status = code === 0 ? 'disconnected' : 'error';
      });

      // Send initialization request
      await this.sendRequest('initialize', {
        protocolVersion: '1.0.0',
        clientInfo: {
          name: 'cloutagent',
          version: '1.0.0',
        },
      });

      this.status = 'connected';
    } catch (error) {
      this.status = 'error';
      throw new MCPError(
        `Failed to connect to MCP server: ${error}`,
        this.config.id,
        'CONNECTION_FAILED',
        error,
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
    this.status = 'disconnected';
  }

  async discoverTools(): Promise<MCPTool[]> {
    const response = await this.sendRequest('tools/list', {});
    return response.tools || [];
  }

  async executeTool(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<ToolCallResult> {
    const startTime = Date.now();

    try {
      const response = await this.sendRequest('tools/call', {
        name: toolName,
        arguments: args,
      });

      return {
        id: `tool-${Date.now()}`,
        name: toolName,
        input: args,
        output: JSON.stringify(response.result),
        duration: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      return {
        id: `tool-${Date.now()}`,
        name: toolName,
        input: args,
        output: '',
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.sendRequest('ping', {});
      return true;
    } catch {
      return false;
    }
  }

  getStatus() {
    return this.status;
  }

  private async sendRequest(method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.process || !this.process.stdin) {
        reject(new Error('MCP process not connected'));
        return;
      }

      const id = ++this.messageId;
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      this.pendingRequests.set(id, { resolve, reject });

      // Send request
      this.process.stdin.write(JSON.stringify(request) + '\n');

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 30000);
    });
  }

  private handleResponse(data: string) {
    try {
      const lines = data.trim().split('\n');

      for (const line of lines) {
        const response = JSON.parse(line);

        if (response.id && this.pendingRequests.has(response.id)) {
          const { resolve, reject } = this.pendingRequests.get(response.id)!;
          this.pendingRequests.delete(response.id);

          if (response.error) {
            reject(new Error(response.error.message || 'MCP request failed'));
          } else {
            resolve(response.result);
          }
        }
      }
    } catch (error) {
      console.error('[MCP] Failed to parse response:', error);
    }
  }
}
```

**Acceptance Criteria:**

- [ ] MCP client spawns server process correctly
- [ ] JSON-RPC 2.0 messages sent and received correctly
- [ ] Initialization handshake completes successfully
- [ ] Tool discovery returns valid tool list
- [ ] Tool execution works with correct input/output
- [ ] Process crashes handled gracefully (auto-reconnect)
- [ ] Timeout handling for hung processes
- [ ] Unit tests with mock process
- [ ] Integration tests with real MCP server (filesystem)

**Testing:**

```typescript
describe('MCPClient - Stdio Transport', () => {
  it('should connect to MCP server successfully', async () => {
    const client = new MCPClient({
      id: 'test-fs',
      name: 'Filesystem',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
      transport: 'stdio',
    });

    await client.connect();
    expect(client.getStatus()).toBe('connected');

    await client.disconnect();
  });

  it('should discover tools from server', async () => {
    const client = new MCPClient({...});
    await client.connect();

    const tools = await client.discoverTools();

    expect(tools.length).toBeGreaterThan(0);
    expect(tools[0]).toHaveProperty('name');
    expect(tools[0]).toHaveProperty('description');
    expect(tools[0]).toHaveProperty('inputSchema');
  });

  it('should execute tool successfully', async () => {
    const client = new MCPClient({...});
    await client.connect();

    const result = await client.executeTool('read_file', {
      path: '/tmp/test.txt',
    });

    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
  });
});
```

---

#### Task 1.4: MCP Client Pool - Multi-Server Management

**Title:** Implement MCP Client Pool for Multiple Server Connections

**Engineer:** Backend Engineer 2
**Priority:** P0
**Estimated Time:** 1 week
**Dependencies:** Task 1.3

**Description:**

Create a pool manager that handles multiple MCP server connections, aggregates tools from all servers, and routes tool calls to the correct server.

**Technical Requirements:**

1. Manage multiple MCPClient instances
2. Aggregate tools from all connected servers
3. Route tool execution to correct server
4. Handle server addition/removal
5. Periodic health checks
6. Connection retry logic
7. Tool name conflict resolution (prefix with server name)

**Implementation Details:**

```typescript
// apps/backend/src/services/mcp/MCPClientPool.ts

export class MCPClientPool implements IMCPClientPool {
  private clients = new Map<string, MCPClient>();
  private toolToServer = new Map<string, string>();
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    // Start periodic health checks
    this.startHealthChecks();
  }

  async addServer(config: MCPServerConfig): Promise<MCPConnection> {
    try {
      const client = new MCPClient(config);
      await client.connect();

      const tools = await client.discoverTools();

      // Register tools with server mapping
      for (const tool of tools) {
        const toolKey = `${config.name}:${tool.name}`;
        this.toolToServer.set(toolKey, config.id);
      }

      this.clients.set(config.id, client);

      return {
        serverId: config.id,
        serverName: config.name,
        status: 'connected',
        tools,
      };
    } catch (error) {
      throw new MCPError(
        `Failed to add MCP server: ${error}`,
        config.id,
        'ADD_SERVER_FAILED',
        error,
      );
    }
  }

  async removeServer(serverId: string): Promise<void> {
    const client = this.clients.get(serverId);
    if (client) {
      await client.disconnect();
      this.clients.delete(serverId);

      // Remove tool mappings
      for (const [tool, sid] of this.toolToServer.entries()) {
        if (sid === serverId) {
          this.toolToServer.delete(tool);
        }
      }
    }
  }

  async getAllTools(): Promise<MCPTool[]> {
    const allTools: MCPTool[] = [];

    for (const [serverId, client] of this.clients.entries()) {
      try {
        const tools = await client.discoverTools();
        const serverName = this.getServerName(serverId);

        // Prefix tool names with server name
        const prefixedTools = tools.map(tool => ({
          ...tool,
          name: `${serverName}:${tool.name}`,
        }));

        allTools.push(...prefixedTools);
      } catch (error) {
        console.error(`Failed to get tools from ${serverId}:`, error);
      }
    }

    return allTools;
  }

  async executeTool(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<ToolCallResult> {
    const serverId = this.toolToServer.get(toolName);

    if (!serverId) {
      throw new MCPError(
        `Tool not found: ${toolName}`,
        'unknown',
        'TOOL_NOT_FOUND',
      );
    }

    const client = this.clients.get(serverId);
    if (!client) {
      throw new MCPError(
        `Server not connected: ${serverId}`,
        serverId,
        'SERVER_NOT_CONNECTED',
      );
    }

    // Extract actual tool name (remove server prefix)
    const actualToolName = toolName.split(':')[1] || toolName;

    return client.executeTool(actualToolName, args);
  }

  async getConnections(): Promise<MCPConnection[]> {
    const connections: MCPConnection[] = [];

    for (const [serverId, client] of this.clients.entries()) {
      const tools = await client.discoverTools();
      connections.push({
        serverId,
        serverName: this.getServerName(serverId),
        status: client.getStatus(),
        tools,
      });
    }

    return connections;
  }

  getClient(serverId: string): IMCPClient | undefined {
    return this.clients.get(serverId);
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    for (const [serverId, client] of this.clients.entries()) {
      health[serverId] = await client.checkHealth();
    }

    return health;
  }

  private startHealthChecks() {
    this.healthCheckInterval = setInterval(async () => {
      const health = await this.healthCheck();

      // Attempt to reconnect failed servers
      for (const [serverId, isHealthy] of Object.entries(health)) {
        if (!isHealthy) {
          console.log(`[MCP Pool] Server ${serverId} unhealthy, attempting reconnect...`);
          // Reconnection logic here
        }
      }
    }, 30000); // Every 30 seconds
  }

  private getServerName(serverId: string): string {
    // Extract server name from stored configs
    // This would need to be tracked in the pool
    return serverId;
  }

  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Disconnect all clients
    for (const client of this.clients.values()) {
      client.disconnect();
    }
  }
}
```

**Acceptance Criteria:**

- [ ] Multiple servers can be added concurrently
- [ ] Tools aggregated from all servers
- [ ] Tool execution routed to correct server
- [ ] Tool name conflicts resolved with prefixing
- [ ] Health checks run periodically
- [ ] Failed servers automatically reconnected
- [ ] Server removal cleans up resources
- [ ] Unit tests with multiple mock clients
- [ ] Integration tests with 3+ real MCP servers

**Testing:**

```typescript
describe('MCPClientPool', () => {
  it('should manage multiple MCP servers', async () => {
    const pool = new MCPClientPool();

    await pool.addServer({
      id: 'fs',
      name: 'filesystem',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
      transport: 'stdio',
    });

    await pool.addServer({
      id: 'web',
      name: 'web-search',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-puppeteer'],
      transport: 'stdio',
    });

    const tools = await pool.getAllTools();
    expect(tools.length).toBeGreaterThan(2);

    const connections = await pool.getConnections();
    expect(connections).toHaveLength(2);
    expect(connections.every(c => c.status === 'connected')).toBe(true);
  });

  it('should route tool calls to correct server', async () => {
    const pool = new MCPClientPool();
    await pool.addServer({...});

    const result = await pool.executeTool('filesystem:read_file', {
      path: '/tmp/test.txt',
    });

    expect(result.success).toBe(true);
  });
});
```

---

#### Task 1.5: Integrate MCP with ClaudeSDKService - Tool Calling

**Title:** Integrate MCP Tools with Claude Agent Tool Calling

**Engineer:** Backend Engineer 1 + Backend Engineer 2 (Pair)
**Priority:** P0
**Estimated Time:** 1.5 weeks
**Dependencies:** Task 1.2, Task 1.4

**Description:**

Connect MCP Client Pool with Claude SDK Service to enable Claude to discover and use MCP tools. Implement tool call handling in streaming and non-streaming modes.

**Technical Requirements:**

1. Pass MCP tools to Anthropic API as tool definitions
2. Handle tool_use blocks from Claude responses
3. Execute MCP tools when Claude requests them
4. Return tool results back to Claude
5. Support multi-turn tool calling (Claude may call multiple tools)
6. Stream tool calls and results to client
7. Handle tool execution errors gracefully

**Implementation Details:**

```typescript
// apps/backend/src/services/ClaudeSDKService.ts

export class ClaudeSDKService implements IClaudeSDKService {
  private mcpPool: MCPClientPool;

  constructor() {
    this.mcpPool = new MCPClientPool();
    // ... existing code
  }

  async createAgent(config: AgentConfig): Promise<Agent> {
    const agent: Agent = {
      id: config.id,
      name: config.name,
      config,
    };

    // Connect to MCP servers if configured
    if (config.mcpServers && config.mcpServers.length > 0) {
      const connections: MCPConnection[] = [];

      for (const serverConfig of config.mcpServers) {
        try {
          const connection = await this.mcpPool.addServer(serverConfig);
          connections.push(connection);
        } catch (error) {
          console.error(`Failed to connect to MCP server ${serverConfig.name}:`, error);
        }
      }

      agent.mcpConnections = connections;
    }

    this.agents.set(agent.id, agent);
    return agent;
  }

  private async executeWithSDK(
    agent: Agent,
    input: string,
    systemPrompt: string,
    maxTokens: number,
  ): Promise<{
    output: string;
    promptTokens: number;
    completionTokens: number;
    toolCalls?: ToolCallResult[];
  }> {
    // Get MCP tools
    const mcpTools = await this.mcpPool.getAllTools();
    const tools = this.convertMCPToolsToAnthropicFormat(mcpTools);

    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: input,
      },
    ];

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    const allToolCalls: ToolCallResult[] = [];
    let finalResponse = '';

    // Tool calling loop (max 5 iterations)
    for (let iteration = 0; iteration < 5; iteration++) {
      const response = await this.anthropic.messages.create({
        model: agent.config.model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
        tools,
        temperature: agent.config.temperature,
      });

      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;

      // Check if Claude wants to use tools
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
      );

      if (toolUseBlocks.length === 0) {
        // No tool use, return final response
        finalResponse = this.extractTextContent(response.content);
        break;
      }

      // Execute all tool calls
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        const toolResult = await this.mcpPool.executeTool(
          toolUse.name,
          toolUse.input as Record<string, unknown>,
        );

        allToolCalls.push(toolResult);

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: toolResult.success
            ? toolResult.output
            : `Error: ${toolResult.error}`,
        });
      }

      // Add assistant message with tool use
      messages.push({
        role: 'assistant',
        content: response.content,
      });

      // Add tool results as user message
      messages.push({
        role: 'user',
        content: toolResults,
      });

      // Continue loop to get Claude's response with tool results
    }

    return {
      output: finalResponse,
      promptTokens: totalInputTokens,
      completionTokens: totalOutputTokens,
      toolCalls: allToolCalls,
    };
  }

  private convertMCPToolsToAnthropicFormat(
    mcpTools: MCPTool[],
  ): Anthropic.Tool[] {
    return mcpTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object',
        properties: tool.inputSchema.properties,
        required: tool.inputSchema.required || [],
      },
    }));
  }

  private extractTextContent(content: Anthropic.ContentBlock[]): string {
    return content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');
  }
}
```

**Streaming Implementation:**

```typescript
private async streamWithSDK(
  agent: Agent,
  input: string,
  systemPrompt: string,
  maxTokens: number,
  onChunk: (chunk: StreamChunk) => void,
): Promise<{
  output: string;
  promptTokens: number;
  completionTokens: number;
  toolCalls?: ToolCallResult[];
}> {
  const mcpTools = await this.mcpPool.getAllTools();
  const tools = this.convertMCPToolsToAnthropicFormat(mcpTools);

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: input,
    },
  ];

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  const allToolCalls: ToolCallResult[] = [];
  let finalOutput = '';

  // Tool calling loop
  for (let iteration = 0; iteration < 5; iteration++) {
    const stream = await this.anthropic.messages.stream({
      model: agent.config.model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
      tools,
      temperature: agent.config.temperature,
    });

    let currentAssistantMessage: Anthropic.ContentBlock[] = [];

    stream.on('text', (text) => {
      finalOutput += text;
      onChunk({ type: 'content', content: text });
    });

    stream.on('contentBlock', (block) => {
      currentAssistantMessage.push(block);

      if (block.type === 'tool_use') {
        onChunk({
          type: 'tool_call',
          toolCall: {
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          },
        });
      }
    });

    const finalMessage = await stream.finalMessage();

    totalInputTokens += finalMessage.usage.input_tokens;
    totalOutputTokens += finalMessage.usage.output_tokens;

    // Check for tool use
    const toolUseBlocks = finalMessage.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );

    if (toolUseBlocks.length === 0) {
      break; // No tools, done
    }

    // Execute tools
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const toolUse of toolUseBlocks) {
      const toolResult = await this.mcpPool.executeTool(
        toolUse.name,
        toolUse.input as Record<string, unknown>,
      );

      allToolCalls.push(toolResult);

      onChunk({
        type: 'tool_result',
        toolResult,
      });

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: toolResult.success
          ? toolResult.output
          : `Error: ${toolResult.error}`,
      });
    }

    // Add messages for next iteration
    messages.push({
      role: 'assistant',
      content: finalMessage.content,
    });

    messages.push({
      role: 'user',
      content: toolResults,
    });
  }

  return {
    output: finalOutput,
    promptTokens: totalInputTokens,
    completionTokens: totalOutputTokens,
    toolCalls: allToolCalls,
  };
}
```

**Acceptance Criteria:**

- [ ] MCP tools passed to Claude as tool definitions
- [ ] Claude can request tool execution
- [ ] MCP tools executed when Claude requests them
- [ ] Tool results returned to Claude correctly
- [ ] Multi-turn tool calling works (up to 5 iterations)
- [ ] Streaming includes tool call and result events
- [ ] Tool execution errors handled gracefully
- [ ] Token and cost tracking includes tool use
- [ ] Integration tests with real MCP server + Claude
- [ ] End-to-end test: User input → Claude uses tool → Final response

**Testing:**

```typescript
describe('ClaudeSDKService - MCP Integration', () => {
  it('should use MCP tools in workflow', async () => {
    const service = new ClaudeSDKService();

    const agent = await service.createAgent({
      id: 'test-agent',
      name: 'File Agent',
      model: 'claude-sonnet-4-5',
      systemPrompt: 'You are a helpful assistant with access to filesystem tools.',
      temperature: 0.7,
      maxTokens: 2048,
      enabledTools: ['filesystem:read_file'],
      mcpServers: [{
        id: 'fs',
        name: 'filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        transport: 'stdio',
      }],
    });

    const result = await service.executeAgent(
      agent,
      'Read the file at /tmp/test.txt and summarize its contents',
    );

    expect(result.status).toBe('completed');
    expect(result.toolCalls).toBeDefined();
    expect(result.toolCalls!.length).toBeGreaterThan(0);
    expect(result.toolCalls![0].name).toBe('read_file');
    expect(result.toolCalls![0].success).toBe(true);
  });

  it('should stream MCP tool execution', async () => {
    const chunks: StreamChunk[] = [];
    const service = new ClaudeSDKService();
    const agent = await service.createAgent({...});

    await service.streamExecution(
      agent,
      'List files in /tmp directory',
      (chunk) => chunks.push(chunk),
    );

    const toolCallChunks = chunks.filter(c => c.type === 'tool_call');
    const toolResultChunks = chunks.filter(c => c.type === 'tool_result');

    expect(toolCallChunks.length).toBeGreaterThan(0);
    expect(toolResultChunks.length).toBeGreaterThan(0);
  });
});
```

---

### Sprint 2: Integration & Production Readiness (Weeks 6-10)

---

#### Task 2.1: ExecutionEngine Integration

**Title:** Integrate Claude SDK Service with ExecutionEngine

**Engineer:** Backend Engineer 3
**Priority:** P0
**Estimated Time:** 1 week
**Dependencies:** Task 1.5

**Description:**

Update ExecutionEngine to use the new ClaudeSDKService instead of mocked implementation. Handle agent node execution with MCP server configuration.

**Technical Requirements:**

1. Update `executeAgentNode` to use ClaudeSDKService
2. Pass MCP server configs from node properties
3. Handle streaming to SSE response
4. Update execution state tracking
5. Save tool call results in execution history
6. Handle errors and retry logic

**Implementation Details:**

```typescript
// apps/backend/src/services/ExecutionEngine.ts

export class ExecutionEngine {
  private claudeService: ClaudeSDKService;

  constructor() {
    this.claudeService = new ClaudeSDKService();
  }

  private async executeAgentNode(
    node: WorkflowNode,
    context: ExecutionContext,
    res?: Response,
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      // Extract agent configuration from node
      const agentConfig: AgentConfig = {
        id: node.id,
        name: node.data.label || 'Agent',
        model: node.data.model || 'claude-sonnet-4-5',
        systemPrompt: this.resolveVariables(
          node.data.systemPrompt || '',
          context.variables,
        ),
        temperature: node.data.temperature || 0.7,
        maxTokens: node.data.maxTokens || 4096,
        enabledTools: node.data.enabledTools || [],
        mcpServers: node.data.mcpServers || [],
      };

      // Create agent
      const agent = await this.claudeService.createAgent(agentConfig);

      // Get input from previous nodes
      const input = this.getNodeInput(node, context);

      // Execute with streaming if SSE response available
      let result: SDKExecutionResult;

      if (res && node.data.streaming !== false) {
        result = await this.claudeService.streamExecution(
          agent,
          input,
          (chunk) => {
            this.sendSSEChunk(res, node.id, chunk);
          },
        );
      } else {
        result = await this.claudeService.executeAgent(agent, input);
      }

      // Track execution
      await this.saveExecutionStep({
        nodeId: node.id,
        status: result.status,
        output: result.result,
        cost: result.cost,
        duration: result.duration,
        toolCalls: result.toolCalls,
      });

      return {
        nodeId: node.id,
        status: result.status === 'completed' ? 'success' : 'error',
        output: result.result || '',
        error: result.error,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        nodeId: node.id,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  private sendSSEChunk(res: Response, nodeId: string, chunk: StreamChunk) {
    const sseData = {
      nodeId,
      ...chunk,
    };

    res.write(`data: ${JSON.stringify(sseData)}\n\n`);
  }

  private getNodeInput(node: WorkflowNode, context: ExecutionContext): string {
    const incomingEdges = context.workflow.edges.filter(
      e => e.target === node.id,
    );

    if (incomingEdges.length === 0) {
      return node.data.defaultInput || '';
    }

    // Get output from connected nodes
    const inputs = incomingEdges.map(edge => {
      const sourceResult = context.results.get(edge.source);
      return sourceResult?.output || '';
    });

    return inputs.join('\n\n');
  }

  private resolveVariables(
    text: string,
    variables: Record<string, string>,
  ): string {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }
}
```

**Acceptance Criteria:**

- [ ] ExecutionEngine uses ClaudeSDKService
- [ ] Agent nodes execute with real Claude API
- [ ] MCP servers configured from node properties
- [ ] Streaming works via SSE
- [ ] Tool calls tracked in execution history
- [ ] Errors handled gracefully
- [ ] Cost tracked per execution
- [ ] Integration tests with full workflow

**Testing:**

```typescript
describe('ExecutionEngine - Claude Integration', () => {
  it('should execute workflow with agent node', async () => {
    const engine = new ExecutionEngine();

    const workflow = {
      nodes: [{
        id: 'agent-1',
        type: 'agent',
        data: {
          label: 'Assistant',
          model: 'claude-sonnet-4-5',
          systemPrompt: 'You are a helpful assistant.',
          temperature: 0.7,
          maxTokens: 1024,
        },
      }],
      edges: [],
    };

    const execution = await engine.executeWorkflow(workflow, {
      input: 'Hello, how are you?',
    });

    expect(execution.status).toBe('completed');
    expect(execution.steps).toHaveLength(1);
    expect(execution.steps[0].output).toBeDefined();
  });
});
```

---

#### Task 2.2: Frontend Integration - MCP Configuration UI

**Title:** Add MCP Server Configuration UI to Agent Properties

**Engineer:** Frontend Engineer 1
**Priority:** P1
**Estimated Time:** 1 week
**Dependencies:** Task 2.1

**Description:**

Update AgentProperties component to allow users to configure MCP servers for agents. Add UI for server selection, configuration, and tool management.

**Technical Requirements:**

1. Add MCP server configuration section to AgentProperties
2. UI for adding/removing MCP servers
3. Server type selection (filesystem, web-search, custom)
4. Configuration inputs (command, args, env vars)
5. Test connection button
6. Display available tools from connected servers
7. Tool selection/filtering

**Implementation Details:**

```tsx
// apps/frontend/src/components/properties/AgentProperties.tsx

interface MCPServerConfig {
  id: string;
  name: string;
  type: 'filesystem' | 'web-search' | 'database' | 'custom';
  command: string;
  args: string[];
  env?: Record<string, string>;
  enabled: boolean;
}

export function AgentProperties({ node, onChange }: AgentPropertiesProps) {
  const [mcpServers, setMcpServers] = useState<MCPServerConfig[]>(
    node.data.mcpServers || [],
  );
  const [availableTools, setAvailableTools] = useState<MCPTool[]>([]);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  const handleAddMCPServer = () => {
    const newServer: MCPServerConfig = {
      id: `mcp-${Date.now()}`,
      name: 'New MCP Server',
      type: 'custom',
      command: '',
      args: [],
      enabled: true,
    };

    setMcpServers([...mcpServers, newServer]);
  };

  const handleTestConnection = async (serverId: string) => {
    setTestingConnection(serverId);

    try {
      const server = mcpServers.find(s => s.id === serverId);
      if (!server) return;

      const response = await fetch('/api/mcp/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(server),
      });

      const { success, tools, error } = await response.json();

      if (success) {
        setAvailableTools(tools);
        toast.success(`Connected! Found ${tools.length} tools.`);
      } else {
        toast.error(`Connection failed: ${error}`);
      }
    } catch (error) {
      toast.error('Failed to test connection');
    } finally {
      setTestingConnection(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing agent properties... */}

      <Separator />

      <div>
        <Label className="text-base font-semibold">MCP Servers</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Connect to Model Context Protocol servers to give your agent access to tools
        </p>

        <div className="space-y-4">
          {mcpServers.map((server, index) => (
            <Card key={server.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={server.enabled}
                    onCheckedChange={(enabled) => {
                      const updated = [...mcpServers];
                      updated[index].enabled = enabled;
                      setMcpServers(updated);
                      onChange({ ...node.data, mcpServers: updated });
                    }}
                  />
                  <Input
                    value={server.name}
                    onChange={(e) => {
                      const updated = [...mcpServers];
                      updated[index].name = e.target.value;
                      setMcpServers(updated);
                    }}
                    className="font-medium"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMcpServers(mcpServers.filter(s => s.id !== server.id));
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <Select
                  value={server.type}
                  onValueChange={(type) => {
                    const updated = [...mcpServers];
                    updated[index].type = type as any;

                    // Set default command/args for known types
                    if (type === 'filesystem') {
                      updated[index].command = 'npx';
                      updated[index].args = [
                        '-y',
                        '@modelcontextprotocol/server-filesystem',
                        '/tmp',
                      ];
                    }

                    setMcpServers(updated);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select server type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="filesystem">Filesystem</SelectItem>
                    <SelectItem value="web-search">Web Search</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Command (e.g., npx)"
                  value={server.command}
                  onChange={(e) => {
                    const updated = [...mcpServers];
                    updated[index].command = e.target.value;
                    setMcpServers(updated);
                  }}
                />

                <Textarea
                  placeholder="Arguments (one per line)"
                  value={server.args.join('\n')}
                  onChange={(e) => {
                    const updated = [...mcpServers];
                    updated[index].args = e.target.value.split('\n');
                    setMcpServers(updated);
                  }}
                  rows={3}
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestConnection(server.id)}
                  disabled={testingConnection === server.id}
                >
                  {testingConnection === server.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}

          <Button
            variant="outline"
            onClick={handleAddMCPServer}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add MCP Server
          </Button>
        </div>

        {availableTools.length > 0 && (
          <Card className="mt-4 p-4">
            <Label className="text-sm font-semibold mb-2">
              Available Tools ({availableTools.length})
            </Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableTools.map(tool => (
                <div key={tool.name} className="text-sm">
                  <span className="font-mono text-xs">{tool.name}</span>
                  <p className="text-muted-foreground text-xs">
                    {tool.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
```

**API Endpoint for Testing:**

```typescript
// apps/backend/src/routes/mcp.ts

router.post('/test-connection', async (req, res) => {
  try {
    const serverConfig: MCPServerConfig = req.body;

    const client = new MCPClient(serverConfig);
    await client.connect();

    const tools = await client.discoverTools();
    await client.disconnect();

    res.json({
      success: true,
      tools,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    });
  }
});
```

**Acceptance Criteria:**

- [ ] MCP server configuration UI in AgentProperties
- [ ] Add/remove MCP servers
- [ ] Server type presets (filesystem, web-search, etc.)
- [ ] Custom server configuration
- [ ] Test connection button works
- [ ] Available tools displayed after connection
- [ ] Configuration saved to node data
- [ ] UI responsive and accessible

---

#### Task 2.3: Error Handling & Retry Logic

**Title:** Comprehensive Error Handling and Retry Logic

**Engineer:** Backend Engineer 3
**Priority:** P0
**Estimated Time:** 1 week
**Dependencies:** Task 2.1

**Description:**

Implement production-grade error handling, retry logic, and graceful degradation for Claude API and MCP server failures.

**Technical Requirements:**

1. Exponential backoff for API rate limits
2. Timeout handling for hung requests
3. MCP server crash recovery
4. Partial failure handling (some tools fail, others succeed)
5. Circuit breaker pattern for failing services
6. Error categorization (retryable vs fatal)
7. Detailed error messages for users

**Implementation Details:**

```typescript
// apps/backend/src/services/errors/ErrorHandler.ts

export enum ErrorCategory {
  RETRYABLE = 'retryable',
  FATAL = 'fatal',
  USER_ERROR = 'user_error',
}

export interface ErrorContext {
  category: ErrorCategory;
  message: string;
  userMessage: string;
  retryable: boolean;
  details?: unknown;
}

export class ErrorHandler {
  categorizeError(error: unknown): ErrorContext {
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        return {
          category: ErrorCategory.RETRYABLE,
          message: 'Rate limit exceeded',
          userMessage: 'Too many requests. Please wait a moment and try again.',
          retryable: true,
          details: error,
        };
      }

      if (error.status === 401) {
        return {
          category: ErrorCategory.FATAL,
          message: 'Invalid API key',
          userMessage: 'Authentication failed. Please check your API key.',
          retryable: false,
          details: error,
        };
      }

      if (error.status >= 500) {
        return {
          category: ErrorCategory.RETRYABLE,
          message: 'Anthropic API error',
          userMessage: 'Anthropic service temporarily unavailable. Retrying...',
          retryable: true,
          details: error,
        };
      }
    }

    if (error instanceof MCPError) {
      if (error.code === 'CONNECTION_FAILED') {
        return {
          category: ErrorCategory.RETRYABLE,
          message: `MCP server connection failed: ${error.serverId}`,
          userMessage: `Failed to connect to ${error.serverId}. Retrying...`,
          retryable: true,
          details: error,
        };
      }
    }

    return {
      category: ErrorCategory.FATAL,
      message: error instanceof Error ? error.message : 'Unknown error',
      userMessage: 'An unexpected error occurred. Please try again.',
      retryable: false,
      details: error,
    };
  }
}

export class RetryManager {
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      initialDelay?: number;
      maxDelay?: number;
      factor?: number;
    } = {},
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 30000,
      factor = 2,
    } = options;

    let lastError: unknown;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        const errorHandler = new ErrorHandler();
        const errorContext = errorHandler.categorizeError(error);

        if (!errorContext.retryable || attempt === maxRetries) {
          throw error;
        }

        console.log(
          `Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
        );

        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * factor, maxDelay);
      }
    }

    throw lastError;
  }
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold = 5,
    private timeout = 60000,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  getState() {
    return this.state;
  }
}
```

**Usage in ClaudeSDKService:**

```typescript
export class ClaudeSDKService {
  private retryManager = new RetryManager();
  private circuitBreaker = new CircuitBreaker();

  async executeAgent(
    agent: Agent,
    input: string,
    options: ExecutionOptions = {},
  ): Promise<SDKExecutionResult> {
    return this.retryManager.executeWithRetry(
      () => this.circuitBreaker.execute(
        () => this._executeAgentInternal(agent, input, options),
      ),
      {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        factor: 2,
      },
    );
  }

  private async _executeAgentInternal(
    agent: Agent,
    input: string,
    options: ExecutionOptions,
  ): Promise<SDKExecutionResult> {
    // Actual execution logic...
  }
}
```

**Acceptance Criteria:**

- [ ] Exponential backoff implemented
- [ ] Rate limit errors retried automatically
- [ ] Circuit breaker prevents cascading failures
- [ ] Timeout handling for hung requests
- [ ] MCP server failures don't crash execution
- [ ] Partial tool failures handled gracefully
- [ ] Error messages user-friendly
- [ ] All error types categorized correctly
- [ ] Unit tests for error scenarios
- [ ] Integration tests with simulated failures

---

#### Task 2.4: Cost Tracking & Limits

**Title:** Enhanced Cost Tracking and Budget Controls

**Engineer:** Backend Engineer 4
**Priority:** P1
**Estimated Time:** 1 week
**Dependencies:** Task 2.1

**Description:**

Implement comprehensive cost tracking per execution, project, and user with budget controls and alerts.

**Technical Requirements:**

1. Track costs per execution (prompt + completion tokens)
2. Aggregate costs per project
3. Aggregate costs per user (when auth implemented)
4. Cost limits per project
5. Cost alerts (50%, 75%, 90%, 100%)
6. Cost estimation before execution (dry run)
7. Cost analytics API endpoints

**Implementation Details:**

```typescript
// apps/backend/src/services/CostTrackingService.ts

export interface CostRecord {
  id: string;
  projectId: string;
  userId?: string;
  executionId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  timestamp: Date;
}

export interface ProjectCostSummary {
  projectId: string;
  totalCost: number;
  executionCount: number;
  periodStart: Date;
  periodEnd: Date;
  costByModel: Record<string, number>;
  costByDay: Array<{ date: string; cost: number }>;
}

export interface CostLimit {
  projectId: string;
  limitType: 'daily' | 'weekly' | 'monthly';
  limitAmount: number;
  currentSpend: number;
  alertThresholds: number[];
}

export class CostTrackingService {
  async recordCost(record: CostRecord): Promise<void> {
    // Save to database
    await this.saveCostRecord(record);

    // Check against limits
    await this.checkCostLimits(record.projectId, record.totalCost);
  }

  async getProjectCostSummary(
    projectId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<ProjectCostSummary> {
    const records = await this.getCostRecords(projectId, periodStart, periodEnd);

    const totalCost = records.reduce((sum, r) => sum + r.totalCost, 0);
    const executionCount = records.length;

    const costByModel = records.reduce((acc, r) => {
      acc[r.model] = (acc[r.model] || 0) + r.totalCost;
      return acc;
    }, {} as Record<string, number>);

    const costByDay = this.aggregateCostByDay(records);

    return {
      projectId,
      totalCost,
      executionCount,
      periodStart,
      periodEnd,
      costByModel,
      costByDay,
    };
  }

  async setCostLimit(limit: CostLimit): Promise<void> {
    // Save to database
    await this.saveCostLimit(limit);
  }

  async checkCostLimits(projectId: string, newCost: number): Promise<void> {
    const limit = await this.getCostLimit(projectId);
    if (!limit) return;

    const newTotal = limit.currentSpend + newCost;
    const percentage = (newTotal / limit.limitAmount) * 100;

    // Check alert thresholds
    for (const threshold of limit.alertThresholds) {
      if (percentage >= threshold && limit.currentSpend < threshold) {
        await this.sendCostAlert(projectId, percentage, newTotal, limit.limitAmount);
      }
    }

    // Enforce hard limit
    if (newTotal > limit.limitAmount) {
      throw new Error(
        `Cost limit exceeded: $${newTotal.toFixed(4)} / $${limit.limitAmount}`,
      );
    }

    // Update current spend
    await this.updateCurrentSpend(projectId, newTotal);
  }

  async estimateCost(
    model: string,
    estimatedPromptTokens: number,
    estimatedCompletionTokens: number,
  ): Promise<number> {
    const pricing = this.getPricing(model);

    const promptCost = estimatedPromptTokens * pricing.promptTokens;
    const completionCost = estimatedCompletionTokens * pricing.completionTokens;

    return promptCost + completionCost;
  }

  private async sendCostAlert(
    projectId: string,
    percentage: number,
    currentCost: number,
    limitAmount: number,
  ): Promise<void> {
    console.log(
      `[Cost Alert] Project ${projectId} at ${percentage.toFixed(0)}% of budget ($${currentCost.toFixed(4)} / $${limitAmount})`,
    );

    // TODO: Send email, webhook, etc.
  }

  private getPricing(model: string) {
    const PRICING = {
      'claude-sonnet-4-5': {
        promptTokens: 0.003 / 1000,
        completionTokens: 0.015 / 1000,
      },
      'claude-opus-4': {
        promptTokens: 0.015 / 1000,
        completionTokens: 0.075 / 1000,
      },
    };

    return PRICING[model] || PRICING['claude-sonnet-4-5'];
  }

  private aggregateCostByDay(records: CostRecord[]) {
    const byDay: Record<string, number> = {};

    for (const record of records) {
      const date = record.timestamp.toISOString().split('T')[0];
      byDay[date] = (byDay[date] || 0) + record.totalCost;
    }

    return Object.entries(byDay).map(([date, cost]) => ({ date, cost }));
  }
}
```

**API Endpoints:**

```typescript
// apps/backend/src/routes/costs.ts

router.get('/projects/:projectId/costs/summary', async (req, res) => {
  const { projectId } = req.params;
  const { start, end } = req.query;

  const costService = new CostTrackingService();
  const summary = await costService.getProjectCostSummary(
    projectId,
    new Date(start as string),
    new Date(end as string),
  );

  res.json(summary);
});

router.post('/projects/:projectId/costs/limit', async (req, res) => {
  const { projectId } = req.params;
  const limit: CostLimit = req.body;

  const costService = new CostTrackingService();
  await costService.setCostLimit({ ...limit, projectId });

  res.json({ success: true });
});

router.post('/costs/estimate', async (req, res) => {
  const { model, estimatedPromptTokens, estimatedCompletionTokens } = req.body;

  const costService = new CostTrackingService();
  const estimate = await costService.estimateCost(
    model,
    estimatedPromptTokens,
    estimatedCompletionTokens,
  );

  res.json({ estimatedCost: estimate });
});
```

**Acceptance Criteria:**

- [ ] Cost tracked per execution
- [ ] Cost aggregated per project
- [ ] Cost limits enforceable
- [ ] Alerts sent at thresholds
- [ ] Cost estimation API works
- [ ] Cost analytics endpoints functional
- [ ] Frontend displays cost tracking
- [ ] Budget controls prevent overruns

---

#### Task 2.5: Documentation & Examples

**Title:** Comprehensive Documentation and Example Workflows

**Engineer:** Technical Writer + Backend Engineer 1
**Priority:** P1
**Estimated Time:** 1 week
**Dependencies:** All previous tasks

**Description:**

Create comprehensive documentation for Claude SDK integration, MCP usage, and example workflows demonstrating capabilities.

**Deliverables:**

1. **Claude SDK Integration Guide**
   - Setup and configuration
   - Environment variables
   - API key management
   - Model selection guide

2. **MCP Server Guide**
   - What is MCP?
   - Supported MCP servers
   - How to connect to MCP servers
   - Custom MCP server development
   - Troubleshooting MCP connections

3. **Example Workflows**
   - Simple chatbot (no tools)
   - File operations (filesystem MCP)
   - Web research (web-search MCP)
   - Database queries (database MCP)
   - Multi-agent workflow with tools
   - Error handling examples

4. **API Documentation**
   - OpenAPI spec for all endpoints
   - SDK usage examples (when implemented)
   - WebSocket/SSE streaming guide
   - Error codes and handling

5. **Best Practices**
   - Cost optimization
   - Performance tuning
   - Security considerations
   - Production deployment checklist

**Acceptance Criteria:**

- [ ] All documentation written and reviewed
- [ ] 5+ example workflows created
- [ ] API documentation complete
- [ ] Troubleshooting guide available
- [ ] Video tutorials recorded (optional)
- [ ] Documentation deployed to docs site

---

## Dependencies & Critical Path

### Dependency Graph

```
Task 1.1 (Anthropic SDK Base)
  │
  ├─▶ Task 1.2 (Streaming)
  │     │
  │     └─▶ Task 1.5 (MCP Integration)
  │           │
  │           └─▶ Task 2.1 (ExecutionEngine)
  │                 │
  │                 ├─▶ Task 2.2 (Frontend UI)
  │                 ├─▶ Task 2.3 (Error Handling)
  │                 └─▶ Task 2.4 (Cost Tracking)
  │                       │
  │                       └─▶ Task 2.5 (Documentation)
  │
Task 1.3 (MCP Client)
  │
  └─▶ Task 1.4 (MCP Pool)
        │
        └─▶ Task 1.5 (MCP Integration)
```

### Critical Path

1. Task 1.1 → Task 1.2 → Task 1.5 → Task 2.1 → Task 2.5 (10 weeks)

### Parallel Tracks

- **Track A (Claude SDK):** Task 1.1 → 1.2 → 1.5
- **Track B (MCP):** Task 1.3 → 1.4 → 1.5
- **Track C (Integration):** Task 2.1 → 2.2, 2.3, 2.4 (parallel)

### Team Allocation

- **Backend Engineer 1:** Tasks 1.1, 1.2, 1.5 (pair), 2.5
- **Backend Engineer 2:** Tasks 1.3, 1.4, 1.5 (pair)
- **Backend Engineer 3:** Tasks 2.1, 2.3
- **Backend Engineer 4:** Task 2.4
- **Frontend Engineer 1:** Task 2.2
- **Technical Writer:** Task 2.5

---

## Testing Strategy

### Unit Tests

**Coverage Target:** 90%+

**Test Files:**
- `ClaudeSDKService.test.ts`
- `MCPClient.test.ts`
- `MCPClientPool.test.ts`
- `ExecutionEngine.test.ts`
- `CostTrackingService.test.ts`
- `ErrorHandler.test.ts`

**Key Scenarios:**
- Happy path execution
- API errors (rate limits, auth failures)
- MCP connection failures
- Tool execution errors
- Timeout handling
- Cost limit enforcement

### Integration Tests

**Test Environments:**
- Development (mocked APIs)
- Staging (real APIs, test data)

**Test Suites:**
1. **Claude API Integration**
   - Non-streaming execution
   - Streaming execution
   - Tool calling
   - Error handling

2. **MCP Integration**
   - Connect to filesystem server
   - Connect to web-search server
   - Tool discovery
   - Tool execution
   - Server crash recovery

3. **End-to-End Workflows**
   - Simple agent workflow
   - Agent with MCP tools
   - Multi-agent workflow
   - Error scenarios

### Performance Tests

**Load Testing:**
- 100 concurrent executions
- Streaming with 50 concurrent connections
- MCP server connection pooling

**Metrics:**
- Response time (p50, p95, p99)
- Throughput (executions/second)
- Error rate
- Resource usage (CPU, memory)

**Targets:**
- p95 latency < 5s for simple workflows
- p99 latency < 10s
- Error rate < 0.5%
- Memory usage stable over 1000 executions

### Manual Testing

**Test Cases:**
1. Create agent with MCP server
2. Execute workflow with tool calling
3. Handle MCP server crash mid-execution
4. Exceed cost limit
5. Rate limit handling
6. Streaming response display

---

## Rollout Plan

### Phase 1: Internal Alpha (Week 8)

**Goal:** Validate core functionality with internal team

**Participants:** 5-10 internal users

**Features:**
- ✅ Claude API execution
- ✅ Basic MCP support (filesystem)
- ⚠️ Limited error handling

**Success Criteria:**
- 20+ workflows executed successfully
- < 5% error rate
- Feedback collected

### Phase 2: Private Beta (Week 9)

**Goal:** Test with friendly external users

**Participants:** 20-30 selected beta users

**Features:**
- ✅ Full Claude API integration
- ✅ Multiple MCP servers
- ✅ Streaming
- ✅ Cost tracking

**Success Criteria:**
- 100+ workflows executed
- < 2% error rate
- Positive user feedback
- No critical bugs

### Phase 3: Public Beta (Week 10)

**Goal:** Open to all users with beta label

**Participants:** All CloutAgent users

**Features:**
- ✅ All production features
- ✅ Documentation complete
- ✅ Error handling robust

**Success Criteria:**
- 1000+ workflows executed
- < 1% error rate
- Cost tracking accurate
- Performance targets met

### Phase 4: General Availability (Week 11+)

**Goal:** Remove beta label, full production

**Participants:** All users

**Success Criteria:**
- 99.5% uptime
- < 0.5% error rate
- Positive user reviews
- Documentation complete

---

## Risk Management

### High Risks

**Risk 1: Anthropic API Rate Limits**
- **Probability:** Medium
- **Impact:** High
- **Mitigation:** Implement exponential backoff, queue system, user rate limits
- **Owner:** Backend Engineer 1

**Risk 2: MCP Protocol Changes**
- **Probability:** Low
- **Impact:** Medium
- **Mitigation:** Version locking, stay updated with MCP spec, abstraction layer
- **Owner:** Backend Engineer 2

**Risk 3: Cost Overruns (Users)**
- **Probability:** Medium
- **Impact:** High
- **Mitigation:** Hard cost limits, clear warnings, dry-run estimates
- **Owner:** Backend Engineer 4

### Medium Risks

**Risk 4: MCP Server Stability**
- **Probability:** Medium
- **Impact:** Medium
- **Mitigation:** Auto-restart, circuit breakers, graceful degradation
- **Owner:** Backend Engineer 2

**Risk 5: Performance Degradation**
- **Probability:** Low
- **Impact:** Medium
- **Mitigation:** Load testing, monitoring, caching strategies
- **Owner:** Backend Engineer 3

---

## Success Metrics

### Technical Metrics

1. **Functionality**
   - ✅ 100% of workflows execute with real Claude API
   - ✅ 5+ MCP servers supported
   - ✅ Streaming works reliably

2. **Reliability**
   - ✅ 99.5%+ success rate on valid workflows
   - ✅ < 0.5% error rate
   - ✅ 99% uptime

3. **Performance**
   - ✅ p95 latency < 5s
   - ✅ p99 latency < 10s
   - ✅ Streaming first token < 2s

4. **Cost Accuracy**
   - ✅ ±1% accuracy in cost calculations
   - ✅ Cost limits enforced 100%

### User Metrics

1. **Adoption**
   - ✅ 50% of users create workflows with MCP tools
   - ✅ Average 10+ executions per project

2. **Satisfaction**
   - ✅ NPS > 40
   - ✅ < 5% negative feedback
   - ✅ Feature request rate < 10/week

3. **Support**
   - ✅ < 2 support tickets per 100 users
   - ✅ 90% of issues resolved in documentation

---

## Appendix

### Useful MCP Servers for Testing

1. **@modelcontextprotocol/server-filesystem**
   - Purpose: File operations
   - Tools: read_file, write_file, list_directory
   - Setup: `npx -y @modelcontextprotocol/server-filesystem <path>`

2. **@modelcontextprotocol/server-puppeteer**
   - Purpose: Web automation
   - Tools: navigate, screenshot, get_content
   - Setup: `npx -y @modelcontextprotocol/server-puppeteer`

3. **@modelcontextprotocol/server-postgres**
   - Purpose: Database queries
   - Tools: query, list_tables, describe_table
   - Setup: `npx -y @modelcontextprotocol/server-postgres <connection-string>`

4. **@modelcontextprotocol/server-brave-search**
   - Purpose: Web search
   - Tools: search, get_page
   - Setup: `npx -y @modelcontextprotocol/server-brave-search`

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-xxx

# Optional
ANTHROPIC_API_URL=https://api.anthropic.com  # Custom endpoint
MAX_CONCURRENT_EXECUTIONS=10                 # Rate limiting
DEFAULT_TIMEOUT_MS=120000                    # Default timeout
ENABLE_COST_LIMITS=true                      # Enable cost controls
```

### Reference Documentation

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Claude Agent Best Practices](https://docs.anthropic.com/claude/docs/agent-best-practices)

---

**Document Version:** 1.0
**Last Updated:** October 14, 2025
**Status:** Ready for Implementation
**Approval:** Pending Team Review
