# Testing Workflows Guide

Testing your workflows before production deployment is crucial for reliability, cost control, and quality assurance. This guide covers CloutAgent's testing features and best practices for validating workflows.

## Why Test Workflows?

Testing workflows before production prevents:

- **Cost Overruns**: Catch infinite loops or excessive API calls before they drain your budget
- **Logic Errors**: Validate that workflows behave correctly with various inputs
- **Integration Issues**: Ensure external services and APIs work as expected
- **Security Vulnerabilities**: Identify potential data leaks or unauthorized access
- **Performance Problems**: Detect slow operations before they impact users

CloutAgent provides multiple testing approaches to validate workflows at different stages of development.

## Test Modes

CloutAgent offers three primary test modes:

### 1. Dry Run Mode

**What it does:** Validates workflow structure and configuration without executing agents or consuming API credits.

**Use when:**
- Making structural changes to workflows
- Checking for configuration errors
- Validating node connections
- Quick sanity checks during development

**How to use:**
1. Click the "Test" dropdown in toolbar
2. Select "Dry Run"
3. Review validation results

**What it checks:**
- All nodes have required configuration
- Connections are valid (correct types)
- No circular dependencies
- Required variables and secrets exist
- System prompts are not empty
- Model selections are valid

[Screenshot: Dry run validation results]

**Example Output:**
```
✅ Workflow structure valid
✅ All nodes configured correctly
✅ Connections valid
⚠️  Warning: Agent "Code Generator" max_tokens (8000) is high
❌ Error: Variable "api_endpoint" referenced but not defined
```

### 2. Test Mode (Mock Execution)

**What it does:** Executes the workflow with mock data instead of real API calls.

**Use when:**
- Testing workflow logic without API costs
- Validating data flow between nodes
- Developing and iterating quickly
- Testing error handling paths
- Training or demonstration purposes

**How to use:**
1. Click "Test" dropdown
2. Select "Test Mode"
3. Configure mock responses for each agent
4. Execute workflow
5. Review results and data flow

[Screenshot: Test mode configuration panel]

**Mock Configuration:**

```json
{
  "nodes": {
    "code_generator": {
      "mock_response": "def hello():\n    print('Hello, world!')",
      "mock_tokens": {
        "input": 100,
        "output": 50
      },
      "mock_duration_ms": 1500
    },
    "code_reviewer": {
      "mock_response": "Code looks good! No issues found.",
      "mock_tokens": {
        "input": 150,
        "output": 30
      },
      "mock_duration_ms": 1000
    }
  }
}
```

**Benefits:**
- Zero API costs
- Instant execution (no network latency)
- Predictable results for testing
- Safe to run repeatedly
- Can simulate error conditions

### 3. Live Test Mode

**What it does:** Executes the workflow with real API calls but in a controlled test environment.

**Use when:**
- Final validation before production
- Testing with real model responses
- Validating external integrations
- Performance benchmarking
- Confirming cost estimates

**How to use:**
1. Click "Test" dropdown
2. Select "Live Test"
3. Provide test input
4. Review execution and costs
5. Validate output meets requirements

**Safety Features:**
- Execution timeout limits
- Cost cap warnings
- Test-only environment variables
- Automatic rollback on errors

[Screenshot: Live test execution with cost tracking]

## Mock Data Configuration

Configure realistic mock data for thorough testing:

### Creating Mock Responses

**Method 1: Inline Configuration**

Click on a node in test mode and provide mock response:

```json
{
  "response": "Generated code here...",
  "tokens": {"input": 120, "output": 450},
  "duration_ms": 2000,
  "metadata": {
    "model": "claude-sonnet-4.5",
    "finish_reason": "end_turn"
  }
}
```

**Method 2: Response Templates**

Create reusable mock templates:

```json
{
  "name": "Successful Code Generation",
  "template": {
    "response": "def {{function_name}}():\n    {{implementation}}",
    "tokens": {"input": 100, "output": 200},
    "duration_ms": 1500
  }
}
```

**Method 3: Import from Previous Executions**

