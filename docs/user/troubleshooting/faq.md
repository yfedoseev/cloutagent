# Frequently Asked Questions (FAQ)

Quick answers to the most common questions about CloutAgent.

## Getting Started

### What is CloutAgent?

CloutAgent is a visual workflow builder for creating and orchestrating AI agent workflows powered by Anthropic's Claude. It provides a drag-and-drop interface for designing complex multi-agent systems without writing code.

**Key Features:**
- Visual workflow editor
- Real-time execution monitoring
- Built-in cost tracking
- Specialized agent types
- MCP integration for external tools

### Do I need coding experience to use CloutAgent?

No! CloutAgent is designed for both technical and non-technical users. The visual editor lets you build workflows by dragging and dropping nodes. However, some technical knowledge is helpful for:
- Writing effective system prompts
- Debugging complex workflows
- Integrating with external APIs
- Advanced configuration

### What do I need to get started?

**Required:**
- Node.js 22 or higher
- pnpm package manager
- Anthropic API key

**Optional:**
- MCP servers for external integrations
- Git for version control

### How much does CloutAgent cost?

CloutAgent itself is open-source and free. You only pay for:
- **Anthropic API usage**: Based on token consumption
- **Infrastructure**: If self-hosting (optional)

Typical costs:
- Simple workflows: $0.01 - $0.10 per execution
- Complex workflows: $0.10 - $1.00 per execution
- Development/testing: Nearly free with test mode

### What's the difference between CloutAgent and the Claude API?

| Feature | CloutAgent | Claude API |
|---------|-----------|------------|
| **Interface** | Visual workflow builder | Code-based integration |
| **Multi-agent** | Built-in support | Manual orchestration |
| **Testing** | Test mode with mocks | Custom implementation |
| **Monitoring** | Real-time dashboard | Custom logging |
| **Cost tracking** | Automatic | Manual calculation |
| **Learning curve** | Low (visual) | Higher (requires coding) |

CloutAgent is best for workflow building; Claude API is best for custom integrations.

## Workflow Design

### How do I choose between Sonnet, Opus, and Haiku?

**Use Claude Sonnet 4.5 when:**
- Most general-purpose tasks
- Good balance of quality and cost
- Speed matters
- Default choice when unsure

**Use Claude Opus 4 when:**
- Complex reasoning required
- Quality is critical
- Working on important/critical systems
- Budget allows premium pricing

**Use Claude Haiku 4 when:**
- Simple, well-defined tasks
- Speed is critical
- Processing large volumes
- Cost minimization is top priority

**Cost comparison:**
```
Haiku:  Input $0.25/M tokens, Output $1.25/M tokens
Sonnet: Input $3/M tokens,    Output $15/M tokens  (12x more than Haiku)
Opus:   Input $15/M tokens,   Output $75/M tokens  (5x more than Sonnet)
```

### When should I use subagents?

**Use subagents when:**
- Task requires specialized expertise (frontend, backend, database, etc.)
- Breaking down complex tasks into domains
- Running parallel workstreams
- Quality assurance (e.g., test-writing agent)

**Don't use subagents when:**
- Task is simple and single-domain
- Cost is critical constraint
- Logic is tightly coupled
- Speed is more important than specialization

**Cost impact:** Each subagent = separate API call. 5 subagents = 5x cost.

### What's the maximum workflow size?

**Technical limits:**
- Nodes: No hard limit (thousands possible)
- Connections: No hard limit
- Total workflow size: Limited by browser memory (~100MB JSON)

**Practical limits:**
- 10-20 nodes: Easy to manage
- 20-50 nodes: Consider grouping/organizing
- 50+ nodes: Break into sub-workflows

**Performance impact:**
- Large workflows may slow canvas rendering
- Use groups and collapsed sections
- Consider splitting into multiple workflows

### How do I handle errors in workflows?

**Best practices:**

**1. Validation Early:**
```
[Input] → [Validator] → [Process]
```

**2. Error Handlers:**
```
[Process] → [On Success] → [Output]
          ↓ [On Error] → [Error Handler]
```

