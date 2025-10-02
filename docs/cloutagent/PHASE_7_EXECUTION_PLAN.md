# Phase 7: MCP Management - Execution Plan

**Timeline**: Week 13
**Focus**: MCP Server Registry, Custom Servers, Tool Management
**Goal**: Complete MCP integration with server discovery, custom server creation, and comprehensive tool management

## Overview

Phase 7 completes the MCP (Model Context Protocol) integration:
- **Server Registry**: Discover and install community MCP servers
- **Custom Servers**: Create and configure custom MCP servers
- **Tool Management**: Enable/disable specific tools, configure permissions
- **Testing & Debugging**: Test MCP connections and debug tool calls
- **Marketplace**: Browse and install pre-built MCP servers

## Interface Contracts

### IC-027: MCP Server Registry Interface

**Purpose**: Discover, install, and manage MCP servers

```typescript
// packages/types/src/mcp/registry.ts

export interface MCPServerDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  author: {
    name: string;
    url?: string;
  };
  repository?: string;
  command: string; // e.g., "npx", "uvx", "docker run"
  args?: string[]; // Command arguments
  env?: Record<string, EnvironmentVariable>; // Required env vars
  tools: MCPToolDefinition[];
  category: 'filesystem' | 'database' | 'api' | 'ai' | 'devtools' | 'custom';
  tags: string[];
  downloads: number;
  rating?: number;
  verified: boolean; // Official/trusted servers
  createdAt: Date;
  updatedAt: Date;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, any>; // JSON Schema
  dangerous: boolean; // Requires explicit permission
  examples?: {
    input: Record<string, any>;
    output: any;
  }[];
}

export interface EnvironmentVariable {
  key: string;
  required: boolean;
  description: string;
  type: 'string' | 'number' | 'secret';
  defaultValue?: string;
}

export interface MCPServerInstallation {
  serverId: string;
  projectId: string;
  config: MCPServer;
  installedAt: Date;
  enabledTools: string[];
  customEnv?: Record<string, string>;
}

export interface MCPServerFilter {
  category?: string;
  tags?: string[];
  search?: string;
  verified?: boolean;
}
```

**API Endpoints**:
```typescript
// GET /api/mcp/registry
// Query: ?category=filesystem&verified=true&search=git
// Response: { servers: MCPServerDefinition[] }

// GET /api/mcp/registry/{serverId}
// Response: MCPServerDefinition

// POST /api/projects/{projectId}/mcp/install
// Body: { serverId: string, config: MCPServer }
// Response: MCPServerInstallation

// GET /api/projects/{projectId}/mcp/installed
// Response: { installations: MCPServerInstallation[] }

// DELETE /api/projects/{projectId}/mcp/{installationId}
// Response: { success: boolean }
```

---

### IC-028: Custom MCP Server Interface

**Purpose**: Create and configure custom MCP servers

```typescript
// packages/types/src/mcp/custom.ts

export interface CustomMCPServer {
  id: string;
  name: string;
  description: string;
  type: 'stdio' | 'sse' | 'http';
  configuration: StdioConfig | SSEConfig | HTTPConfig;
  tools: CustomToolDefinition[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StdioConfig {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
}

export interface SSEConfig {
  url: string;
  headers?: Record<string, string>;
}

export interface HTTPConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  auth?: {
    type: 'bearer' | 'basic' | 'api-key';
    credentials: string; // Secret reference
  };
}

export interface CustomToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  handler: {
    type: 'command' | 'http' | 'javascript';
    implementation: string;
  };
}

export interface MCPServerTemplate {
  id: string;
  name: string;
  description: string;
  template: CustomMCPServer;
  placeholders: {
    [key: string]: {
      description: string;
      type: string;
      required: boolean;
    };
  };
}
```

**API Endpoints**:
```typescript
// POST /api/projects/{projectId}/mcp/custom
// Body: CustomMCPServer
// Response: CustomMCPServer

// GET /api/projects/{projectId}/mcp/custom/{serverId}
// Response: CustomMCPServer

// PUT /api/projects/{projectId}/mcp/custom/{serverId}
// Body: Partial<CustomMCPServer>
// Response: CustomMCPServer

// GET /api/mcp/templates
// Response: { templates: MCPServerTemplate[] }
```

