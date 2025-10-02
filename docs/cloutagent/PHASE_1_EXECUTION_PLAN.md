# Phase 1: Core Infrastructure - Detailed Execution Plan

**Duration**: Weeks 1-2
**Parallel Execution**: Up to 6 agents can work simultaneously
**Status**: Ready for execution

---

## Interface Contracts (Must be defined FIRST)

These contracts must be agreed upon before task execution begins. All agents must implement against these exact interfaces.

### IC-001: Project Storage Interface

```typescript
// packages/types/src/storage.ts
export interface IProjectStorage {
  // Create new project
  create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project>;

  // Read project by ID
  read(id: string): Promise<Project | null>;

  // Update project
  update(id: string, updates: Partial<Project>): Promise<Project>;

  // Delete project
  delete(id: string): Promise<void>;

  // List all projects
  list(): Promise<Project[]>;

  // Check if project exists
  exists(id: string): Promise<boolean>;
}

// File system paths
export const PROJECT_ROOT = '/app/projects';
export const getProjectPath = (id: string) => `${PROJECT_ROOT}/${id}`;
export const getProjectMetadataPath = (id: string) => `${getProjectPath(id)}/metadata.json`;
```

### IC-002: Secret Management Interface

```typescript
// packages/types/src/secrets.ts
export interface ISecretManager {
  // Encrypt secret value
  encrypt(plaintext: string): Promise<string>;

  // Decrypt secret value
  decrypt(ciphertext: string): Promise<string>;

  // Store secret for project
  setSecret(projectId: string, name: string, value: string): Promise<void>;

  // Retrieve decrypted secret
  getSecret(projectId: string, name: string): Promise<string | null>;

  // List secret names (not values)
  listSecrets(projectId: string): Promise<string[]>;

  // Delete secret
  deleteSecret(projectId: string, name: string): Promise<void>;
}

// Encryption configuration
export interface EncryptionConfig {
  algorithm: 'aes-256-gcm';
  keyLength: 32; // 256 bits
  ivLength: 16; // 128 bits
}

// Encrypted secret format
export interface EncryptedSecret {
  iv: string; // hex-encoded IV
  authTag: string; // hex-encoded auth tag
  encrypted: string; // hex-encoded ciphertext
}
```

### IC-003: API Authentication Interface

```typescript
// packages/types/src/auth.ts
export interface IAuthMiddleware {
  // Validate API key from request headers
  validateAPIKey(apiKey: string): Promise<Project | null>;

  // Generate new API key for project
  generateAPIKey(): string;

  // Hash API key for storage
  hashAPIKey(apiKey: string): Promise<string>;
}

// Request with authenticated project
export interface AuthenticatedRequest extends Request {
  project: Project;
}

// API key header name
export const API_KEY_HEADER = 'X-API-Key';
```

### IC-004: REST API Endpoints

```typescript
// API route contracts
export interface ProjectCreateRequest {
  name: string;
  description?: string;
  agent: Omit<AgentConfig, 'id'>;
  limits?: {
    maxTokens?: number;
    maxCost?: number;
    timeout?: number;
  };
}

export interface ProjectCreateResponse {
  project: Project;
  apiKey: string; // Only returned once on creation
}

export interface ProjectListResponse {
  projects: Array<{
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface ProjectGetResponse {
  project: Project;
}

// API routes
export const API_ROUTES = {
  CREATE_PROJECT: 'POST /api/v1/projects',
  GET_PROJECT: 'GET /api/v1/projects/:id',
  LIST_PROJECTS: 'GET /api/v1/projects',
  HEALTH: 'GET /api/health',
} as const;
```

### IC-005: Claude Agent SDK Integration Interface

```typescript
// packages/types/src/agent-sdk.ts
export interface IAgentExecutor {
  // Initialize SDK with project config
  initialize(config: AgentConfig): Promise<void>;

  // Execute agent with prompt
  execute(prompt: string, options: ExecutionOptions): Promise<ExecutionResult>;

  // Get cost estimate
  estimateCost(promptTokens: number): number;

  // Stop running execution
  stop(): Promise<void>;
}

export interface ExecutionOptions {
  maxTokens?: number;
  maxCost?: number;
  timeout?: number;
  variables?: Record<string, string>;
}

export interface ExecutionResult {
  id: string;
  status: 'completed' | 'failed' | 'cancelled';
  result?: string;
  cost: {
    promptTokens: number;
    completionTokens: number;
    totalCost: number;
  };
  duration: number; // milliseconds
  error?: string;
}
```

