# Phase 9: Documentation & Examples - Execution Plan

**Timeline**: Weeks 15-16
**Focus**: Documentation, Examples, Onboarding, Help Center
**Goal**: Comprehensive documentation, example workflows, interactive tutorials, and smooth user onboarding

## Overview

Phase 9 completes the MVP with comprehensive documentation and examples:
- **User Documentation**: Getting started, user guides, best practices
- **API Documentation**: Complete API reference with examples
- **Developer Guides**: Architecture docs, contribution guide, deployment guide
- **Example Workflows**: Pre-built workflows for common use cases
- **Interactive Tutorials**: Step-by-step guided tours
- **Help Center**: FAQs, troubleshooting, video tutorials
- **Onboarding Flow**: New user welcome and quick start

## Documentation Structure

### User Documentation
```
/docs/user/
├── getting-started.md
│   ├── Installation
│   ├── Quick Start
│   ├── First Workflow
│   └── Core Concepts
├── guides/
│   ├── visual-editor.md
│   ├── agent-configuration.md
│   ├── subagents.md
│   ├── hooks.md
│   ├── mcp-integration.md
│   ├── variables-secrets.md
│   ├── testing-workflows.md
│   └── version-control.md
├── best-practices/
│   ├── workflow-design.md
│   ├── cost-optimization.md
│   ├── security.md
│   └── performance.md
└── troubleshooting/
    ├── common-errors.md
    ├── debugging.md
    └── faq.md
```

### API Documentation
```
/docs/api/
├── overview.md
├── authentication.md
├── endpoints/
│   ├── projects.md
│   ├── executions.md
│   ├── variables.md
│   ├── secrets.md
│   ├── mcp.md
│   └── analytics.md
├── websockets.md
├── sse.md
├── rate-limits.md
└── errors.md
```

### Developer Documentation
```
/docs/developer/
├── architecture.md
├── setup.md
├── contributing.md
├── deployment.md
├── testing.md
└── release-process.md
```

## Tasks

### TASK-056: User Documentation

**Agent**: prompt-engineer
**Priority**: P0
**Estimated Time**: 12 hours
**Dependencies**: All previous phases

**Description**: Write comprehensive user documentation covering all features.

**Content to Create**:

1. **Getting Started Guide**
```markdown
# Getting Started with CloutAgent

## What is CloutAgent?

CloutAgent is a visual workflow builder for creating and orchestrating Claude-powered agent workflows. Build complex AI automation visually, no coding required.

## Installation

### Requirements
- Node.js 22+ (LTS)
- pnpm 8+
- Anthropic API key

### Quick Install

bash
# Clone the repository
git clone https://github.com/yfedoseev/cloutagent.git
cd cloutagent

# Install dependencies
pnpm install

# Create environment file
cp .env.example .env

# Add your Anthropic API key
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env

# Start the application
pnpm dev


Access the app at http://localhost:3000

## Your First Workflow

### Step 1: Create a Project

1. Click "New Project" in the dashboard
2. Enter project name: "My First Workflow"
3. Add description (optional)
4. Click "Create"

### Step 2: Add an Agent Node

1. Drag "Agent" from the node palette
2. Drop it on the canvas
3. Click the node to configure:
   - **Name**: "Code Generator"
   - **Model**: Claude Sonnet 4.5
   - **System Prompt**: "You are an expert programmer..."
   - **Max Tokens**: 4000

### Step 3: Execute Your Workflow

1. Click the "Run" button
2. Enter your prompt: "Write a Python function to calculate Fibonacci"
3. Watch real-time execution
4. View the generated code

Congratulations! 🎉 You've created your first AI workflow.

## Core Concepts

### Nodes
- **Agent**: Main AI agent that processes your prompts
- **Subagent**: Specialized agents (frontend, backend, etc.)
- **Hook**: Lifecycle event handlers
- **MCP**: External tool integrations

### Variables
Store and reuse data across workflow executions.

### Secrets
Securely store API keys and credentials (AES-256 encrypted).

### Execution
Run workflows with real-time streaming and monitoring.

## Next Steps

- [Configure Advanced Nodes](./guides/agent-configuration.md)
- [Add Subagents](./guides/subagents.md)
- [Integrate MCP Servers](./guides/mcp-integration.md)
- [Explore Example Workflows](../examples/)
```

2. **Visual Editor Guide**
3. **Agent Configuration Guide**
4. **Testing Workflows Guide**
5. **Best Practices**
6. **Troubleshooting Guide**
7. **FAQ**

