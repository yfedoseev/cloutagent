# CloutAgent - Technical Stack Specification

**Version:** 1.0 (MVP)  
**Last Updated:** October 1, 2025

---

## Overview

CloutAgent uses a modern TypeScript monorepo architecture with React frontend and Express backend, both built on Node.js 20+.

---

## Frontend Stack

### Core Framework
- **React 19+** - UI framework
  - New `use()` hook for promises/contexts
  - Actions for form handling
  - React Server Components (stable)
  - Concurrent features enabled
  - Strict mode in development
  - Production optimizations
- **TypeScript 5.3+** - Type safety
  - Strict mode enabled
  - Path aliases configured

### Build & Development
- **Vite 7+** - Build tool & dev server (ESM only)
  - Fast Hot Module Replacement (HMR)
  - Optimized production builds
  - Tree-shaking & code-splitting
  - Environment variable handling
  - **Note**: Vite 7 requires Node.js 22.12+
- **SWC** - Fast TypeScript/JSX transpilation (via Vite)

### State Management
- **Zustand 4.4+** - Global state
  - Lightweight (~3KB gzipped)
  - No boilerplate
  - DevTools integration
  - Persistence middleware for canvas state

**Store Structure:**
```typescript
// stores/projectStore.ts
interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  loading: boolean;
  error: string | null;
}

// stores/canvasStore.ts
interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  viewport: { x: number; y: number; zoom: number };
}

// stores/executionStore.ts
interface ExecutionState {
  currentExecution: Execution | null;
  events: ExecutionEvent[];
  status: 'idle' | 'running' | 'completed' | 'failed';
}
```

### UI Components & Styling

#### Component Library
- **shadcn/ui** - Copy-paste components
  - Based on Radix UI primitives
  - Customizable with Tailwind
  - Accessible by default (ARIA compliant)
  - Components used:
    - Button, Input, Select, Dialog, Dropdown
    - Popover, Tooltip, Tabs, Card
    - Sheet (sidebar), Alert, Badge
    - Command (⌘K menu)

#### Styling
- **Tailwind CSS 3.4+** - Utility-first CSS
  - JIT compiler enabled
  - Custom color palette (Anthropic-inspired)
  - Dark mode support (class-based)
  - Custom animations for execution states
- **CSS Modules** - Scoped styles (when needed)
  - For complex animations
  - Canvas-specific styles

**Tailwind Config:**
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Anthropic-inspired palette
        primary: { /* coral/orange tones */ },
        secondary: { /* neutral grays */ },
        success: { /* green */ },
        error: { /* red */ },
        warning: { /* yellow */ },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

#### Icons
- **Lucide React 0.300+** - Icon library
  - 1000+ icons, consistent style
  - Tree-shakeable
  - TypeScript support
  - Usage: `<PlayIcon className="h-4 w-4" />`

### Visual Canvas Editor
- **ReactFlow 11.10+** - Node-based canvas
  - Drag-and-drop nodes
  - Custom node types
  - Edge routing
  - Zoom & pan
  - Minimap
  - Background grid
  - Undo/redo support

**Custom Node Types:**
```typescript
// AgentNode.tsx
const nodeTypes = {
  agent: AgentNode,
  subagent: SubagentNode,
  hook: HookNode,
  mcp: MCPNode,
};

// Node styling based on state
const nodeClassName = (state: NodeState) => {
  switch (state) {
    case 'idle': return 'border-gray-300';
    case 'running': return 'border-blue-500 animate-pulse';
    case 'success': return 'border-green-500';
    case 'error': return 'border-red-500';
  }
};
```

### Forms & Validation
- **React Hook Form 7.49+** - Form management
  - Minimal re-renders
  - Built-in validation
  - Async validation support
- **Zod 3.22+** - Schema validation
  - Runtime type safety
  - Detailed error messages
  - Shared schemas with backend

