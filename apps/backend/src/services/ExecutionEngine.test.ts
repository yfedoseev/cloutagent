import type { ExecutionConfig, WorkflowGraph } from '@cloutagent/types';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ExecutionEngine } from './ExecutionEngine';

// Mock dependencies
class MockClaudeSDKService {
  createAgent = vi.fn(() => ({
    run: vi.fn(async (input: string, options: any) => {
      // Simulate streaming with delay to ensure duration > 0
      await new Promise(resolve => setTimeout(resolve, 50));

      if (options?.onChunk) {
        options.onChunk('Hello ');
        options.onChunk('World!');
      }

      return {
        output: 'Hello World!',
        usage: {
          input: 100,
          output: 50,
          total: 150,
        },
      };
    }),
  }));
}

class MockSubagentService {
  executeBatch = vi.fn(async (requests: any[]) => {
    return requests.map(req => ({
      subagentId: req.subagentId,
      output: `Subagent ${req.subagentId} result`,
      tokenUsage: {
        input: 50,
        output: 25,
      },
    }));
  });
}

class MockHookExecutionService {
  executeHookChain = vi.fn(async () => {
    return { success: true };
  });
}

describe('ExecutionEngine', () => {
  let engine: ExecutionEngine;
  let mockClaudeSDK: MockClaudeSDKService;
  let mockSubagentService: MockSubagentService;
  let mockHookService: MockHookExecutionService;

  beforeEach(() => {
    mockClaudeSDK = new MockClaudeSDKService();
    mockSubagentService = new MockSubagentService();
    mockHookService = new MockHookExecutionService();

    engine = new ExecutionEngine(
      mockClaudeSDK as any,
      mockSubagentService as any,
      mockHookService as any,
    );
  });

  describe('execute complete workflow', () => {
    it('should execute complete workflow with agent node', async () => {
      const config: ExecutionConfig = {
        projectId: 'proj-001',
        input: 'Build a login form',
        options: { streaming: true },
      };

      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: {
                model: 'claude-sonnet-4-5',
                systemPrompt: 'You are a helpful assistant',
              },
            },
          },
        ],
        edges: [],
      };

      const execution = await engine.execute(config, workflow);

      expect(execution.status).toBe('completed');
      expect(execution.output).toBeTruthy();
      expect(execution.output).toBe('Hello World!');
      expect(execution.tokenUsage.total).toBeGreaterThan(0);
      expect(execution.tokenUsage.input).toBe(100);
      expect(execution.tokenUsage.output).toBe(50);
      expect(execution.costUSD).toBeGreaterThan(0);
      expect(execution.steps.length).toBeGreaterThan(0);
      expect(execution.completedAt).toBeDefined();
      expect(execution.duration).toBeGreaterThan(0);
    });

    it('should throw error if no agent node found', async () => {
      const config: ExecutionConfig = {
        projectId: 'proj-001',
        input: 'Test input',
      };

      const workflow: WorkflowGraph = {
        nodes: [],
        edges: [],
      };

      const execution = await engine.execute(config, workflow);

      expect(execution.status).toBe('failed');
      expect(execution.error).toContain('Workflow validation failed');
      expect(execution.error).toContain('at least one node');
    });
  });

  describe('pre-execution hooks', () => {
    it('should execute pre-execution hooks before agent', async () => {
      const config: ExecutionConfig = {
        projectId: 'proj-001',
        input: 'Test input',
      };

      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'hook-1',
            type: 'hook',
            data: {
              config: {
                type: 'pre-execution',
                name: 'Pre Hook',
                action: { code: 'console.log("test")' },
              },
            },
          },
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: {
                model: 'claude-sonnet-4-5',
                systemPrompt: 'You are helpful',
              },
            },
          },
        ],
        edges: [],
      };

      await engine.execute(config, workflow);

      expect(mockHookService.executeHookChain).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ type: 'pre-execution' }),
        ]),
        expect.objectContaining({
          hookType: 'pre-execution',
        }),
      );
    });
  });

  describe('subagent execution', () => {
    it('should execute subagents in parallel', async () => {
      const config: ExecutionConfig = {
        projectId: 'proj-001',
        input: 'Test input',
      };

      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: {
                model: 'claude-sonnet-4-5',
                systemPrompt: 'You are helpful',
              },
            },
          },
          {
            id: 'subagent-1',
            type: 'subagent',
            data: {
              config: {
                type: 'research',
                prompt: 'Research topic 1',
              },
            },
          },
          {
            id: 'subagent-2',
            type: 'subagent',
            data: {
              config: {
                type: 'analysis',
                prompt: 'Analyze data',
              },
            },
          },
          {
            id: 'subagent-3',
            type: 'subagent',
            data: {
              config: {
                type: 'synthesis',
                prompt: 'Synthesize results',
              },
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'agent-1', target: 'subagent-1' },
          { id: 'e2', source: 'agent-1', target: 'subagent-2' },
          { id: 'e3', source: 'agent-1', target: 'subagent-3' },
        ],
      };

      const startTime = Date.now();
      const execution = await engine.execute(config, workflow);
      const duration = Date.now() - startTime;

      expect(execution.status).toBe('completed');
      expect(mockSubagentService.executeBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ subagentId: 'subagent-1' }),
          expect.objectContaining({ subagentId: 'subagent-2' }),
          expect.objectContaining({ subagentId: 'subagent-3' }),
        ]),
      );

      // Verify parallel execution (should be fast)
      expect(duration).toBeLessThan(1000);

      // Verify token usage includes subagents
      expect(execution.tokenUsage.input).toBe(250); // 100 + 50*3
      expect(execution.tokenUsage.output).toBe(125); // 50 + 25*3
    });
  });

  describe('post-execution hooks', () => {
    it('should execute post-execution hooks after completion', async () => {
      const config: ExecutionConfig = {
        projectId: 'proj-001',
        input: 'Test input',
      };

      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: {
                model: 'claude-sonnet-4-5',
                systemPrompt: 'You are helpful',
              },
            },
          },
          {
            id: 'hook-1',
            type: 'hook',
            data: {
              config: {
                type: 'post-execution',
                name: 'Post Hook',
                action: { code: 'console.log("test")' },
              },
            },
          },
        ],
        edges: [],
      };

      await engine.execute(config, workflow);

      expect(mockHookService.executeHookChain).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ type: 'post-execution' }),
        ]),
        expect.objectContaining({
          hookType: 'post-execution',
        }),
      );
    });
  });

  describe('pause and resume execution', () => {
    it('should pause running execution', async () => {
      const config: ExecutionConfig = {
        projectId: 'proj-001',
        input: 'Test input',
      };

      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: {
                model: 'claude-sonnet-4-5',
                systemPrompt: 'You are helpful',
              },
            },
          },
        ],
        edges: [],
      };

      // Start execution
      const executionPromise = engine.execute(config, workflow);

      // Get execution ID from the active executions
      let executionId: string | undefined;
      const checkExecution = setInterval(() => {
        const activeExecs = (engine as any).activeExecutions;
        if (activeExecs.size > 0) {
          executionId = Array.from(activeExecs.keys())[0];
          clearInterval(checkExecution);
        }
      }, 10);

      // Wait a bit for execution to start
      await new Promise(resolve => setTimeout(resolve, 50));

      if (executionId) {
        const paused = await engine.pause(executionId);
        expect(paused).toBe(true);

        const execution = (engine as any).activeExecutions.get(executionId);
        expect(execution?.status).toBe('paused');
      }

      await executionPromise;
    });

    it('should resume paused execution', async () => {
      const config: ExecutionConfig = {
        projectId: 'proj-001',
        input: 'Test input',
      };

      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: {
                model: 'claude-sonnet-4-5',
                systemPrompt: 'You are helpful',
              },
            },
          },
        ],
        edges: [],
      };

      const executionPromise = engine.execute(config, workflow);

      let executionId: string | undefined;
      const checkExecution = setInterval(() => {
        const activeExecs = (engine as any).activeExecutions;
        if (activeExecs.size > 0) {
          executionId = Array.from(activeExecs.keys())[0];
          clearInterval(checkExecution);
        }
      }, 10);

      await new Promise(resolve => setTimeout(resolve, 50));

      if (executionId) {
        await engine.pause(executionId);
        const resumed = await engine.resume(executionId);

        expect(resumed).toBe(true);

        const execution = (engine as any).activeExecutions.get(executionId);
        expect(execution?.status).toBe('running');
      }

      await executionPromise;
    });

    it('should return false when pausing non-running execution', async () => {
      const result = await engine.pause('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('cancel running execution', () => {
    it('should cancel running execution', async () => {
      const config: ExecutionConfig = {
        projectId: 'proj-001',
        input: 'Test input',
      };

      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: {
                model: 'claude-sonnet-4-5',
                systemPrompt: 'You are helpful',
              },
            },
          },
        ],
        edges: [],
      };

      const executionPromise = engine.execute(config, workflow);

      let executionId: string | undefined;
      const checkExecution = setInterval(() => {
        const activeExecs = (engine as any).activeExecutions;
        if (activeExecs.size > 0) {
          executionId = Array.from(activeExecs.keys())[0];
          clearInterval(checkExecution);
        }
      }, 10);

      await new Promise(resolve => setTimeout(resolve, 50));

      if (executionId) {
        const cancelled = await engine.cancel(executionId);
        expect(cancelled).toBe(true);
      }

      await executionPromise;
    });
  });

  describe('token usage tracking', () => {
    it('should track token usage accurately', async () => {
      const config: ExecutionConfig = {
        projectId: 'proj-001',
        input: 'Test input',
      };

      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: {
                model: 'claude-sonnet-4-5',
                systemPrompt: 'You are helpful',
              },
            },
          },
        ],
        edges: [],
      };

      const execution = await engine.execute(config, workflow);

      expect(execution.tokenUsage.input).toBe(100);
      expect(execution.tokenUsage.output).toBe(50);
      expect(execution.tokenUsage.total).toBe(150);

      // Claude Sonnet 4.5 pricing: $3/1M input, $15/1M output
      const expectedCost = (100 / 1_000_000) * 3.0 + (50 / 1_000_000) * 15.0;
      expect(execution.costUSD).toBeCloseTo(expectedCost, 6);
    });
  });

  describe('event emission', () => {
    it('should emit events during execution', async () => {
      const config: ExecutionConfig = {
        projectId: 'proj-001',
        input: 'Test input',
      };

      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: {
                model: 'claude-sonnet-4-5',
                systemPrompt: 'You are helpful',
              },
            },
          },
        ],
        edges: [],
      };

      const events: any[] = [];

      engine.on('execution:started', data =>
        events.push({ type: 'started', data }),
      );
      engine.on('execution:step', data => events.push({ type: 'step', data }));
      engine.on('execution:output', data =>
        events.push({ type: 'output', data }),
      );
      engine.on('execution:token-usage', data =>
        events.push({ type: 'token-usage', data }),
      );
      engine.on('execution:completed', data =>
        events.push({ type: 'completed', data }),
      );

      await engine.execute(config, workflow);

      expect(events.some(e => e.type === 'started')).toBe(true);
      expect(events.some(e => e.type === 'step')).toBe(true);
      expect(events.some(e => e.type === 'output')).toBe(true);
      expect(events.some(e => e.type === 'token-usage')).toBe(true);
      expect(events.some(e => e.type === 'completed')).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle execution errors and execute error hooks', async () => {
      const config: ExecutionConfig = {
        projectId: 'proj-001',
        input: 'Test input',
      };

      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: {
                model: 'claude-sonnet-4-5',
                systemPrompt: 'You are helpful',
              },
            },
          },
          {
            id: 'hook-1',
            type: 'hook',
            data: {
              config: {
                type: 'on-error',
                name: 'Error Hook',
                action: { code: 'console.log("error")' },
              },
            },
          },
        ],
        edges: [],
      };

      // Make agent throw an error (with delay to ensure duration > 0)
      mockClaudeSDK.createAgent.mockReturnValueOnce({
        run: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          throw new Error('Agent execution failed');
        }),
      });

      const execution = await engine.execute(config, workflow);

      expect(execution.status).toBe('failed');
      expect(execution.error).toContain('Agent execution failed');
      expect(execution.completedAt).toBeDefined();
      expect(execution.duration).toBeGreaterThan(0);

      // Verify error hook was executed
      expect(mockHookService.executeHookChain).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ type: 'on-error' })]),
        expect.objectContaining({
          hookType: 'on-error',
          payload: expect.objectContaining({
            error: expect.any(Error),
          }),
        }),
      );
    });

    it('should emit execution:failed event on error', async () => {
      const config: ExecutionConfig = {
        projectId: 'proj-001',
        input: 'Test input',
      };

      const workflow: WorkflowGraph = {
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            data: {
              config: {
                model: 'claude-sonnet-4-5',
                systemPrompt: 'You are helpful',
              },
            },
          },
        ],
        edges: [],
      };

      mockClaudeSDK.createAgent.mockReturnValueOnce({
        run: vi.fn(async () => {
          throw new Error('Test error');
        }),
      });

      const failedEvents: any[] = [];
      engine.on('execution:failed', data => failedEvents.push(data));

      await engine.execute(config, workflow);

      expect(failedEvents.length).toBe(1);
      expect(failedEvents[0].error).toContain('Test error');
    });
  });
});