**Acceptance Criteria**:
- [ ] All major features documented
- [ ] Screenshots for visual guides
- [ ] Code examples included
- [ ] Common errors documented
- [ ] Search-friendly formatting
- [ ] Up-to-date with latest version

---

### TASK-057: API Documentation

**Agent**: backend-engineer + prompt-engineer
**Priority**: P0
**Estimated Time**: 8 hours
**Dependencies**: All backend tasks

**Description**: Create complete API reference documentation with OpenAPI/Swagger spec.

**Implementation**:

```yaml
# openapi.yaml

openapi: 3.0.0
info:
  title: CloutAgent API
  version: 1.0.0
  description: Visual workflow builder API for Claude Agent SDK
  contact:
    name: API Support
    url: https://github.com/yfedoseev/cloutagent
  license:
    name: MIT

servers:
  - url: http://localhost:3001/api
    description: Development server
  - url: https://api.cloutagent.com/api
    description: Production server

security:
  - ApiKeyAuth: []

paths:
  /projects:
    get:
      summary: List all projects
      tags: [Projects]
      responses:
        '200':
          description: List of projects
          content:
            application/json:
              schema:
                type: object
                properties:
                  projects:
                    type: array
                    items:
                      $ref: '#/components/schemas/Project'

    post:
      summary: Create a new project
      tags: [Projects]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name]
              properties:
                name:
                  type: string
                  example: "My Workflow"
                description:
                  type: string
                  example: "A sample workflow"
      responses:
        '201':
          description: Project created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Project'

  /projects/{projectId}/execute:
    post:
      summary: Execute workflow
      tags: [Execution]
      parameters:
        - name: projectId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ExecutionConfig'
      responses:
        '200':
          description: Execution started
          content:
            application/json:
              schema:
                type: object
                properties:
                  executionId:
                    type: string

  /executions/{executionId}/stream:
    get:
      summary: Stream execution events (SSE)
      tags: [Execution]
      parameters:
        - name: executionId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Event stream
          content:
            text/event-stream:
              schema:
                type: string

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

  schemas:
    Project:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        description:
          type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    ExecutionConfig:
      type: object
      required: [input]
      properties:
        input:
          type: string
          example: "Write a Python script"
        options:
          type: object
          properties:
            streaming:
              type: boolean
              default: true
            maxRetries:
              type: integer
              default: 3
```

**Documentation Pages**:

1. **API Overview**: Authentication, base URL, versioning
2. **Endpoints by Resource**: Projects, Executions, Variables, Secrets, MCP, Analytics
3. **Real-time APIs**: SSE, WebSocket connections
4. **Rate Limits**: Request limits, handling 429 errors
5. **Error Codes**: Standard error responses with examples
6. **SDKs & Client Libraries**: TypeScript, Python (future)

**Acceptance Criteria**:
- [ ] OpenAPI 3.0 spec complete
- [ ] All endpoints documented
- [ ] Request/response examples
- [ ] Error responses documented
- [ ] Interactive API explorer (Swagger UI)
- [ ] Code samples in multiple languages

---

### TASK-058: Example Workflows

**Agent**: prompt-engineer + frontend-engineer
**Priority**: P0
**Estimated Time**: 10 hours
**Dependencies**: Export/import functionality

**Description**: Create 10+ example workflows for common use cases.

**Example Workflows to Create**:

1. **Code Review Assistant**
```json
{
  "name": "Code Review Assistant",
  "description": "Automated code review with best practices",
  "category": "development",
  "nodes": [
    {
      "type": "agent",
      "config": {
        "name": "Code Reviewer",
        "systemPrompt": "You are an expert code reviewer...",
        "model": "claude-sonnet-4.5"
      }
    },
    {
      "type": "subagent",
      "config": {
        "type": "frontend-engineer",
        "name": "Frontend Reviewer",
        "prompt": "Review React components for best practices"
      }
    },
    {
      "type": "subagent",
      "config": {
        "type": "backend-engineer",
        "name": "Backend Reviewer",
        "prompt": "Review API endpoints for security and performance"
      }
    },
    {
      "type": "hook",
      "config": {
        "type": "post-execution",
        "action": {
          "type": "custom",
          "code": "console.log('Review complete:', context)"
        }
      }
    }
  ]
}
```

2. **Documentation Generator**
3. **Bug Fixer**
4. **Data Analysis Pipeline**
5. **Content Creation Workflow**
6. **API Integration Builder**
7. **Database Schema Designer**
8. **Test Case Generator**
9. **Deployment Automation**
10. **Customer Support Bot**

