# Claude Agent SDK Migration Guide

**Date**: 2025-10-14  
**Status**: ✅ Complete  
**Version**: Claude Agent SDK 0.1.1

## Overview

This document details the migration from the low-level `@anthropic-ai/sdk` to the high-level `@anthropic-ai/claude-agent-sdk`. This migration brings CloutAgent in line with the official Claude Code architecture and provides comprehensive streaming support for all agent actions.

---

## Why Migrate?

### Problems with `@anthropic-ai/sdk` (Low-Level)
- Manual message construction and conversation management
- Complex tool execution orchestration
- Custom MCP protocol implementation required
- Manual cost calculation and token tracking
- No built-in session management
- Verbose streaming implementation

### Benefits of `@anthropic-ai/claude-agent-sdk` (High-Level)
- ✅ **Built-in MCP Support**: Native MCP server integration via configuration
- ✅ **Automatic Tool Orchestration**: SDK handles tool execution lifecycle
- ✅ **Pre-calculated Costs**: Token usage and costs provided automatically
- ✅ **Session Management**: Built-in resume/fork session capabilities
- ✅ **Comprehensive Streaming**: Real-time events for all actions
- ✅ **Extended Thinking Support**: Native support for Claude's reasoning mode
- ✅ **Production Ready**: Powers Claude Code CLI

---

## Architecture Changes

### Before: Custom SDK Wrapper
```
CloutAgent
├── AnthropicSDKService (custom wrapper)
├── MCPClient (custom MCP protocol implementation)
├── MCPClientPool (custom MCP management)
├── CostCalculator (custom pricing)
└── StreamingManager (custom SSE)
```

### After: Agent SDK Integration
```
CloutAgent
└── ClaudeAgentSDKService
    ├── Uses query() function from Agent SDK
    ├── Built-in MCP support (no custom client needed)
    ├── SDK-provided cost calculation
    └── Event mapping layer (SDKMessage → SSEEvent)
```

---

## Technical Implementation

### 1. Package Installation

**Added Dependency**:
```json
{
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.1.1"
  }
}
```

**File**: `apps/backend/package.json`

---

### 2. Type System Updates

**New SSE Event Types**:
```typescript
export type SSEEventType =
  | 'execution:output'           // Text chunks
  | 'execution:thinking'          // 🆕 Claude's thinking/reasoning
  | 'execution:tool-call'         // Tool invocation
  | 'execution:tool-result'       // Tool execution result
  | 'execution:token-usage'       // Token counts
  | 'execution:cost-update'       // 🆕 Incremental cost updates
  | 'execution:session-created'   // 🆕 Session initialization
  // ... other events
```

**File**: `packages/types/src/index.ts:330-346`

**New Agent SDK Types**:
```typescript
export interface CloutAgentConfig {
  id: string;
  name: string;
  model: 'sonnet' | 'opus' | 'haiku';
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  maxTurns?: number;
  mcpServers?: Record<string, {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  }>;
  allowedTools?: string[];
  disallowedTools?: string[];
}

export interface SessionInfo {
  sessionId: string;
  query: Query;
  createdAt: Date;
  lastActivity: Date;
  config: CloutAgentConfig;
}

export interface AgentSDKExecutionOptions {
  timeout?: number;
  variables?: Record<string, string>;
  sessionId?: string;  // Resume existing session
  forkFrom?: string;   // Fork from existing session
}
```

**File**: `packages/types/src/claude-sdk.ts` (267 lines)

---

### 3. Core Service Implementation

**ClaudeAgentSDKService Architecture**:

```typescript
export class ClaudeAgentSDKService {
  private apiKey: string;
  private activeSessions: Map<string, SessionInfo>;

  // Main streaming execution method
  async streamExecution(
    config: CloutAgentConfig,
    input: string,
    onEvent: (event: SSEEvent) => void,
    options: AgentSDKExecutionOptions = {}
  ): Promise<SDKExecutionResult>

  // Event mapping layer
  private async mapSDKMessageToSSE(
    message: SDKMessage,
    executionId: string,
    onEvent: (event: SSEEvent) => void,
    accumulators: {...}
  ): Promise<void>

  // Session management
  async createSession(): Promise<string>
  async closeSession(sessionId: string): Promise<void>
  getActiveSessionIds(): string[]
}
```