---

### IC-029: MCP Tool Permissions Interface

**Purpose**: Manage tool-level permissions and safety controls

```typescript
// packages/types/src/mcp/permissions.ts

export interface MCPToolPermission {
  toolName: string;
  serverId: string;
  allowed: boolean;
  requiresApproval: boolean; // Manual approval for each invocation
  allowedNodes?: string[]; // Restrict to specific nodes
  rateLimit?: {
    maxCallsPerMinute: number;
    maxCallsPerHour: number;
  };
  auditLog: boolean;
}

export interface MCPToolInvocation {
  id: string;
  toolName: string;
  serverId: string;
  nodeId: string;
  executionId: string;
  input: Record<string, any>;
  output?: any;
  error?: string;
  status: 'pending' | 'approved' | 'denied' | 'executed' | 'failed';
  requestedAt: Date;
  executedAt?: Date;
  approvedBy?: string;
}

export interface MCPApprovalRequest {
  invocationId: string;
  toolName: string;
  serverId: string;
  input: Record<string, any>;
  reason: string;
  dangerous: boolean;
}

export interface MCPApprovalResponse {
  invocationId: string;
  approved: boolean;
  reason?: string;
}
```

**API Endpoints**:
```typescript
// GET /api/projects/{projectId}/mcp/permissions
// Response: { permissions: MCPToolPermission[] }

// PUT /api/projects/{projectId}/mcp/permissions/{toolName}
// Body: MCPToolPermission
// Response: MCPToolPermission

// GET /api/projects/{projectId}/mcp/approvals/pending
// Response: { requests: MCPApprovalRequest[] }

// POST /api/projects/{projectId}/mcp/approvals/{invocationId}
// Body: MCPApprovalResponse
// Response: { success: boolean }

// GET /api/projects/{projectId}/mcp/audit
// Query: ?serverId=xxx&toolName=yyy&startDate=...
// Response: { invocations: MCPToolInvocation[] }
```

---

### IC-030: MCP Testing & Debugging Interface

**Purpose**: Test MCP connections and debug tool invocations

```typescript
// packages/types/src/mcp/testing.ts

export interface MCPConnectionTest {
  serverId: string;
  config: MCPServer;
  timeout?: number;
}

export interface MCPConnectionTestResult {
  serverId: string;
  connected: boolean;
  responseTime: number;
  availableTools: string[];
  serverInfo?: {
    name: string;
    version: string;
    capabilities: string[];
  };
  error?: string;
  logs: string[];
}

export interface MCPToolTest {
  serverId: string;
  toolName: string;
  input: Record<string, any>;
  timeout?: number;
}

export interface MCPToolTestResult {
  toolName: string;
  success: boolean;
  output?: any;
  error?: string;
  executionTime: number;
  logs: string[];
  validationErrors?: string[];
}

export interface MCPDebugSession {
  id: string;
  serverId: string;
  active: boolean;
  logs: MCPDebugLog[];
  startedAt: Date;
  endedAt?: Date;
}

export interface MCPDebugLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: 'client' | 'server';
  message: string;
  data?: any;
}
```

**API Endpoints**:
```typescript
// POST /api/mcp/test-connection
// Body: MCPConnectionTest
// Response: MCPConnectionTestResult

// POST /api/mcp/test-tool
// Body: MCPToolTest
// Response: MCPToolTestResult

// POST /api/projects/{projectId}/mcp/{serverId}/debug/start
// Response: MCPDebugSession

// GET /api/projects/{projectId}/mcp/{serverId}/debug/logs
// Response: { logs: MCPDebugLog[] }

// POST /api/projects/{projectId}/mcp/{serverId}/debug/stop
// Response: { success: boolean }
```

---

## Tasks

### TASK-048: MCP Server Registry Backend

**Agent**: backend-engineer
**Priority**: P0
**Estimated Time**: 5 hours
**Dependencies**: TASK-026 (MCP Service), IC-027

**Description**: Implement MCP server registry with discovery and installation.

