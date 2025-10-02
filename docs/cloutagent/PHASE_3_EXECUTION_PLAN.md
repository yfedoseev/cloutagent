# Phase 3: Advanced Nodes - Execution Plan

**Timeline**: Weeks 5-6
**Focus**: Subagents, Hooks, MCP Integration
**Goal**: Enable advanced workflow composition with subagents, lifecycle hooks, and MCP tool integrations

## Overview

Phase 3 extends the visual builder with advanced node types that enable complex agent orchestration. This phase implements:
- **Subagent Nodes**: Parallel execution of specialized agents within workflows
- **Hook Nodes**: Lifecycle event handlers (pre-execution, post-execution, tool calls, errors)
- **MCP Nodes**: Model Context Protocol tool configuration and management
- **Validation Engine**: Connection validation and workflow integrity checks

## Interface Contracts

### IC-011: Subagent Configuration Interface

**Purpose**: Define structure for subagent nodes that can execute specialized agents in parallel

```typescript
// packages/types/src/nodes/subagent.ts

export interface SubagentConfig {
  id: string;
  name: string;
  type: 'general-purpose' | 'frontend-engineer' | 'backend-engineer' |
        'database-engineer' | 'ml-engineer' | 'ui-ux-designer' |
        'software-engineer-test' | 'infrastructure-engineer' | 'custom';
  description: string;
  prompt: string;
  maxTokens?: number;
  timeout?: number; // milliseconds
  parallelExecutionAllowed: boolean;
}

export interface SubagentNode extends Node {
  type: 'subagent';
  data: {
    config: SubagentConfig;
    status: 'idle' | 'running' | 'completed' | 'failed';
    result?: string;
    error?: string;
    executionTime?: number;
  };
}

export interface SubagentExecutionRequest {
  subagentId: string;
  prompt: string;
  context?: Record<string, any>;
  parentAgentId: string;
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
```

**API Endpoints**:
```typescript
// POST /api/projects/{projectId}/subagents/execute
// Body: SubagentExecutionRequest
// Response: SubagentExecutionResponse

// POST /api/projects/{projectId}/subagents/batch-execute
// Body: { subagents: SubagentExecutionRequest[] }
// Response: { results: SubagentExecutionResponse[] }
```

---

### IC-012: Hook Configuration Interface

**Purpose**: Define lifecycle hooks that execute at specific workflow events

```typescript
// packages/types/src/nodes/hook.ts

export type HookType =
  | 'pre-execution'      // Before main agent execution
  | 'post-execution'     // After successful execution
  | 'pre-tool-call'      // Before any tool call
  | 'post-tool-call'     // After any tool call
  | 'on-error'           // On execution error
  | 'on-validation-fail'; // On validation failure

export interface HookConfig {
  id: string;
  name: string;
  type: HookType;
  enabled: boolean;
  condition?: string; // JavaScript expression, e.g., "context.retryCount < 3"
  action: {
    type: 'log' | 'notify' | 'transform' | 'validate' | 'custom';
    code: string; // JavaScript code to execute
  };
  order: number; // Execution order when multiple hooks of same type
}

export interface HookNode extends Node {
  type: 'hook';
  data: {
    config: HookConfig;
    lastExecution?: {
      timestamp: Date;
      result: 'success' | 'failure';
      output?: any;
      error?: string;
    };
  };
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
  shouldContinue: boolean; // Can halt execution
}
```

**API Endpoints**:
```typescript
// POST /api/projects/{projectId}/hooks/validate
// Body: { code: string, type: HookType }
// Response: { valid: boolean, errors?: string[] }

// POST /api/projects/{projectId}/hooks/execute
// Body: HookExecutionContext
// Response: HookExecutionResult
```

---

### IC-013: MCP Configuration Interface

**Purpose**: Define MCP (Model Context Protocol) tool integrations

```typescript
// packages/types/src/nodes/mcp.ts

export interface MCPServer {
  id: string;
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  enabled: boolean;
}

export interface MCPTool {
  serverId: string;
  toolName: string;
  description: string;
  inputSchema: Record<string, any>; // JSON Schema
  enabled: boolean;
}

export interface MCPConfig {
  id: string;
  name: string;
  server: MCPServer;
  availableTools: MCPTool[];
  selectedTools: string[]; // Tool names to enable
  credentials?: {
    type: 'env-var' | 'secret-ref';
    value: string; // Secret ID or env var name
  };
}

export interface MCPNode extends Node {
  type: 'mcp';
  data: {
    config: MCPConfig;
    status: 'connected' | 'disconnected' | 'error';
    lastChecked?: Date;
    error?: string;
  };
}

export interface MCPConnectionTest {
  serverId: string;
  config: MCPServer;
}

export interface MCPConnectionTestResult {
  serverId: string;
  connected: boolean;
  availableTools?: string[];
  error?: string;
}
```

**API Endpoints**:
```typescript
// POST /api/projects/{projectId}/mcp/test-connection
// Body: MCPConnectionTest
// Response: MCPConnectionTestResult

// GET /api/projects/{projectId}/mcp/{serverId}/tools
// Response: { tools: MCPTool[] }

// POST /api/projects/{projectId}/mcp/{serverId}/enable-tools
// Body: { toolNames: string[] }
// Response: { enabled: boolean }
```

---

### IC-014: Workflow Validation Interface

**Purpose**: Validate workflow integrity and node connections