1. Find a successful production execution
2. Click "Save as Mock"
3. Template created from real response
4. Use in future test runs

[Screenshot: Mock data configuration interface]

### Mock Response Best Practices

**Realistic Data:**
Use responses that closely match production data:

```json
❌ { "response": "test response" }
✅ {
  "response": "def calculate_total(items):\n    return sum(item.price for item in items)",
  "tokens": {"input": 145, "output": 234}
}
```

**Edge Cases:**
Create mocks for error scenarios:

```json
{
  "name": "API Rate Limit Error",
  "error": {
    "type": "rate_limit_error",
    "message": "Rate limit exceeded",
    "retry_after": 60
  }
}
```

**Variable Responses:**
Test different outcomes:

```json
{
  "scenarios": [
    {"name": "success", "response": "..."},
    {"name": "partial_success", "response": "..."},
    {"name": "failure", "error": "..."}
  ]
}
```

## Validation and Assertions

Add automated checks to verify workflow behavior:

### Output Validation

Define expected output criteria:

```javascript
{
  "validation": {
    "output_contains": ["def ", "return"],
    "output_not_contains": ["error", "failed"],
    "min_length": 50,
    "max_length": 5000,
    "format": "python_code"
  }
}
```

**Validation Types:**

**Content Validation:**
```javascript
{
  "contains": ["expected string"],
  "not_contains": ["error", "exception"],
  "matches_regex": "^def \\w+\\(.*\\):$",
  "json_schema": {...}
}
```

**Quality Validation:**
```javascript
{
  "min_quality_score": 0.8,
  "readability_score": "high",
  "sentiment": "positive",
  "language": "en"
}
```

**Performance Validation:**
```javascript
{
  "max_duration_ms": 5000,
  "max_tokens": 2000,
  "max_cost_usd": 0.10
}
```

[Screenshot: Validation rules configuration]

### Assertions

Write test assertions for specific conditions:

```javascript
// Assertion: Output is valid Python code
assert(() => {
  const output = workflow.output;
  try {
    // Syntax check (would use actual Python parser in real implementation)
    return output.includes('def ') && output.includes('return');
  } catch (error) {
    return false;
  }
}, "Output must be valid Python code");

// Assertion: Execution completes within budget
assert(() => {
  return workflow.totalCost < 0.50;
}, "Workflow cost must be under $0.50");

// Assertion: No errors in execution log
assert(() => {
  return workflow.errors.length === 0;
}, "Workflow must complete without errors");
```

### Test Suites

Organize related tests into suites:

```javascript
{
  "name": "Code Generator Test Suite",
  "tests": [
    {
      "name": "Generates valid Python function",
      "input": "Create a function to calculate factorial",
      "expectations": {
        "contains": ["def factorial", "return"],
        "format": "python"
      }
    },
    {
      "name": "Includes error handling",
      "input": "Create a safe division function",
      "expectations": {
        "contains": ["try", "except", "ZeroDivisionError"]
      }
    },
    {
      "name": "Respects max token limit",
      "input": "Generate a complex sorting algorithm",
      "expectations": {
        "max_tokens": 1000
      }
    }
  ]
}
```

[Screenshot: Test suite execution results]

## Test Scenarios

Create comprehensive test scenarios for different use cases:

### Basic Functionality Test

Verify core workflow behavior:

```javascript
{
  "scenario": "Basic Code Generation",
  "description": "Verify agent generates functional code",
  "input": {
    "prompt": "Write a Python function to reverse a string"
  },
  "expectations": {
    "output_contains": ["def", "return", "str"],
    "execution_success": true,
    "duration_max_ms": 5000
  }
}
```

### Error Handling Test

Verify graceful error handling:

```javascript
{
  "scenario": "Invalid Input Handling",
  "description": "Verify workflow handles invalid input gracefully",
  "input": {
    "prompt": ""  // Empty prompt
  },
  "expectations": {
    "error_type": "validation_error",
    "error_message_contains": "Input cannot be empty",
    "no_api_call_made": true
  }
}
```

### Edge Case Test

Test boundary conditions:

```javascript
{
  "scenario": "Maximum Input Length",
  "description": "Verify handling of very long input",
  "input": {
    "prompt": "a".repeat(10000)  // 10k character input
  },
  "expectations": {
    "either": [
      {"truncated": true},
      {"error_type": "input_too_long"}
    ]
  }
}
```

### Performance Test

Validate performance requirements:

```javascript
{
  "scenario": "Performance Benchmark",
  "description": "Verify workflow meets performance targets",
  "input": {
    "prompt": "Generate a simple Hello World function"
  },
  "expectations": {
    "duration_max_ms": 3000,
    "tokens_max": 500,
    "cost_max_usd": 0.05
  }
}
```

### Integration Test

Test external service integrations:

```javascript
{
  "scenario": "GitHub Integration",
  "description": "Verify workflow can access GitHub API",
  "input": {
    "repo": "test/repo"
  },
  "mock_external_apis": {
    "github": {
      "status": 200,
      "response": {
        "name": "repo",
        "stars": 100
      }
    }
  },
  "expectations": {
    "api_called": "github",
    "output_contains": ["100 stars"]
  }
}
```

[Screenshot: Test scenario execution dashboard]

## Test Coverage

Ensure comprehensive testing coverage:

### Coverage Checklist

**Functionality Coverage:**
- [ ] All workflow paths executed
- [ ] All node types tested
- [ ] All configuration options validated
- [ ] All variables and secrets used

**Input Coverage:**
- [ ] Valid inputs tested
- [ ] Invalid inputs tested
- [ ] Edge cases covered
- [ ] Boundary conditions tested

**Error Coverage:**
- [ ] Network errors simulated
- [ ] API errors handled
- [ ] Validation errors caught
- [ ] Timeout scenarios tested

**Integration Coverage:**
- [ ] External APIs tested
- [ ] Database connections validated
- [ ] File operations verified
- [ ] Authentication tested

### Coverage Report

CloutAgent generates coverage reports showing:

```
Workflow Test Coverage Report
==============================

Nodes Tested: 4/4 (100%)
✅ Code Generator
✅ Code Reviewer
✅ Format Output
✅ Save Results

Paths Tested: 3/3 (100%)
✅ Success path
✅ Validation error path
✅ API error path

Inputs Tested: 15/20 (75%)
✅ Valid Python request
✅ Valid JavaScript request
✅ Empty input
✅ Very long input
⚠️  Missing: Special characters test
⚠️  Missing: Unicode test
...

Overall Coverage: 92%
```

[Screenshot: Coverage report visualization]

## Continuous Testing

Integrate testing into your development workflow:

### Pre-commit Testing

Run automated tests before saving changes:

```bash
# .git/hooks/pre-commit

#!/bin/bash
echo "Running workflow tests..."
cloutagent test --workflow=current --mode=dry-run

if [ $? -ne 0 ]; then
  echo "Tests failed! Commit aborted."
  exit 1
fi

echo "Tests passed!"
exit 0
```

### Automated Test Runs

Schedule regular test execution:

```yaml
# .github/workflows/test-workflows.yml

name: Test Workflows
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  push:
    paths:
      - 'workflows/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run workflow tests
        run: |
          cloutagent test --all --report=coverage.json
      - name: Upload coverage
        uses: actions/upload-artifact@v2
        with:
          name: coverage-report
          path: coverage.json
```

### Regression Testing

Maintain test baselines to catch regressions:

```javascript
{
  "baseline": {
    "created_at": "2025-01-15",
    "workflow_version": "1.2.0",
    "metrics": {
      "avg_duration_ms": 2500,
      "avg_tokens": 450,
      "avg_cost_usd": 0.08,
      "success_rate": 0.98
    }
  },
  "regression_thresholds": {
    "duration_increase_max": 1.2,  // 20% slower triggers alert
    "cost_increase_max": 1.15,     // 15% more expensive triggers alert
    "success_rate_min": 0.95       // Below 95% triggers alert
  }
}
```

## Test Debugging

Debug failing tests effectively:

### Execution Logs

