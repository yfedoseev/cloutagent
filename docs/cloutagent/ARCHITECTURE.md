# CloutAgent - Technical Architecture

**Version:** 1.0 (MVP)  
**Last Updated:** October 1, 2025

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         User's Browser                             │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    React SPA (Port 3000)                      │ │
│  │                                                               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │ │
│  │  │   Canvas    │  │  Execution  │  │  Dashboard  │         │ │
│  │  │   Editor    │  │   Monitor   │  │   Metrics   │         │ │
│  │  │ (ReactFlow) │  │   (SSE)     │  │  (Charts)   │         │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │ │
│  │                                                               │ │
│  │  State Management: Zustand                                   │ │
│  │  Styling: Tailwind CSS + shadcn/ui                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────┬───────────────────────────────────┘
                                 │
                    HTTP/HTTPS + Server-Sent Events (SSE)
                                 │
┌────────────────────────────────▼───────────────────────────────────┐
│                    Express.js Backend (Node.js 20+)                │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                     API Layer (TypeScript)                    │ │
│  │                                                               │ │
│  │  Routes:                                                      │ │
│  │  - POST /api/v1/projects/{id}/execute                       │ │
│  │  - GET  /api/v1/executions/{id}/stream                      │ │
│  │  - POST /api/v1/executions/{id}/cancel                      │ │
│  │  - GET  /api/v1/projects                                    │ │
│  │  - POST /api/v1/projects                                    │ │
│  │                                                               │ │
│  │  Middleware:                                                  │ │
│  │  - Authentication (API Key validation)                       │ │
│  │  - Rate Limiting (100 req/min per IP)                       │ │
│  │  - CORS Configuration                                        │ │
│  │  - Request Validation                                        │ │
│  │  - Error Handling                                            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │               Business Logic Layer                            │ │
│  │                                                               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │ │
│  │  │  Project    │  │  Execution  │  │   Secret    │         │ │
│  │  │  Manager    │  │   Queue     │  │  Manager    │         │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │ │
│  │                                                               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │ │
│  │  │    MCP      │  │   Backup    │  │  Metrics    │         │ │
│  │  │  Manager    │  │  Manager    │  │ Collector   │         │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │         Claude Agent SDK Integration Layer                    │ │
│  │         @anthropic-ai/claude-agent-sdk                       │ │
│  │                                                               │ │
│  │  - Agent execution orchestration                             │ │
│  │  - Subagent management (parallel execution)                  │ │
│  │  - Hook system (lifecycle callbacks)                         │ │
│  │  - Tool management (bash, file_create, etc.)               │ │
│  │  - MCP integration (custom tools)                           │ │
│  │  - Context management (compaction, memory)                   │ │
│  │  - Cost tracking and enforcement                             │ │
│  │  - OTEL integration (traces, logs)                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                 Storage Layer (File System)                   │ │
│  │                                                               │ │
│  │  - Project CRUD operations                                   │ │
│  │  - Version management                                        │ │
│  │  - Secret encryption/decryption (AES-256-GCM)               │ │
│  │  - Backup creation/restoration                               │ │
│  │  - Execution log storage                                     │ │
│  │  - Atomic writes with rollback                               │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────┬───────────────────────────────────┘
                                 │
┌────────────────────────────────▼───────────────────────────────────┐
│                      File System (Docker Volume)                   │
│                                                                    │
│  /projects/                                                        │
│    ├── project-id-1/                                              │
│    │   ├── agent.config.json                                     │
│    │   ├── subagents/                                            │
│    │   ├── hooks/                                                │
│    │   ├── mcps/                                                 │
│    │   ├── .secrets/secrets.enc                                 │
│    │   ├── .ui/flow-coordinates.json                            │
│    │   ├── executions/                                           │
│    │   ├── versions/                                             │
│    │   └── metadata.json                                         │
│    └── project-id-2/                                              │
│                                                                    │
│  /backups/                                                         │
│    ├── backup-2025-10-01.zip                                     │
│    ├── backup-2025-10-02.zip                                     │
│    └── ...                                                        │
└────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### Frontend Components