**Implementation Skeleton**:
```typescript
// apps/backend/src/services/MCPRegistryService.ts

import { promises as fs } from 'fs';
import {
  MCPServerDefinition,
  MCPServerInstallation,
  MCPServerFilter,
} from '@cloutagent/types';

export class MCPRegistryService {
  private readonly registryPath = './mcp-registry.json';

  async listServers(filter?: MCPServerFilter): Promise<MCPServerDefinition[]> {
    const allServers = await this.loadRegistry();

    let filtered = allServers;

    if (filter?.category) {
      filtered = filtered.filter(s => s.category === filter.category);
    }

    if (filter?.tags) {
      filtered = filtered.filter(s =>
        filter.tags!.some(tag => s.tags.includes(tag))
      );
    }

    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.name.toLowerCase().includes(searchLower) ||
          s.description.toLowerCase().includes(searchLower)
      );
    }

    if (filter?.verified !== undefined) {
      filtered = filtered.filter(s => s.verified === filter.verified);
    }

    // Sort by downloads and rating
    filtered.sort((a, b) => {
      if (a.verified !== b.verified) {
        return a.verified ? -1 : 1;
      }
      return b.downloads - a.downloads;
    });

    return filtered;
  }

  async getServer(serverId: string): Promise<MCPServerDefinition | null> {
    const servers = await this.loadRegistry();
    return servers.find(s => s.id === serverId) || null;
  }

  async installServer(
    projectId: string,
    serverId: string,
    config: Partial<MCPServer>
  ): Promise<MCPServerInstallation> {
    const serverDef = await this.getServer(serverId);

    if (!serverDef) {
      throw new Error('Server not found in registry');
    }

    // Validate required environment variables
    this.validateRequiredEnv(serverDef, config.env || {});

    const installation: MCPServerInstallation = {
      serverId,
      projectId,
      config: {
        id: this.generateId(),
        name: serverDef.name,
        command: serverDef.command,
        args: serverDef.args,
        env: config.env,
        enabled: true,
      },
      installedAt: new Date(),
      enabledTools: serverDef.tools.map(t => t.name),
      customEnv: config.env,
    };

    await this.saveInstallation(projectId, installation);

    // Increment download count
    serverDef.downloads++;
    await this.saveRegistry(await this.loadRegistry());

    return installation;
  }

  async getInstalled(projectId: string): Promise<MCPServerInstallation[]> {
    const filePath = `./projects/${projectId}/mcp-installations.json`;

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  async uninstall(projectId: string, installationId: string): Promise<boolean> {
    const installations = await this.getInstalled(projectId);
    const filtered = installations.filter(
      i => i.config.id !== installationId
    );

    if (filtered.length === installations.length) {
      return false; // Not found
    }

    await this.saveInstallations(projectId, filtered);
    return true;
  }

  private async loadRegistry(): Promise<MCPServerDefinition[]> {
    try {
      const content = await fs.readFile(this.registryPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      // Return default registry
      return this.getDefaultRegistry();
    }
  }

  private async saveRegistry(servers: MCPServerDefinition[]): Promise<void> {
    await fs.writeFile(
      this.registryPath,
      JSON.stringify(servers, null, 2),
      'utf-8'
    );
  }

  private async saveInstallation(
    projectId: string,
    installation: MCPServerInstallation
  ): Promise<void> {
    const installations = await this.getInstalled(projectId);
    installations.push(installation);
    await this.saveInstallations(projectId, installations);
  }

  private async saveInstallations(
    projectId: string,
    installations: MCPServerInstallation[]
  ): Promise<void> {
    const filePath = `./projects/${projectId}/mcp-installations.json`;
    await fs.writeFile(
      filePath,
      JSON.stringify(installations, null, 2),
      'utf-8'
    );
  }

  private validateRequiredEnv(
    serverDef: MCPServerDefinition,
    env: Record<string, string>
  ): void {
    if (!serverDef.env) return;

    const requiredVars = Object.values(serverDef.env).filter(v => v.required);

    for (const envVar of requiredVars) {
      if (!env[envVar.key]) {
        throw new Error(`Required environment variable missing: ${envVar.key}`);
      }
    }
  }

  private getDefaultRegistry(): MCPServerDefinition[] {
    return [
      {
        id: 'filesystem',
        name: 'Filesystem MCP',
        description: 'Read and write files on the local filesystem',
        version: '1.0.0',
        author: { name: 'Anthropic', url: 'https://anthropic.com' },
        repository: 'https://github.com/modelcontextprotocol/servers',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        tools: [
          {
            name: 'read_file',
            description: 'Read contents of a file',
            inputSchema: { type: 'object', properties: { path: { type: 'string' } } },
            dangerous: false,
          },
          {
            name: 'write_file',
            description: 'Write contents to a file',
            inputSchema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } } },
            dangerous: true,
          },
        ],
        category: 'filesystem',
        tags: ['files', 'io'],
        downloads: 1500,
        verified: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
      // ... more default servers
    ];
  }

  private generateId(): string {
    return `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

