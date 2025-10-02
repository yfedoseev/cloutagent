# Phase 5: Variables, Secrets & Testing - Execution Plan

**Timeline**: Weeks 9-10
**Focus**: Variable Management, Secrets, Test Mode
**Goal**: Enable dynamic workflows with variables, secure secret management, and comprehensive testing capabilities

## Overview

Phase 5 adds critical infrastructure for production-ready workflows:
- **Workflow Variables**: Dynamic data flow between nodes with type safety
- **Secret Management**: Encrypted storage and injection of API keys and credentials
- **Environment Variables**: Project-level configuration management
- **Test Mode**: Safe workflow testing with mock data and validation
- **Testing Framework**: Comprehensive unit and E2E testing infrastructure

## Interface Contracts

### IC-019: Variable Management Interface

**Purpose**: Define workflow variables for dynamic data flow between nodes

```typescript
// packages/types/src/variables.ts

export type VariableType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'secret';

export interface Variable {
  id: string;
  name: string;
  type: VariableType;
  value: any;
  description?: string;
  scope: 'global' | 'node' | 'execution';
  encrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VariableDefinition {
  name: string;
  type: VariableType;
  required: boolean;
  defaultValue?: any;
  validation?: {
    pattern?: string; // Regex for strings
    min?: number; // For numbers
    max?: number;
    enum?: any[]; // Allowed values
  };
}

export interface VariableScope {
  global: Record<string, Variable>; // Available everywhere
  node: Record<string, Record<string, Variable>>; // Per-node variables
  execution: Record<string, Variable>; // Runtime variables
}

export interface VariableReference {
  type: 'variable' | 'secret' | 'env';
  path: string; // e.g., "global.API_URL" or "env.NODE_ENV"
}

// Variable interpolation syntax: ${global.variableName} or ${env.ENV_VAR}
export type InterpolatedString = string;
```

**API Endpoints**:
```typescript
// POST /api/projects/{projectId}/variables
// Body: { name: string, type: VariableType, value: any }
// Response: Variable

// GET /api/projects/{projectId}/variables
// Response: { variables: Variable[] }

// PUT /api/projects/{projectId}/variables/{variableId}
// Body: { value: any }
// Response: Variable

// DELETE /api/projects/{projectId}/variables/{variableId}
// Response: { success: boolean }
```

---

### IC-020: Secret Storage Interface

**Purpose**: Secure storage and retrieval of sensitive credentials

```typescript
// packages/types/src/secrets.ts

export interface Secret {
  id: string;
  name: string;
  description?: string;
  type: 'api-key' | 'token' | 'password' | 'certificate' | 'custom';
  encrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  usageCount: number;
}

export interface SecretValue {
  id: string;
  value: string; // Encrypted
}

export interface SecretUpdate {
  id: string;
  value: string; // Plain text, will be encrypted
  expiresAt?: Date;
}

export interface SecretUsageLog {
  secretId: string;
  timestamp: Date;
  context: string; // Where it was used (execution ID, node ID)
  success: boolean;
}

// Security features
export interface SecretPolicy {
  rotationPeriod?: number; // Days
  requireRotation: boolean;
  allowedNodes?: string[]; // Node IDs that can access this secret
  auditLog: boolean;
}
```

**API Endpoints**:
```typescript
// POST /api/projects/{projectId}/secrets
// Body: { name: string, value: string, type: string, policy?: SecretPolicy }
// Response: Secret (without value)

// GET /api/projects/{projectId}/secrets
// Response: { secrets: Secret[] } // Values never returned

// GET /api/projects/{projectId}/secrets/{secretId}/value
// Response: { value: string } // Decrypted, logged
// Note: Only available during execution, requires authentication

// PUT /api/projects/{projectId}/secrets/{secretId}
// Body: { value: string }
// Response: Secret

// DELETE /api/projects/{projectId}/secrets/{secretId}
// Response: { success: boolean }

// GET /api/projects/{projectId}/secrets/{secretId}/usage
// Response: { logs: SecretUsageLog[] }
```