#### 1. Canvas Editor (ReactFlow)
```typescript
// Core canvas component
<ReactFlowProvider>
  <Canvas
    nodes={nodes}
    edges={edges}
    onNodesChange={handleNodesChange}
    onEdgesChange={handleEdgesChange}
  >
    <Background />
    <Controls />
    <MiniMap />
  </Canvas>
</ReactFlowProvider>

// Custom node types
- AgentNode: Main executor
- SubagentNode: Specialized tasks
- HookNode: Lifecycle callbacks
- MCPNode: External integrations
```

**State Management:**
```typescript
// Zustand store
interface ProjectState {
  currentProject: Project | null;
  nodes: Node[];
  edges: Edge[];
  executionStatus: ExecutionStatus;
  costs: CostMetrics;
}

// Actions
const useProjectStore = create<ProjectState>((set) => ({
  // ... state
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  updateNode: (id, updates) => { /* ... */ },
  deleteNode: (id) => { /* ... */ },
}));
```

#### 2. Execution Monitor
```typescript
// SSE connection for real-time updates
const useExecutionStream = (executionId: string) => {
  const [events, setEvents] = useState<ExecutionEvent[]>([]);
  
  useEffect(() => {
    const eventSource = new EventSource(
      `/api/v1/executions/${executionId}/stream`
    );
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEvents((prev) => [...prev, data]);
    };
    
    return () => eventSource.close();
  }, [executionId]);
  
  return events;
};
```

#### 3. Metrics Dashboard
```typescript
// Real-time cost tracking
interface CostMetrics {
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  percentOfLimit: number;
}

// Chart components (recharts)
<LineChart data={costHistory}>
  <XAxis dataKey="timestamp" />
  <YAxis />
  <Line dataKey="cost" stroke="#ff6b6b" />
</LineChart>
```

---

### Backend Components

#### 1. API Routes (Express)
```typescript
// Project routes
router.post('/api/v1/projects', authenticateAPIKey, createProject);
router.get('/api/v1/projects/:id', authenticateAPIKey, getProject);
router.put('/api/v1/projects/:id', authenticateAPIKey, updateProject);

// Execution routes
router.post('/api/v1/projects/:id/execute', 
  authenticateAPIKey, 
  validateExecutionRequest,
  enforceRateLimit,
  executeAgent
);

router.get('/api/v1/executions/:id/stream', 
  authenticateAPIKey,
  streamExecution
);

router.post('/api/v1/executions/:id/cancel',
  authenticateAPIKey,
  cancelExecution
);
```

#### 2. Authentication Middleware
```typescript
async function authenticateAPIKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API key' });
  }
  
  const project = await findProjectByAPIKey(apiKey);
  
  if (!project) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  req.project = project;
  next();
}
```

#### 3. Execution Queue
```typescript
class ExecutionQueue {
  private queue: Map<string, QueueItem[]> = new Map();
  private running: Map<string, Set<string>> = new Map();
  private maxConcurrent: number = 3;
  
  async enqueue(projectId: string, execution: Execution) {
    const running = this.running.get(projectId) || new Set();
    
    if (running.size >= this.maxConcurrent) {
      // Add to queue
      const queue = this.queue.get(projectId) || [];
      queue.push({ execution, timestamp: Date.now() });
      this.queue.set(projectId, queue);
      
      return { status: 'queued', position: queue.length };
    }
    
    // Execute immediately
    running.add(execution.id);
    this.running.set(projectId, running);
    
    this.executeAgent(execution);
    
    return { status: 'running' };
  }
  
  private async executeAgent(execution: Execution) {
    try {
      await agentSDK.execute(execution);
    } finally {
      // Remove from running, check queue
      const running = this.running.get(execution.projectId);
      running?.delete(execution.id);
      
      await this.processQueue(execution.projectId);
    }
  }
  
  private async processQueue(projectId: string) {
    const queue = this.queue.get(projectId);
    if (!queue || queue.length === 0) return;
    
    const next = queue.shift();
    if (next) {
      this.enqueue(projectId, next.execution);
    }
  }
}
```

