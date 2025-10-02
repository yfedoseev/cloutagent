# Product Requirements Document: CloutAgent

## Project Overview

**Project Name:** CloutAgent  
**Tagline:** Agents with Impact  
**Target Users:** Developers who want to quickly configure and deploy agentic workflows powered by Anthropic's models  
**Development Approach:** Built with Claude Agent SDK (formerly Claude Code SDK)  
**License:** Open Source

### Vision Statement
CloutAgent is an intuitive, visual interface for building powerful agentic workflows using Claude Agent SDK. It allows developers to quickly configure agents, subagents, hooks, and MCPs, then expose them as production-ready APIs with real-time execution monitoring. Built on the same infrastructure that powers Claude Code, CloutAgent makes enterprise-grade AI automation accessible to every developer.

### What's in MVP vs Future

**MVP (v1.0) Includes:**
✅ Visual workflow builder (drag-and-drop nodes)
✅ API key authentication per project
✅ Cost limits and timeout enforcement
✅ Encrypted secret management
✅ Test mode (validate without execution)
✅ Execution queue (max 3 concurrent)
✅ Real-time streaming with reconnection
✅ Variable and secret support
✅ MCP integration with credentials
✅ Automatic daily backups
✅ Basic metrics dashboard (24h stats)
✅ Version control (v1, v2, v3...)
✅ Export/import projects

**NOT in MVP (Future versions):**
❌ Multi-user authentication
❌ Agent marketplace/templates
❌ Step-by-step debugger
❌ Scheduled executions (cron)
❌ A/B testing
❌ Advanced analytics
❌ Integration hub (Slack, GitHub, etc.)
❌ Resume from checkpoint (mid-execution)

See "Features NOT in MVP" section below for comprehensive future roadmap.

---

## Core Concepts

### About Claude Agent SDK
CloutAgent is built on top of the **Claude Agent SDK** - the same infrastructure that powers Claude Code. Released by Anthropic in September 2025 alongside Claude Sonnet 4.5, the SDK provides developers with powerful primitives for building autonomous agents:

- **Agent Loop**: gather context → take action → verify work → repeat
- **Subagents**: Parallel execution and isolated context management
- **Hooks**: Lifecycle callbacks for custom logic (pre/post execution, tool calls, errors)
- **MCP Integration**: Connect to external tools and services via Model Context Protocol
- **Computer Use**: Full file system access, bash execution, code editing
- **OTEL Support**: Built-in observability with OpenTelemetry

Learn more: [Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)

### Architecture Overview
```
┌─────────────────────────────────────────────────┐
│                  SPA Frontend                    │
│         (TypeScript + React/Vue/Svelte)         │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Visual Flow  │  │  Live Exec   │            │
│  │   Builder    │  │  Monitoring  │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
                      │ HTTP/SSE
┌─────────────────────────────────────────────────┐
│              TypeScript Backend                  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │    Claude Agent SDK Integration           │  │
│  │  (Agent → Subagents → Hooks → Tools)      │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │        Execution API Layer                │  │
│  │  (HTTP Streaming for external apps)       │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────────┐
│           File System Storage                    │
│                                                  │
│  /projects/                                      │
│    ├── project-name/                            │
│    │   ├── agent.config.json                   │
│    │   ├── subagents/                          │
│    │   ├── hooks/                              │
│    │   ├── mcps/                               │
│    │   └── .ui/                                │
│    │       └── flow-coordinates.json           │
│    └── another-project/                        │
└─────────────────────────────────────────────────┘
```

---

## Security & Cost Management

### MVP Security Features

#### API Authentication
- **API Keys per Project**: Each project generates a unique API key for execution endpoint
- **Key Generation**: UUID-based keys stored in project metadata
- **Header-based Auth**: `X-API-Key` header required for all execution requests
- **Key Rotation**: Manual key regeneration via UI

#### Cost Controls
- **Per-Execution Limits**:
  - Max tokens (configurable per project, default: 100k)
  - Max cost (configurable per project, default: $1.00)
  - Execution timeout (configurable, default: 1 hour, max: 4 hours)
- **Budget Enforcement**: Agent stops when limit reached
- **Cost Alerts**: Visual warning at 80% of budget

#### Secret Management
- **Encrypted Storage**: Secrets encrypted at rest (AES-256)
- **Secret Types**:
  - MCP credentials (API keys, tokens)
  - Environment variables (separate from runtime variables)
- **Access Control**: Secrets never exposed in UI/logs, only used during execution

### Security Features NOT in MVP (Future)
- Multi-user authentication (OAuth, SSO)
- Role-based access control (RBAC)
- Project sharing permissions
- Audit logging of API access
- IP whitelisting
- Rate limiting per API key
- Webhook signature validation
- GDPR compliance tools

---

## Functional Requirements

### 1. Project Management

#### 1.1 Project Structure
- Each project stored as a folder with Claude Agent SDK structure
- Additional `.ui/` folder for visual editor metadata:
  - `flow-coordinates.json` - Node positions, connections
  - `ui-config.json` - Editor preferences, zoom level, etc.

#### 1.2 Project Operations
- **Create Project**: Initialize new Claude Agent SDK project with UI metadata
- **Open Project**: Load existing project (including legacy Claude Code projects)
- **Export Project**: 
  - Full export (code + UI coordinates)
  - Code-only export (pure Claude Agent SDK format)
  - Formats: ZIP, tar.gz
- **Import Project**:
  - Support Claude Agent SDK projects (auto-generate UI layout)
  - Support exported projects with UI data
- **Version Control**:
  - Built-in versioning: v1, v2, v3... (stored as folders)
  - Each version is immutable snapshot
  - Compare versions (diff view)
  - Rollback to previous version

#### 1.3 Variable & Secret Management
- **Variables** (plain text, visible in UI):
  - Runtime variables: passed via API at execution time (`{{variable_name}}`)
  - Environment variables: stored in project, used by all executions
  - Built-in variables: `{{timestamp}}`, `{{execution_id}}`, `{{project_name}}`
