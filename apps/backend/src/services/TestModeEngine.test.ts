import { describe, it, expect, beforeEach } from 'vitest';
import { TestModeEngine } from './TestModeEngine';
import type { WorkflowGraph, ExecutionConfig } from '@cloutagent/types';

describe('TestModeEngine', () => {
  let engine: TestModeEngine;

  beforeEach(() => {
    engine = new TestModeEngine();
  });

  it('should simulate complete workflow execution', async () => {
    const workflow: WorkflowGraph = {
      nodes: [
        {
          id: 'agent-1',
          type: 'agent',
          data: {
            config: {
              model: 'claude-sonnet-4-5',
              systemPrompt: 'You are a helpful assistant',
              maxTokens: 4096,
            },
          },
        },
      ],
      edges: [],
    };

    const config: ExecutionConfig = {
      projectId: 'test-proj',
      input: 'Hello',
      options: { testMode: true },
    };

    const result = await engine.testExecute(config, workflow);

    expect(result.status).toBe('completed');
    expect(result.output).toContain('[TEST MODE - Simulated Output]');
    expect(result.tokenUsage.total).toBeGreaterThan(0);
    expect(result.costUSD).toBeGreaterThan(0);
    expect(result.duration).toBeGreaterThan(0);
    expect(result.steps).toHaveLength(2); // validation + agent
  });

  it('should simulate subagent execution', async () => {
    const workflow: WorkflowGraph = {
      nodes: [
        {
          id: 'agent-1',
          type: 'agent',
          data: { config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } },
        },
        {
          id: 'sub-1',
          type: 'subagent',
          data: { config: { type: 'frontend-engineer', prompt: 'Build UI' } },
        },
      ],
      edges: [{ id: 'e1', source: 'agent-1', target: 'sub-1' }],
    };

    const config: ExecutionConfig = {
      projectId: 'test-proj',
      input: 'Test',
      options: { testMode: true },
    };

    const result = await engine.testExecute(config, workflow);

    expect(result.status).toBe('completed');
    expect(result.steps.some(s => s.message?.includes('subagent'))).toBe(true);
  });

  it('should simulate pre and post execution hooks', async () => {
    const workflow: WorkflowGraph = {
      nodes: [
        {
          id: 'agent-1',
          type: 'agent',
          data: { config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } },
        },
        {
          id: 'pre-hook-1',
          type: 'hook',
          data: { config: { type: 'pre-execution', name: 'Validate input' } },
        },
        {
          id: 'post-hook-1',
          type: 'hook',
          data: { config: { type: 'post-execution', name: 'Log results' } },
        },
      ],
      edges: [],
    };

    const config: ExecutionConfig = {
      projectId: 'test-proj',
      input: 'Test',
      options: { testMode: true },
    };

    const result = await engine.testExecute(config, workflow);

    expect(result.status).toBe('completed');
    expect(result.steps.some(s => s.message?.includes('pre-execution hook'))).toBe(true);
    expect(result.steps.some(s => s.message?.includes('post-execution hook'))).toBe(true);
  });

  it('should emit test events during execution', async () => {
    const events: any[] = [];

    engine.on('test:started', data => events.push({ type: 'started', data }));
    engine.on('test:step', data => events.push({ type: 'step', data }));
    engine.on('test:output', data => events.push({ type: 'output', data }));
    engine.on('test:completed', data => events.push({ type: 'completed', data }));

    const workflow: WorkflowGraph = {
      nodes: [
        {
          id: 'agent-1',
          type: 'agent',
          data: { config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } },
        },
      ],
      edges: [],
    };

    const config: ExecutionConfig = {
      projectId: 'test-proj',
      input: 'Test',
      options: { testMode: true },
    };

    await engine.testExecute(config, workflow);

    expect(events.some(e => e.type === 'started')).toBe(true);
    expect(events.some(e => e.type === 'step')).toBe(true);
    expect(events.some(e => e.type === 'output')).toBe(true);
    expect(events.some(e => e.type === 'completed')).toBe(true);
  });

  it('should handle workflow without agent node', async () => {
    const workflow: WorkflowGraph = {
      nodes: [{ id: 'sub-1', type: 'subagent', data: {} }],
      edges: [],
    };

    const config: ExecutionConfig = {
      projectId: 'test-proj',
      input: 'Test',
      options: { testMode: true },
    };

    const result = await engine.testExecute(config, workflow);

    expect(result.status).toBe('failed');
    expect(result.error).toContain('No agent node');
  });

  it('should calculate token usage and costs correctly', async () => {
    const workflow: WorkflowGraph = {
      nodes: [
        {
          id: 'agent-1',
          type: 'agent',
          data: {
            config: {
              model: 'claude-sonnet-4-5',
              systemPrompt: 'This is a test system prompt',
              maxTokens: 2000,
            },
          },
        },
      ],
      edges: [],
    };

    const config: ExecutionConfig = {
      projectId: 'test-proj',
      input: 'Short input',
      options: { testMode: true },
    };

    const result = await engine.testExecute(config, workflow);

    expect(result.tokenUsage.input).toBeGreaterThan(0);
    expect(result.tokenUsage.output).toBeGreaterThan(0);
    expect(result.tokenUsage.total).toBe(
      result.tokenUsage.input + result.tokenUsage.output,
    );
    // Claude Sonnet 4.5: $3/1M input, $15/1M output
    const expectedCost =
      (result.tokenUsage.input / 1_000_000) * 3.0 +
      (result.tokenUsage.output / 1_000_000) * 15.0;
    expect(result.costUSD).toBeCloseTo(expectedCost, 6);
  });

  it('should include execution metadata', async () => {
    const workflow: WorkflowGraph = {
      nodes: [
        {
          id: 'agent-1',
          type: 'agent',
          data: { config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } },
        },
      ],
      edges: [],
    };

    const config: ExecutionConfig = {
      projectId: 'test-proj-123',
      input: 'Test',
      options: { testMode: true },
    };

    const result = await engine.testExecute(config, workflow);

    expect(result.id).toMatch(/^test-exec-\d+$/);
    expect(result.projectId).toBe('test-proj-123');
    expect(result.startedAt).toBeDefined();
    expect(result.completedAt).toBeDefined();
    expect(result.duration).toBeGreaterThan(0);
  });

  describe('dryRun', () => {
    it('should estimate costs and duration', async () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: { config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test prompt' } },
          },
        ],
        edges: [],
      };

      const result = await engine.dryRun(workflow);

      expect(result.valid).toBe(true);
      expect(result.estimatedCost).toBeGreaterThan(0);
      expect(result.estimatedTokens).toBeGreaterThan(0);
      expect(result.estimatedDuration).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid workflow', async () => {
      const workflow: WorkflowGraph = {
        nodes: [],
        edges: [],
      };

      const result = await engine.dryRun(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Workflow must have at least one node');
    });

    it('should return error when no agent node exists', async () => {
      const workflow: WorkflowGraph = {
        nodes: [{ id: 'hook-1', type: 'hook', data: {} }],
        edges: [],
      };

      const result = await engine.dryRun(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Workflow must have an agent node');
    });

    it('should estimate duration with hooks included', async () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: { config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } },
          },
          { id: 'hook-1', type: 'hook', data: {} },
          { id: 'hook-2', type: 'hook', data: {} },
        ],
        edges: [],
      };

      const result = await engine.dryRun(workflow);

      expect(result.valid).toBe(true);
      // Agent: 2000ms + 2 hooks × 100ms = 2200ms minimum
      expect(result.estimatedDuration).toBeGreaterThanOrEqual(2200);
    });

    it('should estimate duration with subagents included', async () => {
      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: { config: { model: 'claude-sonnet-4-5', systemPrompt: 'Test' } },
          },
          { id: 'sub-1', type: 'subagent', data: {} },
          { id: 'sub-2', type: 'subagent', data: {} },
        ],
        edges: [
          { id: 'e1', source: 'agent-1', target: 'sub-1' },
          { id: 'e2', source: 'agent-1', target: 'sub-2' },
        ],
      };

      const result = await engine.dryRun(workflow);

      expect(result.valid).toBe(true);
      // Agent: 2000ms + subagents parallel: 3000ms = 5000ms minimum
      expect(result.estimatedDuration).toBeGreaterThanOrEqual(5000);
    });
  });

  describe('error handling', () => {
    it('should emit failed event on error', async () => {
      const events: any[] = [];

      engine.on('test:failed', data => events.push({ type: 'failed', data }));

      const workflow: WorkflowGraph = {
        nodes: [],
        edges: [],
      };

      const config: ExecutionConfig = {
        projectId: 'test-proj',
        input: 'Test',
        options: { testMode: true },
      };

      await engine.testExecute(config, workflow);

      expect(events.some(e => e.type === 'failed')).toBe(true);
    });

    it('should include error message in result', async () => {
      const workflow: WorkflowGraph = {
        nodes: [],
        edges: [],
      };

      const config: ExecutionConfig = {
        projectId: 'test-proj',
        input: 'Test',
        options: { testMode: true },
      };

      const result = await engine.testExecute(config, workflow);

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
      expect(result.completedAt).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
    });
  });
});