**3. Retry Logic:**
```javascript
{
  "retry_policy": {
    "max_retries": 3,
    "backoff": "exponential"
  }
}
```

**4. Fallback Models:**
```javascript
{
  "primary": "claude-opus-4",
  "fallback": "claude-sonnet-4.5"
}
```

### Can I reuse workflows across projects?

**Yes!** Multiple ways:

**1. Export/Import:**
- Export workflow as JSON
- Import into another project
- Modify as needed

**2. Templates:**
- Save workflow as template
- Create new from template
- Customizable starting point

**3. Sub-workflows:**
- Reference workflows from other workflows
- Update once, affects all references

**4. Version Control:**
- Store workflows in Git
- Share with team
- Track changes over time

## Agent Configuration

### What's a system prompt and how do I write a good one?

A system prompt defines your agent's role, expertise, and behavior.

**Structure:**
```markdown
1. Role: "You are a [specific role]"
2. Expertise: "You specialize in [domain]"
3. Behavior: "When responding, you [guidelines]"
4. Format: "Format output as [structure]"
5. Constraints: "Never [restrictions]"
```

**Example:**
```markdown
You are a Python expert specializing in FastAPI backend development.

When writing code:
- Follow PEP 8 style guidelines
- Include comprehensive docstrings
- Add error handling for edge cases
- Use type hints for all functions

Format responses as:
- Code blocks with syntax highlighting
- Explanatory comments for complex logic
- Brief summary of changes

Never:
- Use deprecated libraries
- Ignore security best practices
- Generate code without error handling
```

**Tips:**
- Be specific, not generic
- Include examples of desired output
- Set clear boundaries
- Test and iterate

### What temperature should I use?

**Temperature controls randomness (0.0 - 1.0):**

**0.0 - 0.3 (Deterministic):**
- Code generation
- Factual content
- Structured data
- Consistent outputs
- Example: 0.2 for SQL query generation

**0.4 - 0.7 (Balanced):**
- General tasks
- Documentation
- Problem-solving
- Good default
- Example: 0.5 for technical writing

**0.8 - 1.0 (Creative):**
- Creative writing
- Brainstorming
- Varied outputs
- Idea generation
- Example: 0.9 for marketing copy

**Default:** 0.7 is a good starting point for most tasks.

### How many tokens should I set for max_tokens?

**Guidelines:**

**Short (100-500 tokens):**
- Yes/no answers
- Brief summaries
- Simple classifications

**Medium (500-2000 tokens):**
- Code snippets
- Explanations
- Short documentation

**Long (2000-4000 tokens):**
- Complete functions/classes
- Detailed guides
- Complex analyses

**Maximum (4000-8192 tokens):**
- Full documentation
- Large code files
- Comprehensive reports

**Tip:** Set to 2x what you expect. Output tokens cost 5x more than input, so don't over-allocate.

### Can I use my own prompts from other tools?

**Yes!** Prompts are transferable, but optimize for Claude:

**Adjustments needed:**
- Claude doesn't need "As an AI assistant" preambles
- Be more direct and specific
- Use markdown formatting
- Include examples for complex tasks

**Migration checklist:**
- Remove generic AI assistant language
- Add Claude-specific formatting
- Test and validate outputs
- Adjust temperature if needed

## Execution and Testing

### How do I test workflows without spending money?

**Use Test Mode:**

**1. Dry Run (Free):**
- Validates structure and configuration
- No API calls
- Instant feedback
- Perfect for development

**2. Test Mode with Mocks (Free):**
- Simulates execution with mock data
- No API calls
- Tests logic and flow
- Great for iteration

**3. Live Test (Costs):**
- Real API calls
- Actual model responses
- Use sparingly
- Final validation before production

**Development workflow:**
```
1. Build: Use dry run after each change
2. Iterate: Use test mode with mocks
3. Validate: Use live test once before deployment
4. Deploy: Run in production
```

### What happens if a workflow fails mid-execution?

**CloutAgent handles failures gracefully:**

**1. Error Capture:**
- Error logged with full context
- Execution marked as failed
- Partial results saved

**2. Cleanup:**
- Resources released
- Connections closed
- State cleaned up