**Acceptance Criteria**:
- [ ] Registry lists all available MCP servers
- [ ] Filtering by category, tags, verified status
- [ ] Search functionality works
- [ ] Installation validates required env vars
- [ ] Download count tracked
- [ ] Uninstall removes configuration
- [ ] Default registry includes common servers

**Test Cases**:
```typescript
describe('MCPRegistryService', () => {
  it('should list servers with filtering', async () => {
    const servers = await service.listServers({
      category: 'filesystem',
      verified: true,
    });

    expect(servers.length).toBeGreaterThan(0);
    expect(servers.every(s => s.category === 'filesystem')).toBe(true);
  });

  it('should install server with required env', async () => {
    const installation = await service.installServer('proj-001', 'filesystem', {
      env: { FILESYSTEM_ROOT: '/tmp' },
    });

    expect(installation.serverId).toBe('filesystem');
    expect(installation.config.enabled).toBe(true);
  });
});
```

---

### TASK-049: MCP Tool Permissions Service

**Agent**: backend-engineer
**Priority**: P1
**Estimated Time**: 4 hours
**Dependencies**: TASK-048 (Registry Service), IC-029

**Description**: Implement tool-level permissions and approval workflow.

**Implementation Skeleton**:
```typescript
// apps/backend/src/services/MCPPermissionsService.ts

import {
  MCPToolPermission,
  MCPToolInvocation,
  MCPApprovalRequest,
} from '@cloutagent/types';

export class MCPPermissionsService {
  async getPermissions(projectId: string): Promise<MCPToolPermission[]> {
    // Load from project config
    return [];
  }

  async updatePermission(
    projectId: string,
    toolName: string,
    permission: MCPToolPermission
  ): Promise<MCPToolPermission> {
    const permissions = await this.getPermissions(projectId);
    const existing = permissions.find(p => p.toolName === toolName);

    if (existing) {
      Object.assign(existing, permission);
    } else {
      permissions.push(permission);
    }

    await this.savePermissions(projectId, permissions);

    return permission;
  }

  async checkPermission(
    projectId: string,
    toolName: string,
    nodeId: string
  ): Promise<{ allowed: boolean; requiresApproval: boolean }> {
    const permissions = await this.getPermissions(projectId);
    const permission = permissions.find(p => p.toolName === toolName);

    if (!permission) {
      // Default: require approval for all tools
      return { allowed: true, requiresApproval: true };
    }

    // Check node restrictions
    if (permission.allowedNodes && !permission.allowedNodes.includes(nodeId)) {
      return { allowed: false, requiresApproval: false };
    }

    // Check rate limits
    if (permission.rateLimit) {
      const withinLimit = await this.checkRateLimit(
        projectId,
        toolName,
        permission.rateLimit
      );

      if (!withinLimit) {
        return { allowed: false, requiresApproval: false };
      }
    }

    return {
      allowed: permission.allowed,
      requiresApproval: permission.requiresApproval,
    };
  }

  async requestApproval(
    projectId: string,
    invocation: MCPToolInvocation
  ): Promise<MCPApprovalRequest> {
    const request: MCPApprovalRequest = {
      invocationId: invocation.id,
      toolName: invocation.toolName,
      serverId: invocation.serverId,
      input: invocation.input,
      reason: `Tool "${invocation.toolName}" requires approval`,
      dangerous: await this.isToolDangerous(invocation.serverId, invocation.toolName),
    };

    // Save to pending approvals
    await this.savePendingApproval(projectId, request);

    return request;
  }

  async approveInvocation(
    projectId: string,
    invocationId: string,
    approved: boolean,
    reason?: string
  ): Promise<boolean> {
    const pending = await this.getPendingApprovals(projectId);
    const request = pending.find(r => r.invocationId === invocationId);

    if (!request) {
      throw new Error('Approval request not found');
    }

    // Update invocation status
    const invocation = await this.getInvocation(invocationId);
    invocation.status = approved ? 'approved' : 'denied';

    await this.saveInvocation(invocation);

    // Remove from pending
    await this.removePendingApproval(projectId, invocationId);

    return approved;
  }

  async getAuditLog(
    projectId: string,
    filters?: {
      serverId?: string;
      toolName?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<MCPToolInvocation[]> {
    // Load from audit log
    return [];
  }

  private async checkRateLimit(
    projectId: string,
    toolName: string,
    limits: MCPToolPermission['rateLimit']
  ): Promise<boolean> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentInvocations = await this.getAuditLog(projectId, {
      toolName,
      startDate: oneHourAgo,
    });

    const lastMinute = recentInvocations.filter(
      inv => inv.requestedAt > oneMinuteAgo
    );

    if (limits?.maxCallsPerMinute && lastMinute.length >= limits.maxCallsPerMinute) {
      return false;
    }

    if (limits?.maxCallsPerHour && recentInvocations.length >= limits.maxCallsPerHour) {
      return false;
    }

    return true;
  }

  private async isToolDangerous(
    serverId: string,
    toolName: string
  ): Promise<boolean> {
    // Check if tool is marked as dangerous in registry
    return false;
  }

  private async savePermissions(
    projectId: string,
    permissions: MCPToolPermission[]
  ): Promise<void> {
    // Save to file
  }

  private async savePendingApproval(
    projectId: string,
    request: MCPApprovalRequest
  ): Promise<void> {
    // Save to pending approvals
  }

  private async getPendingApprovals(
    projectId: string
  ): Promise<MCPApprovalRequest[]> {
    return [];
  }

  private async removePendingApproval(
    projectId: string,
    invocationId: string
  ): Promise<void> {
    // Remove from pending
  }

  private async getInvocation(
    invocationId: string
  ): Promise<MCPToolInvocation> {
    return {} as MCPToolInvocation;
  }

  private async saveInvocation(invocation: MCPToolInvocation): Promise<void> {
    // Save invocation
  }
}
```