### IC-006: Cost Tracking Interface

```typescript
// packages/types/src/cost.ts
export interface ICostTracker {
  // Track token usage
  trackTokens(executionId: string, usage: TokenUsage): void;

  // Calculate cost from tokens
  calculateCost(usage: TokenUsage): number;

  // Check if execution is within limits
  checkLimits(executionId: string, limits: CostLimits): LimitCheckResult;

  // Get current cost for execution
  getCurrentCost(executionId: string): number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface CostLimits {
  maxTokens?: number;
  maxCost?: number;
}

export interface LimitCheckResult {
  withinLimits: boolean;
  percentOfTokenLimit?: number;
  percentOfCostLimit?: number;
  exceeded?: 'tokens' | 'cost';
}

// Pricing (Claude Sonnet 4.5 - update if changed)
export const MODEL_PRICING = {
  'claude-sonnet-4-5': {
    promptTokens: 0.003 / 1000, // $0.003 per 1K tokens
    completionTokens: 0.015 / 1000, // $0.015 per 1K tokens
  },
} as const;
```

---

## Task Breakdown

### Track 1: Backend Core (Sequential Dependencies)

#### TASK-001: Shared Types Package Enhancement
**Agent**: `backend-engineer`
**Priority**: P0 (Blocking all other tasks)
**Estimated Time**: 2 hours
**Dependencies**: None

**Description**:
Enhance the existing `packages/types` package with all interface contracts defined above (IC-001 through IC-006). This provides the foundation for all other backend tasks.

**Files to Create/Modify**:
- `packages/types/src/storage.ts` - IC-001
- `packages/types/src/secrets.ts` - IC-002
- `packages/types/src/auth.ts` - IC-003
- `packages/types/src/api.ts` - IC-004
- `packages/types/src/agent-sdk.ts` - IC-005
- `packages/types/src/cost.ts` - IC-006
- `packages/types/src/index.ts` - Export all new types

**Acceptance Criteria**:
- [ ] All 6 interface contracts implemented exactly as specified
- [ ] TypeScript compiles without errors
- [ ] All types exported from index.ts
- [ ] No `any` types used
- [ ] JSDoc comments on all interfaces and methods

**Interface Contract**:
```typescript
// packages/types/src/index.ts - Final export structure
export * from './storage';
export * from './secrets';
export * from './auth';
export * from './api';
export * from './agent-sdk';
export * from './cost';
```

**Validation**:
```bash
cd packages/types && pnpm typecheck
```

---

#### TASK-002: File System Storage Service
**Agent**: `backend-engineer`
**Priority**: P0
**Estimated Time**: 4 hours
**Dependencies**: TASK-001

**Description**:
Implement file-based project storage with atomic writes and rollback capabilities. Must implement `IProjectStorage` interface exactly.

**Files to Create**:
- `apps/backend/src/services/FileSystemStorage.ts` - Main implementation
- `apps/backend/src/services/FileSystemStorage.test.ts` - Unit tests

**Implementation Requirements**:
1. Use `fs/promises` for async file operations
2. Implement atomic writes (write to .tmp, then rename)
3. Handle concurrent access with file locking
4. Validate JSON schema on read
5. Create directories as needed

**Example Implementation Skeleton**:
```typescript
// apps/backend/src/services/FileSystemStorage.ts
import fs from 'fs/promises';
import path from 'path';
import { IProjectStorage, Project, PROJECT_ROOT } from '@cloutagent/types';

export class FileSystemStorage implements IProjectStorage {
  async create(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    // 1. Generate UUID for project ID
    // 2. Add timestamps
    // 3. Create project directory
    // 4. Write metadata.json atomically
    // 5. Return created project
  }

  async read(id: string): Promise<Project | null> {
    // 1. Check if project exists
    // 2. Read metadata.json
    // 3. Parse and validate JSON
    // 4. Return project or null
  }

  // ... implement other methods
}
```

**Acceptance Criteria**:
- [ ] Implements `IProjectStorage` interface exactly
- [ ] All methods have error handling (try/catch)
- [ ] Atomic writes implemented (no partial writes)
- [ ] Unit tests cover all methods (95%+ coverage)
- [ ] Tests verify file system state after each operation
- [ ] Handles missing files gracefully (returns null, not throw)
- [ ] Creates directories if they don't exist

