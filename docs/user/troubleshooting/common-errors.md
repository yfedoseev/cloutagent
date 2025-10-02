# Common Errors and Solutions

This guide covers the most frequently encountered errors in CloutAgent and provides step-by-step solutions to resolve them.

## Authentication Errors

### Error: "Invalid API Key"

**Symptom:**
```
Error: Authentication failed
Details: Invalid API key provided
Status: 401 Unauthorized
```

**Causes:**
- API key is incorrect or malformed
- API key has been revoked
- API key not set in environment

**Solutions:**

**1. Verify API Key Format:**
```bash
# Anthropic API keys start with "sk-ant-"
echo $ANTHROPIC_API_KEY
# Should output: sk-ant-api03-...
```

**2. Check Environment Configuration:**
```bash
# Verify .env file exists and contains key
cat .env | grep ANTHROPIC_API_KEY

# If missing, add it
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" >> .env
```

**3. Restart Application:**
```bash
# Environment changes require restart
pnpm dev
```

**4. Verify Key in Anthropic Console:**
- Visit [console.anthropic.com](https://console.anthropic.com/)
- Check "API Keys" section
- Verify key is active
- Generate new key if needed

[Screenshot: Anthropic Console API Keys page]

### Error: "API Key Permissions Insufficient"

**Symptom:**
```
Error: Permission denied
Details: API key lacks required permissions
Status: 403 Forbidden
```

**Causes:**
- Using workspace key instead of personal key
- API key has restricted permissions
- Organization policy restrictions

**Solutions:**

**1. Use Correct Key Type:**
```bash
# Personal API keys have full permissions
# Workspace keys may have restrictions
```

**2. Check Key Permissions:**
- Log into Anthropic Console
- Review key permissions
- Use unrestricted key for development

**3. Contact Administrator:**
- If using organization account
- Request necessary permissions
- Or use personal account for development

### Error: "Rate Limit Exceeded"

**Symptom:**
```
Error: Rate limit exceeded
Details: Too many requests. Retry after 60 seconds.
Status: 429 Too Many Requests
Headers: Retry-After: 60
```

**Causes:**
- Exceeded requests per minute limit
- Exceeded tokens per minute limit
- Burst traffic spike

**Solutions:**

**1. Implement Retry Logic:**
```javascript
{
  "retry_policy": {
    "max_retries": 3,
    "respect_retry_after": true,
    "exponential_backoff": true
  }
}
```

**2. Add Rate Limiting:**
```javascript
{
  "rate_limit": {
    "requests_per_minute": 50,
    "queue_excess": true
  }
}
```

**3. Upgrade API Tier:**
- Visit Anthropic Console
- Review usage limits
- Upgrade to higher tier if needed

**4. Optimize Request Frequency:**
```javascript
// Batch operations instead of rapid individual calls
{
  "batch_size": 10,
  "delay_between_batches_ms": 1000
}
```

[Screenshot: Rate limit error with retry-after header]

## Execution Errors

### Error: "Workflow Execution Failed"

**Symptom:**
```
Error: Workflow execution failed
Node: code_generator
Details: Model request failed after 3 retries
```

**Causes:**
- Network connectivity issues
- Model timeout
- Invalid configuration
- Malformed input

**Solutions:**

**1. Check Error Details:**
```bash
# View detailed execution log
View execution → Logs tab → Filter: Errors
```

**2. Validate Workflow Configuration:**
```bash
# Run dry run to check configuration
Test → Dry Run
```

**3. Verify Network Connectivity:**
```bash
# Test connection to Anthropic API
curl -I https://api.anthropic.com
```

**4. Check Model Availability:**
```javascript
// Verify model name is correct
{
  "model": "claude-sonnet-4.5"  // ✅ Correct
  "model": "claude-4-sonnet"    // ❌ Incorrect
}
```

**5. Review Input Data:**
- Check for empty or null inputs
- Verify data format matches expectations
- Test with minimal example input

### Error: "Node Connection Invalid"

**Symptom:**
```
Error: Invalid connection
Details: Cannot connect Text output to File input
Expected type: File
Received type: Text
```

**Causes:**
- Output type doesn't match input type
- Missing data transformation
- Incorrect node configuration

**Solutions:**

**1. Check Connection Types:**
```
Node A output: Text
Node B input: Text
Result: ✅ Valid connection

Node A output: Text
Node B input: File
Result: ❌ Invalid connection
```

**2. Add Data Transformation:**
```
[Text Node] → [Text-to-File Transformer] → [File Node]
```

**3. Verify Node Configuration:**
- Check node output type in property panel
- Check target node input type
- Ensure types are compatible

**4. Use Type Converters:**
```javascript
{
  "transform": {
    "from": "text",
    "to": "file",
    "method": "write_to_file"
  }
}
```

[Screenshot: Connection type mismatch error]

### Error: "Timeout Exceeded"

**Symptom:**
```
Error: Execution timeout
Details: Node "code_generator" exceeded 30s timeout
Partial output may be available
```

**Causes:**
- Complex task taking too long
- Large output generation
- Slow network connection
- Model overload

**Solutions:**

**1. Increase Timeout:**
```javascript
{
  "timeout_ms": 60000  // Increase from 30s to 60s
}
```

**2. Reduce Task Complexity:**
```javascript
// Break large task into smaller chunks
{
  "max_tokens": 2000  // Instead of 8000
}
```

**3. Use Faster Model:**
```javascript
{
  "model": "claude-haiku-4"  // Faster than Opus
}
```

**4. Enable Partial Results:**
```javascript
{
  "allow_partial_output": true,
  "return_on_timeout": true
}
```

### Error: "Insufficient Credits"

**Symptom:**
```
Error: Payment required
Details: Insufficient API credits
Status: 402 Payment Required
```

**Causes:**
- API credits depleted
- Payment method failed
- Billing issue

**Solutions:**

**1. Check Credit Balance:**
- Visit Anthropic Console
- Navigate to Billing section
- Review current balance

**2. Add Credits:**
- Add payment method
- Purchase additional credits
- Set up auto-reload

**3. Monitor Usage:**
```javascript
{
  "cost_tracking": {
    "enabled": true,
    "alert_threshold_usd": 10,
    "daily_budget_usd": 50
  }
}
```

[Screenshot: Anthropic billing dashboard]

## Configuration Errors

### Error: "Invalid System Prompt"

**Symptom:**
```
Error: Configuration invalid
Details: System prompt exceeds maximum length
Maximum: 100,000 characters
Provided: 125,000 characters
```

**Causes:**
- System prompt too long
- Prompt contains invalid characters
- Formatting issues

**Solutions:**

**1. Shorten System Prompt:**
```javascript
// ❌ Too verbose
{
  "system_prompt": "You are an expert in... [50,000 words of detailed instructions]"
}

// ✅ Concise
{
  "system_prompt": "You are a Python expert. Follow PEP 8. Include docstrings."
}
```

**2. Extract to External File:**
```javascript
{
  "system_prompt_file": "./prompts/code_reviewer.txt"
}
```

**3. Use Template Variables:**
```javascript
{
  "system_prompt": "{{base_prompt}} Additional context: {{context}}"
}
```

### Error: "Missing Required Variable"

**Symptom:**
```
Error: Variable not found
Details: Required variable "api_endpoint" is not defined
Referenced in: Node "API Caller"
```

**Causes:**
- Variable referenced but not created
- Typo in variable name
- Variable deleted after being referenced

**Solutions:**

**1. Create Missing Variable:**
```bash
# Navigate to Variables section
# Click "Add Variable"
# Name: api_endpoint
# Value: https://api.example.com
```

**2. Check Variable Name:**
```javascript
// Ensure exact name match (case-sensitive)
Reference: {{api_endpoint}}
Variable: api_endpoint  // ✅ Match
Variable: API_endpoint  // ❌ No match
```

**3. Update References:**
```bash
# Search workflow for variable references
# Update to correct variable name
```

[Screenshot: Variable creation dialog]

### Error: "Secret Decryption Failed"

**Symptom:**
```
Error: Secret access denied
Details: Unable to decrypt secret "database_password"
```

**Causes:**
- Secret encryption key changed
- Secret corrupted
- Permission issue

**Solutions:**

**1. Re-create Secret:**
```bash
# Delete old secret
# Create new secret with same name
# Update secret value
```

**2. Check Permissions:**
```bash
# Verify you have access to secret
# Check project permissions
```

**3. Verify Encryption Key:**
```bash
# Check ENCRYPTION_KEY in .env
# Ensure it hasn't changed
# If changed, secrets must be re-created
```

## Node-Specific Errors

### Agent Node Errors

**Error: "Model Not Found"**

```
Error: Invalid model
Details: Model "claude-sonnet-4" not found
Available: claude-sonnet-4.5, claude-opus-4, claude-haiku-4
```

**Solution:**
```javascript
// Use exact model name
{
  "model": "claude-sonnet-4.5"  // ✅ Correct
}
```

**Error: "Temperature Out of Range"**

```
Error: Invalid parameter
Details: Temperature must be between 0.0 and 1.0
Provided: 1.5
```

**Solution:**
```javascript
{
  "temperature": 0.7  // ✅ Valid (0.0 - 1.0)
}
```

**Error: "Max Tokens Exceeded Limit"**

```
Error: Invalid parameter
Details: max_tokens cannot exceed 8192
Provided: 10000
```

**Solution:**
```javascript
{
  "max_tokens": 8192  // ✅ Maximum allowed
}
```

### Subagent Node Errors

**Error: "Invalid Subagent Type"**

```
Error: Unknown subagent type
Details: Subagent type "mobile-engineer" not found
Available types: frontend-engineer, backend-engineer, etc.
```

**Solution:**
```javascript
// Use valid subagent type
{
  "type": "frontend-engineer"  // ✅ Valid
}
```

**Error: "Subagent Context Too Large"**

```
Error: Context size exceeded
Details: Subagent context exceeds 100,000 tokens
Consider reducing context size
```

**Solution:**
```javascript
{
  "context": "Concise, focused context instead of entire codebase"
}
```

### MCP Node Errors

**Error: "MCP Server Connection Failed"**

```
Error: Connection failed
Details: Unable to connect to MCP server at localhost:3002
```

**Solutions:**

**1. Verify Server Running:**
```bash
# Check if MCP server is running
curl http://localhost:3002/health
```

**2. Check Configuration:**
```javascript
{
  "mcp_server_url": "http://localhost:3002",  // Verify URL
  "timeout_ms": 5000
}
```

**3. Review Server Logs:**
```bash
# Check MCP server logs for errors
tail -f /var/log/mcp-server.log
```

**Error: "Tool Not Found"**

```
Error: Unknown tool
Details: Tool "custom_analyzer" not found in MCP server
```

**Solutions:**

**1. List Available Tools:**
```bash
# Query MCP server for available tools
curl http://localhost:3002/tools
```

**2. Verify Tool Name:**
```javascript
{
  "tool": "file_reader"  // ✅ Correct name
}
```

**3. Update MCP Server:**
```bash
# Ensure MCP server is latest version
npm update @modelcontextprotocol/server
```

[Screenshot: MCP connection settings]

## Performance Issues

### Problem: "Workflow Execution Too Slow"

**Symptoms:**
- Execution takes minutes instead of seconds
- UI becomes unresponsive
- High API costs

**Diagnosis:**

**1. Check Execution Timeline:**
```bash
# View detailed execution timeline
Execution Details → Timeline Tab
# Identify slowest nodes
```

**2. Review Token Usage:**
```bash
# Check token consumption per node
Execution Details → Tokens Tab
# Look for unexpectedly high counts
```

**Solutions:**

**1. Optimize Slow Nodes:**
```javascript
// Use faster model for non-critical tasks
{
  "model": "claude-haiku-4",  // Instead of Opus
  "max_tokens": 1000  // Instead of 4000
}
```

**2. Parallelize Independent Tasks:**
```
// ❌ Sequential (slow)
[A] → [B] → [C]  // 3s + 3s + 3s = 9s

// ✅ Parallel (fast)
[A] →
[B] → [Combine]  // max(3s, 3s, 3s) = 3s
[C] →
```

**3. Reduce Context Size:**
```javascript
{
  "system_prompt": "Concise prompt",  // Not 10,000 words
  "input": "Relevant data only"  // Not entire codebase
}
```

**4. Enable Streaming:**
```javascript
{
  "streaming": true  // Show progress immediately
}
```

[Screenshot: Execution timeline showing bottleneck]

### Problem: "High Memory Usage"

**Symptoms:**
- Browser tab crashes
- System becomes sluggish
- Out of memory errors

**Solutions:**

**1. Clear Execution History:**
```bash
# Settings → Clear old executions
# Keep last 100 instead of all
```

**2. Reduce Canvas Complexity:**
```bash
# Collapse node groups
# Hide comments layer
# Simplify visualizations
```

**3. Close Unused Projects:**
```bash
# Close projects you're not actively working on
# Free up memory for active project
```

**4. Use Simplified View:**
```bash
# Settings → Performance → Enable simplified view
# Reduces visual complexity
```

## Data Issues

### Error: "Invalid JSON in Variable"

**Symptom:**
```
Error: JSON parse failed
Details: Unexpected token in JSON at position 42
Variable: config_data
```

**Causes:**
- Malformed JSON syntax
- Unescaped quotes
- Trailing commas

**Solutions:**

**1. Validate JSON:**
```bash
# Use online JSON validator
# Or command line tool
echo '{"key": "value"}' | jq .
```

**2. Fix Common Issues:**
```javascript
// ❌ Trailing comma
{"key": "value",}

// ✅ No trailing comma
{"key": "value"}

// ❌ Unescaped quotes
{"message": "He said "hello""}

// ✅ Escaped quotes
{"message": "He said \"hello\""}
```

**3. Use JSON Editor:**
```bash
# Use built-in JSON editor with validation
# Highlights syntax errors automatically
```

### Error: "Data Type Mismatch"

**Symptom:**
```
Error: Type error
Details: Expected number, received string
Field: max_retries
Value: "3" (string)
```

**Solution:**
```javascript
// ❌ String instead of number
{
  "max_retries": "3"
}

// ✅ Correct type
{
  "max_retries": 3
}
```

## File and Storage Errors

### Error: "Unable to Save Workflow"

**Symptom:**
```
Error: Save failed
Details: Permission denied writing to disk
```

**Solutions:**

**1. Check Disk Space:**
```bash
df -h
# Ensure sufficient free space
```

**2. Verify Permissions:**
```bash
# Check write permissions on data directory
ls -la ./data
chmod 755 ./data
```

**3. Try Save As:**
```bash
# File → Save As → New location
```

### Error: "Import Failed"

**Symptom:**
```
Error: Import failed
Details: Invalid workflow format
File: workflow.json
```

**Solutions:**

**1. Validate JSON:**
```bash
# Ensure file is valid JSON
jq . workflow.json
```

**2. Check Version Compatibility:**
```javascript
{
  "workflow_version": "1.0.0",  // Check if compatible
  "required_version": ">=1.0.0"
}
```

**3. Try Example Workflow:**
```bash
# Verify import works with known-good file
# Import example workflow from docs
```

## Getting Help

If you can't resolve an error:

### 1. Check Documentation
- [FAQ](./faq.md)
- [Debugging Guide](./debugging.md)
- [API Reference](../../api/)

### 2. Search Community
- GitHub Discussions
- Discord server
- Stack Overflow (tag: cloutagent)

### 3. Report Bug
```bash
# Include this information:
- Error message (full text)
- Steps to reproduce
- CloutAgent version
- Environment (OS, Node version)
- Relevant workflow configuration
- Execution logs
```

### 4. Contact Support
- Email: support@cloutagent.com
- Include account information
- Describe issue in detail
- Attach logs and screenshots

[Screenshot: Support ticket form]

## Error Prevention

Best practices to avoid common errors:

### 1. Use Dry Run Before Execution
```bash
# Always test with dry run first
Test → Dry Run → Verify → Execute
```

### 2. Validate Configuration
```bash
# Use built-in validators
Tools → Validate Configuration
```

### 3. Monitor Execution Logs
```bash
# Watch for warnings
# Address issues early
```

### 4. Keep Software Updated
```bash
# Update regularly
pnpm update
```

### 5. Back Up Workflows
```bash
# Export workflows regularly
# Store in version control
```

## Next Steps

- **[Debugging Guide](./debugging.md)**: Advanced debugging techniques
- **[FAQ](./faq.md)**: Frequently asked questions
- **[Best Practices](../best-practices/)**: Avoid common pitfalls

---

**Still stuck?** Join our [Discord community](https://discord.gg/cloutagent) for real-time help from other users and the CloutAgent team.
