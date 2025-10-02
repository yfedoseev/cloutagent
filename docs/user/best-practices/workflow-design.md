# Workflow Design Best Practices

Designing effective AI workflows is both an art and a science. This guide shares proven patterns, principles, and practices for building workflows that are reliable, cost-efficient, and maintainable.

## Design Principles

Follow these core principles when designing workflows:

### 1. Single Responsibility Principle

Each node should have one clear purpose:

```markdown
❌ Bad: "Generate code, review it, format it, and deploy"
✅ Good: Separate nodes for generate, review, format, deploy
```

**Why it matters:**
- Easier to test individual components
- Simpler to debug when issues arise
- More reusable across workflows
- Better separation of concerns

**Example:**
```
[Input] → [Generator] → [Reviewer] → [Formatter] → [Deployer] → [Output]
```

### 2. Fail Fast, Fail Clearly

Validate inputs early and provide clear error messages:

```javascript
// Validation node at workflow start
{
  "name": "Input Validator",
  "rules": {
    "code_required": "Input must include code to review",
    "max_length": "Code must be under 10,000 characters",
    "valid_language": "Language must be one of: python, javascript, typescript"
  }
}
```

**Benefits:**
- Save API costs by catching errors before execution
- Provide actionable feedback to users
- Prevent cascading failures downstream

### 3. Design for Idempotency

Workflows should produce the same result when run multiple times with the same input:

```markdown
❌ "Append timestamp to generated code"
✅ "Generate code with deterministic output (temperature=0.2)"
```

**Implementation:**
- Use low temperature for consistent outputs
- Avoid random elements unless necessary
- Make external API calls idempotent
- Use versioning for non-idempotent operations

### 4. Progressive Enhancement

Build workflows in layers, from simple to complex:

**Layer 1: Core Functionality**
```
[Input] → [Main Agent] → [Output]
```

**Layer 2: Add Quality Control**
```
[Input] → [Validator] → [Main Agent] → [Reviewer] → [Output]
```

**Layer 3: Add Error Handling**
```
[Input] → [Validator] → [Main Agent] → [Reviewer] → [Error Handler] → [Output]
```

**Layer 4: Add Optimization**
```
[Input] → [Validator] → [Preprocessor] → [Main Agent] → [Reviewer] → [Optimizer] → [Error Handler] → [Output]
```

### 5. Separation of Configuration and Logic

Store configuration separately from workflow logic:

```javascript
// ❌ Hardcoded configuration
{
  "system_prompt": "You are a Python expert...",
  "model": "claude-sonnet-4.5",
  "max_tokens": 4000
}

// ✅ Configuration from variables
{
  "system_prompt": "{{expert_prompt}}",
  "model": "{{preferred_model}}",
  "max_tokens": "{{max_output_tokens}}"
}
```

**Benefits:**
- Easy to adjust without modifying workflow
- Different configs for dev/staging/production
- A/B testing configurations
- Team members can tune without technical knowledge

## Common Workflow Patterns

Proven patterns for common scenarios:

### Sequential Processing Pattern

Use when: Tasks must happen in specific order

```
[Input] → [Step 1] → [Step 2] → [Step 3] → [Output]
```

**Example: Code Generation Pipeline**
```
[Requirements] → [Generate Code] → [Add Tests] → [Review Code] → [Format Code] → [Output]
```

**Best Practices:**
- Each step validates input from previous step
- Pass complete context forward
- Add checkpoints for long pipelines
- Enable partial recovery on failure

[Diagram: Sequential processing flow]

### Parallel Processing Pattern

Use when: Multiple independent tasks can run simultaneously

```
                    → [Agent 1] →
[Input] → [Splitter]→ [Agent 2] → [Aggregator] → [Output]
                    → [Agent 3] →
```

**Example: Multi-Language Code Generation**
```
                    → [Python Generator] →
[Spec] → [Parse]   → [JavaScript Generator] → [Combine] → [Output]
                    → [TypeScript Generator] →
```

**Best Practices:**
- Ensure tasks are truly independent
- Set timeout for slowest task
- Handle partial failures gracefully
- Aggregate results consistently

[Diagram: Parallel processing flow]

### Conditional Branching Pattern

Use when: Different paths based on conditions

```
              → [Path A] →
[Input] → [Decision]      → [Merge] → [Output]
              → [Path B] →
```

**Example: Code Review with Complexity Detection**
```
                    → [Simple Review] →
[Code] → [Analyze] → [Decision]        → [Format] → [Output]
                    → [Deep Review] →
```

**Decision Logic:**
```javascript
{
  "condition": "code.lines < 100 && code.complexity < 5",
  "if_true": "simple_review_path",
  "if_false": "deep_review_path"
}
```

**Best Practices:**
- Make conditions explicit and testable
- Ensure all paths converge or handle separately
- Log which path was taken
- Validate outputs from both paths