**File**: `apps/backend/src/services/ClaudeAgentSDKService.ts:23-424`

---

## Agent SDK Message Types

The SDK returns 7 message types via `query()` async generator:

### 1. `system` Message
**Purpose**: System initialization and configuration  
**SSE Mapping**: `execution:progress`
```typescript
{
  type: 'system',
  subtype: 'init',
  model: string,
  tools: MCPTool[],
  mcp_servers: Record<string, MCPServerConfig>
}
```

### 2. `stream_event` Message
**Purpose**: Real-time streaming chunks from Anthropic API  
**SSE Mapping**: Multiple event types
```typescript
{
  type: 'stream_event',
  event: {
    type: 'content_block_delta' | 'content_block_start',
    delta?: { type: 'text_delta', text: string },
    content_block?: { type: 'tool_use' | 'thinking', ... }
  }
}
```

**Event Mapping**:
- `text_delta` → `execution:output` (text chunks)
- `tool_use` → `execution:tool-call` (tool invocation)
- `thinking` → `execution:thinking` (reasoning block)

**File**: `ClaudeAgentSDKService.ts:213-256`

### 3. `assistant` Message
**Purpose**: Complete assistant response with tool calls  
**SSE Mapping**: `execution:tool-call`, `execution:output`
```typescript
{
  type: 'assistant',
  message: {
    content: Array<{
      type: 'tool_use' | 'text',
      name?: string,
      id?: string,
      input?: any,
      text?: string
    }>
  }
}
```

**File**: `ClaudeAgentSDKService.ts:258-291`

### 4. `user` Message
**Purpose**: Tool execution results from SDK  
**SSE Mapping**: `execution:tool-result`
```typescript
{
  type: 'user',
  message: {
    content: Array<{
      type: 'tool_result',
      tool_use_id: string,
      content: any,
      is_error?: boolean
    }>
  }
}
```

**File**: `ClaudeAgentSDKService.ts:293-316`

### 5. `result` Message
**Purpose**: Final execution results with usage and cost  
**SSE Mapping**: `execution:token-usage`, `execution:cost-update`
```typescript
{
  type: 'result',
  subtype: 'success' | 'error',
  usage: {
    input_tokens: number,
    output_tokens: number,
    cache_read_input_tokens?: number,
    cache_creation_input_tokens?: number
  },
  total_cost_usd: number,
  modelUsage: Record<string, ModelUsageDetails>,
  duration_ms: number
}
```

**File**: `ClaudeAgentSDKService.ts:318-369`

### 6. `compact_boundary` Message
**Purpose**: Performance optimization markers  
**SSE Mapping**: None (internal)

### 7. `hook_response` Message
**Purpose**: Hook execution results  
**SSE Mapping**: TBD (future integration)

---

## MCP Integration

### Before: Custom MCP Client
```typescript
// Custom implementation required
const mcpClient = new MCPClient(config);
await mcpClient.connect();
const tools = await mcpClient.discoverTools();
// Manual tool execution
const result = await mcpClient.executeTool(toolName, args);
```

### After: Built-in MCP Support
```typescript
// Just configure in query options
const queryOptions = {
  mcpServers: {
    playwright: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-playwright']
    },
    filesystem: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem']
    }
  }
};

// SDK handles connection, discovery, and execution automatically
const q = query({ prompt, options: queryOptions });
```

**File**: `ClaudeAgentSDKService.ts:54-67`

---

## Session Management

### Creating a Session
```typescript
const sessionId = await service.createSession();
```

### Resuming a Session
```typescript
await service.streamExecution(
  config,
  input,
  onEvent,
  { sessionId: 'existing-session-id' }
);
```

### Forking a Session
```typescript
await service.streamExecution(
  config,
  input,
  onEvent,
  { forkFrom: 'parent-session-id' }
);
```

### Session Tracking
```typescript
// Get all active session IDs
const activeIds = service.getActiveSessionIds();

// Close a session
await service.closeSession(sessionId);
```

