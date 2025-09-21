# Agent Communication Hub

This file serves as a communication center for agent coordination during development tasks.

## Communication Protocol

### Status Update Format
```markdown
### [Timestamp] - [Agent Type]
**Task**: [Brief task description]
**Status**: [Percentage complete or current phase]
**Progress**: [What has been accomplished]
**Blockers**: [Any dependencies or issues]
**Next Steps**: [Immediate next actions]
**Files**: [Files created/modified]
**Notes**: [Additional context or findings]
```

## Active Communications

### Example Entry Format
```markdown
### 2025-01-09 15:30 - Backend Engineer
**Task**: Implementing user authentication API endpoints
**Status**: 80% complete
**Progress**: Created login/logout endpoints, JWT middleware implemented
**Blockers**: Need frontend team to confirm token refresh requirements
**Next Steps**: Implement password reset endpoint, add rate limiting
**Files**:
- src/api/auth.ts (new)
- src/middleware/jwt.ts (modified)
- tests/auth.test.ts (new)
**Notes**: Using bcrypt for password hashing, tokens expire in 24h
```

## Coordination Guidelines

### For Agents
1. **Post updates immediately** when starting, hitting milestones, or encountering blockers
2. **Check for updates** from other agents before proceeding with interdependent work
3. **Tag other agents** when their input is needed: @frontend-engineer @backend-engineer
4. **Document decisions** that affect other agents' work
5. **Report completion** with summary of deliverables and next steps

### For Main Claude
1. **Monitor regularly** for agent status and coordination needs
2. **Resolve blockers** by facilitating communication between agents
3. **Redistribute work** if agents encounter scope changes
4. **Synthesize results** from multiple agents into coherent final output
5. **Maintain oversight** of overall project progress and quality

## Agent Tags
Use these tags to direct messages to specific agents:
- @frontend-engineer - UI/UX implementation
- @backend-engineer - API and server logic
- @database-engineer - Data modeling and queries
- @infrastructure-engineer - DevOps and deployment
- @software-engineer-test - Testing and QA
- @ml-engineer - Machine learning and data science
- @cloud-architect - Cloud architecture and scaling
- @ui-ux-designer - Design and user experience
- @product-manager - Requirements and prioritization
- @project-manager - Timeline and coordination

---

*This file is actively monitored. All agents should check for updates before starting work and post status updates throughout task execution.*