---

### IC-021: Environment Configuration Interface

**Purpose**: Project-level environment variables and configuration

```typescript
// packages/types/src/environment.ts

export interface EnvironmentConfig {
  projectId: string;
  environment: 'development' | 'staging' | 'production';
  variables: Record<string, string>;
  overrides?: Record<string, Record<string, string>>; // Per-environment overrides
  locked: boolean; // Prevent changes in production
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  type: 'plain' | 'secret-ref'; // secret-ref points to a secret
  environment?: string; // If null, applies to all environments
  description?: string;
}

// Environment variable resolution priority:
// 1. Execution-specific overrides
// 2. Environment-specific values
// 3. Global defaults
// 4. System environment variables
```

**API Endpoints**:
```typescript
// GET /api/projects/{projectId}/environment
// Response: EnvironmentConfig

// PUT /api/projects/{projectId}/environment
// Body: { variables: Record<string, string> }
// Response: EnvironmentConfig

// POST /api/projects/{projectId}/environment/switch
// Body: { environment: 'development' | 'staging' | 'production' }
// Response: { success: boolean }
```

---

### IC-022: Test Mode Interface

**Purpose**: Safe workflow testing with mock data and validation

```typescript
// packages/types/src/testing.ts

export interface TestConfig {
  enabled: boolean;
  mockData: {
    nodes: Record<string, any>; // Node ID -> mock output
    secrets: Record<string, string>; // Secret ID -> mock value
    variables: Record<string, any>; // Variable name -> mock value
  };
  validation: {
    enabled: boolean;
    rules: ValidationRule[];
    strictMode: boolean; // Fail on warnings
  };
  options: {
    skipRealAPICalls: boolean;
    dryRun: boolean; // Don't persist results
    verbose: boolean; // Detailed logging
  };
}

export interface TestExecution {
  id: string;
  projectId: string;
  config: TestConfig;
  result: {
    passed: boolean;
    executionId: string;
    validationResults: ValidationResult[];
    mockDataUsed: string[]; // Which mocks were used
    errors: string[];
    warnings: string[];
  };
  timestamp: Date;
}

export interface MockNodeOutput {
  nodeId: string;
  output: any;
  delay?: number; // Simulate execution time
  error?: string; // Simulate failure
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestCase[];
}

export interface TestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput?: string;
  expectedStatus: ExecutionStatus;
  mockData?: TestConfig['mockData'];
  assertions: Assertion[];
}

export interface Assertion {
  type: 'output-contains' | 'status-equals' | 'token-usage-less-than' | 'duration-less-than' | 'custom';
  value: any;
  errorMessage?: string;
}
```

**API Endpoints**:
```typescript
// POST /api/projects/{projectId}/test
// Body: TestConfig
// Response: TestExecution

// POST /api/projects/{projectId}/test-suites
// Body: TestSuite
// Response: TestSuite

// POST /api/projects/{projectId}/test-suites/{suiteId}/run
// Response: { results: TestCaseResult[] }

// GET /api/projects/{projectId}/test-history
// Response: { executions: TestExecution[] }
```

---

### IC-023: Variable Interpolation Interface

**Purpose**: Dynamic variable resolution in node configurations

```typescript
// packages/types/src/interpolation.ts

export interface InterpolationContext {
  variables: VariableScope;
  secrets: Map<string, string>; // Decrypted secrets
  env: Record<string, string>;
  execution: {
    id: string;
    input: string;
    previousOutputs: Record<string, any>; // Node ID -> output
  };
}

export interface InterpolationResult {
  value: any;
  resolved: boolean;
  errors: string[];
  references: VariableReference[]; // All variables referenced
}

// Interpolation syntax examples:
// - ${global.apiUrl} -> Variable reference
// - ${env.NODE_ENV} -> Environment variable
// - ${secret.apiKey} -> Secret reference (only in execution context)
// - ${execution.previousNode.output} -> Previous node output
// - ${execution.input} -> Original execution input

export class VariableInterpolator {
  interpolate(
    template: string,
    context: InterpolationContext
  ): InterpolationResult;

  validate(
    template: string,
    availableVariables: VariableDefinition[]
  ): { valid: boolean; errors: string[] };
}
```