**Test Cases Required**:
```typescript
describe('FileSystemStorage', () => {
  test('create - creates project with valid ID and timestamps');
  test('create - creates directory structure');
  test('create - writes valid JSON');
  test('read - returns null for non-existent project');
  test('read - returns project for valid ID');
  test('update - updates only specified fields');
  test('delete - removes project directory');
  test('list - returns all projects');
  test('exists - returns true/false correctly');
});
```

---

#### TASK-003: Secret Management Service
**Agent**: `backend-engineer`
**Priority**: P0
**Estimated Time**: 4 hours
**Dependencies**: TASK-001, TASK-002

**Description**:
Implement AES-256-GCM encryption for secrets. Must implement `ISecretManager` interface exactly.

**Files to Create**:
- `apps/backend/src/services/SecretManager.ts` - Main implementation
- `apps/backend/src/services/SecretManager.test.ts` - Unit tests

**Implementation Requirements**:
1. Use Node.js `crypto` module (no external libraries)
2. Generate random IV for each encryption
3. Store secrets in project's `.secrets/secrets.enc` file
4. Load encryption key from environment variable

**Example Implementation Skeleton**:
```typescript
// apps/backend/src/services/SecretManager.ts
import crypto from 'crypto';
import { ISecretManager, EncryptedSecret } from '@cloutagent/types';

export class SecretManager implements ISecretManager {
  private algorithm = 'aes-256-gcm';
  private encryptionKey: Buffer;

  constructor(keyHex: string) {
    // Validate key is 64 hex chars (32 bytes)
    this.encryptionKey = Buffer.from(keyHex, 'hex');
  }

  async encrypt(plaintext: string): Promise<string> {
    // 1. Generate random IV (16 bytes)
    // 2. Create cipher
    // 3. Encrypt plaintext
    // 4. Get auth tag
    // 5. Return JSON with {iv, authTag, encrypted}
  }

  async decrypt(ciphertext: string): Promise<string> {
    // 1. Parse JSON to get iv, authTag, encrypted
    // 2. Create decipher
    // 3. Set auth tag
    // 4. Decrypt and return plaintext
  }

  // ... implement storage methods
}
```

**Acceptance Criteria**:
- [ ] Implements `ISecretManager` interface exactly
- [ ] Encryption uses AES-256-GCM correctly
- [ ] Random IV generated for each encryption
- [ ] Auth tag verification on decrypt
- [ ] Throws error on tampered ciphertext
- [ ] Unit tests verify encryption/decryption round-trip
- [ ] Tests verify different plaintexts produce different ciphertexts
- [ ] Secrets stored in `.secrets/secrets.enc` as JSON

**Test Cases Required**:
```typescript
describe('SecretManager', () => {
  test('encrypt - produces different output each time');
  test('decrypt - recovers original plaintext');
  test('decrypt - throws on invalid auth tag');
  test('setSecret - stores encrypted secret in file');
  test('getSecret - retrieves and decrypts secret');
  test('listSecrets - returns secret names only');
  test('deleteSecret - removes secret from file');
});
```

---

#### TASK-004: API Key Authentication Middleware
**Agent**: `backend-engineer`
**Priority**: P0
**Estimated Time**: 3 hours
**Dependencies**: TASK-001, TASK-002

**Description**:
Implement API key generation, hashing, and validation middleware. Must implement `IAuthMiddleware` interface exactly.

**Files to Create**:
- `apps/backend/src/middleware/auth.ts` - Middleware implementation
- `apps/backend/src/middleware/auth.test.ts` - Unit tests

**Implementation Requirements**:
1. Generate UUID-based API keys
2. Hash API keys with bcrypt (cost factor: 10)
3. Store hashed keys in project metadata
4. Validate keys from `X-API-Key` header

**Example Implementation Skeleton**:
```typescript
// apps/backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { IAuthMiddleware, AuthenticatedRequest, API_KEY_HEADER } from '@cloutagent/types';
import { FileSystemStorage } from '../services/FileSystemStorage';

export class AuthMiddleware implements IAuthMiddleware {
  constructor(private storage: FileSystemStorage) {}

  generateAPIKey(): string {
    // Generate: "cla_" + UUID (claudeagent prefix)
    return `cla_${uuidv4()}`;
  }

  async hashAPIKey(apiKey: string): Promise<string> {
    return bcrypt.hash(apiKey, 10);
  }

  async validateAPIKey(apiKey: string): Promise<Project | null> {
    // 1. List all projects
    // 2. For each project, compare hashed API key
    // 3. Return matching project or null
  }

  // Express middleware function
  authenticate = async (req: Request, res: Response, next: NextFunction) => {
    // 1. Extract API key from header
    // 2. Validate API key
    // 3. Attach project to request
    // 4. Call next() or return 401
  };
}
```