**Acceptance Criteria**:
- [ ] Tool permissions configurable per tool
- [ ] Node-level restrictions enforced
- [ ] Rate limits prevent abuse
- [ ] Approval workflow for dangerous tools
- [ ] Audit log tracks all invocations
- [ ] Pending approvals retrievable

---

### TASK-050: MCP Registry UI

**Agent**: frontend-engineer
**Priority**: P0
**Estimated Time**: 5 hours
**Dependencies**: TASK-048 (Registry Service), IC-027

**Description**: Create MCP marketplace UI for browsing and installing servers.

**Implementation Skeleton**:
```typescript
// apps/frontend/src/components/MCPMarketplace.tsx

import { useState, useEffect } from 'react';
import { MCPServerDefinition } from '@cloutagent/types';

export function MCPMarketplace({ projectId }: { projectId: string }) {
  const [servers, setServers] = useState<MCPServerDefinition[]>([]);
  const [filter, setFilter] = useState({
    category: '',
    verified: false,
    search: '',
  });

  useEffect(() => {
    loadServers();
  }, [filter]);

  const loadServers = async () => {
    const params = new URLSearchParams();
    if (filter.category) params.set('category', filter.category);
    if (filter.verified) params.set('verified', 'true');
    if (filter.search) params.set('search', filter.search);

    const response = await fetch(`/api/mcp/registry?${params}`);
    const data = await response.json();
    setServers(data.servers);
  };

  const handleInstall = async (server: MCPServerDefinition) => {
    const env: Record<string, string> = {};

    // Prompt for required env vars
    if (server.env) {
      for (const envVar of Object.values(server.env)) {
        if (envVar.required) {
          const value = prompt(`Enter value for ${envVar.key}:\n${envVar.description}`);
          if (!value) return; // Cancel installation
          env[envVar.key] = value;
        }
      }
    }

    const response = await fetch(`/api/projects/${projectId}/mcp/install`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serverId: server.id,
        config: { env },
      }),
    });

    if (response.ok) {
      alert(`${server.name} installed successfully!`);
    }
  };

  return (
    <div className="p-4 bg-gray-900 text-white">
      <h2 className="text-2xl font-bold mb-4">🔌 MCP Marketplace</h2>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={filter.category}
          onChange={e => setFilter({ ...filter, category: e.target.value })}
          className="px-3 py-2 bg-gray-800 rounded"
        >
          <option value="">All Categories</option>
          <option value="filesystem">Filesystem</option>
          <option value="database">Database</option>
          <option value="api">API</option>
          <option value="ai">AI</option>
          <option value="devtools">Dev Tools</option>
        </select>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filter.verified}
            onChange={e => setFilter({ ...filter, verified: e.target.checked })}
          />
          <span>Verified only</span>
        </label>

        <input
          type="text"
          placeholder="Search servers..."
          value={filter.search}
          onChange={e => setFilter({ ...filter, search: e.target.value })}
          className="flex-1 px-3 py-2 bg-gray-800 rounded"
        />
      </div>

      {/* Server list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {servers.map(server => (
          <MCPServerCard
            key={server.id}
            server={server}
            onInstall={handleInstall}
          />
        ))}
      </div>
    </div>
  );
}

function MCPServerCard({
  server,
  onInstall,
}: {
  server: MCPServerDefinition;
  onInstall: (server: MCPServerDefinition) => void;
}) {
  return (
    <div className="p-4 bg-gray-800 rounded border border-gray-700 hover:border-gray-600">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-bold text-lg">{server.name}</h3>
          {server.verified && (
            <span className="text-xs text-blue-400">✓ Verified</span>
          )}
        </div>

        <span className="text-xs text-gray-400">v{server.version}</span>
      </div>

      <p className="text-sm text-gray-300 mb-3">{server.description}</p>

      <div className="flex flex-wrap gap-1 mb-3">
        {server.tags.map(tag => (
          <span
            key={tag}
            className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
        <span>📥 {server.downloads.toLocaleString()} installs</span>
        <span>🛠️ {server.tools.length} tools</span>
      </div>

      <button
        onClick={() => onInstall(server)}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
      >
        Install
      </button>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Server list with filtering
- [ ] Category and verified filters
- [ ] Search functionality
- [ ] Install prompts for required env vars
- [ ] Server cards show key info
- [ ] Verified badge displayed
- [ ] Download count visible

---

### TASK-051: MCP Testing UI

**Agent**: frontend-engineer
**Priority**: P1
**Estimated Time**: 4 hours
**Dependencies**: TASK-026 (MCP Service), IC-030

**Description**: Create MCP connection testing and debugging UI.

**Implementation Skeleton**:
```typescript
// apps/frontend/src/components/MCPTestingPanel.tsx