---

## Tasks

### TASK-038: Variable Management Service

**Agent**: backend-engineer
**Priority**: P0
**Estimated Time**: 4 hours
**Dependencies**: TASK-001 (File Storage), IC-019

**Description**: Implement variable storage, retrieval, and scope management.

**Implementation Skeleton**:
```typescript
// apps/backend/src/services/VariableService.ts

import { promises as fs } from 'fs';
import path from 'path';
import { Variable, VariableScope, VariableDefinition } from '@cloutagent/types';

export class VariableService {
  private readonly variablesDir: string;

  constructor(baseDir: string = './projects') {
    this.variablesDir = baseDir;
  }

  async createVariable(
    projectId: string,
    variable: Omit<Variable, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Variable> {
    const newVariable: Variable = {
      ...variable,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Validate
    if (variable.type === 'secret' && !variable.encrypted) {
      throw new Error('Secret variables must be encrypted');
    }

    const variables = await this.listVariables(projectId);
    variables.push(newVariable);

    await this.saveVariables(projectId, variables);

    return newVariable;
  }

  async updateVariable(
    projectId: string,
    variableId: string,
    updates: { value: any }
  ): Promise<Variable> {
    const variables = await this.listVariables(projectId);
    const variable = variables.find(v => v.id === variableId);

    if (!variable) {
      throw new Error('Variable not found');
    }

    // Validate type
    if (!this.validateType(updates.value, variable.type)) {
      throw new Error(`Value type mismatch. Expected ${variable.type}`);
    }

    variable.value = updates.value;
    variable.updatedAt = new Date();

    await this.saveVariables(projectId, variables);

    return variable;
  }

  async deleteVariable(projectId: string, variableId: string): Promise<boolean> {
    const variables = await this.listVariables(projectId);
    const filtered = variables.filter(v => v.id !== variableId);

    if (filtered.length === variables.length) {
      return false; // Not found
    }

    await this.saveVariables(projectId, filtered);
    return true;
  }

  async listVariables(projectId: string): Promise<Variable[]> {
    const filePath = this.getVariablesPath(projectId);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  async getVariableScope(projectId: string, executionId?: string): Promise<VariableScope> {
    const variables = await this.listVariables(projectId);

    const scope: VariableScope = {
      global: {},
      node: {},
      execution: {},
    };

    variables.forEach(variable => {
      if (variable.scope === 'global') {
        scope.global[variable.name] = variable;
      } else if (variable.scope === 'node') {
        // Group by node ID (stored in variable metadata)
        const nodeId = (variable as any).nodeId;
        if (!scope.node[nodeId]) {
          scope.node[nodeId] = {};
        }
        scope.node[nodeId][variable.name] = variable;
      } else if (variable.scope === 'execution' && executionId) {
        scope.execution[variable.name] = variable;
      }
    });

    return scope;
  }

  private validateType(value: any, type: VariableType): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      case 'secret':
        return typeof value === 'string';
      default:
        return false;
    }
  }

  private async saveVariables(projectId: string, variables: Variable[]): Promise<void> {
    const filePath = this.getVariablesPath(projectId);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(variables, null, 2), 'utf-8');
  }

  private getVariablesPath(projectId: string): string {
    return path.join(this.variablesDir, projectId, 'variables.json');
  }

  private generateId(): string {
    return `var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

**Acceptance Criteria**:
- [ ] CRUD operations for variables
- [ ] Type validation enforced
- [ ] Scope management (global, node, execution)
- [ ] Variables persisted to filesystem
- [ ] Secret variables marked as encrypted
- [ ] Thread-safe file writes