```typescript
// packages/types/src/validation.ts

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationRule {
  id: string;
  name: string;
  severity: ValidationSeverity;
  check: (workflow: WorkflowGraph) => ValidationResult;
}

export interface ValidationResult {
  ruleId: string;
  passed: boolean;
  severity: ValidationSeverity;
  message: string;
  affectedNodes?: string[]; // Node IDs
  affectedEdges?: string[]; // Edge IDs
  suggestedFix?: string;
}

export interface WorkflowGraph {
  nodes: Node[];
  edges: Edge[];
  projectId: string;
}

export interface ValidationReport {
  valid: boolean;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  info: ValidationResult[];
  timestamp: Date;
}

// Built-in validation rules
export const ValidationRules = {
  NO_CYCLES: 'no-cycles', // Workflow must be acyclic
  SINGLE_AGENT: 'single-agent', // Must have exactly one agent node
  HOOK_CONNECTIONS: 'hook-connections', // Hooks must connect to agent
  MCP_VALID_CONFIG: 'mcp-valid-config', // MCP nodes must have valid config
  SUBAGENT_REACHABLE: 'subagent-reachable', // Subagents must be reachable from agent
  REQUIRED_INPUTS: 'required-inputs', // All required inputs must be connected
} as const;
```

**API Endpoints**:
```typescript
// POST /api/projects/{projectId}/validate
// Body: WorkflowGraph
// Response: ValidationReport
```

---

## Tasks

### TASK-022: Subagent Configuration Backend Service

**Agent**: backend-engineer
**Priority**: P0
**Estimated Time**: 4 hours
**Dependencies**: TASK-005 (Claude Agent SDK Integration), IC-011

**Description**: Implement backend service for subagent execution with parallel processing capabilities.

**Implementation Skeleton**:
```typescript
// apps/backend/src/services/SubagentService.ts

import { SubagentConfig, SubagentExecutionRequest, SubagentExecutionResponse } from '@cloutagent/types';
import { ClaudeSDKService } from './ClaudeSDKService';

export class SubagentService {
  constructor(
    private sdkService: ClaudeSDKService,
    private costTracker: CostTracker
  ) {}

  async executeSubagent(
    request: SubagentExecutionRequest
  ): Promise<SubagentExecutionResponse> {
    const startTime = Date.now();

    try {
      // Create specialized agent instance
      const agent = this.sdkService.createAgent({
        subagentType: request.subagentType,
        systemPrompt: this.buildSystemPrompt(request),
      });

      // Execute with timeout
      const result = await this.executeWithTimeout(
        agent.run(request.prompt, request.context),
        request.timeout || 120000
      );

      // Track costs
      await this.costTracker.trackSubagent({
        subagentId: request.subagentId,
        tokenUsage: result.usage,
        executionTime: Date.now() - startTime,
      });

      return {
        subagentId: request.subagentId,
        result: result.output,
        executionTime: Date.now() - startTime,
        tokenUsage: result.usage,
        status: 'completed',
      };
    } catch (error) {
      return {
        subagentId: request.subagentId,
        result: '',
        executionTime: Date.now() - startTime,
        tokenUsage: { input: 0, output: 0 },
        status: 'failed',
        error: error.message,
      };
    }
  }

  async executeBatch(
    requests: SubagentExecutionRequest[]
  ): Promise<SubagentExecutionResponse[]> {
    // Execute in parallel with concurrency limit
    return Promise.all(
      requests.map(req => this.executeSubagent(req))
    );
  }

  private buildSystemPrompt(request: SubagentExecutionRequest): string {
    // Build specialized system prompt based on subagent type
    const basePrompts = {
      'frontend-engineer': 'You are a frontend engineer...',
      'backend-engineer': 'You are a backend engineer...',
      // ... other types
    };
    return basePrompts[request.type] || request.prompt;
  }

  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      ),
    ]);
  }
}
```

**Acceptance Criteria**:
- [ ] SubagentService implements IC-011 interface completely
- [ ] Parallel execution supports up to 10 concurrent subagents
- [ ] Timeout handling prevents hanging executions
- [ ] Cost tracking records all subagent token usage
- [ ] Error handling captures and returns detailed error messages
- [ ] System prompts correctly configured for each subagent type
- [ ] Batch execution endpoint handles failures gracefully

**Test Cases**:
```typescript
describe('SubagentService', () => {
  it('should execute single subagent successfully', async () => {
    const request: SubagentExecutionRequest = {
      subagentId: 'sub-001',
      type: 'frontend-engineer',
      prompt: 'Create a login form',
      parentAgentId: 'agent-001',
    };

    const result = await service.executeSubagent(request);

    expect(result.status).toBe('completed');
    expect(result.result).toBeTruthy();
    expect(result.tokenUsage.input).toBeGreaterThan(0);
  });

  it('should handle timeout correctly', async () => {
    const request = {
      subagentId: 'sub-002',
      timeout: 100, // Very short timeout
      prompt: 'Long running task',
    };

    const result = await service.executeSubagent(request);

    expect(result.status).toBe('failed');
    expect(result.error).toContain('Timeout');
  });

  it('should execute batch in parallel', async () => {
    const requests = Array(5).fill(null).map((_, i) => ({
      subagentId: `sub-${i}`,
      prompt: `Task ${i}`,
    }));

    const startTime = Date.now();
    const results = await service.executeBatch(requests);
    const duration = Date.now() - startTime;

    expect(results).toHaveLength(5);
    expect(duration).toBeLessThan(10000); // Parallel should be faster
  });
});
```

---

### TASK-023: Subagent Node Component

**Agent**: frontend-engineer
**Priority**: P0
**Estimated Time**: 5 hours
**Dependencies**: TASK-015 (Custom Node Components), IC-011

**Description**: Create React component for subagent nodes with real-time status indicators.