**Acceptance Criteria**:
- [ ] Implements `IAuthMiddleware` interface exactly
- [ ] API keys have format: `cla_<uuid>`
- [ ] Keys hashed with bcrypt (cost 10)
- [ ] Middleware reads from `X-API-Key` header
- [ ] Returns 401 with proper error message if invalid
- [ ] Attaches `project` to request object if valid
- [ ] Unit tests verify key generation format
- [ ] Tests verify hash/compare works correctly
- [ ] Tests verify middleware behavior (401 vs next())

**Test Cases Required**:
```typescript
describe('AuthMiddleware', () => {
  test('generateAPIKey - produces valid format');
  test('hashAPIKey - returns bcrypt hash');
  test('validateAPIKey - returns project for valid key');
  test('validateAPIKey - returns null for invalid key');
  test('authenticate - calls next() with valid key');
  test('authenticate - returns 401 with invalid key');
  test('authenticate - returns 401 with missing header');
});
```

---

#### TASK-005: REST API Routes - Projects
**Agent**: `backend-engineer`
**Priority**: P1
**Estimated Time**: 4 hours
**Dependencies**: TASK-001, TASK-002, TASK-004

**Description**:
Implement RESTful API endpoints for project management (CREATE, GET, LIST). Must match API contracts in IC-004.

**Files to Create**:
- `apps/backend/src/routes/projects.ts` - Route handlers
- `apps/backend/src/routes/projects.test.ts` - Integration tests

**Implementation Requirements**:
1. Use Express Router
2. Apply authentication middleware to all routes except health
3. Validate request bodies with Zod schemas
4. Return API key only on project creation
5. Handle errors with proper HTTP status codes

**Example Implementation Skeleton**:
```typescript
// apps/backend/src/routes/projects.ts
import { Router } from 'express';
import { z } from 'zod';
import { ProjectCreateRequest, ProjectCreateResponse } from '@cloutagent/types';
import { FileSystemStorage } from '../services/FileSystemStorage';
import { AuthMiddleware } from '../middleware/auth';

const router = Router();

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  agent: z.object({
    name: z.string(),
    systemPrompt: z.string(),
    model: z.enum(['claude-sonnet-4-5', 'claude-opus-4']),
    // ... other fields
  }),
});

// POST /api/v1/projects - Create project
router.post('/', async (req, res) => {
  try {
    // 1. Validate request body
    const data = createProjectSchema.parse(req.body);

    // 2. Generate API key
    // 3. Create project with storage
    // 4. Return project + API key (only time it's shown)

    const response: ProjectCreateResponse = {
      project,
      apiKey,
    };
    res.status(201).json(response);
  } catch (error) {
    // Handle validation errors, storage errors
  }
});

// GET /api/v1/projects/:id - Get project
router.get('/:id', authMiddleware.authenticate, async (req, res) => {
  // Return project from req.project (attached by auth middleware)
});

// GET /api/v1/projects - List projects
router.get('/', authMiddleware.authenticate, async (req, res) => {
  // List all projects (paginate in v2)
});

export default router;
```

**Acceptance Criteria**:
- [ ] POST /api/v1/projects creates project and returns API key
- [ ] GET /api/v1/projects/:id requires auth and returns project
- [ ] GET /api/v1/projects requires auth and returns list
- [ ] All routes validate input with Zod
- [ ] Errors return proper HTTP codes (400, 401, 404, 500)
- [ ] Integration tests verify full request/response cycle
- [ ] Tests verify API key is only returned on creation
- [ ] Tests verify authentication is enforced

**Test Cases Required**:
```typescript
describe('POST /api/v1/projects', () => {
  test('returns 201 with project and apiKey');
  test('returns 400 for invalid input');
  test('creates project in file system');
});

describe('GET /api/v1/projects/:id', () => {
  test('returns 200 with project for valid auth');
  test('returns 401 without auth');
  test('returns 404 for non-existent project');
});

describe('GET /api/v1/projects', () => {
  test('returns 200 with array of projects');
  test('returns 401 without auth');
});
```

