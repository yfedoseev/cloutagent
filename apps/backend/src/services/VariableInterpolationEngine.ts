import type { VariableScope } from '@cloutagent/types';

interface InterpolationOptions {
  strict?: boolean; // Throw error on missing variable (default: false)
  keepUndefined?: boolean; // Keep {{var}} if undefined (default: false, replaces with empty string)
}

export class VariableInterpolationEngine {
  /**
   * Interpolate variables in a string
   * Syntax: {{variableName}} or {{scope.variableName}}
   *
   * Examples:
   * - "Hello {{name}}" with {name: "Alice"} -> "Hello Alice"
   * - "API: {{global.apiKey}}" with global.apiKey -> "API: sk-..."
   * - "Node: {{node.config}}" with node.config -> "Node: {...}"
   *
   * @param template - String with {{variable}} placeholders
   * @param scope - Variable scope with global, node, execution objects
   * @param options - Interpolation options
   */
  interpolate(
    template: string,
    scope: VariableScope,
    options?: InterpolationOptions,
  ): string {
    const strict = options?.strict ?? false;
    const keepUndefined = options?.keepUndefined ?? false;

    // Regex to match {{variableName}} or {{scope.variableName}}
    const regex = /\{\{([^}]+)\}\}/g;

    return template.replace(regex, (match, varPath) => {
      const trimmedPath = varPath.trim();

      // Parse variable path (e.g., "global.apiKey" or "name")
      const value = this.resolveVariable(trimmedPath, scope);

      if (value === undefined) {
        if (strict) {
          throw new Error(`Variable not found: ${trimmedPath}`);
        }
        return keepUndefined ? match : '';
      }

      // Convert value to string
      return this.valueToString(value);
    });
  }

  /**
   * Resolve variable by path from scope
   * Supports:
   * - "variableName" - searches in order: execution -> node -> global
   * - "global.variableName" - only global scope
   * - "node.variableName" - only node scope
   * - "execution.variableName" - only execution scope
   */
  private resolveVariable(path: string, scope: VariableScope): any {
    const parts = path.split('.');

    if (parts.length === 1) {
      // Simple variable name - search in order: execution -> node -> global
      const varName = parts[0];

      if (scope.execution && varName in scope.execution) {
        return this.getVariableValue(scope.execution[varName]);
      }
      // For node scope, we need to check all nodes (simplified approach)
      if (scope.node) {
        for (const nodeVars of Object.values(scope.node)) {
          if (nodeVars && typeof nodeVars === 'object' && varName in nodeVars) {
            return this.getVariableValue(nodeVars[varName]);
          }
        }
      }
      if (scope.global && varName in scope.global) {
        return this.getVariableValue(scope.global[varName]);
      }

      return undefined;
    }

    // Scoped variable (e.g., "global.apiKey")
    const [scopeName, varName] = parts;

    if (scopeName === 'global' && scope.global) {
      return this.getVariableValue(scope.global[varName]);
    }
    if (scopeName === 'node' && scope.node) {
      // Check if node is a simple key-value map or nested structure
      if (varName in scope.node) {
        // Direct access (simplified test format)
        return this.getVariableValue(scope.node[varName]);
      }
      // For node scope with nodeId structure, check all nodes
      for (const nodeVars of Object.values(scope.node)) {
        if (nodeVars && typeof nodeVars === 'object' && varName in nodeVars) {
          return this.getVariableValue(nodeVars[varName]);
        }
      }
    }
    if (scopeName === 'execution' && scope.execution) {
      return this.getVariableValue(scope.execution[varName]);
    }

    return undefined;
  }

  /**
   * Extract value from Variable object or return value directly
   */
  private getVariableValue(variable: any): any {
    // If it's a Variable object with a value property, extract the value
    if (variable && typeof variable === 'object' && 'value' in variable) {
      return variable.value;
    }
    // Otherwise return as-is (for direct value scopes)
    return variable;
  }

  /**
   * Convert variable value to string
   */
  private valueToString(value: any): string {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return '';
  }

  /**
   * Validate template for interpolation errors
   * Returns array of errors, or empty array if valid
   */
  validateTemplate(template: string, scope: VariableScope): string[] {
    const errors: string[] = [];
    const regex = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = regex.exec(template)) !== null) {
      const varPath = match[1].trim();
      const value = this.resolveVariable(varPath, scope);

      if (value === undefined) {
        errors.push(`Variable not found: ${varPath}`);
      }
    }

    return errors;
  }

  /**
   * Extract all variable references from template
   * Returns array of variable paths (e.g., ["name", "global.apiKey"])
   */
  extractVariables(template: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(template)) !== null) {
      variables.push(match[1].trim());
    }

    return variables;
  }

  /**
   * Check if template has any variables
   */
  hasVariables(template: string): boolean {
    return /\{\{[^}]+\}\}/.test(template);
  }

  /**
   * Interpolate object recursively
   * Useful for interpolating entire config objects
   */
  interpolateObject(obj: any, scope: VariableScope, options?: InterpolationOptions): any {
    if (typeof obj === 'string') {
      return this.interpolate(obj, scope, options);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.interpolateObject(item, scope, options));
    }

    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolateObject(value, scope, options);
      }
      return result;
    }

    return obj;
  }
}