- **Secrets** (encrypted, never visible after creation):
  - MCP credentials (API keys, database passwords)
  - Stored encrypted (AES-256) in `.secrets/` folder
  - Referenced in prompts/configs as `{{secret:NAME}}`
  - UI shows only secret name, not value
  - Import/export: secrets NOT included in exports (security)

#### 1.4 Multi-Tenancy
- Project isolation by user/organization
- No authentication in MVP (single-user mode in Docker)
- Structure ready for future multi-user support

---

### 2. Visual Flow Builder

#### 2.1 Canvas Interface
- **Design Style**: Clean, minimal (Apple/Anthropic aesthetic)
- **Theme**: Dark mode + Light mode toggle
- **Color Palette**: 
  - Primary: Anthropic orange/coral accent
  - Secondary: Neutral grays
  - Success: Green, Error: Red, Info: Blue
- **Layout**:
  - Infinite canvas with pan/zoom
  - Mini-map in corner
  - Grid snapping (toggleable)

#### 2.2 Node Types

**Agent Node** (Main Executor)
- Visual: Rounded rectangle, prominent size
- Properties:
  - Name
  - System Prompt (multi-line text editor)
  - Model Selection (dropdown: Claude 4 variants)
  - Temperature (slider 0-1)
  - Max Tokens (input field)
  - Available Tools (checklist):
    - bash
    - str_replace
    - view
    - file_create
    - (other Claude Agent SDK tools)
  - Task Tool (enable/disable for subagent support)