#### 4. Secret Manager
```typescript
import crypto from 'crypto';

class SecretManager {
  private algorithm = 'aes-256-gcm';
  private encryptionKey: Buffer;
  
  constructor(keyString: string) {
    this.encryptionKey = Buffer.from(keyString, 'hex');
  }
  
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm, 
      this.encryptionKey, 
      iv
    );
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      encrypted
    });
  }
  
  decrypt(ciphertext: string): string {
    const { iv, authTag, encrypted } = JSON.parse(ciphertext);
    
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

#### 5. Claude Agent SDK Integration
```typescript
import { ClaudeAgentSDK } from '@anthropic-ai/claude-agent-sdk';

class AgentExecutor {
  private sdk: ClaudeAgentSDK;
  
  async execute(config: AgentConfig, options: ExecutionOptions) {
    // Initialize SDK with config
    this.sdk = new ClaudeAgentSDK({
      apiKey: process.env.ANTHROPIC_API_KEY,
      systemPrompt: config.systemPrompt,
      model: config.model,
      maxTokens: options.maxTokens,
      tools: config.enabledTools,
    });
    
    // Set up cost tracking
    let totalCost = 0;
    const costLimit = options.maxCost || 1.0;
    
    this.sdk.on('tool_call', (tool) => {
      this.emitEvent('tool_call', { tool: tool.name, input: tool.input });
    });
    
    this.sdk.on('token_usage', (usage) => {
      totalCost += calculateCost(usage);
      this.emitEvent('cost_update', { totalCost, percentOfLimit: (totalCost / costLimit) * 100 });
      
      if (totalCost >= costLimit) {
        this.sdk.stop();
        throw new Error('COST_LIMIT_EXCEEDED');
      }
    });
    
    // Add subagents
    for (const subagent of config.subagents) {
      this.sdk.addSubagent({
        name: subagent.name,
        prompt: subagent.prompt,
        tools: subagent.tools,
        parallel: subagent.parallel,
        maxParallel: subagent.maxParallelInstances,
      });
    }
    
    // Add hooks
    for (const hook of config.hooks) {
      this.sdk.addHook(hook.type, async (context) => {
        // Execute hook logic
        await this.executeHook(hook, context);
      });
    }
    
    // Add MCPs
    for (const mcp of config.mcps) {
      const credentials = await this.secretManager.getSecrets(mcp.credentials);
      
      this.sdk.addMCP({
        type: mcp.type,
        connection: mcp.connection,
        credentials,
        enabledTools: mcp.enabledTools,
      });
    }
    
    // Execute agent
    const result = await this.sdk.execute(options.prompt, {
      timeout: options.timeout,
      variables: options.variables,
    });
    
    return result;
  }
  
  private emitEvent(type: string, data: any) {
    // Send SSE event to connected clients
    this.sseClients.forEach(client => {
      client.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
    });
  }
}
```

---

## Data Flow

### 1. Creating an Agent

```
User (Browser)
    │
    ├─► Drag AgentNode onto canvas
    │       │
    │       └─► Update Zustand store (nodes, edges)
    │
    ├─► Configure node properties
    │       │
    │       └─► Open property panel (modal/sidebar)
    │           └─► Fill in: prompt, model, tools, limits
    │
    ├─► Click "Save"
    │       │
    │       └─► POST /api/v1/projects/{id}
    │               │
    │               └─► Backend validates config
    │                   └─► Write to file system:
    │                       - agent.config.json
    │                       - .ui/flow-coordinates.json
    │                       - metadata.json (with API key)
    │
    └─► Success response
            └─► UI updates, shows API key
