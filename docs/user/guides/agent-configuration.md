# Agent Configuration Guide

Configuring your agents effectively is the key to building powerful, cost-efficient workflows. This guide covers everything you need to know about agent configuration, from writing effective system prompts to selecting optimal models and parameters.

## Agent Basics

Every agent in CloutAgent is powered by Anthropic's Claude models. Understanding how to configure agents properly will dramatically improve your workflow results.

### Agent Node Properties

When you select an agent node, the property panel displays these key configuration options:

**Core Properties:**
- **Name**: Identifier for the agent (e.g., "Code Reviewer", "Content Generator")
- **Model**: Which Claude model to use (Sonnet 4.5, Opus 4, etc.)
- **System Prompt**: Instructions that define the agent's behavior and expertise
- **Max Tokens**: Maximum output length
- **Temperature**: Creativity vs consistency control (0-1 scale)

**Advanced Properties:**
- **Tools**: Enable/disable specific capabilities
- **Stop Sequences**: Custom strings that halt generation
- **Top-P**: Nucleus sampling parameter for output diversity
- **Top-K**: Token sampling limit

[Screenshot: Agent configuration panel with all properties visible]

## Writing Effective System Prompts

The system prompt is the most important configuration setting. It defines who your agent is, what it knows, and how it should behave.

### System Prompt Structure

A well-structured system prompt includes these key elements:

```markdown
# Role Definition
You are [specific role] with expertise in [domain].

# Core Capabilities
You excel at:
- [Capability 1]
- [Capability 2]
- [Capability 3]

# Behavioral Guidelines
When responding:
- [Guideline 1]
- [Guideline 2]
- [Guideline 3]

# Output Format
Format your responses as:
[Specific format requirements]

# Constraints
Never:
- [Constraint 1]
- [Constraint 2]
```

### Example: Code Review Agent

Here's a complete system prompt for a code review agent:

```markdown
You are an expert software engineer specializing in code review and best practices.
You have deep knowledge of software architecture, security, performance optimization,
and maintainability patterns.

Your code reviews are:
- Thorough but constructive
- Focused on significant issues, not nitpicks
- Educational, explaining the "why" behind suggestions
- Specific, with concrete code examples

When reviewing code:
1. First, identify what the code does well
2. Then, categorize issues by severity:
   - CRITICAL: Security vulnerabilities, data loss risks, breaking bugs
   - HIGH: Performance problems, architectural issues, major code smells
   - MEDIUM: Maintainability concerns, minor bugs, style inconsistencies
   - LOW: Suggestions for improvement, alternative approaches

3. For each issue, provide:
   - Clear description of the problem
   - Explanation of why it matters
   - Specific code example showing the fix
   - References to relevant best practices or documentation

Format your review as markdown with:
- Summary section at the top
- Issues grouped by severity
- Code blocks with syntax highlighting
- Links to relevant documentation

Never:
- Be dismissive or overly critical
- Suggest changes without explanation
- Focus on minor formatting issues when major problems exist
- Provide fixes without explaining the reasoning
```

This prompt creates a balanced, helpful code reviewer that provides actionable feedback.

[Screenshot: Code review agent in action]

### System Prompt Best Practices

**Be Specific:**
```markdown
❌ "You are a helpful assistant."
✅ "You are a Python expert specializing in data science and pandas library optimization."
```

**Define Output Format:**
```markdown
❌ "Provide a response."
✅ "Provide a JSON response with keys: analysis, recommendations, confidence_score."
```

**Include Examples:**
```markdown
You generate function documentation in this format:

Example:
'''python
def calculate_total(items: list[dict]) -> float:
    """
    Calculate total price from list of items.

    Args:
        items: List of dicts with 'price' and 'quantity' keys

    Returns:
        Total price as float

    Raises:
        ValueError: If items list is empty
    """
    if not items:
        raise ValueError("Items list cannot be empty")
    return sum(item['price'] * item['quantity'] for item in items)
'''
```

**Set Clear Boundaries:**
```markdown
You focus exclusively on frontend React code. For backend or database questions,
respond with: "This requires backend expertise. Please consult the backend-engineer agent."
```