**Subagent Node**
- Visual: Smaller rounded rectangle, connected to Agent
- Properties:
  - Name
  - Type (determines when/how it's invoked)
  - Prompt/Instructions
  - Available Tools (subset of Agent tools)
  - Parallel Execution (checkbox)
  - Max Parallel Instances (number input if parallel enabled)

**Hook Node**
- Visual: Diamond shape, connects to Agent
- Types (based on Claude Agent SDK hooks):
  - Pre-execution hooks
  - Post-execution hooks
  - Tool execution hooks
  - Error hooks
  - Custom hooks
- Properties:
  - Hook Type (dropdown)
  - Trigger Condition
  - Action/Script

**MCP Configuration Node**
- Visual: Hexagon shape
- Properties:
  - MCP Name
  - Connection Type:
    - URL (HTTP endpoint)
    - npx (Node package)
    - uvx (Python package)
  - Connection String/Command
  - Enabled Tools (from MCP)
  - Credentials (future - placeholder for now)

#### 2.3 Connections
- Visual lines connecting nodes
- Automatic routing (avoid overlaps)
- Connection types:
  - Agent → Subagent (solid line)
  - Agent → Hook (dashed line)
  - Agent → MCP Config (dotted line)

#### 2.4 Editor Features
- **Drag & Drop**: Add nodes from sidebar palette
- **Multi-select**: Ctrl/Cmd + Click
- **Copy/Paste**: Duplicate node configurations
- **Delete**: Remove nodes and connections
- **Undo/Redo**: Full history stack
- **Search**: Find nodes by name
- **Align Tools**: Auto-align selected nodes
- **Keyboard Shortcuts**: Standard shortcuts (Cmd+S save, Cmd+Z undo, etc.)

---

### 3. Prompt Engineering Interface

#### 3.1 Prompt Editor
- **Text Editor**:
  - Syntax highlighting for variables
  - Line numbers
  - Auto-complete for variables
  - Resizable text area

#### 3.2 Variable Support
- **Variable Syntax**: `{{variableName}}`
- **Built-in Variables**:
  - `{{timestamp}}`
  - `{{project_name}}`
  - `{{execution_id}}`
- **Custom Variables**:
  - Defined at project level
  - Passed via Execution API
- **Variable Preview**: Show resolved values in editor

#### 3.3 Prompt Templates (Future)
- Pre-built prompt patterns
- Template library (v2 feature)

---

### 4. Execution & Monitoring

#### 4.1 Execution Modes

**Builder Mode** (UI)
- Test individual flows
- Step-through execution
- Full flow execution with real-time monitoring

**API Mode** (Headless)
- External apps invoke workflows via REST API
- HTTP Streaming for progress updates
- Stateless execution
- API key authentication required

**Error Recovery (MVP)**:
- Execution state saved every 10 steps
- Failed executions can be inspected (view logs, costs, error point)
- Manual retry from beginning
- Automatic cleanup of failed executions after 24 hours

**Streaming Reconnection (MVP)**:
- Each execution gets unique ID
- Client can reconnect to in-progress execution
- Resume streaming from last received event: `GET /api/v1/executions/{id}/stream?from_event=42`
- Execution history stored for 24 hours after completion

#### 4.2 Real-Time Execution View

**Progress Display** (Perplexity/Claude Deep Research style)
- **Streaming Updates**:
  - Current step/agent executing
  - Tool calls in progress
  - Thinking/reasoning (if exposed by SDK)
  - Intermediate results
  - Completion status

**Visual Indicators**:
- Active node highlighted on canvas
- Progress bar per agent/subagent
- Status badges (Running, Success, Error, Waiting)

**Execution Log Panel**:
- Timestamped events
- Collapsible sections per agent/tool
- Syntax highlighting for tool inputs/outputs
- Error stack traces (expandable)

#### 4.3 Cost Tracking
- **Per Execution**:
  - Prompt tokens
  - Completion tokens
  - Total cost (based on model pricing)
  - Caching stats (if applicable)
- **Aggregated Stats**:
  - Daily/Weekly/Monthly costs
  - Per-project breakdown
  - Cost trends chart

#### 4.4 OpenTelemetry Integration
- All execution history/logs stored via OTEL (as per Claude Agent SDK)
- UI displays OTEL data in friendly format
- Export traces for external analysis

#### 4.5 Execution Queue (MVP)
- **Concurrent Execution Limit**: Max 3 concurrent executions per project (configurable)
- **Queue System**: Additional requests wait in FIFO queue
- **Queue Visibility**: UI shows queued executions with position
- **Queue Management**: Cancel queued executions before they start
- **Priority**: Manual executions (from UI) have higher priority than API calls

#### 4.6 Test Mode (MVP)
- **Dry Run**: Validate flow without actual execution
- **Checks**:
  - All nodes properly connected
  - Required fields filled
  - Variables referenced exist
  - MCP servers accessible
  - Estimated cost calculation (based on prompt tokens)
- **No API Calls**: Test mode doesn't call Claude API or execute tools
- **Result**: Pass/fail report with issues highlighted on canvas

---

### 5. Execution API

#### 5.1 REST API Endpoints

**Execute Workflow**
```typescript
POST /api/v1/projects/{projectId}/execute
Headers:
  X-API-Key: <project-api-key>
  Content-Type: application/json

Request Body:
{
  "version": "v3",  // optional, defaults to latest
  "variables": {
    "customVar": "value"
  },
  "streaming": true,  // default: true
  "limits": {  // optional, overrides project defaults (if lower)
    "maxTokens": 50000,
    "maxCost": 0.50,
    "timeout": 1800  // seconds
  }
}

Response (HTTP Streaming):
// Server-Sent Events format
data: {"type": "start", "executionId": "exec-123", "timestamp": "..."}
data: {"type": "agent_start", "agent": "main", "step": 1}
data: {"type": "tool_call", "tool": "bash", "input": "ls -la"}
data: {"type": "tool_result", "tool": "bash", "output": "..."}
data: {"type": "thinking", "content": "I need to analyze..."}
data: {"type": "cost_update", "totalCost": 0.0085, "percentOfLimit": 17}
data: {"type": "agent_complete", "agent": "main", "result": "..."}
data: {"type": "complete", "finalResult": "...", "cost": {...}}

// Error responses:
data: {"type": "error", "code": "COST_LIMIT_EXCEEDED", "message": "...", "totalCost": 0.51}
data: {"type": "error", "code": "TIMEOUT", "message": "Execution exceeded 1 hour limit"}
data: {"type": "error", "code": "TOKEN_LIMIT_EXCEEDED", "message": "..."}

// Non-streaming response (if streaming=false):
{
  "executionId": "exec-123",
  "status": "completed",
  "result": "...",
  "cost": {
    "promptTokens": 1000,
    "completionTokens": 500,
    "totalCost": 0.015
  },
  "duration": 12500  // ms
}
```

**Reconnect to Execution**
```
GET /api/v1/executions/{executionId}/stream?from_event=42
Headers:
  X-API-Key: <project-api-key>

Response: SSE stream from event 42 onwards
```

**Get Execution Status**
```
GET /api/v1/executions/{executionId}
Headers:
  X-API-Key: <project-api-key>

Response:
{
  "executionId": "exec-123",
  "projectId": "proj-abc",
  "status": "running" | "completed" | "failed" | "cancelled",
  "progress": {
    "currentStep": 15,
    "totalSteps": 20  // estimate
  },
  "cost": {...},
  "startTime": "...",
  "endTime": "..."  // null if running
}
```

**Cancel Execution**
```
POST /api/v1/executions/{executionId}/cancel
Headers:
  X-API-Key: <project-api-key>

Response: {"status": "cancelled"}
```

**List Projects**
```
GET /api/v1/projects
Response: [
  {"id": "proj-1", "name": "Customer Support Agent", "versions": ["v1", "v2"]},
  ...
]
```

**Get Project Config**
```
GET /api/v1/projects/{projectId}/config?version=v2
Response: {full Claude Agent SDK config}
```

**Health Check**
```
GET /api/health
Response: {"status": "ok", "version": "1.0.0"}
```

#### 5.2 Streaming Protocol
- **Primary**: HTTP Streaming (Transfer-Encoding: chunked)
- **Format**: Server-Sent Events (SSE) compatible
- **Fallback**: WebSocket support (future enhancement)

#### 5.3 Error Handling
- Standard HTTP status codes
- Structured error responses:
```json
{
  "error": {
    "code": "EXECUTION_FAILED",
    "message": "Agent execution failed at step 3",
    "details": {
      "agent": "data-processor",
      "step": 3,
      "toolError": "..."
    }
  }
}
```

---

### 6. MCP Integration

#### 6.1 Default MCPs
- **Browser MCP** (Playwright): Pre-configured, ready to use
- All Claude Agent SDK built-in tools

#### 6.2 Custom MCP Configuration

**Add MCP via UI**:
- Form fields:
  - MCP Name (user-friendly)
  - Connection Type: URL / npx / uvx
  - Connection String:
    - URL: `http://localhost:3000` or `https://mcp.example.com`
    - npx: `@modelcontextprotocol/server-filesystem`
    - uvx: `mcp-package-name`
  - Arguments (optional): JSON object or CLI args
  - **Credentials (MVP)**: 
    - Add secrets for MCP (API keys, tokens)
    - Stored encrypted in project `.secrets/`
    - Injected at runtime as environment variables
- Test Connection button (validates MCP is reachable)
- Enable/Disable toggle

**MCP Tool Management**:
- Auto-discover tools exposed by MCP
- Checklist to enable/disable specific tools
- Tool descriptions (from MCP metadata)

**Credential Types Supported (MVP)**:
- Simple key-value pairs (API_KEY, TOKEN, etc.)
- Basic auth (username/password)
- Bearer tokens

**Credential Types NOT in MVP (Future)**:
- OAuth flows
- Certificate-based auth
- Credential rotation
- Vault integration (HashiCorp, AWS Secrets Manager)

#### 6.3 MCP Persistence
- Stored in `project/mcps/mcp-config.json`
- Format:
```json
{
  "mcps": [
    {
      "id": "browser-mcp",
      "name": "Browser Automation",
      "type": "npx",
      "command": "@modelcontextprotocol/server-playwright",
      "enabled": true,
      "tools": ["navigate", "click", "screenshot"]
    },
    {
      "id": "custom-api",
      "name": "Custom API",
      "type": "url",
      "endpoint": "http://localhost:8080",
      "enabled": true,
      "tools": ["query_db", "send_email"]
    }
  ]
}
```

---

### 7. File System Storage

#### 7.1 Project Directory Structure
```
/projects/
  └── {project-id}/
      ├── agent.config.json          # Main agent configuration
      ├── subagents/
      │   ├── data-processor.json
      │   └── report-generator.json
      ├── hooks/
      │   ├── pre-exec.json
      │   └── error-handler.json
      ├── mcps/
      │   └── mcp-config.json
      ├── prompts/
      │   ├── main-prompt.txt
      │   └── subagent-prompts/
      ├── .secrets/                   # Encrypted secrets (AES-256)
      │   └── secrets.enc             # Encrypted key-value store
      ├── .ui/
      │   ├── flow-coordinates.json  # Node positions, connections
      │   └── ui-config.json         # Editor preferences
      ├── versions/
      │   ├── v1/  # Full snapshot of above structure
      │   ├── v2/
      │   └── v3/
      ├── executions/                 # Last 24h of execution logs
      │   ├── exec-123/
      │   │   ├── events.jsonl       # Streaming events
      │   │   ├── state.json         # Final state, cost, duration
      │   │   └── error.json         # If failed
      │   └── exec-124/
      └── metadata.json              # Project name, created date, API key, limits
```

#### 7.2 Configuration File Formats
- JSON for structured configs
- Plain text for prompts (easier version control)
- YAML alternative for UI coordinates (optional, user preference)

#### 7.3 Automatic Backups (MVP)
- **Frequency**: Daily at 2 AM local time
- **Location**: `/backups/backup-{YYYY-MM-DD}.zip`
- **Retention**: Last 7 days (older backups auto-deleted)
- **Contents**: All projects (excluding executions/ folders)
- **Manual Backup**: Button in UI to create on-demand backup
- **Restore**: Import backup ZIP to restore all projects

---

## Monitoring & Observability (MVP)

### Basic Metrics Dashboard
**Per-Project Stats (Last 24 Hours)**:
- Total executions
- Success rate (%)
- Average execution time
- Total cost
- Most used tools

**Recent Executions List**:
- Last 20 executions with status, duration, cost
- Click to view full execution log
- Filter by status (success/failed/running)

**Cost Tracking**:
- Daily cost chart (last 7 days)
- Cost breakdown by project
- Cost per execution histogram

**System Health**:
- Total projects
- Active executions
- Queue length
- Disk space used

### Monitoring Features NOT in MVP (Future)
- Email/Slack/Webhook alerts on failures
- Custom dashboards
- Execution comparison (A/B testing)
- Performance regression detection
- Anomaly detection
- Integration with external monitoring (Datadog, Grafana)
- SLA tracking

---

## Features NOT in MVP (Documented for Future)

## Features NOT in MVP (Documented for Future)

These features are intentionally excluded from MVP to focus on core functionality. They are documented here for reference and future roadmap planning.

### Advanced Collaboration (v2.0)
- Multi-user authentication (OAuth, SSO, SAML)
- Role-based access control (Owner, Editor, Viewer)
- Project sharing and permissions
- Real-time collaborative editing (Google Docs style)
- Comments on nodes and flows
- Change history with author attribution
- Conflict resolution for simultaneous edits
- Team workspaces

### Advanced Debugging & Testing (v2.0)
- Step-by-step debugger (pause, step over, step into)
- Breakpoints on nodes
- Variable inspector during execution
- Resume from checkpoint (mid-execution)
- Replay execution with modified params
- Edit prompt mid-execution
- Unit tests for individual nodes
- Regression testing (compare v1 vs v2 outputs)
- Mock MCP responses for testing
- Load testing for API endpoints
- Performance profiling

### Agent Templates & Marketplace (v2.0)
- Pre-built agent templates (15+ common use cases)
- Prompt library (reusable components)
- Agent marketplace (share/discover community agents)
- One-click install from marketplace
- Template versioning
- Rating and reviews
- Template categories and search

### Advanced Execution Features (v2.0+)
- Scheduled executions (cron-like: daily, weekly, monthly)
- Webhook triggers (external events trigger agents)
- Human-in-the-loop (pause, ask user, resume)
- Conditional routing (if/else logic between nodes)
- Loop nodes (repeat until condition)
- Parallel execution of different agent types
- Output formatters (JSON schema validation)
- A/B testing (run two versions, compare results)
- Execution templates (reusable execution configs)

### Integration Hub (v2.0+)
- Pre-built connectors:
  - Communication: Slack, Discord, Email, SMS
  - Productivity: Google Workspace, Microsoft 365
  - Development: GitHub, GitLab, Jira
  - Data: PostgreSQL, MySQL, MongoDB, Redis
  - Cloud: AWS, GCP, Azure
- Integration templates
- Custom integration builder
- OAuth flow management

### Advanced Cost & Resource Management (v2.0+)
- Cost optimizer (suggest cheaper model/config)
- Budget alerts (email/Slack notifications)
- Cost allocation by team/department
- Reserved capacity planning
- Auto-scaling based on load
- Priority queuing (paid vs free tier)
- Spot instance support (lower cost, interruptible)

### SDK & Extensibility (v2.0+)
- SDK version management (per project)
- SDK version comparison matrix
- Migration guides between SDK versions
- Custom hooks API
- Custom tool builder (no-code)
- Plugin system for UI extensions
- CLI tool for local development
- CI/CD integration (GitHub Actions, Jenkins)

### Enterprise Features (v3.0)
- SSO/SAML authentication
- Audit logging (all actions, API calls)
- IP whitelisting
- VPC deployment
- Air-gapped deployment
- Compliance tools (GDPR, SOC 2, HIPAA)
- Data residency options
- SLA guarantees
- Dedicated support
- Custom contracts

### Storage & Database (v2.0+)
- Migration to PostgreSQL/MongoDB
- Full-text search across projects
- Advanced querying (find all agents using tool X)
- Data export API
- Point-in-time recovery
- Geo-redundancy
- Real-time replication

### UI/UX Enhancements (v1.5+)
- Subagent wizard (guided setup)
- Prompt templates and auto-complete
- Visual diff for versions
- Minimap navigation improvements
- Keyboard shortcuts customization
- Dark/light/custom themes
- Accessibility improvements (WCAG 2.1)
- Mobile responsive design
- Touch support for tablets

### Analytics & Insights (v2.0+)
- Agent performance trends
- Most used tools/MCPs
- Common failure patterns
- Execution duration predictions
- Cost forecasting
- Recommendation engine (improve your agent)
- Execution replay viewer (visual timeline)

---

## Non-Functional Requirements

### 1. Performance
- Canvas renders 100+ nodes smoothly (60 FPS)
- Execution API response time: <100ms to start streaming
- UI loads in <2 seconds on modern browsers

### 2. Scalability
- Support projects with 50+ agents/subagents
- Handle concurrent API executions (rate limiting in Claude Code SDK)

### 3. Usability
- **Target**: Non-engineers can build simple flows in <10 minutes
- Inline help tooltips for all node properties
- Error messages in plain language (no stack traces in UI unless expanded)

### 4. Browser Compatibility
- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- No IE11 support

### 5. Docker Deployment
- Single `docker-compose.yml` file
- Environment variables for configuration:
  - `PORT` (default: 3000)
  - `ANTHROPIC_API_KEY` (required)
  - `ENCRYPTION_KEY` (required for secrets, auto-generated if not provided)
  - `OTEL_ENDPOINT` (optional)
  - `LOG_LEVEL` (debug/info/warn/error)
  - `MAX_CONCURRENT_EXECUTIONS` (default: 3)
  - `BACKUP_ENABLED` (default: true)
- Persistent volumes:
  - `/projects` - All project data
  - `/backups` - Automatic backups
- Health check endpoint for container orchestration
- Graceful shutdown (wait for executions to complete)

### 6. Security
- API keys stored hashed (bcrypt)
- Secrets encrypted at rest (AES-256-GCM)
- HTTPS recommended for production (reverse proxy)
- CORS configuration
- Rate limiting per IP (100 req/min)
- Input validation and sanitization
- No eval() or dynamic code execution from user input

---

## Technology Stack

### Frontend
- **Framework**: React 19+ with TypeScript
  - New `use()` hook for promises/contexts
  - Actions for form handling
  - React Server Components (stable)
- **Build Tool**: Vite 7+ (fast HMR, optimized builds, ESM only)
  - **Note**: Requires Node.js 22.12+
- **State Management**: Zustand 4+ (lightweight, ~3KB)
- **Flow Editor**: ReactFlow 11+ (node-based canvas)
- **UI Components**: shadcn/ui (copy-paste components)
- **Styling**:
  - Tailwind CSS 3+ (utility-first)
  - CSS Modules for scoped styles (when needed)
- **Icons**: Lucide React (consistent icon set)
- **Charts**: Recharts (for cost/metrics visualization)
- **HTTP Client**:
  - Fetch API (built-in)
  - EventSource API for SSE (real-time streaming)
- **Form Handling**: React Hook Form + Zod (validation)
- **Routing**: React Router v6+ (client-side routing)
- **Date/Time**: date-fns (lightweight, tree-shakeable)
- **Code Editor**: Monaco Editor (for prompt editing with syntax highlighting)
- **Notifications**: Sonner (toast notifications)

**Frontend Dependencies (package.json):**
```json
{
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^6.20.0",
    "reactflow": "^11.10.0",
    "zustand": "^4.4.0",
    "@radix-ui/react-*": "^1.0.0",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.300.0",
    "recharts": "^2.10.0",
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.0",
    "@monaco-editor/react": "^4.6.0",
    "sonner": "^1.3.0",
    "date-fns": "^3.0.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^7.1.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "vitest": "^1.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

### Backend
- **Runtime**: Node.js 22+ (LTS)
  - OpenSSL 3.5.2 support
  - **Note**: Node.js 18 reached EOL April 2025
- **Framework**: Express.js 4+ (battle-tested, simple)
- **Language**: TypeScript 5+
- **Claude Agent SDK**: `@anthropic-ai/claude-agent-sdk` (primary dependency)
  - Installation: `npm install @anthropic-ai/claude-agent-sdk`
  - Documentation: https://docs.claude.com/en/api/agent-sdk/overview
  - Version: Latest stable (pin in production)
- **File System**: Native Node.js `fs/promises` (no database in MVP)
- **Encryption**: Native Node.js `crypto` (AES-256-GCM)
- **Validation**: Zod (schema validation for API requests)
- **Logging**: OTEL integration (via Claude Agent SDK) + Winston
- **Environment**: dotenv (config management)

**Backend Dependencies (package.json):**
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.0",
    "@anthropic-ai/claude-agent-sdk": "latest",
    "zod": "^3.22.0",
    "bcrypt": "^5.1.0",
    "uuid": "^9.0.0",
    "winston": "^3.11.0",
    "dotenv": "^16.3.0",
    "archiver": "^6.0.0",
    "unzipper": "^0.10.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.10.0",
    "@types/cors": "^2.8.0",
    "@types/bcrypt": "^5.0.0",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "tsup": "^8.0.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "vitest": "^1.0.0",
    "supertest": "^6.3.0"
  }
}
```

### DevOps
- **Containerization**: Docker + Docker Compose
- **Build Tools**: 
  - Frontend: Vite (dev + production builds)
  - Backend: tsup (TypeScript bundler) or tsx (TypeScript execution)
- **Linting**: ESLint + Prettier
  - Config: ESLint with TypeScript, React, and Prettier plugins
  - Pre-commit hooks with Husky + lint-staged
- **Testing**: 
  - Unit: Vitest (fast, Vite-native)
  - E2E: Playwright (cross-browser testing)
  - API: Supertest (Express endpoint testing)
- **CI/CD**: GitHub Actions (when open sourced)
  - Lint, test, build on PR
  - Docker image build on main
- **Monorepo Structure**:
  ```
  cloutagent/
  ├── apps/
  │   ├── frontend/        # React app
  │   └── backend/         # Express API
  ├── packages/            # Shared code (future)
  │   └── types/          # Shared TypeScript types
  ├── docker-compose.yml
  ├── package.json        # Root workspace
  └── .github/
      └── workflows/
  ```
- **Package Manager**: pnpm (fast, efficient) or npm workspaces

---

## User Stories & MVP Features

### MVP (v1.0) - Must Have

#### As a Developer, I want to...
1. **Create a new agent project** with a visual interface
   - Drag Agent node onto canvas
   - Configure system prompt, model, tools
   - Set cost and time limits
   - Generate API key
   - Save project

2. **Add subagents to handle specific tasks**
   - Drag Subagent node, connect to Agent
   - Configure subagent prompt and tools
   - Enable parallel execution if needed

3. **Configure MCPs for external integrations**
   - Add Browser MCP (pre-configured)
   - Add custom MCP via npx/uvx/URL
   - Add MCP credentials (encrypted)
   - Enable/disable specific MCP tools

4. **Manage variables and secrets securely**
   - Define runtime variables for API calls
   - Store environment variables in project
   - Add encrypted secrets for MCPs
   - Reference variables in prompts: `{{var}}`, `{{secret:key}}`

5. **Set up hooks for execution lifecycle**
   - Add pre/post execution hooks
   - Configure error handling hooks
   - Define notification hooks

6. **Test my agent flow before using API**
   - Run test mode (dry run, no API calls)
   - Validate configuration
   - See estimated cost
   - Fix issues highlighted on canvas

7. **Execute my agent and monitor in real-time**
   - Click "Run" button in UI
   - See live execution progress (steps, tools, thinking)
   - See cost updates during execution
   - Stop execution if needed
   - View final result and total cost

8. **Expose my agent as an API**
   - Get API endpoint URL and API key
   - Call API from external app with HTTP streaming
   - Receive real-time execution updates
   - Reconnect if connection drops
   - Cancel running executions

9. **Control costs and prevent overruns**
   - Set max cost per execution
   - Set max tokens per execution
   - Set timeout limits
   - Get alerts at 80% of budget
   - Execution auto-stops at limit

10. **Export/import agent configurations**
    - Export project as ZIP (with or without UI data)
    - Import existing Claude Agent SDK project
    - Version my workflows (v1, v2, v3...)
    - Compare versions
    - Rollback to previous version

11. **Track execution costs and performance**
    - See token usage per execution
    - View cost breakdown per agent/tool
    - Monitor total project costs (last 24h)
    - See success/failure rates
    - View execution history

12. **Ensure my data is backed up**
    - Automatic daily backups
    - Manual backup on demand
    - Restore from backup
    - Export all projects at once

### Future Enhancements (v2.0+)

See comprehensive list in "Features NOT in MVP" section above. Key highlights:

1. **Multi-user collaboration** - Team workspaces, real-time editing
2. **Agent marketplace** - Pre-built templates, community sharing
3. **Advanced debugging** - Step-through, breakpoints, resume from checkpoint
4. **Scheduled executions** - Cron-like automation
5. **Integration hub** - Slack, GitHub, Google Workspace, etc.
6. **A/B testing** - Compare agent versions automatically
7. **Cost optimizer** - AI-suggested improvements
8. **Enterprise features** - SSO, audit logs, compliance tools

---

## Design Mockups & UI Flow

### Main Application Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [CloutAgent] Project: Customer Support    [Settings] [Run]  │
├───────┬─────────────────────────────────────────────────────┤
│       │                                                       │
│ Node  │              Canvas Area                             │
│ Pal.  │   ┌───────────────┐                                  │
│       │   │  Main Agent   │────┐                             │
│ Agent │   └───────────────┘    │                             │
│ Subag.│                        ▼                             │
│ Hook  │                   ┌─────────┐                        │
│ MCP   │                   │Subagent1│                        │
│       │                   └─────────┘                        │
│       │                                                       │
│       │  [Zoom: 100%]  [Grid: On]   [Minimap]               │
├───────┴─────────────────────────────────────────────────────┤
│  Execution Log                                         [↕]   │
│  > Starting execution...                                     │
│  > Agent: main - Step 1                                      │
│  > Tool: bash - ls -la                                       │
│  ✓ Completed in 2.3s - Cost: $0.002                         │
└─────────────────────────────────────────────────────────────┘
```

### Node Property Panel (Slide-in from right)

```
┌────────────────────────────────┐
│  Agent Configuration      [X]  │
├────────────────────────────────┤
│                                │
│  Name: [Main Agent      ]     │
│                                │
│  Model: [Claude Sonnet 4 ▾]   │
│                                │
│  Temperature: [0.7]            │
│  ◀────────▓──────▶            │
│                                │
│  Max Tokens: [4096      ]     │
│                                │
│  System Prompt:                │
│  ┌──────────────────────────┐ │
│  │You are a helpful...      │ │
│  │                          │ │
│  │Variables: {{user}}       │ │
│  └──────────────────────────┘ │
│                                │
│  Available Tools:              │
│  ☑ bash                        │
│  ☑ file_create                 │
│  ☑ str_replace                 │
│  ☐ view                        │
│  ☑ Task (enables subagents)    │
│                                │
│  [Cancel]  [Save Changes]      │
└────────────────────────────────┘
```

### Execution Monitoring (Real-time)

```
┌─────────────────────────────────────────────────────────┐
│  Execution: exec-abc123               Status: Running   │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐ │
│  │ ◉ Main Agent - Processing request...             │ │
│  │   ├─ 🔧 bash: Listing directory contents         │ │
│  │   │   ✓ Output: 12 files found                   │ │
│  │   ├─ 💭 Thinking: Need to analyze files...       │ │
│  │   ├─ 📤 Starting Subagent: data-processor        │ │
│  │   │   ◉ Processing file data...                  │ │
│  │   │   ⏳ Tool: str_replace - Updating config     │ │
│  │   └─ ⏸ Waiting for subagent completion...        │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Tokens: 1,243 prompt | 456 completion                 │
│  Cost: $0.0085                                          │
│  Duration: 8.2s                                         │
│                                                         │
│  [Stop Execution]  [Export Log]                        │
└─────────────────────────────────────────────────────────┘
```

---

## API Examples for Developers

### Example 1: Execute Agent with Variables

```bash
curl -X POST http://localhost:3000/api/v1/projects/customer-support/execute \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "customer_name": "John Doe",
      "issue_description": "Cannot log in to account"
    },
    "streaming": true
  }'

