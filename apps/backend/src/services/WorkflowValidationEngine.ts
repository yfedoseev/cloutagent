import type {
  WorkflowGraph,
  ValidationResult,
  ValidationError,
} from '@cloutagent/types';

export class WorkflowValidationEngine {
  /**
   * Validate entire workflow
   * Returns validation result with errors and warnings
   */
  validate(workflow: WorkflowGraph): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Run all validation rules
    errors.push(...this.validateStructure(workflow));
    errors.push(...this.validateAgentNode(workflow));
    errors.push(...this.validateConnections(workflow));
    errors.push(...this.validateNodeConfigurations(workflow));
    warnings.push(...this.validateOptimizations(workflow));

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate basic workflow structure
   */
  private validateStructure(workflow: WorkflowGraph): ValidationError[] {
    const errors: ValidationError[] = [];

    // Must have at least one node
    if (!workflow.nodes || workflow.nodes.length === 0) {
      errors.push({
        type: 'structure',
        severity: 'error',
        message: 'Workflow must have at least one node',
      });
    }

    // Edges must reference existing nodes
    if (workflow.edges) {
      for (const edge of workflow.edges) {
        const sourceExists = workflow.nodes.some(n => n.id === edge.source);
        const targetExists = workflow.nodes.some(n => n.id === edge.target);

        if (!sourceExists) {
          errors.push({
            type: 'structure',
            severity: 'error',
            message: `Edge references non-existent source node: ${edge.source}`,
            edgeId: edge.id,
          });
        }

        if (!targetExists) {
          errors.push({
            type: 'structure',
            severity: 'error',
            message: `Edge references non-existent target node: ${edge.target}`,
            edgeId: edge.id,
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate agent node exists and is configured
   */
  private validateAgentNode(workflow: WorkflowGraph): ValidationError[] {
    const errors: ValidationError[] = [];

    const agentNodes = workflow.nodes.filter(n => n.type === 'agent');

    // Must have exactly one agent node
    if (agentNodes.length === 0) {
      errors.push({
        type: 'agent',
        severity: 'error',
        message: 'Workflow must have exactly one agent node',
      });
    } else if (agentNodes.length > 1) {
      errors.push({
        type: 'agent',
        severity: 'error',
        message: `Workflow must have exactly one agent node, found ${agentNodes.length}`,
        nodeIds: agentNodes.map(n => n.id),
      });
    }

    // Validate agent configuration
    if (agentNodes.length === 1) {
      const agent = agentNodes[0];

      if (!agent.data?.config?.model) {
        errors.push({
          type: 'configuration',
          severity: 'error',
          message: 'Agent node must have a model configured',
          nodeId: agent.id,
        });
      }

      if (!agent.data?.config?.systemPrompt) {
        errors.push({
          type: 'configuration',
          severity: 'error',
          message: 'Agent node must have a system prompt',
          nodeId: agent.id,
        });
      }
    }

    return errors;
  }

  /**
   * Validate graph connectivity
   */
  private validateConnections(workflow: WorkflowGraph): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for isolated nodes (except agent and hooks)
    const connectedNodes = new Set<string>();

    for (const edge of workflow.edges || []) {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    }

    for (const node of workflow.nodes) {
      // Agent and hooks can be isolated
      if (node.type === 'agent' || node.type === 'hook') {
        continue;
      }

      if (!connectedNodes.has(node.id)) {
        errors.push({
          type: 'connection',
          severity: 'error',
          message: `Node "${node.data?.name || node.id}" is not connected to the workflow`,
          nodeId: node.id,
        });
      }
    }

    // Check for circular dependencies
    const cycles = this.detectCycles(workflow);
    if (cycles.length > 0) {
      errors.push({
        type: 'connection',
        severity: 'error',
        message: `Circular dependency detected: ${cycles.join(' → ')}`,
        nodeIds: cycles,
      });
    }

    return errors;
  }

  /**
   * Detect cycles in the workflow graph using DFS
   */
  private detectCycles(workflow: WorkflowGraph): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    // Build adjacency list
    const graph = new Map<string, string[]>();
    for (const node of workflow.nodes) {
      graph.set(node.id, []);
    }
    for (const edge of workflow.edges || []) {
      graph.get(edge.source)?.push(edge.target);
    }

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      for (const neighbor of graph.get(nodeId) || []) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          // Found cycle - include the neighbor to complete the cycle
          const cycleStart = path.indexOf(neighbor);
          if (cycleStart !== -1) {
            // Return the cycle path from where it starts
            return true;
          }
        }
      }

      path.pop();
      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of workflow.nodes) {
      if (!visited.has(node.id)) {
        if (dfs(node.id)) {
          return path; // Return cycle path
        }
      }
    }

    return [];
  }

  /**
   * Validate individual node configurations
   */
  private validateNodeConfigurations(workflow: WorkflowGraph): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const node of workflow.nodes) {
      switch (node.type) {
        case 'subagent':
          if (!node.data?.config?.type) {
            errors.push({
              type: 'configuration',
              severity: 'error',
              message: 'Subagent node must have a type configured',
              nodeId: node.id,
            });
          }
          if (!node.data?.config?.prompt) {
            errors.push({
              type: 'configuration',
              severity: 'error',
              message: 'Subagent node must have a prompt',
              nodeId: node.id,
            });
          }
          break;

        case 'hook':
          if (!node.data?.config?.type) {
            errors.push({
              type: 'configuration',
              severity: 'error',
              message: 'Hook node must have a type configured',
              nodeId: node.id,
            });
          }
          if (!node.data?.config?.action?.code) {
            errors.push({
              type: 'configuration',
              severity: 'error',
              message: 'Hook node must have action code',
              nodeId: node.id,
            });
          }
          break;

        case 'mcp':
          if (!node.data?.config?.server) {
            errors.push({
              type: 'configuration',
              severity: 'error',
              message: 'MCP node must have a server configured',
              nodeId: node.id,
            });
          }
          break;
      }
    }