**File**: `ClaudeAgentSDKService.ts:388-411`

---

## Cost Tracking

### Before: Manual Calculation
```typescript
// Custom pricing logic
const cost = (promptTokens * PROMPT_PRICE) + (completionTokens * COMPLETION_PRICE);
```

### After: SDK-Provided Costs
```typescript
// Automatically calculated by SDK
const result = await service.streamExecution(config, input, onEvent);
console.log(result.cost.totalCost); // Pre-calculated USD amount

// Detailed model usage breakdown
onEvent receives:
{
  type: 'execution:cost-update',
  data: {
    totalCostUSD: 0.00123,
    modelUsage: {
      'claude-sonnet-4': {
        input_tokens: 100,
        output_tokens: 50,
        cost: 0.00123
      }
    }
  }
}
```

**File**: `ClaudeAgentSDKService.ts:332-356`

---

## Streaming Events Flow

### Complete Event Sequence

1. **Execution Started**
```typescript
{ type: 'execution:started', data: { agentId, model } }
```

2. **Session Created**
```typescript
{ type: 'execution:session-created', data: { sessionId } }
```

3. **System Initialized**
```typescript
{ type: 'execution:progress', data: { status: 'initialized', tools, mcpServers } }
```

4. **Thinking (Optional)**
```typescript
{ type: 'execution:thinking', data: { status: 'started' } }
```

5. **Tool Calls (If Used)**
```typescript
{ type: 'execution:tool-call', data: { toolName, toolId, toolArgs } }
{ type: 'execution:tool-result', data: { toolId, result, isError } }
```

6. **Text Output Streaming**
```typescript
{ type: 'execution:output', data: { chunk: "..." } }
{ type: 'execution:output', data: { chunk: "..." } }
// ... continues as text is generated
```

7. **Final Metrics**
```typescript
{ type: 'execution:token-usage', data: {
  promptTokens: 150,
  completionTokens: 75,
  cacheReadTokens: 0,
  cacheCreationTokens: 0,
  totalCost: 0.00123
}}

{ type: 'execution:cost-update', data: {
  totalCostUSD: 0.00123,
  modelUsage: {...},
  duration: 3500
}}
```

8. **Execution Complete**
```typescript
{ type: 'execution:completed', data: {
  result: "Full output text",
  cost: {...},
  duration: 3500,
  sessionId: "..."
}}
```

---

## Testing

### Integration Tests Created

**File**: `apps/backend/src/services/__tests__/ClaudeAgentSDKService.integration.test.ts`

**Test Coverage**:
1. ✅ Basic execution with Playwright MCP
2. ✅ Tool call and result events
3. ✅ Thinking events (extended thinking mode)
4. ✅ Session management (create, track, close)
5. ✅ Output streaming in chunks
6. ✅ Variable substitution
7. ✅ Error handling
8. ✅ Cost update events with model usage

**Running Tests**:
```bash
# Set API key
export ANTHROPIC_API_KEY=sk-ant-api03-...

# Run integration tests
npm test -- ClaudeAgentSDKService.integration.test.ts
```

**Note**: Tests are automatically skipped if `ANTHROPIC_API_KEY` is not set.

---

## Migration Checklist

### ✅ Completed

- [x] Install `@anthropic-ai/claude-agent-sdk@0.1.1`
- [x] Update SSE event types (thinking, cost-update, session-created)
- [x] Create Agent SDK type definitions (`claude-sdk.ts`)
- [x] Implement ClaudeAgentSDKService with full streaming
- [x] Implement event mapping layer (SDKMessage → SSEEvent)
- [x] Add session management (create, resume, fork, close)
- [x] Integrate built-in MCP support
- [x] Add variable substitution
- [x] Create comprehensive integration tests
- [x] Add .env.example for configuration
- [x] Document migration comprehensively

### 🔄 Pending

- [ ] Update ExecutionEngine to use ClaudeAgentSDKService
- [ ] Update API routes to emit SSE events
- [ ] Update frontend to handle new SSE event types
- [ ] Deprecate AnthropicSDKService
- [ ] Deprecate custom MCPClient and MCPClientPool
- [ ] Update documentation for developers
- [ ] Performance testing with large workflows
- [ ] Cost optimization testing

