import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowValidationEngine } from './WorkflowValidationEngine';
import type { WorkflowGraph } from '@cloutagent/types';

describe('WorkflowValidationEngine', () => {
  let engine: WorkflowValidationEngine;

  beforeEach(() => {
    engine = new WorkflowValidationEngine();
  });

  describe('validateStructure', () => {
    it('should fail if workflow has no nodes', () => {
      const workflow: WorkflowGraph = { nodes: [], edges: [] };
      const result = engine.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('at least one node');
      expect(result.errors[0].type).toBe('structure');
    });

    it('should fail if edge references non-existent source node', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'node-1',
            type: 'agent',
            data: {
              config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } as any,
            },
          },
        ],
        edges: [{ id: 'e1', source: 'non-existent', target: 'node-1' }],
      };

      const result = engine.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('non-existent source'))).toBe(true);
      expect(result.errors.find(e => e.edgeId === 'e1')).toBeDefined();
    });

    it('should fail if edge references non-existent target node', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'node-1',
            type: 'agent',
            data: {
              config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } as any,
            },
          },
        ],
        edges: [{ id: 'e1', source: 'node-1', target: 'non-existent' }],
      };

      const result = engine.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('non-existent target'))).toBe(true);
    });

    it('should pass if all edges reference existing nodes', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: {
                model: 'claude-sonnet-4-5',
                systemPrompt: 'Test',
              } as any,
            },
          },
          {
            id: 'sub-1',
            type: 'subagent',
            data: {
              config: { type: 'frontend-engineer', prompt: 'Test' } as any,
            },
          },
        ],
        edges: [{ id: 'e1', source: 'agent-1', target: 'sub-1' }],
      };

      const result = engine.validate(workflow);

      expect(result.errors.filter(e => e.type === 'structure')).toHaveLength(0);
    });
  });

  describe('validateAgentNode', () => {
    it('should fail if no agent node exists', () => {
      const workflow: WorkflowGraph = {
        nodes: [{ id: 'sub-1', type: 'subagent', data: { config: {} } }],
        edges: [],
      };

      const result = engine.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('exactly one agent'))).toBe(true);
      expect(result.errors.some(e => e.type === 'agent')).toBe(true);
    });

    it('should fail if multiple agent nodes exist', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } as any,
            },
          },
          {
            id: 'agent-2',
            type: 'agent',
            data: {
              config: { model: 'claude-opus-4', systemPrompt: 'Test 2' } as any,
            },
          },
        ],
        edges: [],
      };

      const result = engine.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('exactly one agent'))).toBe(true);
      expect(result.errors.some(e => e.nodeIds?.length === 2)).toBe(true);
    });

    it('should fail if agent missing model', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: { config: { systemPrompt: 'Test' } as any },
          },
        ],
        edges: [],
      };

      const result = engine.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('model'))).toBe(true);
      expect(result.errors.some(e => e.nodeId === 'agent-1')).toBe(true);
    });

    it('should fail if agent missing system prompt', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: { config: { model: 'claude-sonnet-4-5' } as any },
          },
        ],
        edges: [],
      };

      const result = engine.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('system prompt'))).toBe(true);
    });

    it('should pass if agent has valid configuration', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: {
                model: 'claude-sonnet-4-5',
                systemPrompt: 'You are a helpful assistant',
              } as any,
            },
          },
        ],
        edges: [],
      };

      const result = engine.validate(workflow);

      expect(result.errors.filter(e => e.type === 'agent')).toHaveLength(0);
    });
  });

  describe('validateConnections', () => {
    it('should fail if subagent is isolated', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } as any,
            },
          },
          {
            id: 'sub-1',
            type: 'subagent',
            data: { name: 'Isolated Subagent', config: {} },
          },
        ],
        edges: [],
      };

      const result = engine.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('not connected'))).toBe(true);
      expect(result.errors.some(e => e.nodeId === 'sub-1')).toBe(true);
    });

    it('should allow agent to be isolated', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } as any,
            },
          },
        ],
        edges: [],
      };

      const result = engine.validate(workflow);

      expect(
        result.errors.some(e => e.type === 'connection' && e.nodeId === 'agent-1'),
      ).toBe(false);
    });

    it('should allow hooks to be isolated', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } as any,
            },
          },
          {
            id: 'hook-1',
            type: 'hook',
            data: {
              config: {
                type: 'pre-execution',
                action: { code: 'console.log("test")' },
              } as any,
            },
          },
        ],
        edges: [],
      };

      const result = engine.validate(workflow);

      expect(
        result.errors.some(e => e.type === 'connection' && e.nodeId === 'hook-1'),
      ).toBe(false);
    });

    it('should detect circular dependencies (simple cycle)', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } as any,
            },
          },
          { id: 'sub-1', type: 'subagent', data: { config: {} } },
          { id: 'sub-2', type: 'subagent', data: { config: {} } },
        ],
        edges: [
          { id: 'e1', source: 'agent-1', target: 'sub-1' },
          { id: 'e2', source: 'sub-1', target: 'sub-2' },
          { id: 'e3', source: 'sub-2', target: 'sub-1' }, // Cycle
        ],
      };

      const result = engine.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Circular dependency'))).toBe(true);
    });

    it('should detect self-referencing cycle', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } as any,
            },
          },
          { id: 'sub-1', type: 'subagent', data: { config: {} } },
        ],
        edges: [
          { id: 'e1', source: 'agent-1', target: 'sub-1' },
          { id: 'e2', source: 'sub-1', target: 'sub-1' }, // Self-cycle
        ],
      };

      const result = engine.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Circular dependency'))).toBe(true);
    });

    it('should pass DAG (directed acyclic graph)', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } as any,
            },
          },
          { id: 'sub-1', type: 'subagent', data: { config: {} } },
          { id: 'sub-2', type: 'subagent', data: { config: {} } },
          { id: 'sub-3', type: 'subagent', data: { config: {} } },
        ],
        edges: [
          { id: 'e1', source: 'agent-1', target: 'sub-1' },
          { id: 'e2', source: 'agent-1', target: 'sub-2' },
          { id: 'e3', source: 'sub-1', target: 'sub-3' },
          { id: 'e4', source: 'sub-2', target: 'sub-3' },
        ],
      };

      const result = engine.validate(workflow);

      expect(result.errors.filter(e => e.message.includes('Circular'))).toHaveLength(0);
    });
  });

  describe('validateNodeConfigurations', () => {
    it('should fail if subagent missing type', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } as any,
            },
          },
          {
            id: 'sub-1',
            type: 'subagent',
            data: { config: { prompt: 'Test' } as any },
          },
        ],
        edges: [{ id: 'e1', source: 'agent-1', target: 'sub-1' }],
      };

      const result = engine.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('type configured'))).toBe(true);
      expect(result.errors.some(e => e.nodeId === 'sub-1')).toBe(true);
    });

    it('should fail if subagent missing prompt', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } as any,
            },
          },
          {
            id: 'sub-1',
            type: 'subagent',
            data: { config: { type: 'frontend-engineer' } as any },
          },
        ],
        edges: [{ id: 'e1', source: 'agent-1', target: 'sub-1' }],
      };

      const result = engine.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('prompt'))).toBe(true);
    });

    it('should fail if hook missing type', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } as any,
            },
          },
          {
            id: 'hook-1',
            type: 'hook',
            data: { config: { action: { code: 'console.log("test")' } } as any },
          },
        ],
        edges: [],
      };

      const result = engine.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('type configured'))).toBe(true);
      expect(result.errors.some(e => e.nodeId === 'hook-1')).toBe(true);
    });

    it('should fail if hook missing action code', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } as any,
            },
          },
          {
            id: 'hook-1',
            type: 'hook',
            data: { config: { type: 'pre-execution', action: {} } as any },
          },
        ],
        edges: [],
      };

      const result = engine.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('action code'))).toBe(true);
    });

    it('should fail if MCP missing server', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } as any,
            },
          },
          {
            id: 'mcp-1',
            type: 'mcp',
            data: { config: { name: 'test' } as any },
          },
        ],
        edges: [{ id: 'e1', source: 'agent-1', target: 'mcp-1' }],
      };

      const result = engine.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('server configured'))).toBe(true);
      expect(result.errors.some(e => e.nodeId === 'mcp-1')).toBe(true);
    });

    it('should pass if all nodes properly configured', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: {
                model: 'claude-sonnet-4-5',
                systemPrompt: 'You are helpful',
              } as any,
            },
          },
          {
            id: 'sub-1',
            type: 'subagent',
            data: {
              config: { type: 'frontend-engineer', prompt: 'Build UI' } as any,
            },
          },
          {
            id: 'hook-1',
            type: 'hook',
            data: {
              config: {
                type: 'pre-execution',
                action: { code: 'console.log("test")' },
              } as any,
            },
          },
          {
            id: 'mcp-1',
            type: 'mcp',
            data: { config: { server: 'filesystem' } as any },
          },
        ],
        edges: [
          { id: 'e1', source: 'agent-1', target: 'sub-1' },
          { id: 'e2', source: 'agent-1', target: 'mcp-1' },
        ],
      };

      const result = engine.validate(workflow);

      expect(result.errors.filter(e => e.type === 'configuration')).toHaveLength(0);
    });
  });

  describe('validateOptimizations', () => {
    it('should warn if no subagents exist', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } as any,
            },
          },
        ],
        edges: [],
      };

      const result = engine.validate(workflow);

      expect(result.warnings.some(w => w.message.includes('subagents'))).toBe(true);
      expect(result.warnings.some(w => w.type === 'optimization')).toBe(true);
    });

    it('should warn if too many subagents (>10)', () => {
      const nodes = [
        {
          id: 'agent-1',
          type: 'agent' as const,
          data: {
            config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } as any,
          },
        },
      ];

      // Add 11 subagents
      for (let i = 1; i <= 11; i++) {
        nodes.push({
          id: `sub-${i}`,
          type: 'subagent' as const,
          data: {
            config: { type: 'frontend-engineer', prompt: 'Test' } as any,
          },
        });
      }

      const workflow: WorkflowGraph = {
        nodes,
        edges: nodes
          .slice(1)
          .map((n, i) => ({ id: `e${i}`, source: 'agent-1', target: n.id })),
      };

      const result = engine.validate(workflow);

      expect(result.warnings.some(w => w.message.includes('11 subagents'))).toBe(true);
      expect(result.warnings.some(w => w.message.includes('consolidating'))).toBe(true);
    });

    it('should not warn for optimal subagent count (1-10)', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } as any,
            },
          },
          {
            id: 'sub-1',
            type: 'subagent',
            data: {
              config: { type: 'frontend-engineer', prompt: 'Build UI' } as any,
            },
          },
          {
            id: 'sub-2',
            type: 'subagent',
            data: {
              config: { type: 'backend-engineer', prompt: 'Build API' } as any,
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'agent-1', target: 'sub-1' },
          { id: 'e2', source: 'agent-1', target: 'sub-2' },
        ],
      };

      const result = engine.validate(workflow);

      expect(result.warnings.filter(w => w.type === 'optimization')).toHaveLength(0);
    });
  });

  describe('validateField', () => {
    it('should validate systemPrompt - empty', () => {
      const error = engine.validateField('systemPrompt', '');
      expect(error).not.toBeNull();
      expect(error?.message).toContain('cannot be empty');
      expect(error?.severity).toBe('error');
    });

    it('should validate systemPrompt - too long', () => {
      const error = engine.validateField('systemPrompt', 'a'.repeat(10001));
      expect(error).not.toBeNull();
      expect(error?.message).toContain('very long');
      expect(error?.severity).toBe('warning');
    });

    it('should validate systemPrompt - valid', () => {
      const error = engine.validateField('systemPrompt', 'You are a helpful assistant');
      expect(error).toBeNull();
    });

    it('should validate model - invalid', () => {
      const error = engine.validateField('model', 'gpt-4');
      expect(error).not.toBeNull();
      expect(error?.message).toContain('Invalid model');
    });

    it('should validate model - valid', () => {
      const error = engine.validateField('model', 'claude-sonnet-4-5');
      expect(error).toBeNull();
    });

    it('should validate temperature - below range', () => {
      const error = engine.validateField('temperature', -0.1);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('between 0 and 1');
    });

    it('should validate temperature - above range', () => {
      const error = engine.validateField('temperature', 1.1);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('between 0 and 1');
    });

    it('should validate temperature - valid', () => {
      expect(engine.validateField('temperature', 0)).toBeNull();
      expect(engine.validateField('temperature', 0.5)).toBeNull();
      expect(engine.validateField('temperature', 1)).toBeNull();
    });

    it('should validate maxTokens - below range', () => {
      const error = engine.validateField('maxTokens', 0);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('between 1 and 200,000');
    });

    it('should validate maxTokens - above range', () => {
      const error = engine.validateField('maxTokens', 200001);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('between 1 and 200,000');
    });

    it('should validate maxTokens - valid', () => {
      expect(engine.validateField('maxTokens', 1)).toBeNull();
      expect(engine.validateField('maxTokens', 100000)).toBeNull();
      expect(engine.validateField('maxTokens', 200000)).toBeNull();
    });

    it('should return null for unknown field', () => {
      const error = engine.validateField('unknownField', 'value');
      expect(error).toBeNull();
    });
  });

  describe('complete workflow validation', () => {
    it('should pass valid workflow with all components', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: {
                model: 'claude-sonnet-4-5',
                systemPrompt: 'You are helpful',
              } as any,
            },
          },
          {
            id: 'sub-1',
            type: 'subagent',
            data: {
              config: { type: 'frontend-engineer', prompt: 'Build UI' } as any,
            },
          },
          {
            id: 'sub-2',
            type: 'subagent',
            data: {
              config: { type: 'backend-engineer', prompt: 'Build API' } as any,
            },
          },
          {
            id: 'hook-1',
            type: 'hook',
            data: {
              config: {
                type: 'pre-execution',
                action: { code: 'console.log("test")' },
              } as any,
            },
          },
          {
            id: 'mcp-1',
            type: 'mcp',
            data: { config: { server: 'filesystem' } as any },
          },
        ],
        edges: [
          { id: 'e1', source: 'agent-1', target: 'sub-1' },
          { id: 'e2', source: 'agent-1', target: 'sub-2' },
          { id: 'e3', source: 'agent-1', target: 'mcp-1' },
        ],
      };

      const result = engine.validate(workflow);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect multiple errors from different validators', () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: { config: {} as any }, // Missing model and systemPrompt
          },
          {
            id: 'agent-2',
            type: 'agent',
            data: { config: {} as any }, // Duplicate agent - causes 'agent' type error
          },
          {
            id: 'sub-1',
            type: 'subagent',
            data: { config: {} as any }, // Missing type and prompt
          },
        ],
        edges: [
          { id: 'e1', source: 'agent-1', target: 'sub-1' },
          { id: 'e2', source: 'sub-1', target: 'non-existent' }, // Invalid edge
          { id: 'e3', source: 'sub-1', target: 'agent-1' }, // Creates cycle
        ],
      };

      const result = engine.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
      expect(result.errors.some(e => e.type === 'agent')).toBe(true);
      expect(result.errors.some(e => e.type === 'structure')).toBe(true);
      expect(result.errors.some(e => e.type === 'configuration')).toBe(true);
      expect(result.errors.some(e => e.type === 'connection')).toBe(true);
    });
  });
});
