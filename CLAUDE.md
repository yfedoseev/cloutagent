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

## Agent-Driven Development

### Aggressive Agent Utilization
- **Default Approach**: Pass tasks to specialized agents whenever possible
- **Parallel Execution**: Run 4-10 agents simultaneously when tasks affect different files
- **Complete Context**: Provide agents with full context needed for autonomous execution
- **Specialization**: Use specific agents (frontend-engineer, backend-engineer, ml-engineer, etc.)

### Agent Coordination System

#### Inter-Agent Communication
- **`.claude/agents-chat.md`** - Communication hub for agent coordination
  - Agents post status updates, blockers, and questions
  - Share findings and insights between agents
  - Coordinate on overlapping work and dependencies
  - Main Claude monitors and facilitates collaboration

#### Change Tracking
- **`.claude/agent-change-log.md`** - Comprehensive change documentation
  - Each agent logs all modifications made
  - Include rationale for changes and impact assessment
  - Track file modifications, new features, and bug fixes
  - Maintain chronological record of development progress

### Agent Task Distribution Strategy

#### Parallel Task Execution
```bash
# Example: Launching multiple agents in parallel
/task "Implement user authentication API endpoints" --agent backend-engineer
/task "Create login and registration UI components" --agent frontend-engineer
/task "Write comprehensive test suite for auth flow" --agent software-engineer-test
/task "Design database schema for user management" --agent database-engineer
/task "Configure deployment pipeline for auth service" --agent infrastructure-engineer
```

#### Task Handoff Protocols
- **Context Documentation**: Each agent documents work for seamless handoffs
- **Dependency Management**: Agents coordinate on shared interfaces and contracts
- **Quality Gates**: Agents validate each other's work before integration
- **Rollback Strategy**: Maintain change logs for easy reversion if needed

### Agent Selection Guidelines

#### Task-to-Agent Mapping
- **UI/UX Development** → frontend-engineer, ui-ux-designer
- **API/Backend Logic** → backend-engineer, software-engineer-test
- **Data & Analytics** → data-engineer, ml-engineer
- **Infrastructure** → infrastructure-engineer, cloud-architect
- **Documentation** → prompt-engineer, project-manager
- **Research & Analysis** → Use custom research commands (/deep-research, /batch-research)

#### Optimal Agent Count
- **Simple Tasks**: 2-3 agents (implementation + testing + review)
- **Complex Features**: 4-6 agents (frontend + backend + data + testing + infrastructure)
- **Large Projects**: 6-10 agents (full specialization across domains)
- **Research Projects**: Multiple research cycles with agent synthesis

### Communication Protocols

#### Status Updates in `.claude/agents-chat.md`
```markdown
## Agent Status Updates

### [Timestamp] - Backend Engineer
**Task**: Implementing user authentication API
**Status**: 70% complete
**Blockers**: Need database schema from database-engineer
**Next**: Will implement JWT token validation once schema is ready

### [Timestamp] - Database Engineer
**Task**: User management database schema
**Status**: Complete
**Output**: Schema created in migrations/001_user_auth.sql
**Next**: Backend engineer can proceed with API implementation
```

#### Change Documentation in `.claude/agent-change-log.md`
```markdown
## Agent Change Log

### [Timestamp] - Frontend Engineer
**Files Modified**:
- src/components/LoginForm.tsx (new)
- src/components/RegisterForm.tsx (new)
- src/hooks/useAuth.ts (new)

**Changes Made**:
- Implemented responsive login form with validation
- Added registration form with password strength requirements
- Created custom hook for authentication state management

**Impact**: Frontend auth flow complete, ready for backend integration
**Testing**: Unit tests included, integration tests pending backend completion
```

### Best Practices

#### Agent Task Design
- **Atomic Tasks**: Each agent gets complete, self-contained work
- **Clear Interfaces**: Define explicit contracts between agent work
- **Full Context**: Provide complete background, requirements, and constraints
- **Success Criteria**: Specify exact deliverables and quality standards

#### Coordination Efficiency
- **Pre-Task Planning**: Identify dependencies before launching agents
- **Regular Check-ins**: Monitor agent progress through communication files
- **Conflict Resolution**: Address file conflicts and integration issues promptly
- **Knowledge Synthesis**: Combine agent outputs into coherent final product

#### Quality Assurance
- **Cross-Agent Review**: Agents validate each other's work
- **Integration Testing**: Verify agent outputs work together
- **Documentation Standards**: Maintain consistent documentation across agents
- **Rollback Readiness**: Always maintain ability to revert agent changes