---

### Track 2: Claude Agent SDK Integration (Parallel with Track 1)

#### TASK-006: Claude Agent SDK Service
**Agent**: `ai-engineer`
**Priority**: P0
**Estimated Time**: 6 hours
**Dependencies**: TASK-001

**Description**:
Integrate `@anthropic-ai/claude-agent-sdk` and implement `IAgentExecutor` interface. This can be developed in parallel with Track 1 tasks.

**Files to Create**:
- `apps/backend/src/services/AgentExecutor.ts` - SDK wrapper
- `apps/backend/src/services/AgentExecutor.test.ts` - Unit tests

**Implementation Requirements**:
1. Initialize SDK with project's AgentConfig
2. Handle SDK lifecycle (init, execute, stop)
3. Track token usage during execution
4. Implement timeout handling
5. Return structured results

**Example Implementation Skeleton**:
```typescript
// apps/backend/src/services/AgentExecutor.ts
import { ClaudeAgentSDK } from '@anthropic-ai/claude-agent-sdk';
import { IAgentExecutor, AgentConfig, ExecutionOptions, ExecutionResult } from '@cloutagent/types';

export class AgentExecutor implements IAgentExecutor {
  private sdk: ClaudeAgentSDK | null = null;

  async initialize(config: AgentConfig): Promise<void> {
    this.sdk = new ClaudeAgentSDK({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      model: config.model,
      systemPrompt: config.systemPrompt,
      tools: config.enabledTools,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
    });
  }

  async execute(prompt: string, options: ExecutionOptions): Promise<ExecutionResult> {
    if (!this.sdk) throw new Error('SDK not initialized');

    const startTime = Date.now();
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;

    // Set up token tracking listener
    this.sdk.on('token_usage', (usage) => {
      totalPromptTokens += usage.promptTokens;
      totalCompletionTokens += usage.completionTokens;
    });

    // Execute with timeout
    const result = await this.sdk.execute(prompt, {
      timeout: options.timeout,
      variables: options.variables,
    });

    const duration = Date.now() - startTime;

    return {
      id: uuidv4(),
      status: 'completed',
      result: result.output,
      cost: {
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        totalCost: this.estimateCost({ promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens }),
      },
      duration,
    };
  }

  estimateCost(usage: { promptTokens: number; completionTokens: number }): number {
    // Use MODEL_PRICING from types package
  }

  async stop(): Promise<void> {
    if (this.sdk) {
      await this.sdk.stop();
    }
  }
}
```

**Acceptance Criteria**:
- [ ] Implements `IAgentExecutor` interface exactly
- [ ] Initializes SDK with all config fields
- [ ] Tracks token usage during execution
- [ ] Calculates cost correctly using MODEL_PRICING
- [ ] Handles timeout (throws or returns failed status)
- [ ] Unit tests mock SDK responses
- [ ] Tests verify cost calculation is accurate
- [ ] Tests verify timeout handling

**Test Cases Required**:
```typescript
describe('AgentExecutor', () => {
  test('initialize - creates SDK instance with config');
  test('execute - returns result with cost and duration');
  test('execute - tracks token usage correctly');
  test('execute - handles timeout after specified duration');
  test('estimateCost - calculates cost correctly');
  test('stop - stops SDK execution');
});
```

---

#### TASK-007: Cost Tracking Service
**Agent**: `backend-engineer`
**Priority**: P1
**Estimated Time**: 3 hours
**Dependencies**: TASK-001

**Description**:
Implement cost tracking and limit enforcement. Must implement `ICostTracker` interface exactly. Can be developed in parallel.

**Files to Create**:
- `apps/backend/src/services/CostTracker.ts` - Main implementation
- `apps/backend/src/services/CostTracker.test.ts` - Unit tests

**Implementation Requirements**:
1. Track token usage per execution
2. Calculate cost in real-time
3. Check against limits (tokens and cost)
4. Return percentage of limits used