**3. Recovery Options:**
- Retry from beginning
- Resume from last checkpoint (if configured)
- Manual intervention

**4. Cost Protection:**
- No charge for failed completions
- Only charged for successful API calls
- Failed retries don't multiply costs

**Best practice:** Implement error handlers and checkpoints for critical workflows.

### Can I schedule workflows to run automatically?

**Not built-in yet, but you can:**

**1. Use Cron + CLI:**
```bash
# crontab entry
0 9 * * * cloutagent execute --workflow=daily-report
```

**2. GitHub Actions:**
```yaml
on:
  schedule:
    - cron: '0 9 * * *'
jobs:
  run-workflow:
    runs-on: ubuntu-latest
    steps:
      - name: Execute workflow
        run: cloutagent execute --workflow=daily-report
```

**3. External Scheduler:**
- Use Zapier, Make, or n8n
- Trigger via webhook
- Monitor execution

**Coming soon:** Built-in scheduler in future release.

### How long does a workflow execution take?

**Typical execution times:**

**Simple workflows (1-2 nodes):**
- 2-5 seconds
- Mostly network latency

**Medium workflows (3-10 nodes):**
- 5-30 seconds
- Depends on model and token count

**Complex workflows (10+ nodes, subagents):**
- 30 seconds - 3 minutes
- Multiple API calls add up

**Factors affecting speed:**
- Model choice (Haiku fastest, Opus slowest)
- Token count (more tokens = longer)
- Network latency
- Parallel vs sequential execution
- Number of subagents

**Optimization tips:**
- Use Haiku for non-critical tasks
- Parallelize independent nodes
- Reduce context/prompt size
- Enable streaming for better UX

## Cost and Billing

### How much do workflows typically cost?

**Typical costs per execution:**

**Simple code generation:**
- Model: Sonnet 4.5
- Tokens: ~500 input, ~1000 output
- Cost: ~$0.02 per execution

**Code review with subagents:**
- Model: Sonnet 4.5
- Subagents: 3
- Tokens: ~2000 input, ~3000 output per agent
- Cost: ~$0.30 per execution

**Complex multi-agent workflow:**
- Models: Mix of Sonnet and Opus
- Agents: 5-10
- Tokens: ~5000 input, ~8000 output total
- Cost: ~$1.00-2.00 per execution

**Cost optimization:**
- Use test mode during development (free)
- Choose appropriate models
- Set reasonable max_tokens
- Cache common prompts
- Monitor and optimize bottlenecks

### Can I set a budget limit?

**Yes! Multiple ways:**

**1. Workflow-level Budget:**
```javascript
{
  "budget": {
    "max_cost_usd": 1.00,
    "abort_on_exceed": true
  }
}
```

**2. Project-level Budget:**
```javascript
{
  "daily_budget_usd": 50,
  "monthly_budget_usd": 1000,
  "alert_at_percent": 80
}
```

**3. Account-level (Anthropic Console):**
- Set spending limits
- Receive alerts
- Auto-pause on limit

**Best practice:** Start with low limits, increase as you validate costs.

### Does CloutAgent charge additional fees?

**No!** CloutAgent is free and open-source.

**You only pay for:**
- Anthropic API usage (direct to Anthropic)
- Infrastructure if self-hosting (optional)

**No hidden fees:**
- No per-execution charges
- No subscription fees
- No markup on API costs
- No platform fees

## Integration and MCP

### What is MCP and do I need it?

**MCP (Model Context Protocol)** is a standard for connecting AI agents to external tools.

**You need MCP if you want to:**
- Read/write files
- Query databases
- Call external APIs
- Execute code
- Access web services

**You don't need MCP for:**
- Pure text generation
- Code generation (without execution)
- Analysis and review tasks
- Workflows using only built-in features

**Popular MCP servers:**
- File system operations
- GitHub integration
- Database connectors
- Web search
- Custom tools

### How do I connect to external APIs?

**Three approaches:**

**1. MCP Integration (Recommended):**
```javascript
{
  "mcp_server": "http://localhost:3002",
  "tool": "api_caller",
  "config": {
    "endpoint": "https://api.example.com",
    "auth": "{{secrets.api_token}}"
  }
}
```