**Test Cases**:
```typescript
describe('VariableService', () => {
  it('should create variable with type validation', async () => {
    const variable = await service.createVariable('proj-001', {
      name: 'API_URL',
      type: 'string',
      value: 'https://api.example.com',
      scope: 'global',
      encrypted: false,
    });

    expect(variable.id).toBeTruthy();
    expect(variable.type).toBe('string');
  });

  it('should reject invalid type', async () => {
    await expect(
      service.updateVariable('proj-001', 'var-001', { value: 123 })
    ).rejects.toThrow('type mismatch');
  });
});
```

---

### TASK-039: Variable Interpolation Engine

**Agent**: backend-engineer
**Priority**: P0
**Estimated Time**: 5 hours
**Dependencies**: TASK-038 (Variable Service), IC-023

**Description**: Implement variable interpolation with support for ${} syntax.

**Implementation Skeleton**:
```typescript
// apps/backend/src/services/VariableInterpolator.ts

import {
  InterpolationContext,
  InterpolationResult,
  VariableReference,
} from '@cloutagent/types';

export class VariableInterpolator {
  private readonly INTERPOLATION_REGEX = /\$\{([^}]+)\}/g;

  interpolate(
    template: string,
    context: InterpolationContext
  ): InterpolationResult {
    const references: VariableReference[] = [];
    const errors: string[] = [];
    let resolved = true;

    const result = template.replace(this.INTERPOLATION_REGEX, (match, path) => {
      try {
        const ref = this.parseReference(path);
        references.push(ref);

        const value = this.resolveReference(ref, context);

        if (value === undefined) {
          errors.push(`Variable not found: ${path}`);
          resolved = false;
          return match; // Keep original
        }

        return typeof value === 'object' ? JSON.stringify(value) : String(value);
      } catch (error) {
        errors.push(`Error resolving ${path}: ${error.message}`);
        resolved = false;
        return match;
      }
    });

    return {
      value: errors.length === 0 ? result : template,
      resolved,
      errors,
      references,
    };
  }

  validate(
    template: string,
    availableVariables: VariableDefinition[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const matches = template.matchAll(this.INTERPOLATION_REGEX);

    for (const match of matches) {
      const path = match[1];
      const ref = this.parseReference(path);

      if (ref.type === 'variable') {
        const varName = ref.path.split('.').pop();
        const exists = availableVariables.some(v => v.name === varName);

        if (!exists) {
          errors.push(`Variable not defined: ${varName}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private parseReference(path: string): VariableReference {
    const parts = path.split('.');
    const scope = parts[0]; // global, env, secret, execution

    if (scope === 'env') {
      return { type: 'env', path: parts.slice(1).join('.') };
    }

    if (scope === 'secret') {
      return { type: 'secret', path: parts.slice(1).join('.') };
    }

    return { type: 'variable', path };
  }

  private resolveReference(
    ref: VariableReference,
    context: InterpolationContext
  ): any {
    switch (ref.type) {
      case 'env':
        return context.env[ref.path];

      case 'secret':
        return context.secrets.get(ref.path);

      case 'variable':
        return this.resolveVariablePath(ref.path, context);

      default:
        throw new Error(`Unknown reference type: ${ref.type}`);
    }
  }

  private resolveVariablePath(path: string, context: InterpolationContext): any {
    const parts = path.split('.');

    if (parts[0] === 'global') {
      return context.variables.global[parts[1]]?.value;
    }

    if (parts[0] === 'node') {
      const nodeId = parts[1];
      const varName = parts[2];
      return context.variables.node[nodeId]?.[varName]?.value;
    }

    if (parts[0] === 'execution') {
      if (parts[1] === 'input') {
        return context.execution.input;
      }

      if (parts[1] === 'previousOutputs') {
        const nodeId = parts[2];
        return context.execution.previousOutputs[nodeId];
      }

      return context.variables.execution[parts[1]]?.value;
    }

    return undefined;
  }
}
```

**Acceptance Criteria**:
- [ ] ${} syntax interpolation works
- [ ] Supports global, env, secret, execution scopes
- [ ] Nested paths resolved correctly (e.g., ${execution.previousOutputs.node1.result})
- [ ] Validation catches undefined variables
- [ ] Error messages descriptive
- [ ] Object values JSON-stringified

**Test Cases**:
```typescript
describe('VariableInterpolator', () => {
  it('should interpolate global variable', () => {
    const result = interpolator.interpolate(
      'API URL: ${global.apiUrl}',
      {
        variables: {
          global: {
            apiUrl: { value: 'https://api.example.com' }
          },
          node: {},
          execution: {},
        },
        secrets: new Map(),
        env: {},
        execution: { id: 'exec-001', input: '', previousOutputs: {} },
      }
    );

    expect(result.value).toBe('API URL: https://api.example.com');
    expect(result.resolved).toBe(true);
  });

  it('should handle missing variable', () => {
    const result = interpolator.interpolate(
      '${global.missing}',
      emptyContext
    );

    expect(result.resolved).toBe(false);
    expect(result.errors[0]).toContain('not found');
  });
});
```

---

### TASK-040: Test Mode Backend Service

**Agent**: backend-engineer
**Priority**: P1
**Estimated Time**: 6 hours
**Dependencies**: TASK-032 (Execution Engine), IC-022

**Description**: Implement test mode execution with mock data and validation.

**Implementation Skeleton**:
```typescript
// apps/backend/src/services/TestModeService.ts

