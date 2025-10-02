# Getting Started with CloutAgent

## What is CloutAgent?

CloutAgent is a powerful visual workflow builder designed for creating and orchestrating AI agent workflows powered by Anthropic's Claude. Whether you're building automated code review systems, content generation pipelines, or complex multi-agent research workflows, CloutAgent makes it simple to design, test, and deploy AI automation without writing code.

**Key Features:**
- **Visual Workflow Builder**: Drag-and-drop interface for designing complex agent workflows
- **Real-time Execution Monitoring**: Watch your agents work with live streaming output
- **Built-in Cost Tracking**: Monitor API usage and costs across all executions
- **Agent Specialization**: Use pre-configured specialized agents (frontend-engineer, backend-engineer, etc.)
- **MCP Integration**: Connect to external tools and services via Model Context Protocol
- **Version Control**: Track changes to your workflows with Git-style version control
- **Secure Secrets Management**: Store API keys and credentials with AES-256 encryption

CloutAgent transforms the complexity of multi-agent orchestration into an intuitive visual experience, letting you focus on what your agents should do rather than how to coordinate them.

## Installation

### System Requirements

Before installing CloutAgent, ensure your system meets these requirements:

- **Node.js**: Version 22 or higher (LTS recommended)
- **pnpm**: Version 8 or higher
- **Anthropic API Key**: Active API key from [Anthropic Console](https://console.anthropic.com/)
- **Operating System**: macOS, Linux, or Windows with WSL2
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 500MB for application and dependencies

### Quick Installation

Follow these steps to get CloutAgent running on your machine:

```bash
# Clone the repository
git clone https://github.com/yfedoseev/cloutagent.git
cd cloutagent

# Install dependencies
pnpm install

# Create environment configuration
cp .env.example .env

# Add your Anthropic API key to .env
echo "ANTHROPIC_API_KEY=sk-ant-your-api-key-here" >> .env

# Start the development server
pnpm dev
```

The application will start on two ports:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

### Environment Configuration

CloutAgent uses environment variables for configuration. Open the `.env` file and configure:

```bash
# Required: Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# Optional: Database (defaults to SQLite)
DATABASE_URL=sqlite:./data/cloutagent.db

# Optional: Server ports
FRONTEND_PORT=3000
BACKEND_PORT=3001

# Optional: Logging level
LOG_LEVEL=info
```

[Screenshot: Successful installation with dev servers running]

## Your First Workflow

Let's create a simple workflow to get familiar with CloutAgent. We'll build a code documentation generator.

### Step 1: Create a New Project

1. Open CloutAgent in your browser (http://localhost:3000)
2. Click the **"New Project"** button in the dashboard
3. Enter the following details:
   - **Name**: "Code Documentation Generator"
   - **Description**: "Automatically generate documentation from code"
4. Click **"Create Project"**

You'll be taken to the visual editor with a blank canvas.

[Screenshot: New project dialog with fields filled]

### Step 2: Add an Agent Node

The Agent node is the core of any workflow. It represents a Claude-powered AI agent.

1. Look at the **Node Palette** on the left side
2. Find the **"Agent"** node (represented by a robot icon)
3. **Drag** the Agent node onto the canvas
4. **Drop** it in the center of the canvas

The node appears with default configuration. Now let's customize it:

1. **Click** on the Agent node to open the property panel
2. Configure the following properties:
   - **Node Name**: "Documentation Generator"
   - **Model**: Select "Claude Sonnet 4.5" (recommended for most tasks)
   - **System Prompt**: Enter the following:
     ```
     You are an expert technical writer and programmer. Generate comprehensive,
     clear documentation for code. Include:
     - Function/class purpose
     - Parameter descriptions with types
     - Return value documentation
     - Usage examples
     - Edge cases and error handling

     Format output in markdown with proper code blocks.
     ```
   - **Max Tokens**: 4000
   - **Temperature**: 0.3 (lower for more consistent output)

3. Click **"Save"** to apply the configuration

[Screenshot: Agent node configuration panel]

### Step 3: Configure Input

Every workflow needs input. We'll configure how to provide code to our agent:

1. Look at the **Input section** in the property panel
2. Set the **Input Prompt Template**: "Generate documentation for this code:\n\n{code}"

This template will receive the code you provide when executing the workflow.

### Step 4: Execute Your Workflow

Now let's test the workflow:

1. Click the **"Run"** button in the top toolbar
2. In the execution dialog, enter this sample code:

```python
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
```

3. Click **"Execute Workflow"**

Watch as CloutAgent:
- Sends your code to the agent
- Streams the response in real-time
- Displays the generated documentation
- Tracks token usage and cost

[Screenshot: Execution panel showing streaming output]

### Step 5: Review the Results

After execution completes, you'll see:

- **Output**: The generated documentation
- **Execution Time**: How long the workflow took
- **Tokens Used**: Input and output token counts
- **Cost**: Estimated cost in USD
- **Execution Log**: Detailed execution trace

The documentation might look like this:

```markdown
# fibonacci Function

## Purpose
Calculates the nth Fibonacci number using recursive algorithm.

## Parameters
- `n` (int): The position in the Fibonacci sequence to calculate

## Returns
- `int`: The Fibonacci number at position n

## Usage Example
```python
result = fibonacci(5)  # Returns 5
```

## Edge Cases
- For n = 0, returns 0
- For n = 1, returns 1
- For negative n, behavior is undefined
```

Congratulations! You've created and executed your first CloutAgent workflow.

[Screenshot: Execution results with documentation output]

## Core Concepts

Understanding these core concepts will help you build more powerful workflows.

### Nodes

Nodes are the building blocks of workflows. Each node type serves a specific purpose:

#### Agent Node
The primary AI agent that processes prompts using Claude models. Use this for:
- Text generation and analysis
- Code writing and review
- Problem-solving tasks
- General AI assistance

**Configuration Options:**
- Model selection (Sonnet 4.5, Opus 4, etc.)
- System prompt (defines agent behavior)
- Temperature (creativity vs consistency)
- Max tokens (output length limit)

#### Subagent Node
Specialized agents optimized for specific tasks. CloutAgent includes:
- **frontend-engineer**: React, UI/UX, web development
- **backend-engineer**: APIs, databases, server-side logic
- **ml-engineer**: Machine learning, data science
- **database-engineer**: Schema design, SQL optimization
- **infrastructure-engineer**: DevOps, cloud architecture
- **software-engineer-test**: Testing strategies, test writing

Use subagents when you need specialized expertise or want to divide complex tasks.

#### Hook Node
Lifecycle event handlers that execute at specific points:
- **pre-execution**: Run before workflow starts
- **post-execution**: Run after workflow completes
- **on-error**: Run when errors occur
- **on-success**: Run only on successful completion

Hooks are perfect for:
- Validation and preprocessing
- Logging and notifications
- Cleanup operations
- Integration with external systems

#### MCP Node
Model Context Protocol nodes connect to external tools and services:
- File system operations
- Database queries
- API integrations
- Custom tool servers

MCP nodes extend your agents' capabilities beyond text processing.

### Variables

Variables store and reuse data across workflow executions. They enable:

**Dynamic Workflows**: Pass data between nodes and executions
**Configuration Management**: Store settings outside of workflow definitions
**Multi-step Processing**: Carry results forward through complex pipelines

**Variable Types:**
- **String**: Text values
- **Number**: Numeric values
- **Boolean**: True/false flags
- **JSON**: Structured data objects

**Example Use Cases:**
- Store API endpoints that change between environments
- Save processing results for later steps
- Configure agent behavior dynamically
- Track state across multiple executions

### Secrets

Secrets provide secure storage for sensitive information:
- API keys and tokens
- Database credentials
- OAuth tokens
- Private configuration

**Security Features:**
- **AES-256 Encryption**: Military-grade encryption at rest
- **Access Control**: Secrets scoped to specific projects
- **No Logging**: Secret values never appear in logs
- **Secure Transmission**: HTTPS-only access

**Best Practices:**
- Never hardcode secrets in workflows
- Rotate secrets regularly
- Use unique secrets per environment
- Audit secret access through logs

### Execution

Execution is the process of running a workflow with specific input:

**Execution Modes:**
- **Real-time Streaming**: Watch output as it's generated
- **Batch Mode**: Execute multiple inputs sequentially
- **Test Mode**: Validate workflows with mock data
- **Dry Run**: Preview execution without consuming API credits

**Execution Monitoring:**
- Live token usage tracking
- Real-time cost estimation
- Progress indicators for multi-step workflows
- Detailed execution logs for debugging

**Execution History:**
- Every execution is saved with full context
- Review past results and outputs
- Compare execution performance over time
- Replay previous executions with same inputs

## Next Steps

Now that you understand the basics, explore these advanced topics:

### Deepen Your Knowledge
- **[Visual Editor Guide](./guides/visual-editor.md)**: Master the canvas, keyboard shortcuts, and advanced editing
- **[Agent Configuration Guide](./guides/agent-configuration.md)**: Learn to write effective system prompts and optimize model selection
- **[Testing Workflows Guide](./guides/testing-workflows.md)**: Validate workflows before production use

### Build Advanced Workflows
- **[Working with Subagents](./guides/subagents.md)**: Coordinate multiple specialized agents
- **[MCP Integration](./guides/mcp-integration.md)**: Connect to external tools and services
- **[Variables & Secrets](./guides/variables-secrets.md)**: Manage configuration and sensitive data

### Learn Best Practices
- **[Workflow Design Patterns](./best-practices/workflow-design.md)**: Proven patterns for common scenarios
- **[Cost Optimization](./best-practices/cost-optimization.md)**: Minimize API costs while maximizing value
- **[Security Best Practices](./best-practices/security.md)**: Keep your workflows secure

### Get Help
- **[Common Errors](./troubleshooting/common-errors.md)**: Solutions to frequent issues
- **[FAQ](./troubleshooting/faq.md)**: Answers to common questions
- **[Example Workflows](../examples/)**: Pre-built workflows you can import

### Join the Community
- **GitHub Discussions**: Share workflows and get help
- **Discord Server**: Real-time chat with other users
- **Example Library**: Contribute your workflows
- **Feature Requests**: Suggest improvements

## Quick Reference

### Essential Keyboard Shortcuts
- `Cmd/Ctrl + N`: New project
- `Cmd/Ctrl + S`: Save workflow
- `Cmd/Ctrl + R`: Run workflow
- `Delete/Backspace`: Delete selected node
- `Cmd/Ctrl + Z`: Undo
- `Cmd/Ctrl + Shift + Z`: Redo

### Common Tasks
- **Add a node**: Drag from palette or double-click canvas
- **Connect nodes**: Click and drag from output to input port
- **Configure node**: Click node to open property panel
- **Delete connection**: Right-click connection and select delete
- **Zoom canvas**: Scroll wheel or pinch gesture
- **Pan canvas**: Click and drag background or use spacebar + drag

### Getting Help
- **Documentation Search**: Press `/` from any page
- **Inline Help**: Hover over `?` icons for tooltips
- **Support**: Email support@cloutagent.com
- **Bug Reports**: GitHub Issues

---

**Ready to build?** Head to the [Visual Editor Guide](./guides/visual-editor.md) to master the canvas and start creating powerful AI workflows.