**2. HTTP Node:**
```javascript
{
  "type": "http_request",
  "url": "https://api.example.com/data",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer {{secrets.token}}"
  }
}
```

**3. Custom Agent with Instructions:**
```javascript
{
  "system_prompt": "Call the API at {{api_endpoint}} and parse the JSON response..."
}
```

**Security tip:** Always use secrets for API keys, never hardcode.

### Can I use CloutAgent with other AI models?

**Currently:** CloutAgent is built specifically for Anthropic's Claude models.

**Future plans:**
- OpenAI GPT support planned
- Local model support (Ollama, etc.) planned
- Multi-model workflows planned

**Current workaround:**
- Use MCP to call other models
- Integrate via custom API calls
- Use Claude as orchestrator

## Data and Privacy

### Where is my workflow data stored?

**Local installation:**
- SQLite database in `./data` directory
- Workflow files on your filesystem
- Full control over data

**Cloud deployment (if you deploy):**
- Your chosen cloud provider
- You control database and storage
- CloutAgent doesn't host data

**Security:**
- Secrets encrypted with AES-256
- API keys never logged
- Execution logs on your infrastructure

### Is my data sent to Anthropic?

**Yes, when executing workflows:**
- Prompts sent to Claude API
- Responses received from Claude
- Normal API communication