**Implementation Skeleton**:
```typescript
// apps/frontend/src/components/nodes/SubagentNode.tsx

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { SubagentNode as SubagentNodeType } from '@cloutagent/types';

export const SubagentNode = memo(({ data, selected }: NodeProps<SubagentNodeType['data']>) => {
  const { config, status, executionTime } = data;

  const statusColors = {
    idle: 'bg-gray-500',
    running: 'bg-blue-500 animate-pulse',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
  };

  const typeIcons = {
    'frontend-engineer': '🎨',
    'backend-engineer': '⚙️',
    'database-engineer': '🗄️',
    'ml-engineer': '🤖',
    'general-purpose': '🔧',
  };

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 min-w-[200px]
        ${selected ? 'border-blue-500' : 'border-gray-700'}
        bg-gradient-to-br from-purple-900 to-purple-800
        shadow-lg transition-all
      `}
    >
      <Handle type="target" position={Position.Top} />

      <div className="flex items-start gap-3">
        <div className="text-2xl">{typeIcons[config.type]}</div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
            <span className="font-semibold text-white">{config.name}</span>
          </div>

          <div className="text-xs text-purple-200 mb-2">
            {config.type.replace('-', ' ')}
          </div>

          {config.description && (
            <p className="text-sm text-purple-100 line-clamp-2">
              {config.description}
            </p>
          )}

          {executionTime && (
            <div className="text-xs text-purple-300 mt-2">
              ⏱️ {executionTime}ms
            </div>
          )}

          {data.error && (
            <div className="text-xs text-red-300 mt-2 p-2 bg-red-900/30 rounded">
              ❌ {data.error}
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

SubagentNode.displayName = 'SubagentNode';
```

**Acceptance Criteria**:
- [ ] Component renders all subagent types with correct icons
- [ ] Real-time status updates (idle → running → completed/failed)
- [ ] Execution time displayed when available
- [ ] Error messages shown with clear styling
- [ ] Animated pulse effect during execution
- [ ] Responsive design works in different canvas zoom levels
- [ ] Handles connect properly to agent nodes

**Test Cases**:
```typescript
describe('SubagentNode', () => {
  it('should render with correct status color', () => {
    const { container } = render(
      <SubagentNode data={{ config, status: 'running' }} />
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should show error message when failed', () => {
    const { getByText } = render(
      <SubagentNode
        data={{
          config,
          status: 'failed',
          error: 'Connection timeout'
        }}
      />
    );

    expect(getByText(/Connection timeout/)).toBeInTheDocument();
  });
});
```

---

### TASK-024: Hook Execution Engine

**Agent**: backend-engineer
**Priority**: P0
**Estimated Time**: 6 hours
**Dependencies**: TASK-005 (SDK Integration), IC-012

**Description**: Implement safe hook execution engine with sandboxed JavaScript runtime.

**Implementation Skeleton**:
```typescript
// apps/backend/src/services/HookExecutionService.ts

import { VM } from 'vm2'; // Sandboxed JavaScript execution
import { HookConfig, HookExecutionContext, HookExecutionResult } from '@cloutagent/types';

export class HookExecutionService {
  private readonly HOOK_TIMEOUT = 5000; // 5 seconds max
  private readonly MAX_MEMORY = 50 * 1024 * 1024; // 50MB

  async executeHook(
    hook: HookConfig,
    context: HookExecutionContext
  ): Promise<HookExecutionResult> {
    // Check condition first
    if (hook.condition && !this.evaluateCondition(hook.condition, context)) {
      return {
        hookId: hook.id,
        success: true,
        shouldContinue: true,
        output: 'Condition not met, skipped',
      };
    }

    try {
      const vm = new VM({
        timeout: this.HOOK_TIMEOUT,
        sandbox: {
          context: context.context,
          payload: context.payload,
          console: this.createSafeConsole(),
        },
      });

      const result = vm.run(hook.action.code);

      return {
        hookId: hook.id,
        success: true,
        output: result,
        modifiedContext: vm.sandbox.context,
        shouldContinue: result?.continue !== false,
      };
    } catch (error) {
      return {
        hookId: hook.id,
        success: false,
        error: error.message,
        shouldContinue: true, // Don't halt on hook errors by default
      };
    }
  }

  async executeHookChain(
    hooks: HookConfig[],
    context: HookExecutionContext
  ): Promise<HookExecutionResult[]> {
    const results: HookExecutionResult[] = [];
    let currentContext = { ...context };

    // Sort hooks by order
    const sortedHooks = [...hooks].sort((a, b) => a.order - b.order);

    for (const hook of sortedHooks) {
      if (!hook.enabled) continue;

      const result = await this.executeHook(hook, currentContext);
      results.push(result);

      // Update context for next hook
      if (result.modifiedContext) {
        currentContext.context = result.modifiedContext;
      }

      // Stop chain if hook says not to continue
      if (!result.shouldContinue) break;
    }

    return results;
  }

  validateHookCode(code: string, type: HookType): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    // Check for forbidden operations
    const forbidden = ['require', 'import', 'eval', 'Function', 'process', 'global'];
    forbidden.forEach(keyword => {
      if (code.includes(keyword)) {
        errors.push(`Forbidden keyword: ${keyword}`);
      }
    });

    // Try to parse as valid JavaScript
    try {
      new Function(code);
    } catch (error) {
      errors.push(`Syntax error: ${error.message}`);
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private evaluateCondition(condition: string, context: HookExecutionContext): boolean {
    try {
      const vm = new VM({
        timeout: 1000,
        sandbox: { context: context.context, payload: context.payload },
      });
      return vm.run(`(${condition})`);
    } catch {
      return false;
    }
  }

  private createSafeConsole() {
    const logs: string[] = [];
    return {
      log: (...args: any[]) => logs.push(args.join(' ')),
      error: (...args: any[]) => logs.push(`ERROR: ${args.join(' ')}`),
      warn: (...args: any[]) => logs.push(`WARN: ${args.join(' ')}`),
      getLogs: () => logs,
    };
  }
}
```

**Acceptance Criteria**:
- [ ] Hook execution sandboxed with vm2 (no access to filesystem, network)
- [ ] Timeout enforcement (5 seconds max per hook)
- [ ] Memory limits prevent runaway scripts
- [ ] Condition evaluation supports JavaScript expressions
- [ ] Hook chain execution maintains context between hooks
- [ ] Validation catches syntax errors and forbidden operations
- [ ] Safe console logging available in hook code
- [ ] Error handling doesn't crash the execution chain

**Test Cases**:
```typescript
describe('HookExecutionService', () => {
  it('should execute simple hook successfully', async () => {
    const hook: HookConfig = {
      id: 'hook-001',
      type: 'pre-execution',
      action: {
        type: 'transform',
        code: 'return { modified: true, value: payload.input * 2 };',
      },
      enabled: true,
      order: 0,
    };

    const context: HookExecutionContext = {
      hookType: 'pre-execution',
      payload: { input: 5 },
      context: {},
    };

    const result = await service.executeHook(hook, context);

    expect(result.success).toBe(true);
    expect(result.output.value).toBe(10);
  });

  it('should reject code with forbidden keywords', () => {
    const { valid, errors } = service.validateHookCode(
      'const fs = require("fs"); fs.readFile(...)',
      'pre-execution'
    );

    expect(valid).toBe(false);
    expect(errors).toContain('Forbidden keyword: require');
  });

  it('should timeout long-running hooks', async () => {
    const hook: HookConfig = {
      id: 'hook-002',
      action: {
        code: 'while(true) {}', // Infinite loop
      },
    };

    const result = await service.executeHook(hook, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('timeout');
  });
});
```

---

### TASK-025: Hook Node Component

**Agent**: frontend-engineer
**Priority**: P0
**Estimated Time**: 4 hours
**Dependencies**: TASK-015 (Custom Node Components), IC-012

**Description**: Create React component for hook nodes with type-specific styling.

**Implementation Skeleton**:
```typescript
// apps/frontend/src/components/nodes/HookNode.tsx

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { HookNode as HookNodeType, HookType } from '@cloutagent/types';

const hookTypeConfig: Record<HookType, { icon: string; color: string; label: string }> = {
  'pre-execution': { icon: '▶️', color: 'from-blue-900 to-blue-800', label: 'Pre-Execution' },
  'post-execution': { icon: '✅', color: 'from-green-900 to-green-800', label: 'Post-Execution' },
  'pre-tool-call': { icon: '🔧', color: 'from-yellow-900 to-yellow-800', label: 'Pre-Tool' },
  'post-tool-call': { icon: '⚙️', color: 'from-orange-900 to-orange-800', label: 'Post-Tool' },
  'on-error': { icon: '❌', color: 'from-red-900 to-red-800', label: 'Error Handler' },
  'on-validation-fail': { icon: '⚠️', color: 'from-pink-900 to-pink-800', label: 'Validation Fail' },
};

export const HookNode = memo(({ data, selected }: NodeProps<HookNodeType['data']>) => {
  const { config, lastExecution } = data;
  const typeConfig = hookTypeConfig[config.type];

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 min-w-[180px]
        ${selected ? 'border-blue-500' : 'border-gray-700'}
        bg-gradient-to-br ${typeConfig.color}
        shadow-lg transition-all
      `}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3"
      />

      <div className="flex items-start gap-2">
        <div className="text-xl">{typeConfig.icon}</div>

        <div className="flex-1">
          <div className="text-xs text-gray-300 mb-1">
            {typeConfig.label}
          </div>

          <div className="font-semibold text-white mb-1">
            {config.name}
          </div>

          {config.condition && (
            <div className="text-xs text-gray-400 mb-2 font-mono">
              if: {config.condition}
            </div>
          )}

          <div className="text-xs text-gray-300">
            {config.action.type}
            {!config.enabled && (
              <span className="ml-2 text-yellow-400">⏸ Disabled</span>
            )}
          </div>

          {lastExecution && (
            <div className={`
              text-xs mt-2 p-1 rounded
              ${lastExecution.result === 'success' ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}
            `}>
              Last: {lastExecution.result}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3"
      />
    </div>
  );
});

HookNode.displayName = 'HookNode';
```

**Acceptance Criteria**:
- [ ] All 6 hook types render with distinct colors and icons
- [ ] Conditional hooks show condition expression
- [ ] Disabled hooks clearly marked with pause icon
- [ ] Last execution status displayed with success/failure styling
- [ ] Horizontal layout (left handle → right handle) for clarity
- [ ] Compact design doesn't overwhelm canvas
- [ ] Type-specific tooltips on hover

---

### TASK-026: MCP Configuration Backend Service

**Agent**: backend-engineer
**Priority**: P1
**Estimated Time**: 5 hours
**Dependencies**: TASK-002 (Secret Manager), IC-013

**Description**: Implement MCP server connection testing and tool discovery.

**Implementation Skeleton**:
```typescript
// apps/backend/src/services/MCPService.ts

import { spawn, ChildProcess } from 'child_process';
import { MCPServer, MCPTool, MCPConnectionTestResult } from '@cloutagent/types';
import { SecretManager } from './SecretManager';

export class MCPService {
  private activeConnections = new Map<string, ChildProcess>();

  constructor(private secretManager: SecretManager) {}

  async testConnection(server: MCPServer): Promise<MCPConnectionTestResult> {
    try {
      // Resolve environment variables from secrets
      const env = await this.resolveEnv(server.env);

      // Spawn MCP server process
      const process = spawn(server.command, server.args || [], {
        env: { ...process.env, ...env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // MCP protocol: send initialization request
      const tools = await this.discoverTools(process);

      // Clean up
      process.kill();

      return {
        serverId: server.id,
        connected: true,
        availableTools: tools.map(t => t.toolName),
      };
    } catch (error) {
      return {
        serverId: server.id,
        connected: false,
        error: error.message,
      };
    }
  }

  async getTools(serverId: string): Promise<MCPTool[]> {
    const process = this.activeConnections.get(serverId);
    if (!process) {
      throw new Error('Server not connected');
    }

    return this.discoverTools(process);
  }

  async enableTools(serverId: string, toolNames: string[]): Promise<boolean> {
    // Store enabled tools in project config
    // This will be used when creating Claude Agent with MCP tools
    return true;
  }

  private async discoverTools(process: ChildProcess): Promise<MCPTool[]> {
    // Implement MCP protocol tool discovery
    // Send: { jsonrpc: '2.0', method: 'tools/list', id: 1 }
    // Receive: { jsonrpc: '2.0', result: { tools: [...] }, id: 1 }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Discovery timeout')), 5000);

      process.stdout?.on('data', (data) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.result?.tools) {
            clearTimeout(timeout);
            resolve(response.result.tools);
          }
        } catch (error) {
          // Ignore parsing errors, wait for valid response
        }
      });

      // Send discovery request
      process.stdin?.write(JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      }) + '\n');
    });
  }

  private async resolveEnv(env?: Record<string, string>): Promise<Record<string, string>> {
    if (!env) return {};

    const resolved: Record<string, string> = {};

    for (const [key, value] of Object.entries(env)) {
      if (value.startsWith('secret:')) {
        // Resolve from secret manager
        const secretId = value.replace('secret:', '');
        resolved[key] = await this.secretManager.getSecret('project-id', secretId);
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }
}
```

**Acceptance Criteria**:
- [ ] MCP server process spawning works with custom commands
- [ ] Tool discovery via MCP protocol (JSON-RPC 2.0)
- [ ] Connection testing with timeout (5 seconds)
- [ ] Environment variable resolution from secrets
- [ ] Error handling for invalid server configurations
- [ ] Process cleanup prevents resource leaks
- [ ] Support for multiple simultaneous MCP servers

**Test Cases**:
```typescript
describe('MCPService', () => {
  it('should discover tools from MCP server', async () => {
    const server: MCPServer = {
      id: 'mcp-001',
      name: 'Test Server',
      command: 'node',
      args: ['mcp-server.js'],
      enabled: true,
    };

    const result = await service.testConnection(server);

    expect(result.connected).toBe(true);
    expect(result.availableTools).toContain('test-tool');
  });

  it('should resolve secrets in environment', async () => {
    const server: MCPServer = {
      id: 'mcp-002',
      env: {
        API_KEY: 'secret:api-key-001',
      },
    };

    const env = await service['resolveEnv'](server.env);

    expect(env.API_KEY).toBe('decrypted-api-key-value');
  });
});
```

---

### TASK-027: MCP Node Component

**Agent**: frontend-engineer
**Priority**: P1
**Estimated Time**: 4 hours
**Dependencies**: TASK-015 (Custom Node Components), IC-013

**Description**: Create React component for MCP configuration nodes.

**Implementation Skeleton**:
```typescript
// apps/frontend/src/components/nodes/MCPNode.tsx

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MCPNode as MCPNodeType } from '@cloutagent/types';

export const MCPNode = memo(({ data, selected }: NodeProps<MCPNodeType['data']>) => {
  const { config, status, lastChecked, error } = data;

  const statusConfig = {
    connected: { color: 'bg-green-500', text: 'Connected', icon: '🟢' },
    disconnected: { color: 'bg-gray-500', text: 'Disconnected', icon: '⚪' },
    error: { color: 'bg-red-500', text: 'Error', icon: '🔴' },
  };

  const currentStatus = statusConfig[status];

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 min-w-[220px]
        ${selected ? 'border-blue-500' : 'border-gray-700'}
        bg-gradient-to-br from-indigo-900 to-indigo-800
        shadow-lg transition-all
      `}
    >
      <Handle type="target" position={Position.Top} />

      <div className="flex items-start gap-3">
        <div className="text-2xl">🔌</div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-white">{config.name}</span>
            <div className={`w-2 h-2 rounded-full ${currentStatus.color}`} />
          </div>

          <div className="text-xs text-indigo-200 mb-2">
            {config.server.command}
          </div>

          <div className="text-xs text-indigo-300">
            {config.selectedTools.length} tools enabled
          </div>

          {config.credentials && (
            <div className="text-xs text-yellow-300 mt-1">
              🔐 Credentials: {config.credentials.type}
            </div>
          )}

          {status === 'connected' && lastChecked && (
            <div className="text-xs text-green-300 mt-2">
              {currentStatus.icon} {currentStatus.text}
            </div>
          )}

          {error && (
            <div className="text-xs text-red-300 mt-2 p-2 bg-red-900/30 rounded">
              ❌ {error}
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

MCPNode.displayName = 'MCPNode';
```

**Acceptance Criteria**:
- [ ] Status indicator shows connected/disconnected/error states
- [ ] Tool count displays number of enabled tools
- [ ] Credential type shown when configured
- [ ] Error messages displayed clearly
- [ ] Visual distinction from other node types
- [ ] Real-time status updates when connection changes

---

### TASK-028: Workflow Validation Engine

**Agent**: backend-engineer
**Priority**: P0
**Estimated Time**: 6 hours
**Dependencies**: IC-014

**Description**: Implement comprehensive workflow validation with built-in rules.

**Implementation Skeleton**:
```typescript
// apps/backend/src/services/ValidationService.ts

import {
  WorkflowGraph,
  ValidationReport,
  ValidationResult,
  ValidationRule,
  ValidationRules,
} from '@cloutagent/types';

export class ValidationService {
  private rules: Map<string, ValidationRule> = new Map();

  constructor() {
    this.registerBuiltInRules();
  }

  async validate(workflow: WorkflowGraph): Promise<ValidationReport> {
    const errors: ValidationResult[] = [];
    const warnings: ValidationResult[] = [];
    const info: ValidationResult[] = [];

    for (const rule of this.rules.values()) {
      const result = rule.check(workflow);

      switch (result.severity) {
        case 'error':
          errors.push(result);
          break;
        case 'warning':
          warnings.push(result);
          break;
        case 'info':
          info.push(result);
          break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info,
      timestamp: new Date(),
    };
  }

  private registerBuiltInRules() {
    // Rule: No cycles in workflow
    this.rules.set(ValidationRules.NO_CYCLES, {
      id: ValidationRules.NO_CYCLES,
      name: 'No Cycles',
      severity: 'error',
      check: (workflow) => {
        const hasCycle = this.detectCycle(workflow);
        return {
          ruleId: ValidationRules.NO_CYCLES,
          passed: !hasCycle,
          severity: 'error',
          message: hasCycle
            ? 'Workflow contains cycles - infinite loops are not allowed'
            : 'No cycles detected',
          suggestedFix: hasCycle
            ? 'Remove connections that create circular dependencies'
            : undefined,
        };
      },
    });

    // Rule: Single agent node
    this.rules.set(ValidationRules.SINGLE_AGENT, {
      id: ValidationRules.SINGLE_AGENT,
      name: 'Single Agent',
      severity: 'error',
      check: (workflow) => {
        const agentNodes = workflow.nodes.filter(n => n.type === 'agent');
        return {
          ruleId: ValidationRules.SINGLE_AGENT,
          passed: agentNodes.length === 1,
          severity: 'error',
          message:
            agentNodes.length === 0
              ? 'Workflow must have at least one agent node'
              : agentNodes.length > 1
              ? 'Workflow can only have one main agent node'
              : 'Valid agent configuration',
          affectedNodes: agentNodes.length !== 1 ? agentNodes.map(n => n.id) : undefined,
        };
      },
    });

    // Rule: Hook connections
    this.rules.set(ValidationRules.HOOK_CONNECTIONS, {
      id: ValidationRules.HOOK_CONNECTIONS,
      name: 'Hook Connections',
      severity: 'warning',
      check: (workflow) => {
        const hookNodes = workflow.nodes.filter(n => n.type === 'hook');
        const disconnectedHooks = hookNodes.filter(
          hook => !this.isConnectedToAgent(hook.id, workflow)
        );

        return {
          ruleId: ValidationRules.HOOK_CONNECTIONS,
          passed: disconnectedHooks.length === 0,
          severity: 'warning',
          message:
            disconnectedHooks.length > 0
              ? `${disconnectedHooks.length} hook(s) not connected to agent`
              : 'All hooks properly connected',
          affectedNodes: disconnectedHooks.map(h => h.id),
          suggestedFix: 'Connect hooks to the main agent node',
        };
      },
    });

    // Rule: MCP valid configuration
    this.rules.set(ValidationRules.MCP_VALID_CONFIG, {
      id: ValidationRules.MCP_VALID_CONFIG,
      name: 'MCP Valid Config',
      severity: 'error',
      check: (workflow) => {
        const mcpNodes = workflow.nodes.filter(n => n.type === 'mcp');
        const invalidMCP = mcpNodes.filter(
          mcp => !mcp.data.config?.server?.command
        );

        return {
          ruleId: ValidationRules.MCP_VALID_CONFIG,
          passed: invalidMCP.length === 0,
          severity: 'error',
          message:
            invalidMCP.length > 0
              ? `${invalidMCP.length} MCP node(s) have invalid configuration`
              : 'All MCP nodes configured correctly',
          affectedNodes: invalidMCP.map(m => m.id),
        };
      },
    });

    // Rule: Subagents reachable
    this.rules.set(ValidationRules.SUBAGENT_REACHABLE, {
      id: ValidationRules.SUBAGENT_REACHABLE,
      name: 'Subagent Reachable',
      severity: 'warning',
      check: (workflow) => {
        const subagentNodes = workflow.nodes.filter(n => n.type === 'subagent');
        const unreachable = subagentNodes.filter(
          sub => !this.isReachableFromAgent(sub.id, workflow)
        );

        return {
          ruleId: ValidationRules.SUBAGENT_REACHABLE,
          passed: unreachable.length === 0,
          severity: 'warning',
          message:
            unreachable.length > 0
              ? `${unreachable.length} subagent(s) not reachable from main agent`
              : 'All subagents reachable',
          affectedNodes: unreachable.map(s => s.id),
          suggestedFix: 'Add connections from agent to subagents',
        };
      },
    });
  }

  private detectCycle(workflow: WorkflowGraph): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycleDFS = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = workflow.edges.filter(e => e.source === nodeId);

      for (const edge of outgoingEdges) {
        if (!visited.has(edge.target)) {
          if (hasCycleDFS(edge.target)) return true;
        } else if (recursionStack.has(edge.target)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of workflow.nodes) {
      if (!visited.has(node.id)) {
        if (hasCycleDFS(node.id)) return true;
      }
    }

    return false;
  }

  private isConnectedToAgent(nodeId: string, workflow: WorkflowGraph): boolean {
    const agentNode = workflow.nodes.find(n => n.type === 'agent');
    if (!agentNode) return false;

    return workflow.edges.some(
      e => (e.source === agentNode.id && e.target === nodeId) ||
           (e.target === agentNode.id && e.source === nodeId)
    );
  }

  private isReachableFromAgent(nodeId: string, workflow: WorkflowGraph): boolean {
    const agentNode = workflow.nodes.find(n => n.type === 'agent');
    if (!agentNode) return false;

    const visited = new Set<string>();
    const queue = [agentNode.id];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === nodeId) return true;

      visited.add(current);

      const outgoing = workflow.edges
        .filter(e => e.source === current && !visited.has(e.target))
        .map(e => e.target);

      queue.push(...outgoing);
    }

    return false;
  }
}
```

**Acceptance Criteria**:
- [ ] All 5 built-in validation rules implemented
- [ ] Cycle detection using DFS algorithm
- [ ] Connection validation for hooks and subagents
- [ ] MCP configuration validation
- [ ] Suggested fixes provided for errors
- [ ] Severity levels properly categorized
- [ ] Validation report includes affected node IDs
- [ ] Performance: validates workflows with 100+ nodes in <1s

**Test Cases**:
```typescript
describe('ValidationService', () => {
  it('should detect cycles in workflow', async () => {
    const workflow: WorkflowGraph = {
      nodes: [
        { id: 'a', type: 'agent' },
        { id: 'b', type: 'subagent' },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'b', target: 'a' }, // Cycle!
      ],
    };

    const report = await service.validate(workflow);

    expect(report.valid).toBe(false);
    expect(report.errors[0].ruleId).toBe('no-cycles');
  });

  it('should validate single agent requirement', async () => {
    const workflow: WorkflowGraph = {
      nodes: [
        { id: 'a1', type: 'agent' },
        { id: 'a2', type: 'agent' }, // Two agents!
      ],
      edges: [],
    };

    const report = await service.validate(workflow);

    expect(report.valid).toBe(false);
    expect(report.errors[0].message).toContain('only have one');
  });
});
```

---

### TASK-029: Validation UI Integration

**Agent**: frontend-engineer
**Priority**: P1
**Estimated Time**: 3 hours
**Dependencies**: TASK-028 (Validation Engine), IC-014

**Description**: Integrate validation with canvas UI, showing errors/warnings visually.

**Implementation Skeleton**:
```typescript
// apps/frontend/src/components/ValidationPanel.tsx

import { useEffect, useState } from 'react';
import { ValidationReport } from '@cloutagent/types';
import { useCanvasStore } from '@/stores/canvas';

export function ValidationPanel() {
  const { nodes, edges } = useCanvasStore();
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Debounced validation on canvas changes
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/projects/${projectId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });

      const validationReport = await response.json();
      setReport(validationReport);
      setIsOpen(validationReport.errors.length > 0 || validationReport.warnings.length > 0);
    }, 500);

    return () => clearTimeout(timer);
  }, [nodes, edges]);

  if (!report) return null;

  const totalIssues = report.errors.length + report.warnings.length;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          px-4 py-2 rounded-lg shadow-lg font-semibold
          ${report.errors.length > 0 ? 'bg-red-600' : 'bg-yellow-600'}
          hover:opacity-90 transition-all
        `}
      >
        {report.errors.length > 0 ? '❌' : '⚠️'} {totalIssues} issue{totalIssues !== 1 ? 's' : ''}
      </button>

      {/* Expanded panel */}
      {isOpen && (
        <div className="mt-2 w-96 bg-gray-800 rounded-lg shadow-xl border border-gray-700 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-bold text-white">Validation Report</h3>
            <p className="text-sm text-gray-400">
              {report.errors.length} errors, {report.warnings.length} warnings
            </p>
          </div>

          <div className="p-4 space-y-3">
            {report.errors.map((error, i) => (
              <ValidationIssue key={i} result={error} severity="error" />
            ))}

            {report.warnings.map((warning, i) => (
              <ValidationIssue key={i} result={warning} severity="warning" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ValidationIssue({ result, severity }: { result: ValidationResult; severity: string }) {
  const colors = {
    error: 'bg-red-900/30 border-red-700 text-red-200',
    warning: 'bg-yellow-900/30 border-yellow-700 text-yellow-200',
  };

  return (
    <div className={`p-3 rounded border ${colors[severity]}`}>
      <div className="flex items-start gap-2">
        <div className="text-lg">{severity === 'error' ? '❌' : '⚠️'}</div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{result.message}</p>

          {result.suggestedFix && (
            <p className="text-xs mt-1 opacity-80">
              💡 {result.suggestedFix}
            </p>
          )}

          {result.affectedNodes && (
            <div className="text-xs mt-2 font-mono opacity-60">
              Nodes: {result.affectedNodes.join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Validation runs automatically on canvas changes (debounced 500ms)
- [ ] Floating badge shows error/warning count
- [ ] Expandable panel lists all issues
- [ ] Error/warning styling clearly distinguished
- [ ] Suggested fixes displayed when available
- [ ] Affected nodes clickable to highlight on canvas
- [ ] Panel auto-opens when errors detected
- [ ] Real-time updates as user fixes issues

---

### TASK-030: Node Palette Extension

**Agent**: frontend-engineer
**Priority**: P1
**Estimated Time**: 2 hours
**Dependencies**: TASK-016 (Node Palette), IC-011, IC-012, IC-013

**Description**: Extend node palette with subagent, hook, and MCP node types.

**Implementation Skeleton**:
```typescript
// apps/frontend/src/components/NodePalette.tsx (extend existing)

const advancedNodeTypes = [
  {
    category: 'Subagents',
    nodes: [
      {
        type: 'subagent',
        subType: 'frontend-engineer',
        label: 'Frontend Engineer',
        icon: '🎨',
        description: 'Specialized agent for frontend development',
      },
      {
        type: 'subagent',
        subType: 'backend-engineer',
        label: 'Backend Engineer',
        icon: '⚙️',
        description: 'Specialized agent for backend development',
      },
      {
        type: 'subagent',
        subType: 'database-engineer',
        label: 'Database Engineer',
        icon: '🗄️',
        description: 'Specialized agent for database design',
      },
      {
        type: 'subagent',
        subType: 'ml-engineer',
        label: 'ML Engineer',
        icon: '🤖',
        description: 'Specialized agent for machine learning',
      },
    ],
  },
  {
    category: 'Hooks',
    nodes: [
      {
        type: 'hook',
        subType: 'pre-execution',
        label: 'Pre-Execution',
        icon: '▶️',
        description: 'Runs before agent execution',
      },
      {
        type: 'hook',
        subType: 'post-execution',
        label: 'Post-Execution',
        icon: '✅',
        description: 'Runs after successful execution',
      },
      {
        type: 'hook',
        subType: 'on-error',
        label: 'Error Handler',
        icon: '❌',
        description: 'Runs when execution fails',
      },
    ],
  },
  {
    category: 'Integrations',
    nodes: [
      {
        type: 'mcp',
        label: 'MCP Server',
        icon: '🔌',
        description: 'Connect external tools via MCP',
      },
    ],
  },
];

// Add to existing palette component
```

**Acceptance Criteria**:
- [ ] Three new categories: Subagents, Hooks, Integrations
- [ ] All subagent types available (4+ types)
- [ ] All hook types available (3+ types)
- [ ] MCP node type available
- [ ] Drag-and-drop works for all new node types
- [ ] Icons and descriptions clear
- [ ] Category collapsible sections

---

### TASK-031: Property Panel Extensions

**Agent**: frontend-engineer
**Priority**: P1
**Estimated Time**: 5 hours
**Dependencies**: TASK-017 (Property Panel), IC-011, IC-012, IC-013

**Description**: Create property editors for subagent, hook, and MCP nodes.

**Implementation Skeleton**:
```typescript
// apps/frontend/src/components/properties/SubagentProperties.tsx

import { useState } from 'react';
import { SubagentConfig } from '@cloutagent/types';

export function SubagentProperties({ node, onChange }: NodePropertiesProps) {
  const [config, setConfig] = useState<SubagentConfig>(node.data.config);

  const handleUpdate = (updates: Partial<SubagentConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onChange({ ...node, data: { ...node.data, config: newConfig } });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          value={config.name}
          onChange={e => handleUpdate({ name: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <select
          value={config.type}
          onChange={e => handleUpdate({ type: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 rounded"
        >
          <option value="frontend-engineer">Frontend Engineer</option>
          <option value="backend-engineer">Backend Engineer</option>
          <option value="database-engineer">Database Engineer</option>
          <option value="ml-engineer">ML Engineer</option>
          <option value="general-purpose">General Purpose</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Prompt</label>
        <textarea
          value={config.prompt}
          onChange={e => handleUpdate({ prompt: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 bg-gray-700 rounded font-mono text-sm"
          placeholder="Enter the task for this subagent..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Max Tokens (optional)
        </label>
        <input
          type="number"
          value={config.maxTokens || ''}
          onChange={e => handleUpdate({ maxTokens: parseInt(e.target.value) })}
          className="w-full px-3 py-2 bg-gray-700 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Timeout (ms)
        </label>
        <input
          type="number"
          value={config.timeout || 120000}
          onChange={e => handleUpdate({ timeout: parseInt(e.target.value) })}
          className="w-full px-3 py-2 bg-gray-700 rounded"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={config.parallelExecutionAllowed}
          onChange={e => handleUpdate({ parallelExecutionAllowed: e.target.checked })}
          className="w-4 h-4"
        />
        <label className="text-sm">Allow parallel execution</label>
      </div>
    </div>
  );
}

// Similar components for HookProperties and MCPProperties
```

**Acceptance Criteria**:
- [ ] SubagentProperties supports all config fields
- [ ] HookProperties includes code editor with syntax highlighting
- [ ] MCPProperties supports server command configuration
- [ ] All property editors validate input
- [ ] Changes auto-save to canvas store
- [ ] Test button for hook code validation
- [ ] Connection test button for MCP servers

---

## Testing Strategy

### Unit Tests
- SubagentService execution logic
- HookExecutionService sandboxing
- MCPService tool discovery
- ValidationService rules engine

### Integration Tests
- Subagent parallel execution
- Hook chain execution
- MCP server connection
- End-to-end workflow validation

### E2E Tests
- Create workflow with subagents
- Configure hooks and test execution
- Add MCP server and enable tools
- Validation feedback on canvas

## Success Metrics

- [ ] Subagents execute in parallel (4+ concurrent)
- [ ] Hooks execute within 5 seconds timeout
- [ ] MCP servers connect within 5 seconds
- [ ] Validation completes for 100-node workflows in <1s
- [ ] Zero security vulnerabilities in hook execution
- [ ] All node types draggable and configurable
- [ ] Property panels functional for all node types

## Dependencies

### External Libraries
- `vm2`: Sandboxed JavaScript execution for hooks
- `reactflow`: Canvas rendering for new node types
- Existing Claude Agent SDK with subagent support

### Phase 1 Requirements
- File storage system (TASK-001)
- Secret manager (TASK-002)
- Claude SDK integration (TASK-005)

### Phase 2 Requirements
- ReactFlow canvas (TASK-014)
- Custom node components (TASK-015)
- Property panel container (TASK-017)

## Rollout Plan

1. **Week 5 Days 1-3**: Backend services (TASK-022, TASK-024, TASK-026, TASK-028)
2. **Week 5 Days 4-5**: Frontend components (TASK-023, TASK-025, TASK-027)
3. **Week 6 Days 1-2**: UI integration (TASK-029, TASK-030, TASK-031)
4. **Week 6 Days 3-5**: Testing, bug fixes, documentation

## Notes

- **Security**: Hook execution must be sandboxed (vm2) - no filesystem/network access
- **Performance**: Subagent parallel execution limited to 10 concurrent by default
- **UX**: Validation panel should not block user workflow
- **Extensibility**: MCP protocol supports future tool additions
