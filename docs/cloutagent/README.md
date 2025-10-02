# CloutAgent Documentation

**Tagline:** Agents with Impact  
**Status:** PRD Complete - Ready for Development  
**Version:** 1.0 (MVP Specification)

---

## 📚 Documentation Overview

This repository contains the complete Product Requirements Document (PRD) and supporting materials for **CloutAgent** - a visual, no-code interface for building AI agents powered by Claude Agent SDK.

### Available Documents

| Document | Purpose | Audience |
|----------|---------|----------|
| [PRD.md](./PRD.md) | Complete product specification (100+ pages) | All stakeholders, developers |
| [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md) | High-level overview, MVP vs future features | Executives, product managers |
| [TECH_STACK.md](./TECH_STACK.md) | Detailed technical stack & dependencies | Developers, architects |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture & data flows | Developers, architects |
| [QUICK_START.md](./QUICK_START.md) | Developer guide for using CloutAgent | Developers, end users |
| README.md (this file) | Navigation and overview | Everyone |

---

## 🎯 What is CloutAgent?

CloutAgent is a visual workflow builder for creating AI agents using Claude Agent SDK. Think "Flowise or Langflow, but specifically built for Claude Agent SDK."

**Key Features:**
- 🎨 Drag-and-drop visual editor
- 🔐 API key authentication & cost limits
- 🔒 Encrypted secret management
- 🚀 Real-time execution streaming
- 📊 Built-in monitoring dashboard
- 🔧 MCP integration with credentials
- 💾 Automatic backups & versioning
- ⚡ Test mode (validate without execution)

---

## 🚀 Quick Links