**Example Schema:**
```typescript
// schemas/agentConfig.ts
const agentConfigSchema = z.object({
  name: z.string().min(1).max(100),
  systemPrompt: z.string().min(1),
  model: z.enum(['claude-sonnet-4-5', 'claude-opus-4']),
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().int().min(1).max(200000),
  enabledTools: z.array(z.string()),
});

// Usage in form
const form = useForm({
  resolver: zodResolver(agentConfigSchema),
});
```

### Code Editor
- **Monaco Editor (React) 4.6+** - VS Code editor
  - Syntax highlighting for prompts
  - Multi-line editing
  - Variable auto-completion
  - Find & replace
  - Minimap
  - Themes: light & dark

**Editor Features:**
```typescript
<MonacoEditor
  language="markdown"
  theme={isDark ? 'vs-dark' : 'vs-light'}
  value={prompt}
  onChange={setPrompt}
  options={{
    minimap: { enabled: true },
    wordWrap: 'on',
    lineNumbers: 'on',
    suggest: {
      showVariables: true, // {{variable}} completion
    },
  }}
/>
```

### Charts & Visualization
- **Recharts 2.10+** - Chart library
  - Line charts (cost over time)
  - Bar charts (execution counts)
  - Pie charts (tool usage)
  - Responsive
  - Animated transitions

**Example:**
```typescript
<LineChart data={costHistory} width={600} height={300}>
  <XAxis dataKey="timestamp" />
  <YAxis />
  <Tooltip />
  <Line 
    type="monotone" 
    dataKey="cost" 
    stroke="#ff6b6b" 
    strokeWidth={2}
  />
</LineChart>
```

### Real-Time Communication
- **EventSource API** - Server-Sent Events (SSE)
  - Built-in browser API (no library needed)
  - Automatic reconnection
  - Simple text/event-stream format

**SSE Client:**
```typescript
const useExecutionStream = (executionId: string) => {
  const [events, setEvents] = useState<ExecutionEvent[]>([]);
  
  useEffect(() => {
    const eventSource = new EventSource(
      `/api/v1/executions/${executionId}/stream`,
      { withCredentials: true }
    );
    
    eventSource.onmessage = (e) => {
      const event = JSON.parse(e.data);
      setEvents(prev => [...prev, event]);
    };
    
    eventSource.onerror = () => {
      eventSource.close();
      // Implement exponential backoff reconnection
    };
    
    return () => eventSource.close();
  }, [executionId]);
  
  return events;
};
```

### HTTP Client
- **Fetch API** - Native browser API
  - No axios needed
  - TypeScript-friendly
  - Supports FormData, streams, etc.

**API Client:**
```typescript
// lib/api.ts
class APIClient {
  private baseURL = '/api/v1';
  private apiKey: string;
  
  async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      throw new APIError(response.status, await response.json());
    }
    
    return response.json();
  }
  
  async executeAgent(projectId: string, params: ExecutionParams) {
    return this.request<ExecutionResponse>(
      `/projects/${projectId}/execute`,
      { method: 'POST', body: JSON.stringify(params) }
    );
  }
}
```

### Routing
- **React Router v6.20+** - Client-side routing
  - Nested routes
  - Lazy loading
  - Route guards
  - Outlet-based layouts

**Routes:**
```typescript
// router.tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <ProjectList /> },
      { 
        path: 'project/:id', 
        element: <ProjectEditor />,
        children: [
          { path: 'canvas', element: <Canvas /> },
          { path: 'settings', element: <ProjectSettings /> },
          { path: 'api', element: <APITab /> },
        ],
      },
      { path: 'executions/:id', element: <ExecutionViewer /> },
    ],
  },
]);
```

### Utilities
- **date-fns 3.0+** - Date manipulation
  - Tree-shakeable (import only what you need)
  - Lightweight vs moment.js
  - Immutable & pure functions
  - Usage: `format(date, 'PPpp')`

- **clsx 2.0+** - Conditional classnames
  - Tiny utility for joining classnames
  - Usage: `clsx('btn', isActive && 'btn-active')`

- **tailwind-merge 2.2+** - Merge Tailwind classes
  - Resolves conflicts (e.g., `px-4 px-2` → `px-2`)
  - Usage with clsx: `cn('px-4', className)`