**Anthropic's data handling:**
- API data not used for training (by default)
- Retained for 30 days for abuse monitoring
- Can opt-out of retention (Enterprise)
- See [Anthropic Privacy Policy](https://www.anthropic.com/legal/privacy)

**What's NOT sent:**
- Workflow structure/configuration
- Secrets (except when used in prompts)
- Execution metadata
- User information

### Can I use CloutAgent offline?

**Partially:**

**Offline capabilities:**
- Create and edit workflows
- Validate workflows (dry run)
- Import/export workflows
- Browse documentation

**Online required for:**
- Executing workflows (needs Claude API)
- MCP integrations (if using external servers)
- Downloading updates

**Future:** Local model support planned for fully offline usage.

### How do I delete my data?

**Local installation:**
```bash
# Delete all project data
rm -rf ./data

# Delete specific project
rm ./data/projects/{project-id}.json

# Delete execution history
rm -rf ./data/executions
```

**Anthropic API data:**
- Automatically deleted after 30 days
- Cannot manually delete (Anthropic policy)
- Don't send sensitive data in prompts

**Best practice:** Implement data retention policy in your workflow configuration.

## Troubleshooting

### Why is my workflow so slow?

**Common causes:**

**1. Wrong model:**
- Opus 4 is slower than Sonnet
- Solution: Use Haiku or Sonnet for speed

**2. Large context:**
- Huge system prompts slow processing
- Solution: Reduce prompt size

**3. Sequential execution:**
- Nodes running one after another
- Solution: Parallelize independent tasks

**4. High max_tokens:**
- More tokens = longer generation
- Solution: Set appropriate limits

**5. Network latency:**
- Slow internet connection
- Solution: Check connectivity

**Debug:**
- View execution timeline
- Identify slowest nodes
- Optimize bottlenecks

### Why did my workflow fail with "Invalid API Key"?

**Common causes:**

**1. Wrong key format:**
- Must start with `sk-ant-`
- Check for typos

**2. Environment not loaded:**
- Restart application after .env changes
- Verify with `echo $ANTHROPIC_API_KEY`

**3. Key revoked:**
- Check Anthropic Console
- Generate new key if needed

**4. Workspace vs Personal:**
- Use personal key for development
- Workspace keys may have restrictions

**Solution:** See [Common Errors - Authentication](./common-errors.md#authentication-errors)

### How do I debug a failing workflow?

**Debugging steps:**

**1. Check Execution Logs:**
```
Execution Details → Logs Tab → Filter: Errors
```

**2. Run Dry Run:**
```
Test → Dry Run → Review validation errors
```

**3. Test with Mock Data:**
```
Test → Test Mode → Use known-good inputs
```

**4. Isolate Problem Node:**
- Disable nodes one by one
- Find which node causes failure

**5. Simplify Input:**
- Test with minimal example
- Add complexity gradually

**6. Check Configuration:**
- Review all node settings
- Verify variables/secrets exist

**7. Review API Limits:**
- Check rate limits
- Verify sufficient credits

**Tools:**
- Execution timeline
- Node-by-node logs
- Token usage tracker
- Error stack traces

## Community and Support

### Where can I get help?

**Self-service:**
- [Documentation](../getting-started.md)
- [Common Errors](./common-errors.md)
- [FAQ](./faq.md) (you are here!)

**Community:**
- GitHub Discussions
- Discord server
- Stack Overflow (tag: cloutagent)

**Direct support:**
- Email: support@cloutagent.com
- GitHub Issues (bugs/features)

**Response times:**
- Community: Usually within hours
- GitHub Issues: 1-2 business days
- Email support: 1-3 business days

### How can I contribute?

**Ways to contribute:**

**1. Code:**
- Fix bugs
- Add features
- Improve performance
- Submit pull requests

**2. Documentation:**
- Fix typos
- Add examples
- Improve guides
- Write tutorials

**3. Community:**
- Answer questions
- Share workflows
- Write blog posts
- Create videos

**4. Feedback:**
- Report bugs
- Request features
- Share use cases
- Provide testimonials

**Start here:**
- Read [Contributing Guide](../../CONTRIBUTING.md)
- Check [Good First Issues](https://github.com/yfedoseev/cloutagent/labels/good-first-issue)
- Join Discord to discuss ideas

### Is CloutAgent open source?

**Yes!** CloutAgent is fully open source.

**License:** MIT License

**What this means:**
- Free to use, even commercially
- Can modify and customize
- Can redistribute
- No warranty or liability

**Source code:**
- GitHub: [github.com/yfedoseev/cloutagent](https://github.com/yfedoseev/cloutagent)
- Full transparency
- Community-driven development

### Will there be a hosted/cloud version?

**Not currently, but:**

**Self-hosting is easy:**
- Deploy to your cloud (AWS, GCP, Azure)
- Use Docker for simplicity
- Full control over infrastructure

**Potential future:**
- Hosted version may be offered
- Would be optional (self-host always available)
- Community feedback will guide decision

**For now:**
- Self-host on your infrastructure
- Deploy guides available
- Community Docker images

## Best Practices

### What are the top 5 best practices?

**1. Test before production:**
- Use dry run for validation
- Use test mode for logic verification
- Use live test sparingly
- Save working versions

**2. Start simple, then expand:**
- Build basic workflow first
- Test and validate
- Add complexity incrementally
- Don't over-engineer

**3. Choose right models:**
- Haiku for simple/fast tasks
- Sonnet for most tasks (default)
- Opus only when needed
- Monitor costs

**4. Write specific prompts:**
- Define role clearly
- Provide examples
- Set expectations
- Include constraints

**5. Monitor and optimize:**
- Track execution costs
- Review slow workflows
- Optimize bottlenecks
- Iterate based on data

### How do I scale workflows for production?

**Production checklist:**

**1. Error Handling:**
- [ ] Retry logic configured
- [ ] Error handlers in place
- [ ] Fallback strategies defined
- [ ] Logging enabled

**2. Performance:**
- [ ] Bottlenecks optimized
- [ ] Parallel execution where possible
- [ ] Appropriate timeouts set
- [ ] Resource limits configured

**3. Cost Control:**
- [ ] Budget limits set
- [ ] Cost alerts configured
- [ ] Model selection optimized
- [ ] Token limits appropriate

**4. Monitoring:**
- [ ] Success rate tracked
- [ ] Execution time monitored
- [ ] Cost tracked
- [ ] Alerts configured

**5. Security:**
- [ ] Secrets properly managed
- [ ] Input validation in place
- [ ] Least privilege permissions
- [ ] Audit logging enabled

**6. Reliability:**
- [ ] Tested with production data
- [ ] Load tested
- [ ] Disaster recovery plan
- [ ] Backups configured

---

**More questions?** Join our [Discord community](https://discord.gg/cloutagent) or check the [full documentation](../getting-started.md).