Review detailed execution logs:

```
[2025-01-15 10:23:45] Test: "Basic Code Generation" started
[2025-01-15 10:23:45] Input: "Write a Python function..."
[2025-01-15 10:23:45] Node: code_generator - Starting
[2025-01-15 10:23:46] Node: code_generator - Model: claude-sonnet-4.5
[2025-01-15 10:23:46] Node: code_generator - Tokens: input=145, output=234
[2025-01-15 10:23:47] Node: code_generator - Complete (1.5s)
[2025-01-15 10:23:47] Validation: Checking output format...
[2025-01-15 10:23:47] Validation: ✅ Contains "def"
[2025-01-15 10:23:47] Validation: ✅ Contains "return"
[2025-01-15 10:23:47] Validation: ❌ Missing "docstring"
[2025-01-15 10:23:47] Test: Failed - Missing expected docstring
```

[Screenshot: Test execution log viewer]

### Breakpoints

Pause execution at specific points:

```javascript
{
  "breakpoints": [
    {
      "node": "code_generator",
      "when": "after_execution",
      "condition": "output.length < 100"
    },
    {
      "node": "code_reviewer",
      "when": "before_execution",
      "always": true
    }
  ]
}
```

### Step-by-Step Execution

Execute workflow one node at a time:

1. Enable "Step Mode" in test settings
2. Click "Next Step" to advance
3. Inspect data at each step
4. Modify values if needed for testing
5. Continue or abort execution

[Screenshot: Step-by-step debugger interface]

### Snapshot Comparison

Compare test results to expected outputs:

```
Expected Output:
-----------------
def reverse_string(s: str) -> str:
    return s[::-1]

Actual Output:
--------------
def reverse_string(s: str) -> str:
    return ''.join(reversed(s))

Diff:
-----
- return s[::-1]
+ return ''.join(reversed(s))

Status: ✅ Both implementations correct, different approach
```

## Best Practices

Follow these testing best practices:

### Test Early and Often

- Run dry runs after every significant change
- Use test mode during development
- Run live tests before production deployment
- Automate testing in CI/CD pipeline

### Create Realistic Test Data

- Use production-like inputs
- Include edge cases
- Test with various data sizes
- Simulate real-world scenarios

### Maintain Test Suites

- Organize tests by feature
- Update tests when requirements change
- Remove obsolete tests
- Document test purposes

### Monitor Test Metrics

- Track test execution time
- Monitor success rates
- Measure code coverage
- Review cost trends

### Balance Speed and Coverage

- Use dry runs for quick feedback
- Use test mode for logic validation
- Use live tests sparingly (cost)
- Parallelize independent tests

## Example Test Scenarios

### Code Review Workflow Test

```javascript
{
  "name": "Code Review Workflow Tests",
  "scenarios": [
    {
      "name": "Review clean code",
      "input": {
        "code": "def add(a, b):\n    return a + b"
      },
      "mock_responses": {
        "reviewer": "Code looks good! Clean and simple."
      },
      "assertions": [
        "output.contains('good')",
        "errors.length === 0"
      ]
    },
    {
      "name": "Detect security issue",
      "input": {
        "code": "eval(user_input)"
      },
      "assertions": [
        "output.contains('security')",
        "output.contains('eval')"
      ]
    },
    {
      "name": "Handle invalid syntax",
      "input": {
        "code": "def broken(\n    print('missing closing"
      },
      "assertions": [
        "output.contains('syntax')"
      ]
    }
  ]
}
```

## Next Steps

Master workflow testing, then explore:

- **[Workflow Design Best Practices](../best-practices/workflow-design.md)**: Design testable workflows
- **[Cost Optimization](../best-practices/cost-optimization.md)**: Minimize testing costs
- **[Debugging Guide](../troubleshooting/debugging.md)**: Advanced debugging techniques
- **[CI/CD Integration](../advanced/ci-cd.md)**: Automate testing in pipelines

---

**Questions?** Check the [FAQ](../troubleshooting/faq.md) or join our [Discord community](https://discord.gg/cloutagent).