### Notifications
- **Sonner 1.3+** - Toast notifications
  - Minimal, accessible
  - Dismissable, stacked
  - Promise-based (loading → success/error)

```typescript
import { toast } from 'sonner';

toast.promise(
  saveProject(),
  {
    loading: 'Saving project...',
    success: 'Project saved!',
    error: 'Failed to save project',
  }
);
```

### Frontend Package.json

```json
{
  "name": "@cloutagent/frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "test": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^6.20.0",
    "reactflow": "^11.10.0",
    "zustand": "^4.4.7",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tooltip": "^1.0.7",
    "lucide-react": "^0.300.0",
    "recharts": "^2.10.0",
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.0",
    "@monaco-editor/react": "^4.6.0",
    "sonner": "^1.3.0",
    "date-fns": "^3.0.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^7.1.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "vitest": "^1.0.4",
    "@playwright/test": "^1.40.1"
  }
}
```

---

## Backend Stack

### Core Framework
- **Node.js 22+ (LTS)** - Runtime
  - Native ESM support
  - Top-level await
  - Improved performance
  - OpenSSL 3.5.2 support
  - **Note**: Node.js 18 reached EOL April 2025
- **Express.js 4.18+** - Web framework
  - Battle-tested, stable
  - Middleware ecosystem
  - Simple, unopinionated
- **TypeScript 5.3+** - Type safety
  - Strict mode enabled
  - Path aliases

### Build & Development
- **tsx 4.7+** - TypeScript execution (dev)
  - Fast compilation
  - Watch mode
  - No separate build step in dev
- **tsup 8.0+** - Production bundler
  - Bundle for deployment
  - Tree-shaking
  - Minification

### Core Dependencies

#### Claude Agent SDK
- **@anthropic-ai/claude-agent-sdk** - Primary dependency
  - Agent orchestration
  - Subagent management
  - Hook system
  - Tool management
  - MCP integration
  - Cost tracking
  - OTEL integration

```typescript
import { ClaudeAgentSDK } from '@anthropic-ai/claude-agent-sdk';

const sdk = new ClaudeAgentSDK({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4-5',
  systemPrompt: 'You are a helpful assistant',
  tools: ['bash', 'file_create', 'str_replace', 'view'],
});
```

#### Security & Validation
- **bcrypt 5.1+** - Password hashing (API keys)
  - Adaptive hashing (cost factor: 10)
  - Salt rounds configurable
- **helmet 7.1+** - Security headers
  - CSP, HSTS, X-Frame-Options, etc.
  - Defaults are sensible
- **cors 2.8+** - CORS middleware
  - Configure allowed origins
  - Credentials support
- **express-rate-limit 7.1+** - Rate limiting
  - Per-IP limits
  - Configurable windows
  - Memory store (Redis in v2.0)
- **zod 3.22+** - Request validation
  - Runtime type checking
  - Shared schemas with frontend

#### Utilities
- **uuid 9.0+** - UUID generation
  - v4 for execution IDs, API keys
- **dotenv 16.3+** - Environment variables
  - Load from .env file
  - Type-safe access (with custom wrapper)
- **archiver 6.0+** - ZIP creation (backups)
- **unzipper 0.10+** - ZIP extraction (restore)

#### Logging
- **winston 3.11+** - Structured logging
  - Multiple transports (console, file)
  - Log levels (error, warn, info, debug)
  - JSON format
  - OTEL integration

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

### Middleware Stack

```typescript
// app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();

// Security
app.use(helmet());
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later',
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Custom middleware
app.use(requestLogger);
app.use(errorHandler);
```

### API Structure

```typescript
// routes/index.ts
import { Router } from 'express';
import { projectRoutes } from './projects';
import { executionRoutes } from './executions';
import { healthRoutes } from './health';

const router = Router();

router.use('/projects', projectRoutes);
router.use('/executions', executionRoutes);
router.use('/health', healthRoutes);

export { router };
```

### Backend Package.json