    return errors;
  }

  /**
   * Check for optimization opportunities (warnings, not errors)
   */
  private validateOptimizations(workflow: WorkflowGraph): ValidationError[] {
    const warnings: ValidationError[] = [];

    // Warn if no subagents (underutilizing parallel execution)
    const subagentCount = workflow.nodes.filter(n => n.type === 'subagent').length;
    if (subagentCount === 0) {
      warnings.push({
        type: 'optimization',
        severity: 'warning',
        message: 'Consider adding subagents for parallel task execution',
      });
    }

    // Warn if too many subagents (>10)
    if (subagentCount > 10) {
      warnings.push({
        type: 'optimization',
        severity: 'warning',
        message: `Workflow has ${subagentCount} subagents. Consider consolidating for better performance.`,
      });
    }

    return warnings;
  }

  /**
   * Quick validation for specific fields
   */
  validateField(field: string, value: string | number): ValidationError | null {
    switch (field) {
      case 'systemPrompt':
        if (typeof value !== 'string' || !value || value.trim().length === 0) {
          return {
            type: 'configuration',
            severity: 'error',
            message: 'System prompt cannot be empty',
          };
        }
        if (typeof value === 'string' && value.length > 10000) {
          return {
            type: 'configuration',
            severity: 'warning',
            message: 'System prompt is very long (>10,000 characters)',
          };
        }
        break;

      case 'model': {
        const validModels = ['claude-sonnet-4-5', 'claude-opus-4', 'claude-haiku-4'];
        if (typeof value === 'string' && !validModels.includes(value)) {
          return {
            type: 'configuration',
            severity: 'error',
            message: `Invalid model: ${value}. Must be one of ${validModels.join(', ')}`,
          };
        }
        break;
      }

      case 'temperature':
        if (typeof value !== 'number' || value < 0 || value > 1) {
          return {
            type: 'configuration',
            severity: 'error',
            message: 'Temperature must be a number between 0 and 1',
          };
        }
        break;

      case 'maxTokens':
        if (typeof value !== 'number' || value < 1 || value > 200000) {
          return {
            type: 'configuration',
            severity: 'error',
            message: 'Max tokens must be between 1 and 200,000',
          };
        }
        break;
    }

    return null;
  }
}