import { TestConfig, TestExecution, MockNodeOutput } from '@cloutagent/types';
import { ExecutionEngine } from './ExecutionEngine';
import { ValidationService } from './ValidationService';

export class TestModeService {
  constructor(
    private executionEngine: ExecutionEngine,
    private validationService: ValidationService
  ) {}

  async executeTest(
    projectId: string,
    config: TestConfig,
    workflow: WorkflowGraph
  ): Promise<TestExecution> {
    const testExecution: TestExecution = {
      id: this.generateTestId(),
      projectId,
      config,
      result: {
        passed: false,
        executionId: '',
        validationResults: [],
        mockDataUsed: [],
        errors: [],
        warnings: [],
      },
      timestamp: new Date(),
    };

    try {
      // Step 1: Validate workflow first
      if (config.validation.enabled) {
        const validationReport = await this.validationService.validate(workflow);

        testExecution.result.validationResults = [
          ...validationReport.errors,
          ...validationReport.warnings,
        ];

        if (!validationReport.valid) {
          if (config.validation.strictMode) {
            testExecution.result.errors.push('Validation failed in strict mode');
            return testExecution;
          }

          testExecution.result.warnings.push('Workflow has validation warnings');
        }
      }

      // Step 2: Prepare mock environment
      const mockEngine = this.createMockEngine(config);

      // Step 3: Execute with mocks
      const execution = await mockEngine.execute(
        {
          projectId,
          input: 'Test input',
          options: {
            streaming: false,
            saveHistory: !config.options.dryRun,
          },
        },
        workflow
      );

      testExecution.result.executionId = execution.id;

      // Step 4: Track which mocks were used
      testExecution.result.mockDataUsed = Object.keys(config.mockData.nodes);

      // Step 5: Determine if test passed
      testExecution.result.passed =
        execution.status === 'completed' &&
        testExecution.result.errors.length === 0;

      return testExecution;
    } catch (error) {
      testExecution.result.errors.push(error.message);
      return testExecution;
    }
  }

  async runTestSuite(
    suiteId: string,
    workflow: WorkflowGraph
  ): Promise<TestCaseResult[]> {
    const suite = await this.loadTestSuite(suiteId);

    const results = await Promise.all(
      suite.tests.map(async test => {
        const testConfig: TestConfig = {
          enabled: true,
          mockData: test.mockData || { nodes: {}, secrets: {}, variables: {} },
          validation: { enabled: true, rules: [], strictMode: false },
          options: {
            skipRealAPICalls: true,
            dryRun: true,
            verbose: false,
          },
        };

        const execution = await this.executeTest(
          suite.projectId,
          testConfig,
          workflow
        );

        // Run assertions
        const assertionResults = test.assertions.map(assertion =>
          this.runAssertion(assertion, execution)
        );

        return {
          testId: test.id,
          testName: test.name,
          passed: assertionResults.every(r => r.passed),
          assertions: assertionResults,
          execution,
        };
      })
    );

    return results;
  }