[Diagram: Conditional branching flow]

### Iterative Refinement Pattern

Use when: Output quality improves with multiple passes

```
[Input] → [Generate] → [Review] → [Good Enough?] → [Output]
                ↑                         ↓
                └───── [Refine] ←─────────┘
```

**Example: Code Quality Improvement**
```
[Spec] → [Generate Code] → [Review] → [Pass Quality Check?] → [Output]
              ↑                              ↓
              └───── [Apply Fixes] ←─────────┘
```

**Best Practices:**
- Set maximum iteration count (prevent infinite loops)
- Define clear success criteria
- Track improvements per iteration
- Cost-cap the refinement process

### Subagent Delegation Pattern

Use when: Complex task requires specialized expertise

```
                    → [Frontend Expert] →
[Task] → [Analyzer]→ [Backend Expert]  → [Integrator] → [Output]
                    → [Database Expert] →
```

**Example: Full-Stack Feature Development**
```
                    → [frontend-engineer: UI Components] →
[Feature] → [Plan] → [backend-engineer: API Endpoints]  → [Combine] → [Output]
                    → [database-engineer: Schema Design] →
```

**Best Practices:**
- Use specialized subagent types appropriately
- Provide complete context to each subagent
- Define clear interfaces between subagents
- Have a coordinator agent for complex tasks

[Diagram: Subagent delegation flow]

### Pipeline with Fallback Pattern

Use when: Primary approach might fail, need backup

```
[Input] → [Primary Agent] → [Success?] → [Output]
                    ↓           ↓
                 [Failed]      [Yes]
                    ↓
              [Fallback Agent] → [Output]
```

**Example: Code Generation with Fallback**
```
[Spec] → [Opus 4: Complex Generation] → [Valid?] → [Output]
                    ↓                      ↓
                 [Failed/Timeout]         [Yes]
                    ↓
         [Sonnet 4.5: Simpler Approach] → [Output]
```

**Best Practices:**
- Use cheaper/faster model as fallback
- Log fallback usage for monitoring
- Simplify requirements for fallback path
- Set clear failure criteria

## When to Use Subagents

Subagents are powerful but add complexity. Use them when:

### Good Use Cases

**Specialized Expertise Required:**
```
Task: "Build a full authentication system"
→ Use frontend-engineer for login UI
→ Use backend-engineer for JWT handling
→ Use database-engineer for user schema
```

**Parallel Workstreams:**
```
Task: "Implement feature across stack"
→ Run frontend and backend subagents in parallel
→ Reduce total execution time
→ Each focuses on their domain
```

**Quality Assurance:**
```
Task: "Generate production-ready code"
→ Main agent: Generate initial implementation
→ software-engineer-test subagent: Create test suite
→ Combine for complete solution
```

**Domain-Specific Tasks:**
```
Task: "Optimize database query performance"
→ database-engineer subagent has specialized knowledge
→ Better results than general agent
→ More targeted recommendations
```

### When NOT to Use Subagents

**Simple, Single-Domain Tasks:**
```
❌ Task: "Write a Python function to reverse a string"
   → Overkill to use subagents
✅ Use single agent with appropriate system prompt
```

**Cost-Sensitive Operations:**
```
❌ Using 5 subagents for simple tasks
   → Each subagent = separate API call = 5x cost
✅ Use single agent unless complexity justifies cost
```

**Tightly Coupled Logic:**
```
❌ Breaking a single algorithm across multiple subagents
   → Coordination overhead > benefit
✅ Use single agent for cohesive logic
```

### Subagent Coordination Best Practices

**Provide Complete Context:**
```javascript
{
  "subagent": "frontend-engineer",
  "context": {
    "feature_spec": "Full feature requirements",
    "design_system": "Component library and styles",
    "api_contract": "Backend API endpoints",
    "constraints": "Browser support, performance targets"
  }
}
```

**Define Clear Interfaces:**
```javascript
{
  "subagent_outputs": {
    "frontend-engineer": {
      "delivers": "React components, styles, tests",
      "format": "TypeScript JSX files"
    },
    "backend-engineer": {
      "delivers": "API endpoints, business logic",
      "format": "Python FastAPI code"
    }
  }
}
```

**Coordinate Dependencies:**
```
1. database-engineer: Design schema (foundation)
   ↓
2. backend-engineer: Build API using schema
   ↓
3. frontend-engineer: Build UI using API
```

## Cost Optimization Strategies

Build workflows that minimize API costs:

### 1. Choose Appropriate Models