- **Installation**: See [QUICK_START.md](./QUICK_START.md#installation-5-minutes)
- **First Agent Tutorial**: See [QUICK_START.md](./QUICK_START.md#your-first-agent-10-minutes)
- **API Reference**: See [PRD.md - Execution API](./PRD.md#5-execution-api)
- **Technology Stack**: See [PRD.md - Technology Stack](./PRD.md#technology-stack)
- **Development Timeline**: See [PRD.md - Development Phases](./PRD.md#development-phases)

---

## 📦 Technology Stack

### Core Dependencies
```json
{
  "@anthropic-ai/claude-agent-sdk": "latest",
  "react": "^19.1.0",
  "reactflow": "^11.0.0",
  "express": "^4.18.0",
  "typescript": "^5.0.0",
  "vite": "^7.1.0"
}
```

### Requirements
- **Node.js 22+** (Node.js 18 reached EOL April 2025)
- **Vite 7** (ESM only, requires Node.js 22.12+)
- **React 19** (new `use()` hook, Actions, Server Components)

**Installation:**
```bash
npm install @anthropic-ai/claude-agent-sdk
```

**Documentation:**
- Official SDK Docs: https://docs.claude.com/en/api/agent-sdk/overview
- Engineering Blog: https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk

---

## 🎨 What Does CloutAgent Look Like?

### Visual Editor
```
┌─────────────────────────────────────────────────────────┐
│  CloutAgent | Customer Support Agent    [Test] [Run]    │
├───────┬─────────────────────────────────────────────────┤
│       │                                                  │
│ Nodes │              Canvas                             │
│       │   ┌───────────────┐                             │
│ ○ Ag. │   │  Main Agent   │────┐                        │
│ ○ Sub │   └───────────────┘    │                        │
│ ◇ Hok │                        ▼                        │
│ ⬡ MCP │                   ┌─────────┐                   │
│       │                   │Subagent │                   │
│       │                   └─────────┘                   │
├───────┴─────────────────────────────────────────────────┤
│  Execution: Running... Cost: $0.05 | 50% of limit      │
│  ● Agent thinking: Analyzing customer request...        │
└─────────────────────────────────────────────────────────┘
```

### Real-Time Monitoring
```
Execution: exec-abc123             Status: Running

◉ Main Agent - Processing request
  ├─ 🔧 bash: Analyzing logs
  │   ✓ Found 3 error patterns
  ├─ 💭 Thinking: Need to check database...
  ├─ 📤 Subagent: database-query (parallel)
  │   ◉ Querying customer records...
  └─ ⏸ Waiting for subagent...

Tokens: 1,243 | Cost: $0.05 | Time: 8.2s
```

---

## 🎯 MVP vs Future Features

### ✅ Included in MVP (v1.0)
- Visual workflow builder
- API key authentication
- Cost limits & timeout enforcement
- Encrypted secret management
- Test mode (validate before execute)
- Execution queue (max 3 concurrent)
- Real-time streaming with reconnection
- MCP integration with credentials
- Automatic daily backups
- Basic metrics dashboard (24h)
- Version control (v1, v2, v3...)
- Export/import projects

### ❌ NOT in MVP (Future)
- Multi-user authentication
- Agent marketplace/templates
- Step-by-step debugger
- Scheduled executions (cron)
- A/B testing
- Integration hub (Slack, GitHub)
- Resume from checkpoint
- Enterprise features (SSO, audit logs)

See [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md#features-not-in-mvp-intentionally-excluded) for complete list.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              React SPA (TypeScript)              │
│    Visual Editor + Real-Time Monitoring         │
└─────────────────┬───────────────────────────────┘
                  │ HTTP/SSE
┌─────────────────▼───────────────────────────────┐
│         Express Backend (TypeScript)             │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │   Claude Agent SDK Integration             │ │
│  │   @anthropic-ai/claude-agent-sdk           │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │   Execution API (HTTP Streaming)           │ │
│  └────────────────────────────────────────────┘ │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│           File System Storage                    │
│  /projects/  /backups/  /.secrets/              │
└─────────────────────────────────────────────────┘
```

---

## 📊 Development Timeline

**Total: 13 weeks to MVP**

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1 | 2 weeks | Core infrastructure, auth, SDK integration |
| Phase 2 | 2 weeks | Visual editor, drag-and-drop |
| Phase 3 | 2 weeks | Advanced nodes (subagents, hooks, MCPs) |
| Phase 4 | 2 weeks | Execution, monitoring, streaming |
| Phase 5 | 1 week | Variables, secrets, test mode |
| Phase 6 | 1 week | Export/import, versioning, backups |
| Phase 7 | 1 week | MCP management with credentials |
| Phase 8 | 1 week | Monitoring dashboard, polish |
| Phase 9 | 1 week | Documentation, examples, launch |

See [PRD.md - Development Phases](./PRD.md#development-phases) for detailed breakdown.

---

## 🔐 Security & Cost Management

### Authentication
- API key per project (UUID-based)
- Header-based: `X-API-Key: <key>`
- Key rotation via UI

### Cost Controls
- Max tokens per execution (default: 100k)
- Max cost per execution (default: $1.00)
- Timeout enforcement (default: 1 hour)
- Alert at 80%, stop at 100%

### Secret Management
- AES-256 encryption at rest
- Never visible after creation
- Not included in exports
- Referenced as `{{secret:NAME}}`

---

## 📈 Success Metrics

1. ✅ User builds working agent in <15 min (no docs)
2. ✅ API responds <500ms (excluding Claude latency)
3. ✅ Cost limits enforced 100%
4. ✅ Streaming reconnection works reliably
5. ✅ Test mode catches 90%+ config errors
6. ✅ Secrets never exposed in logs/UI
7. ✅ Zero data loss (backups work)
8. ✅ 99% API uptime

---

## 🛠️ Local Development Setup

```bash
# Clone repository
git clone https://github.com/cloutagent/cloutagent.git
cd cloutagent

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY

# Run locally
npm run dev

# Or with Docker
docker-compose up
```

Visit: `http://localhost:3000`

See [QUICK_START.md](./QUICK_START.md) for detailed setup instructions.

---

## 📖 Example Use Cases

### 1. Customer Support Automation
Agent reads tickets, searches knowledge base, drafts responses, escalates complex issues.

### 2. Data Analysis Pipeline
Agent processes CSV files in parallel, generates insights, creates visualizations.

### 3. Research Assistant
Agent searches multiple sources, synthesizes findings, generates comprehensive reports.

### 4. Code Review Bot
Agent analyzes PRs, suggests improvements, checks for security issues, posts comments.

### 5. Email Management
Agent categorizes emails, drafts responses, schedules meetings, flags urgent items.

**Download example projects**: Will be in `/examples` folder at launch.

---

## 🤝 Contributing (Post-Launch)

CloutAgent will be open source (MIT or Apache 2.0 license).

**Contribution areas:**
- 🐛 Bug fixes and testing
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- 🔌 New MCP integrations
- 📦 Example agent templates
- 🌍 Internationalization

**Coming soon:**
- Contributing guidelines
- Code of conduct
- Issue templates
- Development setup guide

---

## 📞 Support & Community

**Documentation:** https://docs.cloutagent.dev (coming soon)  
**GitHub:** https://github.com/cloutagent/cloutagent (coming soon)  
**Discord:** https://discord.gg/cloutagent (coming soon)  
**Email:** support@cloutagent.dev (coming soon)

---

## 🗺️ Roadmap

### v1.0 - MVP (Q4 2025)
Core functionality, visual editor, API, security, monitoring

### v1.5 (Q1 2026)
Performance optimizations, more examples, UI improvements

### v2.0 (Q2-Q3 2026)
Multi-user collaboration, agent marketplace, scheduled executions, advanced debugging

### v3.0 (Q4 2026)
Enterprise features, database migration, advanced analytics, plugin system

See [PRD.md - Post-MVP Roadmap](./PRD.md#post-mvp-roadmap-high-level) for details.

---

## 📜 License

**To be determined** (will be MIT or Apache 2.0)

CloutAgent is built on top of Claude Agent SDK by Anthropic.

---

## 🙏 Acknowledgments

- **Anthropic** for Claude Agent SDK
- **ReactFlow** for the visual editor foundation
- **Community** for feedback and contributions (coming soon)

---

## 🔗 Related Resources

- [Claude Agent SDK Documentation](https://docs.claude.com/en/api/agent-sdk/overview)
- [Building Agents Blog Post](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Claude Sonnet 4.5 Announcement](https://www.anthropic.com/news/claude-sonnet-4-5)
- [Model Context Protocol](https://modelcontextprotocol.io)

---

**CloutAgent - Agents with Impact**  
*Making AI agent development accessible to every developer*

---

## 📋 Document Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Oct 1, 2025 | Initial PRD, comprehensive specification complete |

---

**Questions?** Open an issue or contact the team (details coming soon).

**Ready to build?** Start with [QUICK_START.md](./QUICK_START.md)!