  private createMockEngine(config: TestConfig): ExecutionEngine {
    // Create a mock execution engine that uses mock data instead of real API calls
    const mockEngine = new ExecutionEngine(
      this.mockClaudeSDK(config),
      this.mockSubagentService(config),
      this.mockHookService(config)
    );

    return mockEngine;
  }

  private mockClaudeSDK(config: TestConfig) {
    return {
      createAgent: (agentConfig: any) => ({
        run: async (input: string) => {
          const nodeId = agentConfig.id;
          const mock = config.mockData.nodes[nodeId];

          if (mock) {
            if (mock.delay) {
              await new Promise(resolve => setTimeout(resolve, mock.delay));
            }

            if (mock.error) {
              throw new Error(mock.error);
            }

            return {
              output: mock.output,
              usage: { input: 100, output: 200, total: 300 },
            };
          }

          // Default mock response if no specific mock
          return {
            output: `Mock response for: ${input}`,
            usage: { input: 50, output: 100, total: 150 },
          };
        },
      }),
    };
  }

  private mockSubagentService(config: TestConfig) {
    return {
      executeBatch: async (requests: any[]) => {
        return requests.map(req => {
          const mock = config.mockData.nodes[req.subagentId];

          return {
            subagentId: req.subagentId,
            result: mock?.output || 'Mock subagent response',
            executionTime: mock?.delay || 100,
            tokenUsage: { input: 50, output: 50 },
            status: mock?.error ? 'failed' : 'completed',
            error: mock?.error,
          };
        });
      },
    };
  }

  private mockHookService(config: TestConfig) {
    return {
      executeHookChain: async () => [],
    };
  }

  private runAssertion(assertion: Assertion, execution: TestExecution): AssertionResult {
    switch (assertion.type) {
      case 'output-contains':
        const output = execution.result.executionId; // Get actual output
        const contains = output.includes(assertion.value);

        return {
          type: assertion.type,
          passed: contains,
          message: contains
            ? `Output contains "${assertion.value}"`
            : assertion.errorMessage || `Output does not contain "${assertion.value}"`,
        };

      case 'status-equals':
        // Check execution status
        return {
          type: assertion.type,
          passed: true,
          message: 'Status assertion passed',
        };

      default:
        return {
          type: assertion.type,
          passed: false,
          message: 'Unknown assertion type',
        };
    }
  }

  private async loadTestSuite(suiteId: string): Promise<TestSuite> {
    // Load from filesystem
    return {} as TestSuite;
  }