**Use Constraints Effectively:**
```markdown
Constraints:
- Never generate code longer than 100 lines without asking for confirmation
- Always include error handling in code examples
- Prefer modern ES6+ syntax over older JavaScript patterns
- Use TypeScript types in all examples
```

### Prompting Techniques

**Chain of Thought:**
Encourage step-by-step reasoning for complex tasks:

```markdown
When solving problems:
1. First, analyze the requirements and constraints
2. Break down the problem into smaller components
3. Consider multiple approaches and trade-offs
4. Choose the optimal solution with reasoning
5. Implement the solution with explanatory comments
```

**Role-Playing:**
Use persona to influence tone and approach:

```markdown
You are a senior software architect conducting a design review for a junior developer.
Your goal is to teach, not just critique. Explain concepts as if mentoring someone
new to system design.
```

**Output Formatting:**
Control structure for consistent parsing:

```markdown
Always respond in this JSON structure:
{
  "analysis": "Your analysis here",
  "code": "Generated code here",
  "explanation": "Step-by-step explanation",
  "next_steps": ["Step 1", "Step 2", "Step 3"]
}
```

**Few-Shot Learning:**
Provide examples of desired behavior:

```markdown
Example interaction 1:
Input: "Add error handling"
Output: "I've added try-catch blocks with specific error types and meaningful messages..."

Example interaction 2:
Input: "Optimize performance"
Output: "I've identified three performance bottlenecks: 1) Redundant API calls..."
```

## Model Selection

Choosing the right Claude model is crucial for balancing quality, speed, and cost.

### Available Models

CloutAgent supports these Claude models:

#### Claude Sonnet 4.5
**Best for: Most general-purpose tasks**

- **Strengths**: Best balance of intelligence, speed, and cost
- **Use Cases**: Code generation, analysis, content creation, data processing
- **Speed**: Fast (3-5 seconds for typical responses)
- **Cost**: Moderate ($3 per million input tokens, $15 per million output tokens)
- **Max Output**: 8,192 tokens

**Recommended for:**
- Standard code generation and review
- Content writing and editing
- Data analysis and reporting
- API integration and automation
- Most production workflows

#### Claude Opus 4
**Best for: Complex reasoning and challenging tasks**

- **Strengths**: Highest intelligence, best reasoning, most capable
- **Use Cases**: Complex problem-solving, architecture design, research, advanced coding
- **Speed**: Slower (10-20 seconds for typical responses)
- **Cost**: Higher ($15 per million input tokens, $75 per million output tokens)
- **Max Output**: 8,192 tokens

**Recommended for:**
- System architecture design
- Complex algorithm development
- Research and analysis tasks
- Critical code review
- Tasks requiring deep reasoning

#### Claude Haiku 4
**Best for: Speed and cost optimization**

- **Strengths**: Fastest, most cost-effective, very capable
- **Use Cases**: Simple tasks, batch processing, rapid prototyping, testing
- **Speed**: Very fast (1-2 seconds for typical responses)
- **Cost**: Lowest ($0.25 per million input tokens, $1.25 per million output tokens)
- **Max Output**: 8,192 tokens

**Recommended for:**
- Simple text transformations
- Batch data processing
- Rapid iteration during development
- Cost-sensitive production workflows
- Testing workflows before production

[Screenshot: Model comparison chart]

### Model Selection Guidelines

**Choose Sonnet 4.5 when:**
- Task requires good reasoning but not extreme complexity
- Speed matters more than absolute best quality
- Cost-efficiency is important
- You're unsure which model to use (it's the best default)

**Choose Opus 4 when:**
- Task requires deep reasoning or complex problem-solving
- Quality is more important than speed or cost
- Working on critical systems or architecture
- Previous attempts with Sonnet weren't satisfactory
- Budget allows for premium capabilities

**Choose Haiku 4 when:**
- Task is straightforward and well-defined
- Processing large volumes of data
- Speed is critical
- Cost minimization is top priority
- Testing workflows during development

### Cost Optimization Strategy

For multi-step workflows, use different models for different stages:

```
Step 1: Haiku 4 - Parse and validate input (fast, cheap)
Step 2: Sonnet 4.5 - Main processing (balanced)
Step 3: Opus 4 - Final review of critical output (thorough)
Step 4: Haiku 4 - Format and package results (fast, cheap)
```