**Example Implementation Skeleton**:
```typescript
// apps/backend/src/services/CostTracker.ts
import { ICostTracker, TokenUsage, CostLimits, MODEL_PRICING } from '@cloutagent/types';

export class CostTracker implements ICostTracker {
  private executions = new Map<string, {
    promptTokens: number;
    completionTokens: number;
  }>();

  trackTokens(executionId: string, usage: TokenUsage): void {
    const current = this.executions.get(executionId) || { promptTokens: 0, completionTokens: 0 };
    current.promptTokens += usage.promptTokens;
    current.completionTokens += usage.completionTokens;
    this.executions.set(executionId, current);
  }

  calculateCost(usage: TokenUsage): number {
    const pricing = MODEL_PRICING['claude-sonnet-4-5'];
    return (usage.promptTokens * pricing.promptTokens) +
           (usage.completionTokens * pricing.completionTokens);
  }

  checkLimits(executionId: string, limits: CostLimits): LimitCheckResult {
    const usage = this.executions.get(executionId);
    if (!usage) return { withinLimits: true };

    const totalTokens = usage.promptTokens + usage.completionTokens;
    const cost = this.calculateCost(usage);

    // Check both limits
    // Return result
  }

  getCurrentCost(executionId: string): number {
    const usage = this.executions.get(executionId);
    return usage ? this.calculateCost(usage) : 0;
  }
}
```

**Acceptance Criteria**:
- [ ] Implements `ICostTracker` interface exactly
- [ ] Tracks tokens per execution ID
- [ ] Calculates cost using MODEL_PRICING constants
- [ ] checkLimits returns correct percentage values
- [ ] Detects when limits exceeded
- [ ] Unit tests verify all calculations
- [ ] Tests verify limit checking logic

**Test Cases Required**:
```typescript
describe('CostTracker', () => {
  test('trackTokens - accumulates tokens correctly');
  test('calculateCost - uses correct pricing');
  test('checkLimits - returns withinLimits=true when under');
  test('checkLimits - returns withinLimits=false when over');
  test('checkLimits - calculates percentages correctly');
  test('getCurrentCost - returns 0 for new execution');
  test('getCurrentCost - returns accumulated cost');
});
```

---

### Track 3: Infrastructure (Parallel with Tracks 1 & 2)

#### TASK-008: Docker Compose Configuration
**Agent**: `infrastructure-engineer`
**Priority**: P1
**Estimated Time**: 2 hours
**Dependencies**: None (can start immediately)

**Description**:
Enhance docker-compose.yml for local development with health checks, volume management, and proper environment variable handling.

**Files to Modify**:
- `docker-compose.yml` - Add development profile

**Implementation Requirements**:
1. Add development profile with hot reloading
2. Configure health checks for backend
3. Set up persistent volumes for projects/backups
4. Add environment variable validation

**Example Configuration**:
```yaml
version: '3.8'

services:
  # Production services (existing)
  frontend:
    # ... existing config

  backend:
    # ... existing config

  # Development services
  frontend-dev:
    build:
      context: .
      dockerfile: docker/Dockerfile.frontend
      target: development  # Multi-stage build
    ports:
      - "3000:3000"
    volumes:
      - ./apps/frontend:/app/apps/frontend
      - /app/apps/frontend/node_modules
    command: pnpm dev
    profiles:
      - dev

  backend-dev:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
      target: development
    ports:
      - "3001:3001"
    volumes:
      - ./apps/backend:/app/apps/backend
      - ./projects:/app/projects
      - ./backups:/app/backups
      - /app/apps/backend/node_modules
    environment:
      - NODE_ENV=development
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:?ANTHROPIC_API_KEY is required}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY:?ENCRYPTION_KEY is required}
    command: pnpm dev
    profiles:
      - dev
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:3001/api/health"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  projects_data:
  backups_data:
```

**Acceptance Criteria**:
- [ ] Development profile works with `docker-compose --profile dev up`
- [ ] Hot reloading works for both frontend and backend
- [ ] Health check passes for backend service
- [ ] Volumes persist data across restarts
- [ ] Environment variables validated on startup
- [ ] README.md updated with Docker commands

---

#### TASK-009: Environment Configuration & Validation
**Agent**: `infrastructure-engineer`
**Priority**: P1
**Estimated Time**: 2 hours
**Dependencies**: None

**Description**:
Create environment validation script and enhance .env.example with all required variables.

**Files to Create**:
- `apps/backend/src/utils/env.ts` - Environment validation
- `scripts/validate-env.sh` - Shell script for validation

**Implementation Requirements**:
1. Validate all required env vars on startup
2. Generate encryption key if not provided
3. Provide helpful error messages
4. Type-safe environment access