  private generateTestId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

**Acceptance Criteria**:
- [ ] Test mode executes with mock data
- [ ] Real API calls skipped when `skipRealAPICalls: true`
- [ ] Mock node outputs used correctly
- [ ] Validation runs before execution
- [ ] Test suite execution runs all tests
- [ ] Assertions validate execution results
- [ ] Dry run doesn't persist to history

**Test Cases**:
```typescript
describe('TestModeService', () => {
  it('should execute with mocked node output', async () => {
    const config: TestConfig = {
      enabled: true,
      mockData: {
        nodes: {
          'agent-001': {
            nodeId: 'agent-001',
            output: 'Mocked agent response',
            delay: 100,
          },
        },
        secrets: {},
        variables: {},
      },
      validation: { enabled: false, rules: [], strictMode: false },
      options: {
        skipRealAPICalls: true,
        dryRun: true,
        verbose: false,
      },
    };

    const result = await service.executeTest('proj-001', config, workflow);

    expect(result.result.passed).toBe(true);
    expect(result.result.mockDataUsed).toContain('agent-001');
  });
});
```

---

### TASK-041: Variables UI Panel

**Agent**: frontend-engineer
**Priority**: P1
**Estimated Time**: 4 hours
**Dependencies**: TASK-017 (Property Panel), IC-019

**Description**: Create UI for managing workflow variables.

**Implementation Skeleton**:
```typescript
// apps/frontend/src/components/VariablesPanel.tsx

import { useState } from 'react';
import { Variable, VariableType } from '@cloutagent/types';

export function VariablesPanel({ projectId }: { projectId: string }) {
  const [variables, setVariables] = useState<Variable[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (variable: Omit<Variable, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await fetch(`/api/projects/${projectId}/variables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(variable),
    });

    const created = await response.json();
    setVariables([...variables, created]);
    setIsCreating(false);
  };

  const handleDelete = async (variableId: string) => {
    await fetch(`/api/projects/${projectId}/variables/${variableId}`, {
      method: 'DELETE',
    });

    setVariables(variables.filter(v => v.id !== variableId));
  };

  return (
    <div className="p-4 bg-gray-900 text-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Variables</h2>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
        >
          + New Variable
        </button>
      </div>

      {/* Variables list */}
      <div className="space-y-2">
        {variables.map(variable => (
          <VariableCard
            key={variable.id}
            variable={variable}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Create dialog */}
      {isCreating && (
        <VariableCreateDialog
          onSave={handleCreate}
          onCancel={() => setIsCreating(false)}
        />
      )}
    </div>
  );
}

function VariableCard({
  variable,
  onDelete,
}: {
  variable: Variable;
  onDelete: (id: string) => void;
}) {
  const typeIcons = {
    string: '📝',
    number: '🔢',
    boolean: '✓',
    object: '{}',
    array: '[]',
    secret: '🔐',
  };

  return (
    <div className="p-3 bg-gray-800 rounded border border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{typeIcons[variable.type]}</span>

            <span className="font-semibold">{variable.name}</span>

            <span className="text-xs text-gray-400 px-2 py-1 bg-gray-700 rounded">
              {variable.scope}
            </span>
          </div>

          {variable.description && (
            <p className="text-sm text-gray-400 mb-2">{variable.description}</p>
          )}

          <div className="text-sm font-mono text-gray-300">
            {variable.type === 'secret' ? '••••••••' : JSON.stringify(variable.value)}
          </div>
        </div>

        <button
          onClick={() => onDelete(variable.id)}
          className="text-red-400 hover:text-red-300"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

function VariableCreateDialog({
  onSave,
  onCancel,
}: {
  onSave: (variable: any) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<VariableType>('string');
  const [value, setValue] = useState('');
  const [scope, setScope] = useState<'global' | 'node' | 'execution'>('global');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96">
        <h3 className="text-lg font-bold mb-4">Create Variable</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded"
              placeholder="e.g., API_URL"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as VariableType)}
              className="w-full px-3 py-2 bg-gray-700 rounded"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="object">Object</option>
              <option value="array">Array</option>
              <option value="secret">Secret</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Value</label>
            <input
              type={type === 'number' ? 'number' : 'text'}
              value={value}
              onChange={e => setValue(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Scope</label>
            <select
              value={scope}
              onChange={e => setScope(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-700 rounded"
            >
              <option value="global">Global</option>
              <option value="node">Node</option>
              <option value="execution">Execution</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Cancel
          </button>

          <button
            onClick={() => onSave({ name, type, value, scope, encrypted: type === 'secret' })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Variables list with type icons
- [ ] Create/delete variables
- [ ] Secret values masked with ••••••
- [ ] Scope selection (global, node, execution)
- [ ] Type validation on create
- [ ] Inline editing of values

---

### TASK-042: Test Mode UI

**Agent**: frontend-engineer
**Priority**: P1
**Estimated Time**: 4 hours
**Dependencies**: TASK-040 (Test Mode Service), IC-022

**Description**: Create test mode UI with mock data configuration.

**Implementation Skeleton**:
```typescript
// apps/frontend/src/components/TestModePanel.tsx

import { useState } from 'react';
import { TestConfig, TestExecution } from '@cloutagent/types';

export function TestModePanel({ projectId }: { projectId: string }) {
  const [testConfig, setTestConfig] = useState<TestConfig>({
    enabled: true,
    mockData: { nodes: {}, secrets: {}, variables: {} },
    validation: { enabled: true, rules: [], strictMode: false },
    options: {
      skipRealAPICalls: true,
      dryRun: true,
      verbose: false,
    },
  });

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<TestExecution | null>(null);

  const handleRunTest = async () => {
    setIsRunning(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testConfig),
      });

      const testResult = await response.json();
      setResult(testResult);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-4 bg-gray-900 text-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">🧪 Test Mode</h2>

        <button
          onClick={handleRunTest}
          disabled={isRunning}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-medium disabled:opacity-50"
        >
          {isRunning ? '⏳ Running...' : '▶️ Run Test'}
        </button>
      </div>

      {/* Configuration */}
      <div className="space-y-4 mb-6">
        <div className="p-4 bg-gray-800 rounded">
          <h3 className="font-semibold mb-3">Options</h3>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={testConfig.options.skipRealAPICalls}
                onChange={e =>
                  setTestConfig({
                    ...testConfig,
                    options: {
                      ...testConfig.options,
                      skipRealAPICalls: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm">Skip real API calls (use mocks)</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={testConfig.options.dryRun}
                onChange={e =>
                  setTestConfig({
                    ...testConfig,
                    options: {
                      ...testConfig.options,
                      dryRun: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm">Dry run (don't save results)</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={testConfig.validation.strictMode}
                onChange={e =>
                  setTestConfig({
                    ...testConfig,
                    validation: {
                      ...testConfig.validation,
                      strictMode: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm">Strict mode (fail on warnings)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className={`p-4 rounded ${
          result.result.passed ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{result.result.passed ? '✅' : '❌'}</span>
            <span className="font-bold">
              {result.result.passed ? 'Test Passed' : 'Test Failed'}
            </span>
          </div>

          {result.result.errors.length > 0 && (
            <div className="mb-3">
              <h4 className="font-semibold text-red-300 mb-1">Errors:</h4>
              <ul className="list-disc list-inside text-sm text-red-200">
                {result.result.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {result.result.warnings.length > 0 && (
            <div>
              <h4 className="font-semibold text-yellow-300 mb-1">Warnings:</h4>
              <ul className="list-disc list-inside text-sm text-yellow-200">
                {result.result.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Test configuration options UI
- [ ] Run test button triggers test execution
- [ ] Test results displayed with pass/fail
- [ ] Errors and warnings listed clearly
- [ ] Mock data configuration (future enhancement)
- [ ] Loading state during test execution

---

## Testing Strategy

### Unit Tests
- Variable CRUD operations
- Variable interpolation engine
- Test mode mock execution
- Type validation

### Integration Tests
- Variable interpolation in workflows
- Secret injection during execution
- Test suite execution

### E2E Tests
- Create and use variables in workflow
- Test mode execution with mocks
- Secret management flow

## Success Metrics

- [ ] Variables can be created and used in workflows
- [ ] Interpolation resolves 100% of valid references
- [ ] Secrets never exposed in logs or API responses
- [ ] Test mode catches 90% of errors before production
- [ ] Variable type validation prevents runtime errors

## Dependencies

### External Libraries
- None (pure TypeScript implementation)

### Phase Dependencies
- Phase 1: File storage, secret manager
- Phase 2: Canvas, property panel
- Phase 3: Validation engine
- Phase 4: Execution engine

## Rollout Plan

1. **Week 9 Days 1-3**: Backend services (TASK-038, TASK-039, TASK-040)
2. **Week 9 Days 4-5**: Frontend UI (TASK-041, TASK-042)
3. **Week 10**: Testing, documentation, examples

## Notes

- **Security**: Secrets must never be returned in API responses
- **Performance**: Variable interpolation cached during execution
- **UX**: Clear distinction between variables and secrets in UI
- **Testing**: Test mode critical for workflow development