This approach optimizes cost while maintaining quality where it matters most.

## Temperature and Token Configuration

Fine-tune agent behavior with these parameters:

### Temperature (0.0 - 1.0)

Temperature controls randomness in the output:

**Low Temperature (0.0 - 0.3): Consistent, Deterministic**
- More focused and deterministic responses
- Same input produces similar output
- Best for: Code generation, factual content, structured data
- Example: 0.2 for code that must follow strict patterns

**Medium Temperature (0.4 - 0.7): Balanced**
- Good balance of consistency and creativity
- Varied responses while staying on topic
- Best for: General tasks, content with personality, problem-solving
- Example: 0.5 for documentation that should be clear but engaging

**High Temperature (0.8 - 1.0): Creative, Varied**
- More creative and diverse responses
- Same input produces different outputs
- Best for: Creative writing, brainstorming, idea generation
- Example: 0.9 for generating multiple unique marketing copy variations

**Temperature Examples:**

```markdown
Prompt: "Write a function to reverse a string"

Temperature 0.1:
def reverse_string(s: str) -> str:
    return s[::-1]

Temperature 0.9:
def reverse_string(text: str) -> str:
    """Flip that text backwards, character by character!"""
    return ''.join(reversed(text))
```

[Screenshot: Temperature slider with examples]

### Max Tokens

Controls the maximum length of the agent's response:

**Token Guidelines:**
- **Short responses (500-1000 tokens)**: Simple answers, brief code snippets
- **Medium responses (1000-2000 tokens)**: Detailed explanations, moderate code
- **Long responses (2000-4000 tokens)**: Comprehensive guides, large code files
- **Maximum (4000-8192 tokens)**: Full documentation, complex implementations

**Cost Impact:**
Output tokens cost more than input tokens, so set max tokens appropriately:

```
Sonnet 4.5:
- Input: $3 per million tokens
- Output: $15 per million tokens (5x more expensive!)

If you only need 500 tokens, don't set max_tokens to 4000.
```

**Best Practices:**
1. Set max tokens to 2x what you expect to need
2. Monitor actual token usage in execution logs
3. Adjust based on real usage patterns
4. Use different limits for different workflow stages

### Advanced Parameters

#### Top-P (Nucleus Sampling)

Controls diversity by considering only the top percentage of probable tokens:

- **0.1**: Very focused, deterministic (similar to low temperature)
- **0.5**: Moderate diversity
- **0.9**: Higher diversity (default)
- **1.0**: Consider all tokens

**When to adjust:**
- Lower (0.5-0.7) for technical tasks requiring precision
- Higher (0.9-1.0) for creative tasks

#### Top-K

Limits sampling to the K most likely tokens:

- **Default**: Usually not needed (Top-P is preferred)
- **10-50**: Very focused output
- **100-500**: More varied output

**Recommendation:** Use temperature and top-P instead. Top-K is rarely necessary.

#### Stop Sequences

Custom strings that halt generation:

```json
{
  "stop_sequences": ["</code>", "---END---", "TASK_COMPLETE"]
}
```

**Use cases:**
- Prevent overlong outputs
- Parse structured responses
- Control multi-turn conversations

## Tool Configuration

Enable specific capabilities for your agents:

### Available Tools

**File Operations:**
- Read files
- Write files
- List directories
- File search

**Code Execution:**
- Run Python code
- Execute shell commands
- Run tests

**Web Access:**
- Fetch web pages
- Search the internet
- Access APIs

**Database:**
- Query databases
- Execute SQL
- Data transformations

[Screenshot: Tool selection interface]

### Tool Best Practices

**Principle of Least Privilege:**
Only enable tools the agent actually needs:

```markdown
❌ Enable all tools "just in case"
✅ Enable only file read/write for a documentation generator
```

**Security Considerations:**
- Never enable shell execution without sandboxing
- Restrict file operations to specific directories
- Validate all database queries
- Rate-limit API calls

**Performance Impact:**
Each enabled tool adds to context size. Minimize tools for faster responses.

## Configuration Templates

Pre-configured templates for common use cases:

### Code Generator Template