```json
{
  "name": "@cloutagent/backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts --format esm --clean",
    "start": "node dist/index.js",
    "lint": "eslint . --ext ts",
    "format": "prettier --write \"src/**/*.ts\"",
    "test": "vitest",
    "test:api": "vitest --config vitest.api.config.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "@anthropic-ai/claude-agent-sdk": "latest",
    "zod": "^3.22.4",
    "bcrypt": "^5.1.1",
    "uuid": "^9.0.1",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1",
    "archiver": "^6.0.1",
    "unzipper": "^0.10.14"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.5",
    "@types/cors": "^2.8.17",
    "@types/bcrypt": "^5.0.2",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "tsup": "^8.0.1",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1",
    "vitest": "^1.0.4",
    "supertest": "^6.3.3"
  }
}
```

---

## Monorepo Structure

```
cloutagent/
├── apps/
│   ├── frontend/                   # React SPA
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── stores/
│   │   │   ├── lib/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── tsconfig.json
│   │
│   └── backend/                    # Express API
│       ├── src/
│       │   ├── routes/
│       │   ├── middleware/
│       │   ├── services/
│       │   ├── utils/
│       │   └── types/
│       ├── package.json
│       ├── tsconfig.json
│       └── tsup.config.ts
│
├── packages/                       # Shared code
│   └── types/                      # Shared TypeScript types
│       ├── src/
│       │   ├── agent.ts
│       │   ├── execution.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── nginx.conf
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── docker-compose.yml
├── package.json                    # Root workspace
├── pnpm-workspace.yaml
├── .eslintrc.json
├── .prettierrc.json
└── README.md
```

### Root Package.json

```json
{
  "name": "cloutagent",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently \"pnpm -F frontend dev\" \"pnpm -F backend dev\"",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "format": "pnpm -r format",
    "test": "pnpm -r test"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "pnpm": "^8.14.0"
  }
}
```

---

## Development Tools

### Package Manager
**pnpm 8+** (recommended) or **npm workspaces**

**Why pnpm:**
- Faster installs (hard links)
- Disk space efficient
- Strict dependency resolution
- Built-in workspace support

```bash
# Install pnpm globally
npm install -g pnpm

# Install dependencies
pnpm install

# Run dev servers
pnpm dev
```

### Code Quality

#### ESLint Config
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

#### Prettier Config
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### Testing

#### Vitest (Unit Tests)
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
});
```

#### Playwright (E2E Tests)
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Docker Configuration

### Multi-Stage Dockerfile (Frontend)

```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Dockerfile (Backend)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./apps/frontend
      dockerfile: ../../docker/Dockerfile.frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

  backend:
    build:
      context: ./apps/backend
      dockerfile: ../../docker/Dockerfile.backend
    ports:
      - "3001:3001"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - PORT=3001
      - NODE_ENV=production
    volumes:
      - ./projects:/app/projects
      - ./backups:/app/backups
    restart: unless-stopped
```

---

## Environment Variables

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3001/api/v1
VITE_ENV=development
```

### Backend (.env)
```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...
ENCRYPTION_KEY=auto_generated_on_first_run

# Optional
PORT=3001
NODE_ENV=development
LOG_LEVEL=info
MAX_CONCURRENT_EXECUTIONS=3
BACKUP_ENABLED=true
FRONTEND_URL=http://localhost:3000

# OTEL (optional)
OTEL_ENDPOINT=http://localhost:4318
```

---

## Summary

### Frontend: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Canvas**: ReactFlow
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Editor**: Monaco Editor
- **Versions**: React 19+, Vite 7+ (ESM only)

### Backend: Express + TypeScript
- **Core**: Express.js on Node.js 22+
- **Agent SDK**: @anthropic-ai/claude-agent-sdk
- **Security**: helmet, cors, bcrypt, rate-limit
- **Validation**: Zod
- **Logging**: Winston + OTEL

### DevOps
- **Build**: Vite (frontend) + tsup (backend)
- **Lint**: ESLint + Prettier
- **Test**: Vitest + Playwright
- **Deploy**: Docker + Docker Compose
- **Monorepo**: pnpm workspaces

---

**All dependencies confirmed and production-ready!** ✅