# Response (SSE stream):
data: {"type":"start","executionId":"exec-xyz789"}
data: {"type":"agent_start","agent":"main","timestamp":"2025-10-01T10:30:00Z"}
data: {"type":"tool_call","tool":"bash","input":"check_user_status.sh john.doe"}
data: {"type":"tool_result","tool":"bash","output":"User status: locked"}
data: {"type":"thinking","content":"Account is locked, need to verify identity..."}
data: {"type":"complete","result":"I've identified the issue...","cost":{"promptTokens":890,"completionTokens":234,"totalCost":0.0067}}
```

### Example 2: Non-Streaming Execution

```javascript
const response = await fetch('http://localhost:3000/api/v1/projects/data-analyzer/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    variables: { dataset_url: 'https://data.example.com/sales.csv' },
    streaming: false
  })
});

const result = await response.json();
console.log(result);
// {
//   "executionId": "exec-123",
//   "status": "completed",
//   "result": "Analysis complete: Revenue increased 23% YoY...",
//   "cost": { "totalCost": 0.012 },
//   "duration": 15230
// }
```

### Example 3: Streaming in Web App (Frontend)

```typescript
const eventSource = new EventSource(
  'http://localhost:3000/api/v1/projects/report-gen/execute?variables=' + 
  encodeURIComponent(JSON.stringify({ report_type: 'quarterly' }))
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'start':
      console.log('Execution started:', data.executionId);
      break;
    case 'agent_start':
      console.log('Agent running:', data.agent);
      break;
    case 'tool_call':
      console.log(`Tool ${data.tool} called with:`, data.input);
      break;
    case 'thinking':
      console.log('Agent thinking:', data.content);
      break;
    case 'complete':
      console.log('Final result:', data.result);
      console.log('Total cost:', data.cost.totalCost);
      eventSource.close();
      break;
  }
};

