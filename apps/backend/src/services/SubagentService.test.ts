import type { SubagentExecutionRequest } from '@cloutagent/types';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SubagentService } from './SubagentService';

// Mock dependencies
const mockClaudeSDK = {
  createAgent: vi.fn(),
  executeWithTimeout: vi.fn(),
};

const mockCostTracker = {
  trackSubagent: vi.fn(),
};

describe('SubagentService', () => {
  let service: SubagentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SubagentService(mockClaudeSDK as any, mockCostTracker as any);
  });

  it('should execute single subagent successfully', async () => {
    const request: SubagentExecutionRequest = {
      subagentId: 'sub-001',
      type: 'frontend-engineer',
      prompt: 'Create a login form',
      parentAgentId: 'agent-001',
    };

    // Mock successful execution with delay to ensure executionTime > 0
    mockClaudeSDK.createAgent.mockReturnValue({
      run: vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
          output: 'Login form created successfully',
          usage: { input: 100, output: 200 },
        };
      }),
    });

    const result = await service.executeSubagent(request);

    expect(result.status).toBe('completed');
    expect(result.result).toBeTruthy();
    expect(result.result).toBe('Login form created successfully');
    expect(result.tokenUsage.input).toBe(100);
    expect(result.tokenUsage.output).toBe(200);
    expect(result.executionTime).toBeGreaterThan(0);
    expect(mockCostTracker.trackSubagent).toHaveBeenCalledWith({
      subagentId: 'sub-001',
      tokenUsage: { input: 100, output: 200 },
      executionTime: expect.any(Number),
    });
  });

  it('should handle timeout correctly', async () => {
    const request: SubagentExecutionRequest = {
      subagentId: 'sub-002',
      timeout: 100, // Very short timeout
      prompt: 'Long running task',
      parentAgentId: 'agent-001',
    };

    // Mock long-running task
    mockClaudeSDK.createAgent.mockReturnValue({
      run: vi.fn().mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(
              () =>
                resolve({ output: 'Done', usage: { input: 10, output: 10 } }),
              500,
            );
          }),
      ),
    });

    const result = await service.executeSubagent(request);

    expect(result.status).toBe('failed');
    expect(result.error).toContain('Timeout');
  });

  it('should execute batch in parallel', async () => {
    const requests: SubagentExecutionRequest[] = Array(5)
      .fill(null)
      .map((_, i) => ({
        subagentId: `sub-${i}`,
        prompt: `Task ${i}`,
        parentAgentId: 'agent-001',
      }));

    // Mock successful executions with 100ms delay each
    mockClaudeSDK.createAgent.mockReturnValue({
      run: vi.fn().mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(
              () =>
                resolve({
                  output: 'Result',
                  usage: { input: 50, output: 100 },
                }),
              100,
            );
          }),
      ),
    });

    const startTime = Date.now();
    const results = await service.executeBatch(requests);
    const duration = Date.now() - startTime;

    expect(results).toHaveLength(5);
    expect(results.every(r => r.status === 'completed')).toBe(true);
    // Parallel execution should take ~100ms, not 500ms
    expect(duration).toBeLessThan(300);
  });

  it('should track costs for subagent executions', async () => {
    const request: SubagentExecutionRequest = {
      subagentId: 'sub-cost-001',
      prompt: 'Test cost tracking',
      parentAgentId: 'agent-001',
    };

    mockClaudeSDK.createAgent.mockReturnValue({
      run: vi.fn().mockResolvedValue({
        output: 'Test output',
        usage: { input: 1000, output: 2000 },
      }),
    });

    await service.executeSubagent(request);

    expect(mockCostTracker.trackSubagent).toHaveBeenCalledTimes(1);
    expect(mockCostTracker.trackSubagent).toHaveBeenCalledWith({
      subagentId: 'sub-cost-001',
      tokenUsage: { input: 1000, output: 2000 },
      executionTime: expect.any(Number),
    });
  });

  it('should build correct system prompt per type', async () => {
    const types = [
      'frontend-engineer',
      'backend-engineer',
      'database-engineer',
      'ml-engineer',
      'ui-ux-designer',
    ];

    for (const type of types) {
      mockClaudeSDK.createAgent.mockClear();
      mockClaudeSDK.createAgent.mockReturnValue({
        run: vi.fn().mockResolvedValue({
          output: 'Test',
          usage: { input: 10, output: 10 },
        }),
      });

      await service.executeSubagent({
        subagentId: 'sub-type-test',
        type,
        prompt: 'Test prompt',
        parentAgentId: 'agent-001',
      });

      expect(mockClaudeSDK.createAgent).toHaveBeenCalledWith({
        subagentType: type,
        systemPrompt: expect.any(String),
      });

      // Verify system prompt is not empty
      const callArgs = mockClaudeSDK.createAgent.mock.calls[0][0];
      expect(callArgs.systemPrompt.length).toBeGreaterThan(0);
    }
  });

  it('should limit concurrent executions to 10', async () => {
    const requests: SubagentExecutionRequest[] = Array(15)
      .fill(null)
      .map((_, i) => ({
        subagentId: `sub-concurrent-${i}`,
        prompt: `Task ${i}`,
        parentAgentId: 'agent-001',
      }));

    let concurrentCount = 0;
    let maxConcurrent = 0;

    mockClaudeSDK.createAgent.mockReturnValue({
      run: vi.fn().mockImplementation(
        () =>
          new Promise(resolve => {
            concurrentCount++;
            maxConcurrent = Math.max(maxConcurrent, concurrentCount);
            setTimeout(() => {
              concurrentCount--;
              resolve({ output: 'Done', usage: { input: 10, output: 10 } });
            }, 50);
          }),
      ),
    });

    await service.executeBatch(requests);

    expect(maxConcurrent).toBeLessThanOrEqual(10);
  });

  it('should handle subagent failures gracefully', async () => {
    const requests: SubagentExecutionRequest[] = [
      {
        subagentId: 'sub-success-1',
        prompt: 'Task 1',
        parentAgentId: 'agent-001',
      },
      {
        subagentId: 'sub-fail-1',
        prompt: 'Task 2',
        parentAgentId: 'agent-001',
      },
      {
        subagentId: 'sub-success-2',
        prompt: 'Task 3',
        parentAgentId: 'agent-001',
      },
    ];

    let callCount = 0;
    mockClaudeSDK.createAgent.mockReturnValue({
      run: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error('Execution failed'));
        }
        return Promise.resolve({
          output: 'Success',
          usage: { input: 10, output: 10 },
        });
      }),
    });

    const results = await service.executeBatch(requests);

    expect(results).toHaveLength(3);
    expect(results[0].status).toBe('completed');
    expect(results[1].status).toBe('failed');
    expect(results[1].error).toContain('Execution failed');
    expect(results[2].status).toBe('completed');
  });

  describe('Configuration Management', () => {
    // Use unique project IDs with random suffixes to avoid test pollution
    const getUniqueProjectId = () => `test-proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    it('should create a new subagent config', async () => {
      const projectId = getUniqueProjectId();
      const configData = {
        type: 'frontend-engineer' as const,
        name: 'UI Builder',
        prompt: 'Build React components',
        timeout: 60000,
      };

      const config = await service.createConfig(projectId, configData);

      expect(config.id).toBeDefined();
      expect(config.type).toBe('frontend-engineer');
      expect(config.name).toBe('UI Builder');
      expect(config.prompt).toBe('Build React components');
      expect(config.timeout).toBe(60000);
      expect(config.createdAt).toBeDefined();
      expect(config.updatedAt).toBeDefined();
    });

    it('should reject invalid subagent type', async () => {
      const projectId = getUniqueProjectId();
      const configData = {
        type: 'invalid-type' as any,
        name: 'Invalid',
        prompt: 'Test',
      };

      await expect(service.createConfig(projectId, configData)).rejects.toThrow(
        'Invalid subagent type',
      );
    });

    it('should list all configs for a project', async () => {
      const projectId = getUniqueProjectId();

      // Create multiple configs
      await service.createConfig(projectId, {
        type: 'frontend-engineer',
        name: 'UI Builder',
        prompt: 'Build UI',
      });
      await service.createConfig(projectId, {
        type: 'backend-engineer',
        name: 'API Builder',
        prompt: 'Build API',
      });

      const configs = await service.listConfigs(projectId);

      expect(configs).toHaveLength(2);
      expect(configs.some(c => c.name === 'UI Builder')).toBe(true);
      expect(configs.some(c => c.name === 'API Builder')).toBe(true);
    });

    it('should return empty array for non-existent project', async () => {
      const uniqueId = getUniqueProjectId();
      const configs = await service.listConfigs(uniqueId);

      expect(configs).toHaveLength(0);
    });

    it('should get a specific config', async () => {
      const projectId = getUniqueProjectId();
      const created = await service.createConfig(projectId, {
        type: 'ml-engineer',
        name: 'ML Model Builder',
        prompt: 'Build ML models',
      });

      const config = await service.getConfig(projectId, created.id);

      expect(config).not.toBeNull();
      expect(config?.id).toBe(created.id);
      expect(config?.name).toBe('ML Model Builder');
    });

    it('should return null for non-existent config', async () => {
      const projectId = getUniqueProjectId();
      const config = await service.getConfig(projectId, 'non-existent-id');

      expect(config).toBeNull();
    });

    it('should update a config', async () => {
      const projectId = getUniqueProjectId();
      const created = await service.createConfig(projectId, {
        type: 'database-engineer',
        name: 'DB Designer',
        prompt: 'Design database schemas',
      });

      const updated = await service.updateConfig(projectId, created.id, {
        name: 'Advanced DB Designer',
        timeout: 180000,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe('Advanced DB Designer');
      expect(updated.timeout).toBe(180000);
      expect(updated.type).toBe('database-engineer'); // Should preserve original type
      expect(updated.createdAt).toBe(created.createdAt); // Should preserve createdAt
      expect(updated.updatedAt).not.toBe(created.updatedAt); // Should update timestamp
    });

    it('should throw error when updating non-existent config', async () => {
      const projectId = getUniqueProjectId();
      await expect(
        service.updateConfig(projectId, 'non-existent', { name: 'Updated' }),
      ).rejects.toThrow('Subagent config not found');
    });

    it('should delete a config', async () => {
      const projectId = getUniqueProjectId();
      const created = await service.createConfig(projectId, {
        type: 'ui-ux-designer',
        name: 'UX Designer',
        prompt: 'Design user experiences',
      });

      await service.deleteConfig(projectId, created.id);

      const config = await service.getConfig(projectId, created.id);
      expect(config).toBeNull();
    });

    it('should not throw when deleting non-existent config', async () => {
      const projectId = getUniqueProjectId();
      await expect(
        service.deleteConfig(projectId, 'non-existent'),
      ).resolves.not.toThrow();
    });
  });
});