```json
{
  "name": "Code Generator",
  "model": "claude-sonnet-4.5",
  "temperature": 0.2,
  "max_tokens": 4000,
  "system_prompt": "You are an expert programmer who writes clean, well-documented, production-ready code. Follow language best practices, include error handling, and add clear comments explaining complex logic.",
  "tools": ["file_read", "file_write"]
}
```

### Content Writer Template

```json
{
  "name": "Content Writer",
  "model": "claude-sonnet-4.5",
  "temperature": 0.7,
  "max_tokens": 3000,
  "system_prompt": "You are a professional content writer who creates engaging, SEO-optimized content. Write in a conversational yet professional tone, use clear structure with headers, and include relevant examples.",
  "tools": ["web_search"]
}
```

### Data Analyst Template

```json
{
  "name": "Data Analyst",
  "model": "claude-opus-4",
  "temperature": 0.3,
  "max_tokens": 2000,
  "system_prompt": "You are a data analyst who provides insights from data. Create clear visualizations, explain statistical findings in plain language, and provide actionable recommendations backed by data.",
  "tools": ["code_execution", "database_query"]
}
```

### Code Reviewer Template

```json
{
  "name": "Code Reviewer",
  "model": "claude-sonnet-4.5",
  "temperature": 0.4,
  "max_tokens": 3000,
  "system_prompt": "You are a senior engineer conducting code reviews. Identify security issues, performance problems, and maintainability concerns. Be constructive and educational in feedback.",
  "tools": ["file_read"]
}
```

## Testing Your Configuration

Validate agent configuration before production use:

### Configuration Checklist

- [ ] System prompt is specific and well-structured
- [ ] Model selection matches task complexity
- [ ] Temperature appropriate for task type
- [ ] Max tokens covers expected output length
- [ ] Only necessary tools enabled
- [ ] Stop sequences configured if needed
- [ ] Configuration tested with representative inputs

### A/B Testing Configurations

Compare different configurations to optimize:

```markdown
Test: Code generation quality

Configuration A:
- Model: Sonnet 4.5
- Temperature: 0.2
- Max Tokens: 2000

Configuration B:
- Model: Opus 4
- Temperature: 0.3
- Max Tokens: 3000

Run 10 identical prompts through each, compare:
- Code quality
- Execution time
- Cost
- Output consistency
```

[Screenshot: A/B test comparison view]

## Common Configuration Mistakes

Avoid these common pitfalls:

### Overly Generic System Prompts

```markdown
❌ "You are a helpful AI assistant."
✅ "You are a Python expert specializing in FastAPI backend development."
```

**Why it matters:** Specific prompts produce better, more focused results.

### Wrong Model for Task

```markdown
❌ Using Opus 4 for simple text formatting (expensive, slow)
✅ Using Haiku 4 for simple text formatting (fast, cheap, sufficient)
```

**Why it matters:** Wastes money and time on excessive capability.

### Temperature Mismatch

```markdown
❌ Temperature 0.9 for generating SQL queries (too random)
✅ Temperature 0.2 for generating SQL queries (consistent, safe)
```

**Why it matters:** Wrong temperature produces unreliable or boring output.

### Excessive Max Tokens

```markdown
❌ Max tokens 8000 for a yes/no answer
✅ Max tokens 100 for a yes/no answer
```

**Why it matters:** Wastes tokens and money on unused capacity.

### Too Many Tools Enabled

```markdown
❌ Enabling all tools for every agent
✅ Enabling only required tools per agent
```

**Why it matters:** Increases context size, slows responses, security risk.

## Next Steps

Master agent configuration, then explore:

- **[Working with Subagents](./subagents.md)**: Coordinate specialized agents
- **[Testing Workflows](./testing-workflows.md)**: Validate configurations before production
- **[Cost Optimization](../best-practices/cost-optimization.md)**: Minimize API costs
- **[Security Best Practices](../best-practices/security.md)**: Secure your agents

### Additional Resources

- **[System Prompt Library](../../examples/prompts/)**: Community-contributed prompts
- **[Model Comparison Tool](../tools/model-comparison.md)**: Interactive model selection
- **[Configuration Validator](../tools/config-validator.md)**: Automated configuration review

---

**Questions?** Check the [FAQ](../troubleshooting/faq.md) or join our [Discord community](https://discord.gg/cloutagent).