```

### 2. Executing an Agent

```
External App / UI
    │
    └─► POST /api/v1/projects/{id}/execute
            Headers: X-API-Key: <key>
            Body: { variables, limits }
            │
            ├─► Middleware: Authenticate API key
            │       ├─► Valid → Continue
            │       └─► Invalid → 401 Unauthorized
            │
            ├─► Middleware: Rate limiting
            │       ├─► Under limit → Continue
            │       └─► Over limit → 429 Too Many Requests
            │
            ├─► Business Logic: Check execution queue
            │       ├─► Queue full → Add to queue, return "queued"
            │       └─► Queue available → Execute immediately
            │
            ├─► Storage Layer: Load project config
            │       └─► Read from file system:
            │           - agent.config.json
            │           - subagents/
            │           - hooks/
            │           - mcps/
            │           - .secrets/ (decrypt)
            │
            ├─► Claude Agent SDK: Initialize agent
            │       ├─► Set up main agent
            │       ├─► Add subagents
            │       ├─► Add hooks
            │       ├─► Configure MCPs with credentials
            │       └─► Set cost/token/timeout limits
            │
            ├─► Execute agent (async)
            │       │
            │       ├─► Emit SSE events in real-time:
            │       │   - start
            │       │   - agent_start
            │       │   - tool_call
            │       │   - tool_result
            │       │   - thinking
            │       │   - cost_update
            │       │   - agent_complete
            │       │   - complete
            │       │
            │       ├─► Check limits continuously:
            │       │   ├─► Cost > limit → Stop, emit error
            │       │   ├─► Tokens > limit → Stop, emit error
            │       │   └─► Time > timeout → Stop, emit error
            │       │
            │       └─► Save execution state periodically:
            │           └─► /projects/{id}/executions/{exec_id}/
            │               - events.jsonl (append-only)
            │               - state.json (current state)
            │
            └─► Return final result or stream completion
```

### 3. Streaming Reconnection

```
Client loses connection
    │
    └─► Reconnect: GET /api/v1/executions/{id}/stream?from_event=42
            │
            ├─► Authenticate API key
            │
            ├─► Check execution status:
            │   ├─► Still running → Resume stream from event 42
            │   ├─► Completed → Send remaining events + complete
            │   └─► Failed → Send error event
            │
            └─► Stream events (SSE)
                    └─► Client receives events from position 42 onwards
```

---

## Security Architecture

### 1. Authentication Flow
```
External Request
    │
    └─► Extract X-API-Key from headers
            │
            ├─► Hash API key (bcrypt)
            │
            ├─► Look up project by hashed key
            │   ├─► Found → Attach project to request
            │   └─► Not found → 401 Unauthorized
            │
            └─► Continue to route handler
```

### 2. Secret Encryption Flow
```
User adds secret
    │
    └─► POST /api/v1/projects/{id}/secrets
            Body: { name: "API_KEY", value: "secret123" }
            │
            ├─► Load encryption key from env (ENCRYPTION_KEY)
            │
            ├─► Generate IV (random 16 bytes)
            │
            ├─► Encrypt value with AES-256-GCM
            │   ├─► Input: plaintext + encryption_key + IV
            │   └─► Output: ciphertext + auth_tag
            │
            ├─► Store in file system:
            │   └─► .secrets/secrets.enc
            │       └─► { name: { iv, authTag, encrypted } }
            │
            └─► Return success (value NOT returned)

Agent execution needs secret
    │
    └─► Read .secrets/secrets.enc
            │
            ├─► Decrypt using ENCRYPTION_KEY
            │
            ├─► Inject as environment variable
            │   └─► process.env[name] = decrypted_value
            │
            └─► Pass to Claude Agent SDK / MCP
```

### 3. Cost Limit Enforcement
```
Agent execution
    │
    └─► SDK emits 'token_usage' event
            │
            ├─► Calculate cost:
            │   ├─► promptTokens * $0.003 / 1M
            │   └─► completionTokens * $0.015 / 1M
            │
            ├─► Add to totalCost
            │
            ├─► Check against limit:
            │   ├─► totalCost >= maxCost * 0.8
            │   │   └─► Emit warning (80% alert)
            │   │
            │   └─► totalCost >= maxCost
            │       └─► sdk.stop() → Throw COST_LIMIT_EXCEEDED
            │
            └─► Continue execution (if under limit)