**Example Implementation**:
```typescript
// apps/backend/src/utils/env.ts
import { z } from 'zod';
import crypto from 'crypto';
import fs from 'fs';

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
  ENCRYPTION_KEY: z.string().length(64).optional(), // 32 bytes = 64 hex chars
  PORT: z.string().transform(Number).default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  MAX_CONCURRENT_EXECUTIONS: z.string().transform(Number).default('3'),
  BACKUP_ENABLED: z.string().transform(Boolean).default('true'),
});

export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Environment validation failed:');
    console.error(parsed.error.format());
    process.exit(1);
  }

  // Generate encryption key if not provided
  if (!parsed.data.ENCRYPTION_KEY) {
    const key = crypto.randomBytes(32).toString('hex');
    console.log('🔑 Generated encryption key:', key);
    console.log('⚠️  Add this to .env file: ENCRYPTION_KEY=' + key);

    // Write to .env if it exists
    if (fs.existsSync('.env')) {
      fs.appendFileSync('.env', `\nENCRYPTION_KEY=${key}\n`);
      console.log('✅ Added ENCRYPTION_KEY to .env file');
    }

    parsed.data.ENCRYPTION_KEY = key;
  }

  return parsed.data;
}
```

**Acceptance Criteria**:
- [ ] Validates all required environment variables
- [ ] Generates encryption key if missing
- [ ] Provides clear error messages for invalid values
- [ ] Updates .env file with generated key
- [ ] Export typed environment object
- [ ] Script can be run independently: `pnpm validate-env`

---

### Track 4: Frontend Foundation (Can start after interfaces defined)

#### TASK-010: Frontend API Client Service
**Agent**: `frontend-engineer`
**Priority**: P1
**Estimated Time**: 3 hours
**Dependencies**: TASK-001, TASK-005 (API routes must be defined)

**Description**:
Create TypeScript API client for communicating with backend. Must match API contracts in IC-004.

**Files to Create**:
- `apps/frontend/src/lib/api-client.ts` - API client class
- `apps/frontend/src/lib/api-client.test.ts` - Unit tests

**Implementation Requirements**:
1. Use Fetch API with TypeScript generics
2. Handle authentication (store API key)
3. Implement error handling and retry logic
4. Type-safe request/response

**Example Implementation**:
```typescript
// apps/frontend/src/lib/api-client.ts
import {
  Project,
  ProjectCreateRequest,
  ProjectCreateResponse,
  ProjectListResponse,
  ProjectGetResponse,
  APIResponse,
} from '@cloutagent/types';

export class APIClient {
  private baseURL: string;
  private apiKey: string | null = null;

  constructor(baseURL = '/api/v1') {
    this.baseURL = baseURL;
  }

  setAPIKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('cloutagent_api_key', key);
  }

  private async request<T>(
    path: string,
    options?: RequestInit
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const response = await fetch(`${this.baseURL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(response.status, error.message);
    }

    return response.json();
  }

  // Project methods
  async createProject(data: ProjectCreateRequest): Promise<ProjectCreateResponse> {
    const response = await this.request<ProjectCreateResponse>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store API key from creation response
    this.setAPIKey(response.apiKey);

    return response;
  }

  async getProject(id: string): Promise<Project> {
    const response = await this.request<ProjectGetResponse>(`/projects/${id}`);
    return response.project;
  }

  async listProjects(): Promise<Project[]> {
    const response = await this.request<ProjectListResponse>('/projects');
    return response.projects;
  }

  async healthCheck(): Promise<{ status: string; version: string }> {
    return this.request('/health');
  }
}

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}
```

**Acceptance Criteria**:
- [ ] Implements all project API methods
- [ ] Type-safe with @cloutagent/types
- [ ] Stores API key in localStorage
- [ ] Includes API key in request headers
- [ ] Handles errors with typed exceptions
- [ ] Unit tests mock fetch responses
- [ ] Tests verify API key storage/retrieval

---

### Track 5: Testing Infrastructure (Parallel)

#### TASK-011: Integration Test Setup
**Agent**: `software-engineer-test`
**Priority**: P1
**Estimated Time**: 4 hours
**Dependencies**: TASK-001

**Description**:
Set up integration testing infrastructure with test database, fixtures, and utilities.

**Files to Create**:
- `apps/backend/tests/setup.ts` - Test setup and teardown
- `apps/backend/tests/fixtures.ts` - Test data fixtures
- `apps/backend/tests/helpers.ts` - Test utilities

**Implementation Requirements**:
1. Set up test file system (temporary directory)
2. Create test fixtures for projects
3. Helper functions for API testing
4. Clean up after tests

**Example Implementation**:
```typescript
// apps/backend/tests/setup.ts
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

