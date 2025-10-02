import { promises as fs } from 'fs';
import path from 'path';
import type {
  Variable,
  VariableScope,
  VariableType,
  CreateVariableRequest,
  UpdateVariableRequest,
} from '@cloutagent/types';

/**
 * VariableService - Manages variables with file-based persistence
 * Implements IC-019 Variable Management interface
 *
 * Features:
 * - CRUD operations for variables
 * - Type validation (string, number, boolean, object, array, secret)
 * - Scope management (global, node, execution)
 * - Atomic file writes for thread safety
 * - Duplicate name prevention within scope
 */
export class VariableService {
  private readonly variablesDir: string;

  constructor(baseDir: string = './projects') {
    this.variablesDir = baseDir;
  }

  /**
   * Create a new variable
   * @throws Error if name is invalid, type mismatch, or duplicate in scope
   */
  async createVariable(
    projectId: string,
    request: CreateVariableRequest,
  ): Promise<Variable> {
    // Validate variable name (must start with letter or underscore, then alphanumeric + underscore)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(request.name)) {
      throw new Error('Variable name must be alphanumeric with underscores');
    }

    // Validate type
    if (!this.validateType(request.value, request.type)) {
      throw new Error(`Value type mismatch. Expected ${request.type}`);
    }

    // Secret variables must be encrypted
    if (request.type === 'secret' && !request.encrypted) {
      throw new Error('Secret variables must be encrypted');
    }

    const now = new Date();
    const newVariable: Variable = {
      id: this.generateId(),
      name: request.name,
      type: request.type,
      value: request.value,
      description: request.description,
      scope: request.scope,
      encrypted: request.encrypted || false,
      nodeId: request.nodeId,
      createdAt: now,
      updatedAt: now,
    };

    const variables = await this.listVariables(projectId);

    // Check for duplicate names in same scope
    const duplicate = variables.find(v => {
      if (v.name !== newVariable.name || v.scope !== newVariable.scope) {
        return false;
      }
      // For node scope, also check nodeId
      if (v.scope === 'node') {
        return v.nodeId === newVariable.nodeId;
      }
      return true;
    });

    if (duplicate) {
      throw new Error(
        `Variable "${newVariable.name}" already exists in ${newVariable.scope} scope`,
      );
    }

    variables.push(newVariable);
    await this.saveVariables(projectId, variables);

    return newVariable;
  }

  /**
   * Update variable value
   * @throws Error if variable not found or type mismatch
   */
  async updateVariable(
    projectId: string,
    variableId: string,
    updates: UpdateVariableRequest,
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

  /**
   * Delete variable by ID
   * @returns true if deleted, false if not found
   */
  async deleteVariable(
    projectId: string,
    variableId: string,
  ): Promise<boolean> {
    const variables = await this.listVariables(projectId);
    const filtered = variables.filter(v => v.id !== variableId);

    if (filtered.length === variables.length) {
      return false; // Not found
    }

    await this.saveVariables(projectId, filtered);
    return true;
  }

  /**
   * List all variables for a project, optionally filtered by scope
   */
  async listVariables(
    projectId: string,
    scope?: 'global' | 'node' | 'execution',
  ): Promise<Variable[]> {
    const filePath = this.getVariablesPath(projectId);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const variables = JSON.parse(content) as Variable[];

      if (scope) {
        return variables.filter(v => v.scope === scope);
      }

      return variables;
    } catch (error: any) {
      // File doesn't exist or is invalid
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get variables organized by scope
   * Used during execution to resolve variable references
   */
  async getVariableScope(
    projectId: string,
    executionId?: string,
  ): Promise<VariableScope> {
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
        const nodeId = variable.nodeId || 'default';
        if (!scope.node[nodeId]) {
          scope.node[nodeId] = {};
        }
        scope.node[nodeId][variable.name] = variable;
      } else if (variable.scope === 'execution' && executionId) {
        // Only include execution-scoped variables if executionId is provided
        scope.execution[variable.name] = variable;
      }
    });

    return scope;
  }

  /**
   * Validate that a value matches the expected type
   */
  private validateType(value: any, type: VariableType): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return (
          typeof value === 'object' && !Array.isArray(value) && value !== null
        );
      case 'array':
        return Array.isArray(value);
      case 'secret':
        return typeof value === 'string';
      default:
        return false;
    }
  }

  /**
   * Save variables to filesystem with atomic write
   * Uses temp file + rename for thread safety
   */
  private async saveVariables(
    projectId: string,
    variables: Variable[],
  ): Promise<void> {
    const filePath = this.getVariablesPath(projectId);
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Atomic write: write to temp file, then rename
    const tempPath = `${filePath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(variables, null, 2), 'utf-8');
    await fs.rename(tempPath, filePath);
  }

  /**
   * Get the file path for project variables
   */
  private getVariablesPath(projectId: string): string {
    return path.join(this.variablesDir, projectId, 'variables.json');
  }

  /**
   * Generate unique variable ID
   */
  private generateId(): string {
    return `var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