```javascript
// ❌ Expensive: Using Opus 4 for everything
{
  "validation": {"model": "claude-opus-4"},
  "generation": {"model": "claude-opus-4"},
  "formatting": {"model": "claude-opus-4"}
}

// ✅ Optimized: Right model for each task
{
  "validation": {"model": "claude-haiku-4"},     // Fast, cheap
  "generation": {"model": "claude-sonnet-4.5"},  // Balanced
  "formatting": {"model": "claude-haiku-4"}      // Fast, cheap
}
```

**Savings:** 80% cost reduction in this example

### 2. Set Appropriate Token Limits

```javascript
// ❌ Wasteful: High limits for simple tasks
{
  "task": "Generate yes/no answer",
  "max_tokens": 4000  // Way too high
}

// ✅ Optimized: Reasonable limits
{
  "task": "Generate yes/no answer",
  "max_tokens": 50  // Just what's needed
}
```

### 3. Cache Reusable Results

```javascript
{
  "cache_strategy": {
    "system_prompts": true,      // Cache large prompts
    "common_inputs": true,        // Cache frequent queries
    "validation_results": true,   // Reuse validations
    "ttl_seconds": 3600          // 1 hour cache
  }
}
```

### 4. Validate Before Processing

```javascript
// Avoid expensive API calls for invalid input
[Input] → [Local Validation] → [API Call Only If Valid]
```

**Example:**
```javascript
{
  "pre_validation": {
    "check_empty": true,
    "check_length": {"max": 10000},
    "check_format": "code",
    "fail_fast": true  // Stop before API call if invalid
  }
}
```

### 5. Use Test Mode During Development

```javascript
// Development workflow
{
  "mode": "test",
  "mock_responses": true,
  "api_calls": 0,
  "cost": 0
}

// Only switch to live mode for final validation
{
  "mode": "live",
  "confirmed": true
}
```

## Performance Best Practices

Design workflows for optimal performance:

### 1. Parallelize Independent Tasks

```javascript
// ❌ Slow: Sequential execution
Task 1 (3s) → Task 2 (3s) → Task 3 (3s) = 9s total

// ✅ Fast: Parallel execution
Task 1 (3s) →
Task 2 (3s) → [Combine] = 3s total
Task 3 (3s) →
```

### 2. Optimize Prompt Length

```javascript
// ❌ Slow: Massive context
{
  "system_prompt": "50,000 character prompt with entire codebase..."
}

// ✅ Fast: Concise, focused context
{
  "system_prompt": "You are a Python expert. Focus on PEP 8 compliance.",
  "context": "Only relevant code snippets"
}
```

### 3. Use Streaming for Long Outputs

```javascript
{
  "streaming": true,  // User sees progress immediately
  "buffer_size": 1024  // Stream in chunks
}
```

### 4. Implement Timeouts

```javascript
{
  "timeout_ms": 30000,  // 30 second timeout
  "on_timeout": "return_partial_or_fail"
}
```

### 5. Monitor and Optimize Bottlenecks

```javascript
// Identify slow nodes
{
  "performance_monitoring": {
    "track_duration": true,
    "track_token_usage": true,
    "alert_slow_nodes": true,
    "threshold_ms": 5000
  }
}
```

[Screenshot: Performance monitoring dashboard]

## Security Best Practices

Design secure workflows from the start:

### 1. Never Hardcode Secrets

```javascript
// ❌ Insecure: Secrets in workflow
{
  "api_key": "sk-ant-actual-key-here"
}

// ✅ Secure: Reference secret storage
{
  "api_key": "{{secrets.anthropic_api_key}}"
}
```

### 2. Validate and Sanitize Input

```javascript
{
  "input_validation": {
    "max_length": 10000,
    "no_sql_injection": true,
    "no_script_tags": true,
    "allowed_characters": "alphanumeric_plus_code"
  }
}
```

### 3. Principle of Least Privilege

```javascript
// ❌ Over-permissioned
{
  "agent_permissions": ["read_files", "write_files", "execute_code", "network_access"]
}

// ✅ Minimal permissions
{
  "agent_permissions": ["read_files"]  // Only what's needed
}
```

### 4. Audit Logging

```javascript
{
  "audit_log": {
    "log_inputs": true,
    "log_outputs": true,
    "log_errors": true,
    "redact_secrets": true,  // Never log secret values
    "retention_days": 90
  }
}
```

### 5. Secure External Integrations

```javascript
{
  "external_api": {
    "url": "{{secrets.api_endpoint}}",
    "auth": "{{secrets.api_token}}",
    "tls_verify": true,
    "timeout_ms": 5000,
    "rate_limit": 100  // Prevent abuse
  }
}
```

## Error Handling Patterns

Build resilient workflows:

### 1. Graceful Degradation

```javascript
{
  "primary_model": "claude-opus-4",
  "fallback_model": "claude-sonnet-4.5",
  "on_error": "try_fallback"
}
```

### 2. Retry with Backoff