```

---

## File System Structure

```
/
├── projects/
│   └── {project-id}/                      # UUID
│       ├── metadata.json                  # Project info, API key hash, limits
│       ├── agent.config.json              # Main agent config
│       ├── subagents/
│       │   ├── {subagent-id}.json        # Subagent config
│       │   └── ...
│       ├── hooks/
│       │   ├── {hook-id}.json            # Hook config
│       │   └── ...
│       ├── mcps/
│       │   └── mcp-config.json           # All MCP configs
│       ├── prompts/
│       │   ├── main-prompt.txt           # Main agent prompt
│       │   └── subagent-prompts/
│       │       └── {subagent-id}.txt
│       ├── .secrets/
│       │   └── secrets.enc               # Encrypted secrets (AES-256-GCM)
│       ├── .ui/
│       │   ├── flow-coordinates.json     # Node positions, edges
│       │   └── ui-config.json            # Editor state, zoom, etc.
│       ├── executions/                    # Last 24-48 hours
│       │   ├── {execution-id}/
│       │   │   ├── events.jsonl          # Append-only event log
│       │   │   ├── state.json            # Final state, cost, duration
│       │   │   └── error.json            # If failed (stack trace, etc.)
│       │   └── ...
│       └── versions/
│           ├── v1/                        # Full snapshot
│           │   ├── agent.config.json
│           │   ├── subagents/
│           │   └── ...
│           ├── v2/
│           └── v3/
│
├── backups/
│   ├── backup-2025-10-01.zip             # Daily backup
│   ├── backup-2025-10-02.zip
│   └── ...                                # Last 7 days retained
│
└── temp/                                   # Temporary files during execution
    └── {execution-id}/
        └── workspace/                      # Agent's working directory
```

---

## Deployment Architecture (Docker)

```yaml
# docker-compose.yml
version: '3.8'

services:
  cloutagent:
    build: .
    ports:
      - "3000:3000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - PORT=3000
      - NODE_ENV=production
      - MAX_CONCURRENT_EXECUTIONS=3
      - BACKUP_ENABLED=true
    volumes:
      - ./projects:/projects
      - ./backups:/backups
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## Performance Considerations

### 1. Canvas Rendering (ReactFlow)
- Virtual rendering for 200+ nodes
- Memoize node components
- Debounce drag/zoom events
- Use `shouldComponentUpdate` strategically

### 2. SSE Connection Management
- Max 100 concurrent SSE connections per instance
- Automatic cleanup after 24 hours
- Reconnection with exponential backoff
- Event buffering (last 1000 events)

### 3. File System Operations
- Atomic writes (write to temp, then rename)
- Read caching (LRU cache, 100 projects)
- Lazy loading (load config only when needed)
- Background backup (don't block requests)

### 4. Execution Queue
- In-memory queue (Redis in v2.0)
- Max queue size: 50 per project
- Queue timeout: 5 minutes
- Auto-cleanup stale items

---

## Monitoring & Observability

### 1. Metrics (via OTEL)
- Execution count, duration, success rate
- Cost per execution
- Token usage
- Queue length
- API response times

### 2. Logs
- Structured JSON logs
- Levels: debug, info, warn, error
- Sent to OTEL collector
- Retention: 7 days

### 3. Traces (via OTEL)
- Full execution trace per agent run
- Tool call durations
- Subagent execution spans
- MCP call durations

---

## Error Handling

### 1. Client Errors (4xx)
- 400: Invalid request body
- 401: Missing/invalid API key
- 403: Forbidden (e.g., project not owned)
- 404: Project/execution not found
- 429: Rate limit exceeded

### 2. Server Errors (5xx)
- 500: Internal server error
- 502: Bad gateway (MCP connection failed)
- 503: Service unavailable (queue full)
- 504: Gateway timeout (execution timeout)

### 3. Execution Errors
- COST_LIMIT_EXCEEDED
- TOKEN_LIMIT_EXCEEDED
- TIMEOUT
- TOOL_ERROR
- MCP_CONNECTION_FAILED
- SUBAGENT_FAILED

---

## Testing Strategy

### 1. Unit Tests
- Individual components (React)
- Business logic (TypeScript)
- Secret encryption/decryption
- Cost calculation

### 2. Integration Tests
- API endpoints
- Execution queue
- File system operations
- Claude Agent SDK integration

### 3. E2E Tests (Playwright)
- Create project
- Build agent workflow
- Execute agent
- Monitor execution
- Export/import project

---

**Last Updated:** October 1, 2025  
**Version:** 1.0 (MVP Specification)