**Each Example Includes**:
- Workflow JSON (importable)
- README with use case description
- Setup instructions
- Required variables/secrets
- Expected output
- Customization guide

**Acceptance Criteria**:
- [ ] 10 complete example workflows
- [ ] Importable JSON files
- [ ] Documentation for each example
- [ ] Screenshots of expected results
- [ ] Video walkthroughs (optional)

---

### TASK-059: Interactive Onboarding

**Agent**: frontend-engineer + ui-ux-designer
**Priority**: P1
**Estimated Time**: 6 hours
**Dependencies**: Frontend components

**Description**: Create interactive onboarding flow for new users.

**Implementation**:

```typescript
// apps/frontend/src/components/Onboarding.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  skippable: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to CloutAgent',
    description: 'Build AI workflows visually with Claude',
    component: WelcomeStep,
    skippable: false,
  },
  {
    id: 'api-key',
    title: 'Add Anthropic API Key',
    description: 'Connect your Claude API key to start building',
    component: APIKeyStep,
    skippable: false,
  },
  {
    id: 'first-project',
    title: 'Create Your First Project',
    description: 'Let\'s create a simple workflow together',
    component: FirstProjectStep,
    skippable: true,
  },
  {
    id: 'canvas-tour',
    title: 'Visual Editor Tour',
    description: 'Learn the canvas basics',
    component: CanvasTourStep,
    skippable: true,
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Start building amazing AI workflows',
    component: CompleteStep,
    skippable: false,
  },
];

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding complete
      localStorage.setItem('onboarding_completed', 'true');
      navigate('/dashboard');
    }
  };

  const handleSkip = () => {
    if (ONBOARDING_STEPS[currentStep].skippable) {
      handleNext();
    }
  };

  const step = ONBOARDING_STEPS[currentStep];
  const Component = step.component;

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
      <div className="max-w-2xl w-full p-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </span>
          </div>

          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-3">{step.title}</h2>
          <p className="text-lg text-gray-400 mb-6">{step.description}</p>

          <Component onComplete={handleNext} />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            disabled={!step.skippable}
            className="text-gray-400 hover:text-white disabled:opacity-0"
          >
            Skip
          </button>

          <button
            onClick={handleNext}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
          >
            {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="text-center">
      <div className="text-6xl mb-6">🤖</div>
      <p className="text-xl text-gray-300 mb-4">
        CloutAgent makes it easy to build powerful AI workflows using Claude.
      </p>
      <ul className="text-left max-w-md mx-auto space-y-2 text-gray-400">
        <li>✅ Visual workflow builder - no code required</li>
        <li>✅ Real-time execution monitoring</li>
        <li>✅ Built-in cost tracking</li>
        <li>✅ Version control & collaboration</li>
      </ul>
    </div>
  );
}

function APIKeyStep({ onComplete }: { onComplete: () => void }) {
  const [apiKey, setApiKey] = useState('');

  const handleSave = async () => {
    // Save API key
    await fetch('/api/settings/api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });

    onComplete();
  };

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Anthropic API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="sk-ant-..."
          className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500"
        />
      </div>

      <p className="text-sm text-gray-400 mb-4">
        Don't have an API key?{' '}
        <a
          href="https://console.anthropic.com/"
          target="_blank"
          className="text-blue-400 hover:underline"
        >
          Get one here
        </a>
      </p>

      <button
        onClick={handleSave}
        disabled={!apiKey}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold disabled:opacity-50"
      >
        Save & Continue
      </button>
    </div>
  );
}

// ... other step components
```

**Acceptance Criteria**:
- [ ] 5-step onboarding flow
- [ ] API key setup integrated
- [ ] First project creation guided
- [ ] Canvas tour with tooltips
- [ ] Completion celebration
- [ ] Skippable optional steps

---

### TASK-060: Help Center & Video Tutorials

**Agent**: prompt-engineer + ui-ux-designer
**Priority**: P2
**Estimated Time**: 8 hours
**Dependencies**: Documentation

**Description**: Create help center with searchable docs and video tutorials.

**Help Center Structure**:

