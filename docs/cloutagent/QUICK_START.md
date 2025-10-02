# CloutAgent - Quick Start Guide

**Version:** 1.0 (MVP)  
**For:** Developers setting up CloutAgent for the first time

---

## Prerequisites

- Node.js 22+ installed (Node.js 18 reached EOL April 2025)
- Docker and Docker Compose installed
- Anthropic API key ([get one here](https://console.anthropic.com))

---

## Installation (5 minutes)

### 1. Clone Repository
```bash
git clone https://github.com/cloutagent/cloutagent.git
cd cloutagent
```

### 2. Install Dependencies
```bash
# Install Claude Agent SDK
npm install @anthropic-ai/claude-agent-sdk

# Install all dependencies
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```bash
ANTHROPIC_API_KEY=your_api_key_here
PORT=3000
ENCRYPTION_KEY=auto_generated_on_first_run
LOG_LEVEL=info
MAX_CONCURRENT_EXECUTIONS=3
BACKUP_ENABLED=true
```

### 4. Start with Docker
```bash
docker-compose up -d
```

Or run locally:
```bash
npm run dev
```

### 5. Access CloutAgent
Open browser: `http://localhost:3000`

---

## Your First Agent (10 minutes)

### Step 1: Create Project
1. Click "New Project"
2. Name it: "Hello World Agent"
3. Click "Create"

### Step 2: Configure Main Agent
1. Drag "Agent" node onto canvas
2. Click the node to open properties
3. Set:
   - **Name**: Main Agent
   - **System Prompt**: "You are a helpful assistant that greets users."
   - **Model**: Claude Sonnet 4.5
   - **Tools**: Enable "bash"

### Step 3: Set Cost Limits
1. In project settings (top right)
2. Set:
   - **Max Cost**: $0.10
   - **Max Tokens**: 10,000
   - **Timeout**: 5 minutes

### Step 4: Test Your Agent
1. Click "Test Mode" button
2. Verify configuration is valid
3. Click "Run" button
4. Enter prompt: "Say hello!"
5. Watch real-time execution

### Step 5: Get API Key
1. Click "API" tab in project
2. Copy your API key
3. Copy the endpoint URL

### Step 6: Call from External App
```bash
curl -X POST http://localhost:3000/api/v1/projects/hello-world/execute \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "user_name": "Alice"
    },
    "streaming": true
  }'
```

---

## Adding Subagents

### When to Use Subagents
- Parallel processing (multiple tasks at once)
- Context isolation (large data processing)
- Specialized tasks (separate concerns)

### Example: Data Processing Agent

1. **Main Agent** (Orchestrator)
   - Prompt: "You coordinate data processing tasks"
   - Tools: bash, Task (enabled)

2. **Subagent** (Data Processor)
   - Prompt: "You process CSV files and return summaries"
   - Tools: bash, view, file_create
   - Parallel: Enabled (max 2 instances)

3. **Connect**: Drag from Main Agent to Subagent

---

## Adding MCPs (Model Context Protocol)

### Pre-configured MCPs
- **Browser MCP** (Playwright): Already available

### Adding Custom MCP

#### Example: Filesystem MCP
1. Click "Add MCP" button
2. Fill in:
   - **Name**: File System
   - **Type**: npx
   - **Command**: `@modelcontextprotocol/server-filesystem`
   - **Args**: `{"rootPath": "/workspace"}`
3. Click "Test Connection"
4. Enable desired tools
5. Click "Save"

#### Example: Custom API MCP
1. Click "Add MCP"
2. Fill in:
   - **Name**: My API
   - **Type**: URL
   - **Endpoint**: `http://localhost:8080`
3. Add credentials (if needed):
   - Click "Add Secret"
   - **Name**: API_KEY
   - **Value**: your_secret_key
4. Click "Save"

---

## Managing Secrets

### Adding Secrets
1. Go to project settings
2. Click "Secrets" tab
3. Click "Add Secret"
4. Enter:
   - **Name**: DATABASE_PASSWORD
   - **Value**: your_password_here
5. Click "Save" (value is encrypted immediately)

### Using Secrets in Prompts
```
Connect to database using {{secret:DATABASE_PASSWORD}}
```

**Important**: Secrets are NEVER visible after creation. You can only delete and recreate.

---

## Variables

### Built-in Variables
- `{{timestamp}}` - Current ISO timestamp
- `{{execution_id}}` - Unique execution ID
- `{{project_name}}` - Project name

### Environment Variables (Project Level)
Set in project settings → Variables tab:
```
API_BASE_URL=https://api.example.com
REGION=us-west-2
```

Use in prompts:
```
Call API at {{API_BASE_URL}} in {{REGION}} region
```

### Runtime Variables (API Level)
Pass when calling execution API:
```json
{
  "variables": {
    "customer_name": "John Doe",
    "ticket_id": "TICKET-123"
  }
}
```

Use in prompts:
```
Help customer {{customer_name}} with ticket {{ticket_id}}
```

---

## Cost Management

### Setting Limits
Per project, configure:
- **Max Tokens**: 50,000 (default: 100k)
- **Max Cost**: $0.50 (default: $1.00)
- **Timeout**: 30 minutes (default: 1 hour)

### Monitoring Costs
- View in project dashboard (last 24h)
- See cost during execution (live updates)
- Export cost reports (CSV)

### Cost Alerts
- Warning at 80% of budget
- Execution stops at 100% of budget
- Email notification (v2.0 feature)

---

## Versioning

### Creating Versions
1. Make changes to your agent
2. Click "Save as Version"
3. Enter version name: "v2"
4. Click "Create"

### Rolling Back
1. Click "Versions" tab
2. Select previous version (e.g., v1)
3. Click "Rollback"
4. Confirm

### Comparing Versions
1. Click "Compare" button
2. Select two versions
3. View side-by-side diff

---

## Backups

### Automatic Backups
- Runs daily at 2 AM
- Stored in `/backups/backup-YYYY-MM-DD.zip`
- Last 7 days retained

### Manual Backup
1. Click "Backup" button in settings
2. Wait for ZIP creation
3. Click "Download"

### Restoring from Backup
1. Click "Import" button
2. Select backup ZIP file
3. Click "Restore"
4. Select which projects to restore

---

## Execution API Reference

### Execute Agent
```bash
POST /api/v1/projects/{projectId}/execute
Headers:
  X-API-Key: <your-api-key>
  Content-Type: application/json

Body:
{
  "version": "v2",           # optional
  "variables": {...},        # optional
  "streaming": true,         # optional (default: true)
  "limits": {                # optional (override project defaults)
    "maxTokens": 10000,
    "maxCost": 0.20,
    "timeout": 600
  }
}
```

### Reconnect to Execution
```bash
GET /api/v1/executions/{executionId}/stream?from_event=42
Headers:
  X-API-Key: <your-api-key>
```

### Cancel Execution
```bash
POST /api/v1/executions/{executionId}/cancel
Headers:
  X-API-Key: <your-api-key>
```

### Get Execution Status
```bash
GET /api/v1/executions/{executionId}
Headers:
  X-API-Key: <your-api-key>
```

---

## Streaming Response Format (SSE)

Events come in this format:
```javascript
data: {"type": "start", "executionId": "exec-123", "timestamp": "..."}
data: {"type": "agent_start", "agent": "main", "step": 1}
data: {"type": "tool_call", "tool": "bash", "input": "ls -la"}
data: {"type": "tool_result", "tool": "bash", "output": "..."}
data: {"type": "thinking", "content": "I need to..."}
data: {"type": "cost_update", "totalCost": 0.05, "percentOfLimit": 25}
data: {"type": "complete", "finalResult": "...", "cost": {...}}
```

### JavaScript Example
```javascript
const eventSource = new EventSource(
  'http://localhost:3000/api/v1/projects/my-project/execute'
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'tool_call':
      console.log(`Tool: ${data.tool}`);
      break;
    case 'cost_update':
      console.log(`Cost: $${data.totalCost}`);
      break;
    case 'complete':
      console.log('Result:', data.finalResult);
      eventSource.close();
      break;
  }
};
```

---

## Troubleshooting

### "Execution failed: COST_LIMIT_EXCEEDED"
**Solution**: Increase max cost in project settings or optimize your prompts

### "API key invalid"
**Solution**: Regenerate API key in project settings → API tab

### "MCP connection failed"
**Solution**: 
1. Check MCP is running (for URL type)
2. Verify package name (for npx/uvx type)
3. Check credentials are correct

### "Execution timeout"
**Solution**: Increase timeout in project settings or optimize agent workflow

### Canvas is slow with many nodes
**Solution**: 
1. Reduce zoom level
2. Close unused projects
3. Upgrade browser (use Chrome/Edge)

### Secrets not decrypting
**Solution**: Check `ENCRYPTION_KEY` in `.env` hasn't changed

---

## Best Practices

### 1. Start Simple
- Begin with one agent, no subagents
- Add complexity incrementally
- Test frequently

### 2. Use Test Mode
- Always validate before running
- Catches 90% of config errors
- Estimates cost before execution

### 3. Set Conservative Limits
- Start with low cost limits ($0.10)
- Increase gradually as you optimize
- Use timeouts to prevent runaway agents

### 4. Version Everything
- Create version before major changes
- Easy to rollback if something breaks
- Compare versions to debug issues

### 5. Monitor Costs
- Check dashboard daily
- Set up cost alerts (v2.0)
- Optimize expensive agents

### 6. Secure Your Secrets
- Never hardcode API keys in prompts
- Use secret management
- Rotate secrets periodically
- Don't export projects with secrets

### 7. Use Subagents Wisely
- Only for parallel tasks or context isolation
- Each subagent adds overhead
- Test serial vs parallel performance

### 8. Optimize Prompts
- Clear, specific instructions
- Use examples when possible
- Avoid redundant context
- Test different phrasings

---

## Example Projects

### 1. Customer Support Agent
- Reads ticket, searches knowledge base
- Drafts response, escalates if needed
- MCPs: Database, Email

### 2. Data Analyzer
- Processes CSV files
- Generates charts and insights
- Subagent for parallel file processing

### 3. Research Assistant
- Searches multiple sources
- Synthesizes findings
- MCPs: Browser, File System

### 4. Code Reviewer
- Analyzes code quality
- Suggests improvements
- MCPs: GitHub, Slack

### 5. Email Responder
- Reads inbox, categorizes emails
- Drafts responses for approval
- MCPs: Gmail, Calendar

**Download example projects**: `/examples` folder in repo

---

## Getting Help

- **Documentation**: https://docs.cloutagent.dev (coming soon)
- **GitHub Issues**: https://github.com/cloutagent/cloutagent/issues
- **Discord**: https://discord.gg/cloutagent (coming soon)
- **Email**: support@cloutagent.dev (coming soon)

---

## What's Next?

1. ✅ Build your first agent (above)
2. ✅ Try example projects
3. ✅ Add MCPs for your use case
4. ✅ Create subagents for complex workflows
5. ✅ Expose API endpoint
6. ✅ Integrate into your app
7. ✅ Share on GitHub / community

---

**Happy Agent Building! 🚀**

*CloutAgent - Agents with Impact*
