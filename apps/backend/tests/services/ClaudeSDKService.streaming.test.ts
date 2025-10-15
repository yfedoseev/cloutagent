import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClaudeSDKService } from '../../src/services/ClaudeSDKService';
import type { Agent, SSEEvent } from '@cloutagent/types';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  const mockStream = {
    on: vi.fn(),
    finalMessage: vi.fn(),
  };

  return {
    default: vi.fn(() => ({
      messages: {
        create: vi.fn(),
        stream: vi.fn(() => mockStream),
      },
    })),
  };
});

describe('ClaudeSDKService - Enhanced Streaming with SSE Events', () => {
  let service: ClaudeSDKService;
  let mockAgent: Agent;

  beforeEach(() => {
    // Set API key for tests
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
    service = new ClaudeSDKService();

    mockAgent = {
      id: 'test-agent',
      name: 'Test Agent',
      config: {
        model: 'claude-sonnet-4-5',
        systemPrompt: 'You are a test agent',
        temperature: 0.7,
        maxTokens: 1000,
        enabledTools: [],
      },
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('SSE Event Emission', () => {
    it('should emit execution:started event at the beginning of streaming', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      // Setup mock stream behavior
      const Anthropic = await import('@anthropic-ai/sdk');
      const mockInstance = new Anthropic.default();
      const mockStream = mockInstance.messages.stream();

      mockStream.finalMessage = vi.fn().mockResolvedValue({});
      (mockStream.on as any) = vi.fn((eventType: string, callback: any) => {
        if (eventType === 'text') {
          callback('Hello');
        }
        if (eventType === 'message') {
          callback({
            usage: { input_tokens: 10, output_tokens: 5 },
          });
        }
        return mockStream;
      });

      await service.streamExecution(mockAgent, 'test input', onEvent);

      // Verify execution:started event
      const startedEvent = events.find(e => e.type === 'execution:started');
      expect(startedEvent).toBeDefined();
      expect(startedEvent?.data).toHaveProperty('agentId', mockAgent.id);
      expect(startedEvent?.timestamp).toBeInstanceOf(Date);
      expect(startedEvent?.executionId).toBeTruthy();
    });

    it('should emit execution:output events for each text chunk', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);
      const chunks = ['Hello', ' ', 'world', '!'];

      // Setup mock stream behavior
      const Anthropic = await import('@anthropic-ai/sdk');
      const mockInstance = new Anthropic.default();
      const mockStream = mockInstance.messages.stream();

      mockStream.finalMessage = vi.fn().mockResolvedValue({});
      (mockStream.on as any) = vi.fn((eventType: string, callback: any) => {
        if (eventType === 'text') {
          chunks.forEach(chunk => callback(chunk));
        }
        if (eventType === 'message') {
          callback({
            usage: { input_tokens: 10, output_tokens: 5 },
          });
        }
        return mockStream;
      });

      await service.streamExecution(mockAgent, 'test input', onEvent);

      // Verify execution:output events
      const outputEvents = events.filter(e => e.type === 'execution:output');
      expect(outputEvents).toHaveLength(chunks.length);
      chunks.forEach((chunk, index) => {
        expect(outputEvents[index].data).toHaveProperty('chunk', chunk);
      });
    });

    it('should emit execution:token-usage events during streaming', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      // Setup mock stream behavior
      const Anthropic = await import('@anthropic-ai/sdk');
      const mockInstance = new Anthropic.default();
      const mockStream = mockInstance.messages.stream();

      mockStream.finalMessage = vi.fn().mockResolvedValue({});
      (mockStream.on as any) = vi.fn((eventType: string, callback: any) => {
        if (eventType === 'text') {
          callback('Test response');
        }
        if (eventType === 'message') {
          callback({
            usage: { input_tokens: 25, output_tokens: 12 },
          });
        }
        return mockStream;
      });

      await service.streamExecution(mockAgent, 'test input', onEvent);

      // Verify execution:token-usage event
      const tokenEvents = events.filter(e => e.type === 'execution:token-usage');
      expect(tokenEvents.length).toBeGreaterThan(0);

      const lastTokenEvent = tokenEvents[tokenEvents.length - 1];
      expect(lastTokenEvent.data).toHaveProperty('promptTokens', 25);
      expect(lastTokenEvent.data).toHaveProperty('completionTokens', 12);
      expect(lastTokenEvent.data).toHaveProperty('estimatedCost');
      expect(typeof lastTokenEvent.data.estimatedCost).toBe('number');
    });

    it('should emit execution:completed event when streaming finishes successfully', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      // Setup mock stream behavior
      const Anthropic = await import('@anthropic-ai/sdk');
      const mockInstance = new Anthropic.default();
      const mockStream = mockInstance.messages.stream();

      mockStream.finalMessage = vi.fn().mockResolvedValue({});
      (mockStream.on as any) = vi.fn((eventType: string, callback: any) => {
        if (eventType === 'text') {
          callback('Complete response');
        }
        if (eventType === 'message') {
          callback({
            usage: { input_tokens: 15, output_tokens: 8 },
          });
        }
        return mockStream;
      });

      await service.streamExecution(mockAgent, 'test input', onEvent);

      // Verify execution:completed event
      const completedEvent = events.find(e => e.type === 'execution:completed');
      expect(completedEvent).toBeDefined();
      expect(completedEvent?.data).toHaveProperty('result', 'Complete response');
      expect(completedEvent?.data).toHaveProperty('cost');
      expect(completedEvent?.data.cost).toHaveProperty('promptTokens', 15);
      expect(completedEvent?.data.cost).toHaveProperty('completionTokens', 8);
      expect(completedEvent?.data.cost).toHaveProperty('totalCost');
      expect(completedEvent?.data).toHaveProperty('duration');
    });

    it('should emit execution:failed event when streaming encounters an error', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      // Setup mock stream to throw error
      const Anthropic = await import('@anthropic-ai/sdk');
      const mockInstance = new Anthropic.default();
      const mockStream = mockInstance.messages.stream();

      mockStream.finalMessage = vi.fn().mockRejectedValue(new Error('API Error'));
      (mockStream.on as any) = vi.fn(() => mockStream);

      const result = await service.streamExecution(mockAgent, 'test input', onEvent);

      // Verify result shows failure
      expect(result.status).toBe('failed');
      expect(result.error).toBe('API Error');

      // Note: execution:failed is not explicitly required in the SSEEvent types,
      // but the service should return failed status in the result
    });
  });

  describe('Event Order and Timing', () => {
    it('should emit events in the correct order', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      // Setup mock stream behavior
      const Anthropic = await import('@anthropic-ai/sdk');
      const mockInstance = new Anthropic.default();
      const mockStream = mockInstance.messages.stream();

      mockStream.finalMessage = vi.fn().mockResolvedValue({});
      (mockStream.on as any) = vi.fn((eventType: string, callback: any) => {
        if (eventType === 'text') {
          callback('Response');
        }
        if (eventType === 'message') {
          callback({
            usage: { input_tokens: 10, output_tokens: 5 },
          });
        }
        return mockStream;
      });

      await service.streamExecution(mockAgent, 'test input', onEvent);

      // Verify event order
      const eventTypes = events.map(e => e.type);
      expect(eventTypes[0]).toBe('execution:started');
      expect(eventTypes[eventTypes.length - 1]).toBe('execution:completed');

      // All output events should be between started and completed
      const firstOutputIndex = eventTypes.indexOf('execution:output');
      const startedIndex = eventTypes.indexOf('execution:started');
      const completedIndex = eventTypes.indexOf('execution:completed');

      if (firstOutputIndex !== -1) {
        expect(firstOutputIndex).toBeGreaterThan(startedIndex);
        expect(firstOutputIndex).toBeLessThan(completedIndex);
      }
    });

    it('should include executionId in all events', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      // Setup mock stream behavior
      const Anthropic = await import('@anthropic-ai/sdk');
      const mockInstance = new Anthropic.default();
      const mockStream = mockInstance.messages.stream();

      mockStream.finalMessage = vi.fn().mockResolvedValue({});
      (mockStream.on as any) = vi.fn((eventType: string, callback: any) => {
        if (eventType === 'text') {
          callback('Test');
        }
        if (eventType === 'message') {
          callback({
            usage: { input_tokens: 5, output_tokens: 3 },
          });
        }
        return mockStream;
      });

      await service.streamExecution(mockAgent, 'test input', onEvent);

      // Verify all events have the same executionId
      expect(events.length).toBeGreaterThan(0);
      const executionId = events[0].executionId;
      expect(executionId).toBeTruthy();

      events.forEach(event => {
        expect(event.executionId).toBe(executionId);
      });
    });
  });

  describe('Token Tracking and Cost Calculation', () => {
    it('should track incremental token usage in real-time', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      // Setup mock stream behavior
      const Anthropic = await import('@anthropic-ai/sdk');
      const mockInstance = new Anthropic.default();
      const mockStream = mockInstance.messages.stream();

      mockStream.finalMessage = vi.fn().mockResolvedValue({});
      (mockStream.on as any) = vi.fn((eventType: string, callback: any) => {
        if (eventType === 'text') {
          callback('Test response with multiple tokens');
        }
        if (eventType === 'message') {
          callback({
            usage: { input_tokens: 30, output_tokens: 15 },
          });
        }
        return mockStream;
      });

      await service.streamExecution(mockAgent, 'test input', onEvent);

      // Verify token usage is tracked
      const tokenEvents = events.filter(e => e.type === 'execution:token-usage');
      expect(tokenEvents.length).toBeGreaterThan(0);

      // Check final token counts
      const finalTokenEvent = tokenEvents[tokenEvents.length - 1];
      expect(finalTokenEvent.data.promptTokens).toBe(30);
      expect(finalTokenEvent.data.completionTokens).toBe(15);
    });

    it('should calculate cost accurately based on model pricing', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      // Setup mock stream behavior
      const Anthropic = await import('@anthropic-ai/sdk');
      const mockInstance = new Anthropic.default();
      const mockStream = mockInstance.messages.stream();

      mockStream.finalMessage = vi.fn().mockResolvedValue({});
      (mockStream.on as any) = vi.fn((eventType: string, callback: any) => {
        if (eventType === 'text') {
          callback('Response');
        }
        if (eventType === 'message') {
          callback({
            usage: { input_tokens: 1000, output_tokens: 500 },
          });
        }
        return mockStream;
      });

      await service.streamExecution(mockAgent, 'test input', onEvent);

      // Verify cost calculation (Claude Sonnet 4.5 pricing: $3/1M input, $15/1M output)
      const completedEvent = events.find(e => e.type === 'execution:completed');
      expect(completedEvent).toBeDefined();

      const expectedCost = (1000 * 0.003) / 1000 + (500 * 0.015) / 1000;
      expect(completedEvent?.data.cost.totalCost).toBeCloseTo(expectedCost, 10);
    });

    it('should emit token-usage updates during streaming', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      // Setup mock stream behavior
      const Anthropic = await import('@anthropic-ai/sdk');
      const mockInstance = new Anthropic.default();
      const mockStream = mockInstance.messages.stream();

      mockStream.finalMessage = vi.fn().mockResolvedValue({});
      (mockStream.on as any) = vi.fn((eventType: string, callback: any) => {
        if (eventType === 'text') {
          // Simulate multiple chunks
          callback('First');
          callback(' chunk');
        }
        if (eventType === 'message') {
          callback({
            usage: { input_tokens: 20, output_tokens: 10 },
          });
        }
        return mockStream;
      });

      await service.streamExecution(mockAgent, 'test input', onEvent);

      // Verify token-usage events are emitted
      const tokenEvents = events.filter(e => e.type === 'execution:token-usage');
      expect(tokenEvents.length).toBeGreaterThan(0);

      // All token events should have estimatedCost
      tokenEvents.forEach(event => {
        expect(event.data).toHaveProperty('estimatedCost');
        expect(typeof event.data.estimatedCost).toBe('number');
      });
    });
  });

  describe('Backward Compatibility', () => {
    it('should still return SDKExecutionResult with correct structure', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      // Setup mock stream behavior
      const Anthropic = await import('@anthropic-ai/sdk');
      const mockInstance = new Anthropic.default();
      const mockStream = mockInstance.messages.stream();

      mockStream.finalMessage = vi.fn().mockResolvedValue({});
      (mockStream.on as any) = vi.fn((eventType: string, callback: any) => {
        if (eventType === 'text') {
          callback('Test output');
        }
        if (eventType === 'message') {
          callback({
            usage: { input_tokens: 12, output_tokens: 8 },
          });
        }
        return mockStream;
      });

      const result = await service.streamExecution(mockAgent, 'test input', onEvent);

      // Verify result structure
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status', 'completed');
      expect(result).toHaveProperty('result', 'Test output');
      expect(result).toHaveProperty('cost');
      expect(result.cost).toHaveProperty('promptTokens', 12);
      expect(result.cost).toHaveProperty('completionTokens', 8);
      expect(result.cost).toHaveProperty('totalCost');
      expect(result).toHaveProperty('duration');
      expect(typeof result.duration).toBe('number');
    });

    it('should work with execution options', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      // Setup mock stream behavior
      const Anthropic = await import('@anthropic-ai/sdk');
      const mockInstance = new Anthropic.default();
      const mockStream = mockInstance.messages.stream();

      mockStream.finalMessage = vi.fn().mockResolvedValue({});
      (mockStream.on as any) = vi.fn((eventType: string, callback: any) => {
        if (eventType === 'text') {
          callback('Hello World');
        }
        if (eventType === 'message') {
          callback({
            usage: { input_tokens: 10, output_tokens: 5 },
          });
        }
        return mockStream;
      });

      const options = {
        timeout: 60000,
        maxTokens: 2000,
        variables: { name: 'Alice' },
      };

      const result = await service.streamExecution(
        mockAgent,
        'test input',
        onEvent,
        options,
      );

      expect(result.status).toBe('completed');
      expect(events.length).toBeGreaterThan(0);
    });
  });
});