```typescript
// apps/frontend/src/components/HelpCenter.tsx

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Help Center</h1>

      {/* Search */}
      <div className="mb-8">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search for help..."
          className="w-full px-4 py-3 bg-gray-800 rounded-lg"
        />
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <CategoryCard
          icon="🚀"
          title="Getting Started"
          description="New to CloutAgent? Start here"
          articleCount={12}
        />

        <CategoryCard
          icon="🎨"
          title="Visual Editor"
          description="Learn the canvas and nodes"
          articleCount={8}
        />

        <CategoryCard
          icon="🔧"
          title="Advanced Features"
          description="Subagents, hooks, and MCP"
          articleCount={15}
        />
      </div>

      {/* Popular Articles */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Popular Articles</h2>
        <div className="space-y-3">
          <ArticleLink
            title="How to create your first workflow"
            views={1243}
            helpful={42}
          />
          <ArticleLink
            title="Understanding agent configuration"
            views={892}
            helpful={38}
          />
          <ArticleLink
            title="Working with variables and secrets"
            views={654}
            helpful={29}
          />
        </div>
      </div>

      {/* Video Tutorials */}
      <div>
        <h2 className="text-2xl font-bold mb-4">📹 Video Tutorials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <VideoCard
            title="CloutAgent in 5 Minutes"
            duration="5:24"
            thumbnail="/videos/intro.jpg"
            url="https://youtube.com/..."
          />

          <VideoCard
            title="Building Your First Workflow"
            duration="12:45"
            thumbnail="/videos/first-workflow.jpg"
            url="https://youtube.com/..."
          />
        </div>
      </div>
    </div>
  );
}
```

**Video Tutorials to Create** (scripts):

1. **CloutAgent in 5 Minutes** (Overview)
2. **Your First Workflow** (Quickstart)
3. **Understanding Nodes** (Concepts)
4. **Configuring Agents** (Advanced)
5. **Working with Subagents** (Advanced)
6. **MCP Integration** (Advanced)
7. **Cost Optimization Tips** (Best Practices)
8. **Debugging Workflows** (Troubleshooting)

**Acceptance Criteria**:
- [ ] Searchable help center
- [ ] Category organization
- [ ] Popular articles tracked
- [ ] Video tutorial scripts written
- [ ] Embedded video players
- [ ] Related articles suggestions

---

## Documentation Delivery

### Format & Tools
- **Markdown**: All documentation written in Markdown
- **Static Site**: Docusaurus or VitePress for documentation site
- **OpenAPI**: Swagger UI for interactive API docs
- **Search**: Algolia or local search
- **Analytics**: Track popular pages

### Documentation Site Structure
```
docs.cloutagent.com/
├── /
│   └── Landing page with quick links
├── /getting-started
│   └── Installation, quickstart, concepts
├── /guides
│   └── Feature-specific guides
├── /api-reference
│   └── Interactive API documentation
├── /examples
│   └── Example workflows and templates
├── /best-practices
│   └── Design patterns and optimization
├── /troubleshooting
│   └── Common issues and solutions
├── /videos
│   └── Video tutorial library
└── /changelog
    └── Release notes and updates
```

## Testing Strategy

### Documentation Quality
- Technical accuracy verified
- Code samples tested
- Screenshots up-to-date
- Links validated
- Search functionality tested

### Example Workflows
- All examples importable
- Execution tested
- Expected outputs verified
- Variables/secrets documented

### Onboarding Flow
- Complete flow tested
- API key validation works
- Project creation succeeds
- Tour tooltips accurate

## Success Metrics

- [ ] 100% feature coverage in docs
- [ ] All API endpoints documented
- [ ] 10+ example workflows available
- [ ] Onboarding completion rate >80%
- [ ] Help center search accuracy >90%
- [ ] Video tutorials for key features
- [ ] User satisfaction score >4.5/5

## Dependencies

### External Libraries
- **Docusaurus** or **VitePress**: Documentation site generator
- **Swagger UI**: Interactive API documentation
- **Algolia**: Search (optional)

### Phase Dependencies
- All previous phases (for complete feature documentation)

## Rollout Plan

1. **Week 15 Days 1-3**: User documentation (TASK-056)
2. **Week 15 Days 4-5**: API documentation (TASK-057)
3. **Week 16 Days 1-2**: Example workflows (TASK-058)
4. **Week 16 Days 3-4**: Onboarding flow (TASK-059)
5. **Week 16 Day 5**: Help center and video scripts (TASK-060)

## Post-MVP Documentation

After MVP launch, continue adding:
- **Community Examples**: User-contributed workflows
- **Advanced Tutorials**: Complex multi-agent systems
- **Integration Guides**: Third-party service integrations
- **Performance Tuning**: Advanced optimization techniques
- **Security Hardening**: Production security best practices
- **Case Studies**: Real-world usage examples

## Notes

- **Living Documentation**: Docs updated with each release
- **Community Contributions**: Accept PR for documentation improvements
- **Internationalization**: English first, other languages later
- **Accessibility**: Documentation site WCAG 2.1 AA compliant
- **SEO**: Optimize for search engines to aid discovery
