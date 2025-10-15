import type { AgentConfig } from '@cloutagent/types';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ClaudeSDKService } from './ClaudeSDKService';

// Create mock functions for Anthropic SDK
const mockCreate = vi.fn();
const mockStream = vi.fn();

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  const MockAnthropic = vi.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
      stream: mockStream,
    },
  }));
  return {
    default: MockAnthropic,
  };
});

describe('ClaudeSDKService', () => {
  let service: ClaudeSDKService;
  let mockAgentConfig: AgentConfig;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Set up environment
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-123';

    // Setup default mock responses
    mockCreate.mockResolvedValue({
      id: 'msg_123',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'This is a test response.',
        },
      ],
      model: 'claude-sonnet-4-5',
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 10,
        output_tokens: 5,
      },
    });

    // Setup default mock stream
    const mockStreamInstance = {
      on: vi.fn((event: string, handler: any) => {
        if (event === 'text') {
          handler('This ');
          handler('is ');
          handler('streaming.');
        } else if (event === 'message') {
          handler({
            usage: {
              input_tokens: 8,
              output_tokens: 4,
            },
          });
        }
        return mockStreamInstance;
      }),
      finalMessage: vi.fn().mockResolvedValue({}),
    };
    mockStream.mockResolvedValue(mockStreamInstance);

    service = new ClaudeSDKService();

    mockAgentConfig = {
      id: 'agent-1',
      name: 'Test Agent',
      systemPrompt: 'You are a helpful assistant.',
      model: 'claude-sonnet-4-5',
      temperature: 0.7,
      maxTokens: 4096,
      enabledTools: [],
    };
  });

  describe('createAgent', () => {
    it('should create agent with correct config', async () => {
      const agent = await service.createAgent(mockAgentConfig);

      expect(agent).toBeDefined();
      expect(agent.id).toBe(mockAgentConfig.id);
      expect(agent.name).toBe(mockAgentConfig.name);
      expect(agent.config).toMatchObject({
        model: mockAgentConfig.model,
        systemPrompt: mockAgentConfig.systemPrompt,
        temperature: mockAgentConfig.temperature,
        maxTokens: mockAgentConfig.maxTokens,
      });
    });

    it('should throw error if API key is missing', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      const newService = new ClaudeSDKService();

      await expect(newService.createAgent(mockAgentConfig)).rejects.toThrow(
        'ANTHROPIC_API_KEY environment variable is required',
      );
    });
  });

  describe('executeAgent', () => {
    it('should execute agent and return result with real API token counts', async () => {
      const agent = await service.createAgent(mockAgentConfig);
      const input = 'Hello, how are you?';

      // Mock Anthropic API response with specific token counts
      mockCreate.mockResolvedValueOnce({
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'Hello! I am doing well, thank you for asking.',
          },
        ],
        model: 'claude-sonnet-4-5',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 25,
          output_tokens: 12,
        },
      });

      const result = await service.executeAgent(agent, input);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.result).toBeDefined();
      expect(result.cost).toBeDefined();
      // Token counts should come from API response, not estimation
      expect(result.cost.promptTokens).toBe(25);
      expect(result.cost.completionTokens).toBe(12);
      expect(result.cost.totalCost).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle API errors gracefully', async () => {
      const agent = await service.createAgent(mockAgentConfig);

      // Mock SDK to throw error
      vi.spyOn(service as any, 'executeWithSDK').mockRejectedValueOnce(
        new Error('API rate limit exceeded'),
      );

      const result = await service.executeAgent(agent, 'test input');

      expect(result.status).toBe('failed');
      expect(result.error).toContain('API rate limit exceeded');
    });

    it('should timeout long executions', async () => {
      const agent = await service.createAgent(mockAgentConfig);

      // Mock SDK to delay
      vi.spyOn(service as any, 'executeWithSDK').mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 150000)),
      );

      const result = await service.executeAgent(agent, 'test input', {
        timeout: 1000, // 1 second timeout
      });

      expect(result.status).toBe('failed');
      expect(result.error).toContain('timeout');
    });
  });

  describe('streamExecution', () => {
    it('should stream execution with chunks', async () => {
      const agent = await service.createAgent(mockAgentConfig);
      const chunks: string[] = [];
      const onEvent = (event: any) => {
        if (event.type === 'execution:output') {
          chunks.push(event.data.chunk);
        }
      };

      const result = await service.streamExecution(
        agent,
        'Tell me a story',
        onEvent,
      );

      expect(result.status).toBe('completed');
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join('')).toBe(result.result);
    });

    it('should handle streaming errors', async () => {
      const agent = await service.createAgent(mockAgentConfig);
      const events: any[] = [];
      const onEvent = (event: any) => events.push(event);

      // Mock SDK to throw error during streaming
      vi.spyOn(service as any, 'streamWithSSE').mockRejectedValueOnce(
        new Error('Streaming failed'),
      );

      const result = await service.streamExecution(
        agent,
        'test input',
        onEvent,
      );

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Streaming failed');
    });
  });

  describe('trackTokenUsage', () => {
    it('should track token usage', async () => {
      const agent = await service.createAgent(mockAgentConfig);
      const result = await service.executeAgent(agent, 'Count to 5');

      expect(result.cost.promptTokens).toBeGreaterThan(0);
      expect(result.cost.completionTokens).toBeGreaterThan(0);
      expect(result.cost.totalCost).toBeGreaterThan(0);
    });

    it('should calculate cost correctly', async () => {
      const agent = await service.createAgent(mockAgentConfig);
      const result = await service.executeAgent(agent, 'Hi');

      // Claude Sonnet 4.5 pricing: $0.003/1K input, $0.015/1K output
      const expectedCost =
        (result.cost.promptTokens * 0.003) / 1000 +
        (result.cost.completionTokens * 0.015) / 1000;

      expect(result.cost.totalCost).toBeCloseTo(expectedCost, 6);
    });
  });

  describe('supportToolCalls', () => {
    it('should support tool calls', async () => {
      const agentWithTools: AgentConfig = {
        ...mockAgentConfig,
        enabledTools: ['web_search', 'calculator'],
      };

      const agent = await service.createAgent(agentWithTools);
      const result = await service.executeAgent(agent, 'What is 2 + 2?');

      expect(result.status).toBe('completed');
      expect(result.result).toBeDefined();
    });

    it('should handle tool execution errors', async () => {
      const agentWithTools: AgentConfig = {
        ...mockAgentConfig,
        enabledTools: ['invalid_tool'],
      };

      const agent = await service.createAgent(agentWithTools);

      // Mock SDK to throw tool error
      vi.spyOn(service as any, 'executeWithSDK').mockRejectedValueOnce(
        new Error('Tool not found: invalid_tool'),
      );

      const result = await service.executeAgent(agent, 'Use the invalid tool');

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Tool not found');
    });
  });

  describe('executionOptions', () => {
    it('should respect timeout option', async () => {
      const agent = await service.createAgent(mockAgentConfig);
      const startTime = Date.now();

      await service.executeAgent(
        agent,
        'test',
        { timeout: 120000 }, // 120 seconds
      );

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(120000);
    });

    it('should respect maxTokens option', async () => {
      const agent = await service.createAgent(mockAgentConfig);

      const result = await service.executeAgent(
        agent,
        'Write a very long essay',
        { maxTokens: 100 },
      );

      expect(result.cost.completionTokens).toBeLessThanOrEqual(100);
    });

    it('should use variables in execution', async () => {
      const agent = await service.createAgent({
        ...mockAgentConfig,
        systemPrompt: 'You are {{role}}. Your specialty is {{specialty}}.',
      });

      const result = await service.executeAgent(agent, 'Introduce yourself', {
        variables: {
          role: 'a helpful assistant',
          specialty: 'programming',
        },
      });

      expect(result.status).toBe('completed');
      expect(result.result).toBeDefined();
    });
  });
});
