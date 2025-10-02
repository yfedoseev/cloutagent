# CloutAgent - Executive Summary

**Tagline:** Agents with Impact
**Status:** PRD Complete - Ready for Development
**Timeline:** 13 weeks to MVP
**Tech Stack:** TypeScript, React 19, Vite 7, Node.js 22, Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`)

---

## What We're Building

A visual, no-code interface for building AI agents powered by Claude Agent SDK - think "Flowise/Langflow for Claude." Developers can drag-and-drop to build agent workflows, then expose them as production-ready APIs.

---

## Critical MVP Features (Must Have)

### 1. Security & Cost Control ⚠️
- **API Key Authentication**: Every project has unique API key for execution endpoint
- **Cost Limits**: Hard caps on tokens/cost/time per execution
- **Encrypted Secrets**: AES-256 encryption for MCP credentials
- **Budget Enforcement**: Agents auto-stop at configured limits

**Why Critical:** Without this, users risk infinite loops costing $1000+, and anyone can execute agents if they know the URL.

### 2. Visual Workflow Builder
- Drag-and-drop nodes (Agent, Subagent, Hook, MCP)
- Real-time canvas with connections
- Dark/light mode, Apple-style clean UI
- Test mode to validate before execution

### 3. Execution & Monitoring
- HTTP Streaming (SSE) for real-time progress
- Reconnection support (resume from disconnect)
- Execution queue (max 3 concurrent)
- Live cost tracking during execution
- Cancel running executions

### 4. Variable & Secret Management
- Runtime variables via API: `{{variable}}`
- Environment variables stored in project
- Encrypted secrets: `{{secret:API_KEY}}`
- Secrets never exposed in UI/logs/exports

### 5. MCP Integration
- Pre-configured Browser MCP (Playwright)
- Add custom MCPs (npx/uvx/URL)
- Credential management for MCPs
- Enable/disable specific tools

### 6. Data Persistence & Backup
- File-based storage (no database)
- Automatic daily backups
- Manual backup on-demand
- Version control (v1, v2, v3...)
- Import/export projects

### 7. Monitoring Dashboard
- Last 24h execution stats
- Success/failure rates
- Cost tracking per project
- Recent executions list
- System health indicators

---

## What's NOT in MVP (Intentionally Excluded)

We're focusing on core functionality first. These features are documented for future versions:

### Collaboration (v2.0)
- Multi-user authentication (OAuth/SSO)
- Project sharing and permissions
- Real-time collaborative editing
- Comments and change history

### Advanced Debugging (v2.0)
- Step-by-step debugger
- Breakpoints on nodes
- Resume from checkpoint (mid-execution)
- Replay execution with modified params
- Unit tests for nodes

### Marketplace & Templates (v2.0)
- Pre-built agent templates
- Community marketplace
- One-click install
- Template categories and search

### Automation (v2.0+)
- Scheduled executions (cron-like)
- Webhook triggers
- Human-in-the-loop workflows
- A/B testing

### Integrations (v2.0+)
- Slack, Discord, Email connectors
- GitHub, Jira, Google Workspace
- Database connectors
- OAuth flow management

### Enterprise (v3.0)
- SSO/SAML
- Audit logging
- Compliance tools (GDPR, SOC 2)
- SLA guarantees
- Dedicated support

---

## Why These Exclusions Make Sense

1. **Focus**: MVP validates core value prop - "can I build and run agents easily?"
2. **Security First**: We're including critical security (auth, cost limits) but deferring nice-to-haves
3. **Single User**: Collaboration is complex; start with individual developers
4. **Proven Pattern**: Successful tools (Postman, Insomnia) started single-user, added teams later
5. **Fast Launch**: 13 weeks to MVP vs 26+ weeks with all features

---

## Technology Decisions

### TypeScript SDK Confirmed ✅
- **Package**: `@anthropic-ai/claude-agent-sdk`
- **Installation**: `npm install @anthropic-ai/claude-agent-sdk`
- **Documentation**: https://docs.claude.com/en/api/agent-sdk/overview
- **Status**: Production-ready, officially supported by Anthropic
- **Features**: Full feature parity with Python SDK
- **No Python needed**: Pure TypeScript/Node.js implementation

### File-Based Storage (MVP)
- **Why**: Simple, no database setup, easy backups
- **Limitation**: Doesn't scale to 1000s of projects
- **Migration Path**: Abstract storage layer, move to PostgreSQL in v2

### HTTP Streaming (SSE)
- **Why**: Native browser support, simple implementation
- **Concern**: Long-running connections (30+ hours)
- **Mitigation**: Reconnection support with event resumption

---

## Critical Risks & Mitigations

### 1. Cost Overruns
**Risk:** User creates infinite loop, gets $1000 bill  
**Mitigation:** Hard limits enforced in code, can't be bypassed

### 2. API Key Theft
**Risk:** Exposed API key = unauthorized usage  
**Mitigation:** Rate limiting, usage monitoring, easy key rotation

### 3. Secrets Encryption Key Loss
**Risk:** Lose key = lose all secrets  
**Mitigation:** Clear backup docs, ability to re-encrypt with new key

### 4. SDK Breaking Changes
**Risk:** Claude Agent SDK is new (Sept 2025)  
**Mitigation:** Pin SDK version, extensive testing, monitor releases

### 5. File Storage Corruption
**Risk:** Power loss during write = corrupted project  
**Mitigation:** Atomic writes, daily backups, write-ahead logging

---

## Success Criteria for MVP

1. ✅ User can build working agent in <15 minutes (no docs)
2. ✅ API responds within 500ms (excluding Claude latency)
3. ✅ Cost limits enforced 100% (no overruns)
4. ✅ Streaming reconnection works reliably
5. ✅ Test mode catches 90%+ of config errors
6. ✅ Secrets never exposed in logs/UI
7. ✅ Zero data loss (backups work)
8. ✅ 99% API uptime

---

## Development Timeline

**13 Weeks Total**

- **Weeks 1-2**: Core infrastructure, auth, SDK integration
- **Weeks 3-4**: Visual editor, drag-and-drop
- **Weeks 5-6**: Advanced nodes (subagents, hooks, MCPs)
- **Weeks 7-8**: Execution, monitoring, streaming
- **Weeks 9**: Variables, secrets, test mode
- **Weeks 10**: Export/import, versioning, backups
- **Weeks 11**: MCP management with credentials
- **Weeks 12**: Monitoring dashboard, polish
- **Weeks 13**: Documentation, examples, launch prep

---

## Post-MVP Roadmap (High Level)

### v1.5 (Month 4-5)
- Performance optimizations
- 5 more example agents
- UI/UX improvements based on feedback
- Bug fixes

### v2.0 (Month 6-9)
- Multi-user authentication
- Agent marketplace
- Scheduled executions
- Advanced debugging
- Integration hub

### v3.0 (Month 10-12)
- Enterprise features
- Migration to PostgreSQL
- Advanced analytics
- Custom plugins/extensions

---

## Open Source Strategy

- **License**: MIT or Apache 2.0
- **Repository**: GitHub (cloutagent/cloutagent)
- **Launch**: Product Hunt, HackerNews, Dev.to
- **Community**: Discord server for support
- **Documentation**: Comprehensive docs site
- **Examples**: 5 pre-built agents in repo

---

## Questions for Stakeholders

1. **Encryption Key**: Auto-generate or user-provided?  
   → **Recommendation**: Auto-generate, document backup process

2. **Execution History**: 24 hours or configurable?  
   → **Recommendation**: Make configurable (1-30 days), default 7 days

3. **Example Agents**: Which 5 to include?  
   → **Recommendation**: Customer Support, Data Analyzer, Research Assistant, Email Responder, Code Reviewer

4. **Docker Image Size**: Target size?  
   → **Recommendation**: <500MB compressed

5. **Performance**: Canvas with 200+ nodes?  
   → **Recommendation**: 30 FPS minimum, optimize for 60 FPS

---

## Next Steps

1. ✅ **Name Decided**: CloutAgent
2. ✅ **PRD Complete**: Full specification ready
3. ⏭️ **Domain Registration**: cloutagent.com, cloutagent.dev
4. ⏭️ **Repository Setup**: Initialize monorepo
5. ⏭️ **Design Mockups**: High-fidelity UI designs
6. ⏭️ **Development Kickoff**: Week 1 starts

---

**Last Updated:** October 1, 2025  
**Document Version:** 1.0  
**Status:** Ready for Development