```javascript
{
  "retry_policy": {
    "max_retries": 3,
    "initial_delay_ms": 1000,
    "backoff_multiplier": 2,
    "max_delay_ms": 10000
  }
}
```

### 3. Circuit Breaker

```javascript
{
  "circuit_breaker": {
    "failure_threshold": 5,
    "timeout_ms": 60000,
    "half_open_after_ms": 30000
  }
}
```

### 4. Comprehensive Error Messages

```javascript
{
  "error_handling": {
    "include_context": true,
    "suggest_fixes": true,
    "log_full_details": true,
    "user_friendly_message": true
  }
}
```

## Maintainability Best Practices

Design workflows that are easy to maintain:

### 1. Use Descriptive Names

```javascript
// ❌ Unclear
{
  "nodes": ["n1", "n2", "n3"]
}

// ✅ Clear
{
  "nodes": [
    "validate_input",
    "generate_code",
    "review_quality"
  ]
}
```

### 2. Document Complex Logic

```javascript
{
  "name": "Quality Score Calculator",
  "description": "Calculates code quality based on: complexity, test coverage, documentation, and style compliance. Scores range 0-100.",
  "documentation_url": "https://docs.example.com/quality-scoring"
}
```

### 3. Version Control Workflows

```javascript
{
  "workflow_version": "2.1.0",
  "changelog": [
    "2.1.0: Added fallback model for reliability",
    "2.0.0: Refactored to use subagents",
    "1.0.0: Initial release"
  ]
}
```

### 4. Modularize Reusable Components

```javascript
// Shared validation component
{
  "name": "Python Code Validator",
  "reusable": true,
  "used_by": [
    "code_generator_workflow",
    "code_reviewer_workflow",
    "code_formatter_workflow"
  ]
}
```

### 5. Add Monitoring and Alerts

```javascript
{
  "monitoring": {
    "track_success_rate": true,
    "alert_on_error_rate": 0.05,  // 5% error rate triggers alert
    "alert_on_cost_spike": true,
    "alert_recipients": ["team@example.com"]
  }
}
```

## Testing and Quality Assurance

Design workflows that are testable:

### 1. Design for Testability

```javascript
// Make workflows easy to test
{
  "test_mode_supported": true,
  "mock_data_available": true,
  "deterministic_when_possible": true
}
```

### 2. Include Test Cases

```javascript
{
  "test_suite": {
    "happy_path": "Tests normal operation",
    "edge_cases": "Tests boundary conditions",
    "error_cases": "Tests error handling",
    "performance": "Tests speed and cost"
  }
}
```

### 3. Continuous Validation

```javascript
{
  "validation": {
    "on_save": "dry_run",
    "on_deploy": "full_test_suite",
    "scheduled": "daily_regression_tests"
  }
}
```

## Common Anti-Patterns to Avoid

Learn from common mistakes:

### 1. God Node Anti-Pattern

```javascript
// ❌ One node does everything
{
  "mega_node": "Validates, generates, reviews, formats, deploys"
}

// ✅ Separate responsibilities
{
  "nodes": ["validator", "generator", "reviewer", "formatter", "deployer"]
}
```

### 2. Excessive Nesting

```javascript
// ❌ Too deep
{
  "workflow": {
    "subworkflow": {
      "sub_subworkflow": {
        "sub_sub_subworkflow": {...}
      }
    }
  }
}

// ✅ Flat, clear structure
{
  "workflows": ["main", "validation", "processing", "output"]
}
```

### 3. Tight Coupling

```javascript
// ❌ Nodes depend on implementation details
{
  "node_a": {"format": "specific_json_structure"},
  "node_b": {"expects": "specific_json_structure"}  // Brittle
}

// ✅ Loose coupling with contracts
{
  "node_a": {"format": "standard_contract"},
  "node_b": {"expects": "standard_contract"}  // Flexible
}
```

### 4. No Error Handling

```javascript
// ❌ Optimistic, no error handling
[Input] → [Process] → [Output]

// ✅ Defensive, handles errors
[Input] → [Validate] → [Process] → [Verify] → [Error Handler] → [Output]
```

### 5. Premature Optimization

```javascript
// ❌ Optimizing before knowing bottlenecks
{
  "over_engineered": "Complex caching, sharding, load balancing"
}

// ✅ Start simple, optimize based on data
{
  "simple_first": "Basic implementation",
  "measure": "Collect metrics",
  "optimize": "Improve actual bottlenecks"
}
```

## Next Steps

Master workflow design, then explore:

- **[Cost Optimization Guide](./cost-optimization.md)**: Minimize API costs
- **[Security Best Practices](./security.md)**: Secure your workflows
- **[Performance Optimization](./performance.md)**: Speed up execution
- **[Example Workflows](../../examples/)**: Study proven patterns

---

**Questions?** Join our [Discord community](https://discord.gg/cloutagent) to discuss workflow design with other users.