eventSource.onerror = (error) => {
  console.error('Execution error:', error);
  eventSource.close();
};
```

---

## Development Phases

### Phase 1: Core Infrastructure (Weeks 1-2)
- [ ] Set up monorepo structure (frontend + backend)
- [ ] Docker Compose configuration
- [ ] File system storage layer with encryption for secrets
- [ ] API key generation and authentication middleware
- [ ] Basic REST API (create/read/list projects)
- [ ] Claude Agent SDK integration (`@anthropic-ai/claude-agent-sdk`)
- [ ] Cost tracking and limit enforcement

### Phase 2: Visual Editor (Weeks 3-4)
- [ ] ReactFlow canvas setup
- [ ] Agent node component + property panel
- [ ] Drag-and-drop from palette
- [ ] Save/load flow coordinates
- [ ] Basic styling (dark/light mode)
- [ ] Test mode (validation without execution)

### Phase 3: Advanced Nodes (Weeks 5-6)
- [ ] Subagent nodes with parallel execution
- [ ] Hook nodes (pre/post/error hooks)
- [ ] MCP configuration nodes with credential management
- [ ] Connection rendering and validation
- [ ] Variable and secret management UI

### Phase 4: Execution & Monitoring (Weeks 7-8)
- [ ] HTTP Streaming API implementation (SSE)
- [ ] Execution queue system
- [ ] Real-time execution view in UI
- [ ] Progress indicators on canvas
- [ ] Cost tracking and display with limits
- [ ] OTEL log integration
- [ ] Streaming reconnection support

### Phase 5: Variables, Secrets & Testing (Week 9)
- [ ] Variable syntax in prompt editor
- [ ] Variable resolution at runtime
- [ ] Encrypted secret storage (AES-256)
- [ ] Secret management UI
- [ ] Test mode implementation
- [ ] Prompt preview with resolved variables

### Phase 6: Export/Import & Versioning (Week 10)
- [ ] Export project (ZIP with/without UI data)
- [ ] Import Claude Agent SDK projects
- [ ] Version management (create, list, rollback)
- [ ] Version comparison UI
- [ ] Automatic backups

### Phase 7: MCP Management (Week 11)
- [ ] Add custom MCP via UI (npx/uvx/URL)
- [ ] Test MCP connection
- [ ] Enable/disable MCP tools
- [ ] Browser MCP pre-configured
- [ ] MCP credential injection

### Phase 8: Monitoring & Polish (Week 12)
- [ ] Basic metrics dashboard (24h stats)
- [ ] Execution history viewer
- [ ] Cost breakdown charts
- [ ] Error handling and user feedback
- [ ] Inline help tooltips
- [ ] API documentation (OpenAPI spec)
- [ ] Performance optimization

### Phase 9: Documentation & Examples (Week 13)
- [ ] User guide
- [ ] API reference
- [ ] 5 example agent projects
- [ ] Video tutorial (getting started)
- [ ] Deployment guide
- [ ] Security best practices

---

## Success Criteria

### MVP Success Metrics
1. **User can build and test a working agent in <15 minutes** without reading docs
2. **API executes agent within 500ms** of request (excluding Claude API latency)
3. **Real-time updates display within 200ms** of event occurrence
4. **Zero data loss** - all projects save/load correctly, backups work
5. **Cost limits enforced 100%** - no executions exceed configured budget
6. **API key authentication works** - unauthorized requests blocked
7. **Streaming reconnection works** - clients can resume after disconnect
8. **Test mode validates flows** - catches 90%+ of configuration errors
9. **Secrets stay encrypted** - never exposed in logs/UI/exports
10. **API uptime >99%** in Docker container

### Adoption Metrics (Post-Launch)
- GitHub stars (target: 500+ in first 3 months)
- Docker pulls (target: 1000+ in first month)
- Community contributions (PRs, issues)
- Example projects shared by users

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Claude Agent SDK breaking changes | High | Medium | Pin to specific SDK version, monitor releases, test before upgrading |
| Cost overruns (infinite loops) | High | Medium | Hard limits per execution, timeout enforcement, cost alerts |
| HTTP Streaming browser compatibility | Medium | Low | Fallback to polling, SSE is widely supported, reconnection logic |
| Canvas performance with 100+ nodes | Medium | Medium | Virtual rendering, optimize ReactFlow, performance testing |
| File system storage corruption | High | Low | Atomic writes, daily backups, write-ahead logging |
| OTEL integration complexity | Medium | Medium | Start with basic logging, enhance incrementally |
| Secrets encryption key loss | High | Low | Clear docs on key backup, ability to re-encrypt with new key |
| API key theft/exposure | High | Medium | Rate limiting, key rotation capability, usage monitoring |
| Queue system bottleneck | Medium | Low | Configurable concurrency, monitoring, auto-scaling plan for v2 |

---

## Open Questions

1. **Project Naming**: ✅ Decided: **CloutAgent**
   - Reasoning: Sound-alike to Claude, memorable, conveys power/impact
   - Tagline: "Agents with Impact"
   - Domain: Need to check clout.agent, cloutagent.com availability

2. **Claude Agent SDK Hooks**: ✅ Researched
   - Hook types confirmed: pre-execution, post-execution, tool execution, error hooks
   - Hooks enable custom logic at various agent lifecycle points
   - Can be used for notifications, logging, validation, etc.

3. **Multi-tenancy**: ✅ Clarified for MVP
   - Single tenant per Docker instance for MVP
   - No user authentication in MVP
   - File structure supports multi-tenant for v2

4. **MCP Credentials**: ✅ Implemented in MVP
   - Encrypted storage (AES-256)
   - Basic key-value pairs supported
   - OAuth/advanced auth in v2

5. **Rate Limiting**: ✅ Claude Agent SDK handles this internally
   - Built-in rate limiting and queue management
   - CloutAgent adds concurrent execution limits per project
   - Document limits in API docs for transparency

6. **TypeScript SDK**: ✅ Confirmed Available & Production Ready
   - Package: `@anthropic-ai/claude-agent-sdk` (npm)
   - Official documentation: https://docs.claude.com/en/api/agent-sdk/overview
   - Full feature parity with Python SDK
   - Production-ready, actively maintained by Anthropic

### Remaining Questions for Development

1. **Encryption Key Management**: 
   - Should encryption key be generated automatically or user-provided?
   - Proposal: Auto-generate, store in `.env`, provide backup instructions

2. **Execution History Retention**:
   - Currently 24 hours - is this enough?
   - Proposal: Make configurable (1-30 days), default 7 days

3. **Example Projects**:
   - Which 5 example agents to include?
   - Proposal: Customer Support, Data Analyzer, Research Assistant, Email Responder, Code Reviewer

4. **Performance Targets**:
   - Canvas with 200+ nodes - what's acceptable FPS?
   - Proposal: 30 FPS minimum, optimize for 60 FPS

5. **Docker Image Size**:
   - Target size for Docker image?
   - Proposal: <500MB compressed

---

## Appendix

### A. Glossary

- **CloutAgent**: Visual workflow builder for Claude Agent SDK
- **Agent**: Main executor that orchestrates the workflow using Claude Agent SDK
- **Subagent**: Specialized agent invoked by main agent via Task tool for context management
- **Hook**: Lifecycle callback for pre/post execution, error handling, notifications
- **MCP**: Model Context Protocol - external tool/service integration
- **OTEL**: OpenTelemetry - observability framework for traces, metrics, logs
- **SSE**: Server-Sent Events - HTTP streaming standard for real-time updates

### B. References

- [Claude Agent SDK Overview](https://docs.claude.com/en/api/agent-sdk/overview) - Official Documentation
- [Claude Agent SDK - Building Agents](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) - Engineering Blog
- [Claude Agent SDK - Python](https://github.com/anthropics/claude-agent-sdk-python)
- [Claude Agent SDK - TypeScript](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk) - npm Package
- [Anthropic Documentation](https://docs.anthropic.com)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [ReactFlow Documentation](https://reactflow.dev)
- [OpenTelemetry](https://opentelemetry.io)

### C. Competitive Analysis

| Feature | Flowise | Langflow | **CloutAgent** |
|---------|---------|----------|------------------|
| Visual Editor | ✅ | ✅ | ✅ |
| Claude Agent SDK | ❌ | ❌ | ✅ |
| Real-time Monitoring | ⚠️ Basic | ⚠️ Basic | ✅ Advanced (Perplexity-style) |
| Execution API | ✅ | ✅ | ✅ (HTTP Streaming) |
| Cost Tracking | ❌ | ❌ | ✅ |
| File-based Storage | ❌ (DB) | ❌ (DB) | ✅ |
| Version Control | ❌ | ❌ | ✅ |
| MCP Integration | ❌ | ⚠️ Limited | ✅ Native |
| Open Source | ✅ | ✅ | ✅ |

---

## Next Steps

1. **Domain & Branding**: ✅ Name chosen: CloutAgent
   - Register domain (cloutagent.com, cloutagent.dev, clout.agent)
   - Create logo concepts (lightning bolt, impact themes)
2. **Repository Setup**: Initialize Git repo with monorepo structure (cloutagent/cloutagent)
3. **Claude Agent SDK Deep Dive**: 
   - Study Python SDK: https://github.com/anthropics/claude-agent-sdk-python
   - Review TypeScript implementation (when available)
   - Understand hooks, subagents, OTEL integration, custom tools
4. **Design Mockups**: Create high-fidelity UI mockups (Figma) - Apple/Anthropic aesthetic
5. **Tech Spike**: Proof of concept for HTTP Streaming + ReactFlow + Claude Agent SDK
6. **Development Kickoff**: Start Phase 1 with Claude Agent SDK integration

---

**Project**: CloutAgent - Agents with Impact  
**Document Version**: 1.0  
**Last Updated**: 2025-10-01  
**Author**: Product Specification  
**Status**: Draft - Ready for Review
