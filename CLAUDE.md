# Claude Code Project Configuration

## Core Philosophy: "Customer Pays → We Run"

**The Best Code is No Code** - Code is liability. Every line must earn its existence by contributing to customer value or revenue. Delete ruthlessly, build minimally, ship production-ready code from day one.

### Economic Efficiency
- Only write code when customers will pay for that specific value
- Use proven libraries over custom implementations
- Remove unused code, dependencies, features regularly
- Scale to zero cost when customers aren't using the service

### Production-First Standards
- Complete functionality, never stubs or TODOs
- Real integrations with APIs, databases, services
- Comprehensive error handling and security from start
- Environment variables and proper configuration

## Development Workflow

### Commands (via Makefile)
- `make dev-flow` - Format + lint + test (daily workflow)
- `make quick-check` - Lint + fast tests (immediate feedback)
- `make check` - Full quality check before finishing tasks
- `make install` - Install all dependencies

### Task Management
1. Use TodoWrite tool for multi-step workflows
2. Break large tasks into focused components
3. Git commit frequently for checkpoints
4. Complete one task before starting next

## Architecture Principles

### Code Design
- **Functions over classes** - Pure functions, small (5-15 lines), immutable data
- **SOLID principles** - Single responsibility, open/closed, dependency inversion
- **TypeScript preferred** - Follow existing conventions, meaningful names
- **Visual TDD** - Write tests first, never modify tests to match broken code

### Project Structure
```
src/components/  # Reusable UI
src/services/    # API integrations
src/utils/       # Pure functions
tests/           # Test files
```

## Serverless Economics: Zero-Cost Scaling

**Target**: <$310/month at 5,000+ customers. Infrastructure costs only when customers pay.

### Approved Services
- **AWS Lambda** - Pay per invocation
- **DynamoDB** - Pay per usage, no fixed costs
- **API Gateway** - Pay per request
- **S3** - Storage without servers

### Forbidden Patterns
- ❌ Always-on databases (PostgreSQL, MySQL, Redis)
- ❌ Fixed monthly costs (load balancers, NAT gateways)
- ❌ Traditional containers (ECS EC2, self-managed K8s)

## Security by Design

### Essential Patterns
- **Input validation** - Schema validation, never trust user input
- **Secrets management** - Environment variables, never commit secrets
- **Privacy-safe logging** - Pseudonymize PII, mask sensitive data
- **HTTPS only** - TLS 1.3, security headers (CSP, HSTS)
- **Access control** - Role-based, principle of least privilege

```python
# Schema validation example
class UserInputSchema(Schema):
    data = fields.Str(required=True, validate=validate.Length(max=100))

# Safe logging
safe_user_id = hashlib.sha256(f"{user_id}{salt}".encode()).hexdigest()[:12]
```

## Tool Integration

### Claude Code Workflow
- **Post-edit hook** - Auto-formats code after edits
- **Post-write hook** - Runs `make quick-check` immediately
- **Pre-commit hook** - Full quality check before commits
- **Hard testing enabled** - Nothing commits unless all tests pass

### Essential Commands
- Read existing patterns before implementing
- Use Grep/Glob tools for codebase understanding
- Run `make check` before finishing tasks
- Check package.json/Makefile for available commands
- Follow existing naming conventions