---

## Breaking Changes

### Configuration Format
**Before**: `model: 'claude-sonnet-4-5'`  
**After**: `model: 'sonnet'` (simplified)

### MCP Configuration
**Before**: Separate MCPClient configuration  
**After**: Inline `mcpServers` in AgentConfig

### Tool Execution
**Before**: Manual tool orchestration  
**After**: Automatic (SDK handles it)

### Cost Structure
**Before**: Custom calculation  
**After**: SDK-provided `total_cost_usd`

---

## Performance Considerations

### Streaming Efficiency
- Agent SDK uses `includePartialMessages: true` for real-time chunks
- Text deltas arrive as they're generated (no buffering)
- Tool calls stream in real-time

### Session Management
- Sessions are tracked in memory (`Map<string, SessionInfo>`)
- Use `closeSession()` to free resources
- Consider implementing session timeout/cleanup for long-running systems

### MCP Server Lifecycle
- MCP servers are spawned on first query
- Servers persist across queries (efficient for multiple executions)
- Servers are cleaned up when session ends

---

## Example Usage

### Basic Execution
```typescript
const service = new ClaudeAgentSDKService();

const config: CloutAgentConfig = {
  id: 'my-agent',
  name: 'My Agent',
  model: 'sonnet',
  systemPrompt: 'You are a helpful agent.',
  maxTokens: 4000,
  maxTurns: 10
};

const onEvent = (event: SSEEvent) => {
  console.log(`[${event.type}]`, event.data);
};

const result = await service.streamExecution(
  config,
  'What is the capital of France?',
  onEvent
);

console.log(result.result); // "The capital of France is Paris."
```

### With MCP Tools
```typescript
const config: CloutAgentConfig = {
  id: 'playwright-agent',
  name: 'Web Automation Agent',
  model: 'sonnet',
  systemPrompt: 'Use Playwright to automate web tasks.',
  maxTokens: 4000,
  mcpServers: {
    playwright: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-playwright']
    }
  }
};

const result = await service.streamExecution(
  config,
  'Navigate to example.com and take a screenshot',
  onEvent
);
```

### With Session Management
```typescript
// First execution - creates session
const result1 = await service.streamExecution(
  config,
  'Remember that my name is Alice',
  onEvent,
  { sessionId: 'user-123-session' }
);

// Second execution - resumes session
const result2 = await service.streamExecution(
  config,
  'What is my name?',
  onEvent,
  { sessionId: 'user-123-session' }
);
// Result: "Your name is Alice."
```

---

## Troubleshooting

### API Key Not Found
```
Error: ANTHROPIC_API_KEY environment variable is required
```
**Solution**: Create `.env` file with `ANTHROPIC_API_KEY=sk-ant-api03-...`

### MCP Server Not Connecting
```
Error: MCP server 'playwright' failed to initialize
```
**Solution**: Ensure MCP server package is installed globally or use `npx` with `-y` flag

### Session Not Found
```
Error: Session 'xyz' not found
```
**Solution**: Session may have been closed or expired. Create a new session.

### Cost Tracking Shows Zero
```
Result: { cost: { totalCost: 0 } }
```
**Solution**: This is expected for failed executions or when using test mode. Check `result.status`.

---

## References

- [Claude Agent SDK Documentation](https://github.com/anthropics/agent-sdk-python)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [CloutAgent Architecture](./ARCHITECTURE.md)
- [SSE Events Reference](./SSE_EVENTS.md)

---

## Conclusion

The migration to `@anthropic-ai/claude-agent-sdk` significantly simplifies CloutAgent's architecture by:
1. Eliminating custom SDK wrappers
2. Removing custom MCP protocol implementation
3. Using SDK-provided cost calculation
4. Leveraging built-in session management
5. Providing comprehensive real-time streaming

**Result**: More maintainable, production-ready codebase aligned with Claude Code standards.

---

**Last Updated**: 2025-10-14  
**Authors**: CloutAgent Backend Team  
**Status**: ✅ Migration Complete, Testing Pending