import { useState } from 'react';
import {
  MCPConnectionTestResult,
  MCPToolTestResult,
} from '@cloutagent/types';

export function MCPTestingPanel({ projectId }: { projectId: string }) {
  const [serverId, setServerId] = useState('');
  const [connectionResult, setConnectionResult] =
    useState<MCPConnectionTestResult | null>(null);
  const [toolTest, setToolTest] = useState({
    toolName: '',
    input: '{}',
  });
  const [toolResult, setToolResult] = useState<MCPToolTestResult | null>(null);

  const handleTestConnection = async () => {
    const response = await fetch('/api/mcp/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serverId,
        config: {}, // Get from project
        timeout: 5000,
      }),
    });

    const result = await response.json();
    setConnectionResult(result);
  };

  const handleTestTool = async () => {
    const response = await fetch('/api/mcp/test-tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serverId,
        toolName: toolTest.toolName,
        input: JSON.parse(toolTest.input),
        timeout: 10000,
      }),
    });

    const result = await response.json();
    setToolResult(result);
  };

  return (
    <div className="p-4 bg-gray-900 text-white">
      <h2 className="text-xl font-bold mb-4">🧪 MCP Testing & Debugging</h2>

      {/* Connection Test */}
      <div className="mb-6 p-4 bg-gray-800 rounded">
        <h3 className="font-semibold mb-3">Connection Test</h3>

        <div className="mb-3">
          <label className="block text-sm mb-1">Server ID</label>
          <input
            type="text"
            value={serverId}
            onChange={e => setServerId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 rounded"
            placeholder="filesystem"
          />
        </div>

        <button
          onClick={handleTestConnection}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
        >
          Test Connection
        </button>

        {connectionResult && (
          <div
            className={`mt-4 p-3 rounded ${
              connectionResult.connected
                ? 'bg-green-900/30 border border-green-700'
                : 'bg-red-900/30 border border-red-700'
            }`}
          >
            <div className="font-semibold mb-2">
              {connectionResult.connected ? '✅ Connected' : '❌ Connection Failed'}
            </div>

            {connectionResult.connected && (
              <>
                <div className="text-sm text-gray-300 mb-2">
                  Response time: {connectionResult.responseTime}ms
                </div>

                <div className="text-sm">
                  <div className="font-semibold mb-1">Available Tools:</div>
                  <ul className="list-disc list-inside">
                    {connectionResult.availableTools.map(tool => (
                      <li key={tool}>{tool}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {connectionResult.error && (
              <div className="text-sm text-red-300">{connectionResult.error}</div>
            )}
          </div>
        )}
      </div>

      {/* Tool Test */}
      <div className="p-4 bg-gray-800 rounded">
        <h3 className="font-semibold mb-3">Tool Test</h3>

        <div className="mb-3">
          <label className="block text-sm mb-1">Tool Name</label>
          <input
            type="text"
            value={toolTest.toolName}
            onChange={e => setToolTest({ ...toolTest, toolName: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 rounded"
            placeholder="read_file"
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm mb-1">Input (JSON)</label>
          <textarea
            value={toolTest.input}
            onChange={e => setToolTest({ ...toolTest, input: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 bg-gray-700 rounded font-mono text-sm"
            placeholder='{"path": "/tmp/test.txt"}'
          />
        </div>

        <button
          onClick={handleTestTool}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
        >
          Test Tool
        </button>

        {toolResult && (
          <div
            className={`mt-4 p-3 rounded ${
              toolResult.success
                ? 'bg-green-900/30 border border-green-700'
                : 'bg-red-900/30 border border-red-700'
            }`}
          >
            <div className="font-semibold mb-2">
              {toolResult.success ? '✅ Success' : '❌ Failed'}
            </div>

            {toolResult.output && (
              <div className="mb-2">
                <div className="text-sm font-semibold mb-1">Output:</div>
                <pre className="text-sm bg-gray-900 p-2 rounded overflow-x-auto">
                  {JSON.stringify(toolResult.output, null, 2)}
                </pre>
              </div>
            )}

            {toolResult.error && (
              <div className="text-sm text-red-300">{toolResult.error}</div>
            )}

            <div className="text-xs text-gray-400 mt-2">
              Execution time: {toolResult.executionTime}ms
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Connection test shows available tools
- [ ] Tool test with JSON input
- [ ] Results displayed with success/error
- [ ] Execution time tracked
- [ ] Error messages clear
- [ ] Tool output formatted JSON

---

## Testing Strategy

### Unit Tests
- Registry filtering and search
- Permission checking logic
- Rate limit enforcement

### Integration Tests
- MCP server installation flow
- Tool invocation approval workflow
- Connection testing

### E2E Tests
- Browse marketplace, install server
- Test MCP connection
- Configure tool permissions

## Success Metrics

- [ ] 10+ MCP servers in default registry
- [ ] Installation success rate >95%
- [ ] Connection tests complete in <5s
- [ ] Tool permissions prevent unauthorized access
- [ ] Audit log captures all invocations

## Dependencies

### External Libraries
- None (uses existing MCP protocol)

### Phase Dependencies
- Phase 2: Secret manager (for MCP credentials)
- Phase 3: MCP node components

## Rollout Plan

1. **Week 13 Days 1-2**: Backend registry and permissions (TASK-048, TASK-049)
2. **Week 13 Days 3-5**: Frontend marketplace and testing UI (TASK-050, TASK-051)

## Notes

- **Security**: Dangerous tools require explicit approval
- **Performance**: Registry cached locally
- **UX**: Clear warnings for required permissions
- **Extensibility**: Custom MCP servers supported