let testDir: string;

beforeAll(async () => {
  // Create temporary directory for tests
  testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cloutagent-test-'));
  process.env.PROJECT_ROOT = testDir;
});

afterAll(async () => {
  // Clean up test directory
  await fs.rm(testDir, { recursive: true, force: true });
});

beforeEach(async () => {
  // Create fresh directory structure for each test
  await fs.mkdir(path.join(testDir, 'projects'), { recursive: true });
  await fs.mkdir(path.join(testDir, 'backups'), { recursive: true });
});

afterEach(async () => {
  // Clean up test data
  await fs.rm(path.join(testDir, 'projects'), { recursive: true, force: true });
  await fs.rm(path.join(testDir, 'backups'), { recursive: true, force: true });
});

export { testDir };
```

**Acceptance Criteria**:
- [ ] Test environment isolated from production
- [ ] Fixtures cover all entity types
- [ ] Helper functions simplify common test patterns
- [ ] Cleanup happens after each test
- [ ] Tests can run in parallel without conflicts
- [ ] Documentation for writing tests

---

## Execution Strategy

### Phase 1: Interface Definition (Day 1, 2 hours)
**Critical Path - Must complete first**

1. **TASK-001** (backend-engineer): Define all interfaces
   - All other tasks depend on this
   - Review interfaces with team before proceeding

### Phase 2: Parallel Development (Days 2-7)

**Track 1: Backend Core** (Sequential)
- TASK-002 → TASK-003 → TASK-004 → TASK-005

**Track 2: SDK Integration** (Parallel with Track 1)
- TASK-006 (can start after TASK-001)
- TASK-007 (can start after TASK-001)

**Track 3: Infrastructure** (Parallel with all)
- TASK-008 (can start immediately)
- TASK-009 (can start immediately)

**Track 4: Frontend** (Starts after APIs defined)
- TASK-010 (starts after TASK-001, TASK-005)

**Track 5: Testing** (Parallel with all)
- TASK-011 (starts after TASK-001)

### Phase 3: Integration (Days 8-10)

All tracks converge:
1. Wire up AgentExecutor (TASK-006) with API routes (TASK-005)
2. Add CostTracker (TASK-007) to execution flow
3. Test end-to-end with frontend client (TASK-010)
4. Run integration tests (TASK-011)

---

## Agent Coordination

### Communication Protocol

Use `.claude/agents-chat.md` for coordination:

```markdown
## [2025-10-01 18:00] Backend Engineer (TASK-001)
**Status**: COMPLETE
**Output**: All interface contracts defined in packages/types/src/
**Next**: TASK-002, TASK-003, TASK-004 can now start
**Blockers**: None

## [2025-10-01 18:30] AI Engineer (TASK-006)
**Status**: 60% complete
**Blockers**: Waiting for clarification on timeout handling
**Question**: Should timeout throw error or return failed status?
**Tagged**: @backend-engineer

## [2025-10-01 18:45] Backend Engineer
**Response to AI Engineer**: Return failed status with error message
**Reason**: Allows frontend to handle gracefully
```

### Change Documentation

Use `.claude/agent-change-log.md`:

```markdown
## [2025-10-01 18:00] Backend Engineer - TASK-001

**Files Created**:
- packages/types/src/storage.ts (IC-001)
- packages/types/src/secrets.ts (IC-002)
- packages/types/src/auth.ts (IC-003)
- packages/types/src/api.ts (IC-004)
- packages/types/src/agent-sdk.ts (IC-005)
- packages/types/src/cost.ts (IC-006)

**Changes**: Added all interface contracts for Phase 1
**Impact**: Unblocks all dependent tasks
**Tests**: TypeScript compilation passes
```

---

## Success Criteria for Phase 1

- [ ] All 11 tasks completed
- [ ] All interfaces implemented exactly as specified
- [ ] Unit test coverage >80% for all services
- [ ] Integration tests pass for full API flow
- [ ] Docker development environment works
- [ ] Can create project via API
- [ ] Can retrieve project via API
- [ ] API key authentication enforced
- [ ] Secrets encrypted at rest
- [ ] Cost tracking works correctly
- [ ] Claude Agent SDK executes successfully

---

**Ready for parallel execution!** 🚀

Each agent can pick up tasks independently using the interface contracts as their guide.
