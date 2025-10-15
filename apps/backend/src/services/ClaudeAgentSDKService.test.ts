import type { CloutAgentConfig, SSEEvent } from '@cloutagent/types';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ClaudeAgentSDKService } from './ClaudeAgentSDKService';

// Mock the Agent SDK
const mockQueryIterator = vi.fn();
const mockQueryInterrupt = vi.fn();

vi.mock('@anthropic-ai/claude-agent-sdk', () => {
  return {
    query: vi.fn((_prompt: unknown, _options: unknown) => {
      const iterator = mockQueryIterator();
      return {
        [Symbol.asyncIterator]: () => iterator,
        interrupt: mockQueryInterrupt,
      };
    }),
  };
});

describe('ClaudeAgentSDKService', () => {
  let service: ClaudeAgentSDKService;
  let mockConfig: CloutAgentConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-123';

    service = new ClaudeAgentSDKService();

    mockConfig = {
      id: 'agent-1',
      name: 'Test Agent',
      model: 'sonnet',
      systemPrompt: 'You are a helpful assistant.',
      temperature: 0.7,
      maxTokens: 4096,
      maxTurns: 10,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with API key from environment', () => {
      expect(service).toBeDefined();
      expect(service.getActiveSessionIds()).toEqual([]);
    });

    it('should throw error if API key is missing', () => {
      delete process.env.ANTHROPIC_API_KEY;
      expect(() => new ClaudeAgentSDKService()).toThrow(
        'ANTHROPIC_API_KEY environment variable is required',
      );
    });
  });

  describe('streamExecution - Event Emission', () => {
    it('should emit execution:started event', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      // Mock minimal successful response
      mockQueryIterator.mockReturnValue({
        async next() {
          return {
            done: false,
            value: {
              type: 'result',
              subtype: 'success',
              usage: {
                input_tokens: 10,
                output_tokens: 5,
                cache_read_input_tokens: 0,
                cache_creation_input_tokens: 0,
              },
              total_cost_usd: 0.0001,
              duration_ms: 100,
              modelUsage: {},
              is_error: false,
            },
          };
        },
        async return() {
          return { done: true, value: undefined };
        },
        async throw() {
          return { done: true, value: undefined };
        },
      });

      await service.streamExecution(mockConfig, 'Hello', onEvent);

      const startedEvent = events.find(e => e.type === 'execution:started');
      expect(startedEvent).toBeDefined();
      expect(startedEvent?.data).toMatchObject({
        agentId: mockConfig.id,
        model: mockConfig.model,
      });
    });

    it('should emit execution:session-created event', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      mockQueryIterator.mockReturnValue({
        async next() {
          return {
            done: false,
            value: {
              type: 'result',
              subtype: 'success',
              usage: {
                input_tokens: 10,
                output_tokens: 5,
                cache_read_input_tokens: 0,
                cache_creation_input_tokens: 0,
              },
              total_cost_usd: 0.0001,
              duration_ms: 100,
              modelUsage: {},
              is_error: false,
            },
          };
        },
        async return() {
          return { done: true, value: undefined };
        },
        async throw() {
          return { done: true, value: undefined };
        },
      });

      await service.streamExecution(mockConfig, 'Hello', onEvent);

      const sessionEvent = events.find(
        e => e.type === 'execution:session-created',
      );
      expect(sessionEvent).toBeDefined();
      expect(sessionEvent?.data.sessionId).toBeDefined();
    });

    it('should emit execution:progress event for system init', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      let callCount = 0;
      mockQueryIterator.mockReturnValue({
        async next() {
          if (callCount === 0) {
            callCount++;
            return {
              done: false,
              value: {
                type: 'system',
                subtype: 'init',
                model: 'claude-sonnet-4',
                tools: ['tool1'],
                mcp_servers: {},
              },
            };
          } else {
            return {
              done: false,
              value: {
                type: 'result',
                subtype: 'success',
                usage: {
                  input_tokens: 10,
                  output_tokens: 5,
                  cache_read_input_tokens: 0,
                  cache_creation_input_tokens: 0,
                },
                total_cost_usd: 0.0001,
                duration_ms: 100,
                modelUsage: {},
                is_error: false,
              },
            };
          }
        },
        async return() {
          return { done: true, value: undefined };
        },
        async throw() {
          return { done: true, value: undefined };
        },
      });

      await service.streamExecution(mockConfig, 'Hello', onEvent);

      const progressEvent = events.find(e => e.type === 'execution:progress');
      expect(progressEvent).toBeDefined();
      expect(progressEvent?.data.status).toBe('initialized');
    });

    it('should emit execution:output events for text chunks', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      let callCount = 0;
      mockQueryIterator.mockReturnValue({
        async next() {
          if (callCount === 0) {
            callCount++;
            return {
              done: false,
              value: {
                type: 'stream_event',
                event: {
                  type: 'content_block_delta',
                  delta: {
                    type: 'text_delta',
                    text: 'Hello ',
                  },
                },
              },
            };
          } else if (callCount === 1) {
            callCount++;
            return {
              done: false,
              value: {
                type: 'stream_event',
                event: {
                  type: 'content_block_delta',
                  delta: {
                    type: 'text_delta',
                    text: 'World!',
                  },
                },
              },
            };
          } else {
            return {
              done: false,
              value: {
                type: 'result',
                subtype: 'success',
                usage: {
                  input_tokens: 10,
                  output_tokens: 5,
                  cache_read_input_tokens: 0,
                  cache_creation_input_tokens: 0,
                },
                total_cost_usd: 0.0001,
                duration_ms: 100,
                modelUsage: {},
                is_error: false,
              },
            };
          }
        },
        async return() {
          return { done: true, value: undefined };
        },
        async throw() {
          return { done: true, value: undefined };
        },
      });

      const result = await service.streamExecution(
        mockConfig,
        'Hello',
        onEvent,
      );

      const outputEvents = events.filter(e => e.type === 'execution:output');
      expect(outputEvents.length).toBe(2);
      expect(outputEvents[0].data.chunk).toBe('Hello ');
      expect(outputEvents[1].data.chunk).toBe('World!');
      expect(result.result).toBe('Hello World!');
    });

    it('should emit execution:thinking event for thinking blocks', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      let callCount = 0;
      mockQueryIterator.mockReturnValue({
        async next() {
          if (callCount === 0) {
            callCount++;
            return {
              done: false,
              value: {
                type: 'stream_event',
                event: {
                  type: 'content_block_start',
                  content_block: {
                    type: 'thinking',
                  },
                },
              },
            };
          } else {
            return {
              done: false,
              value: {
                type: 'result',
                subtype: 'success',
                usage: {
                  input_tokens: 10,
                  output_tokens: 5,
                  cache_read_input_tokens: 0,
                  cache_creation_input_tokens: 0,
                },
                total_cost_usd: 0.0001,
                duration_ms: 100,
                modelUsage: {},
                is_error: false,
              },
            };
          }
        },
        async return() {
          return { done: true, value: undefined };
        },
        async throw() {
          return { done: true, value: undefined };
        },
      });

      await service.streamExecution(mockConfig, 'Hello', onEvent);

      const thinkingEvent = events.find(e => e.type === 'execution:thinking');
      expect(thinkingEvent).toBeDefined();
      expect(thinkingEvent?.data.status).toBe('started');
    });

    it('should emit execution:tool-call event for tool use', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      let callCount = 0;
      mockQueryIterator.mockReturnValue({
        async next() {
          if (callCount === 0) {
            callCount++;
            return {
              done: false,
              value: {
                type: 'assistant',
                message: {
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool_use',
                      id: 'tool_123',
                      name: 'web_search',
                      input: { query: 'test query' },
                    },
                  ],
                },
              },
            };
          } else {
            return {
              done: false,
              value: {
                type: 'result',
                subtype: 'success',
                usage: {
                  input_tokens: 10,
                  output_tokens: 5,
                  cache_read_input_tokens: 0,
                  cache_creation_input_tokens: 0,
                },
                total_cost_usd: 0.0001,
                duration_ms: 100,
                modelUsage: {},
                is_error: false,
              },
            };
          }
        },
        async return() {
          return { done: true, value: undefined };
        },
        async throw() {
          return { done: true, value: undefined };
        },
      });

      await service.streamExecution(mockConfig, 'Search for test', onEvent);

      const toolCallEvent = events.find(e => e.type === 'execution:tool-call');
      expect(toolCallEvent).toBeDefined();
      expect(toolCallEvent?.data.toolName).toBe('web_search');
      expect(toolCallEvent?.data.toolId).toBe('tool_123');
      expect(toolCallEvent?.data.toolArgs).toEqual({ query: 'test query' });
    });

    it('should emit execution:tool-result event for tool results', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      let callCount = 0;
      mockQueryIterator.mockReturnValue({
        async next() {
          if (callCount === 0) {
            callCount++;
            return {
              done: false,
              value: {
                type: 'user',
                message: {
                  role: 'user',
                  content: [
                    {
                      type: 'tool_result',
                      tool_use_id: 'tool_123',
                      content: 'Search result data',
                      is_error: false,
                    },
                  ],
                },
              },
            };
          } else {
            return {
              done: false,
              value: {
                type: 'result',
                subtype: 'success',
                usage: {
                  input_tokens: 10,
                  output_tokens: 5,
                  cache_read_input_tokens: 0,
                  cache_creation_input_tokens: 0,
                },
                total_cost_usd: 0.0001,
                duration_ms: 100,
                modelUsage: {},
                is_error: false,
              },
            };
          }
        },
        async return() {
          return { done: true, value: undefined };
        },
        async throw() {
          return { done: true, value: undefined };
        },
      });

      await service.streamExecution(mockConfig, 'Get tool result', onEvent);

      const toolResultEvent = events.find(
        e => e.type === 'execution:tool-result',
      );
      expect(toolResultEvent).toBeDefined();
      expect(toolResultEvent?.data.toolId).toBe('tool_123');
      expect(toolResultEvent?.data.result).toBe('Search result data');
      expect(toolResultEvent?.data.isError).toBe(false);
    });

    it('should emit execution:token-usage event with cache details', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      mockQueryIterator.mockReturnValue({
        async next() {
          return {
            done: false,
            value: {
              type: 'result',
              subtype: 'success',
              usage: {
                input_tokens: 100,
                output_tokens: 50,
                cache_read_input_tokens: 20,
                cache_creation_input_tokens: 10,
              },
              total_cost_usd: 0.0015,
              duration_ms: 500,
              modelUsage: {},
              is_error: false,
            },
          };
        },
        async return() {
          return { done: true, value: undefined };
        },
        async throw() {
          return { done: true, value: undefined };
        },
      });

      await service.streamExecution(mockConfig, 'Test tokens', onEvent);

      const tokenEvent = events.find(e => e.type === 'execution:token-usage');
      expect(tokenEvent).toBeDefined();
      expect(tokenEvent?.data.promptTokens).toBe(100);
      expect(tokenEvent?.data.completionTokens).toBe(50);
      expect(tokenEvent?.data.cacheReadTokens).toBe(20);
      expect(tokenEvent?.data.cacheCreationTokens).toBe(10);
      expect(tokenEvent?.data.totalCost).toBe(0.0015);
    });

    it('should emit execution:cost-update event', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      mockQueryIterator.mockReturnValue({
        async next() {
          return {
            done: false,
            value: {
              type: 'result',
              subtype: 'success',
              usage: {
                input_tokens: 100,
                output_tokens: 50,
                cache_read_input_tokens: 0,
                cache_creation_input_tokens: 0,
              },
              total_cost_usd: 0.0025,
              duration_ms: 750,
              modelUsage: { 'claude-sonnet-4': 1 },
              is_error: false,
            },
          };
        },
        async return() {
          return { done: true, value: undefined };
        },
        async throw() {
          return { done: true, value: undefined };
        },
      });

      await service.streamExecution(mockConfig, 'Test cost', onEvent);

      const costEvent = events.find(e => e.type === 'execution:cost-update');
      expect(costEvent).toBeDefined();
      expect(costEvent?.data.totalCostUSD).toBe(0.0025);
      expect(costEvent?.data.duration).toBe(750);
    });

    it('should emit execution:completed event', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      mockQueryIterator.mockReturnValue({
        async next() {
          return {
            done: false,
            value: {
              type: 'result',
              subtype: 'success',
              usage: {
                input_tokens: 10,
                output_tokens: 5,
                cache_read_input_tokens: 0,
                cache_creation_input_tokens: 0,
              },
              total_cost_usd: 0.0001,
              duration_ms: 100,
              modelUsage: {},
              is_error: false,
            },
          };
        },
        async return() {
          return { done: true, value: undefined };
        },
        async throw() {
          return { done: true, value: undefined };
        },
      });

      await service.streamExecution(mockConfig, 'Complete', onEvent);

      const completedEvent = events.find(e => e.type === 'execution:completed');
      expect(completedEvent).toBeDefined();
      expect(completedEvent?.data.cost).toBeDefined();
      expect(completedEvent?.data.duration).toBeGreaterThanOrEqual(0);
    });

    it('should emit execution:failed event on error', async () => {
      const events: SSEEvent[] = [];
      const onEvent = (event: SSEEvent) => events.push(event);

      mockQueryIterator.mockReturnValue({
        async next() {
          throw new Error('API error occurred');
        },
        async return() {
          return { done: true, value: undefined };
        },
        async throw() {
          return { done: true, value: undefined };
        },
      });

      const result = await service.streamExecution(mockConfig, 'Fail', onEvent);

      expect(result.status).toBe('failed');
      const failedEvent = events.find(e => e.type === 'execution:failed');
      expect(failedEvent).toBeDefined();
      expect(failedEvent?.data.error).toContain('API error occurred');
    });
  });

  describe('executeAgent', () => {
    it('should execute agent without event emission', async () => {
      mockQueryIterator.mockReturnValue({
        async next() {
          return {
            done: false,
            value: {
              type: 'result',
              subtype: 'success',
              usage: {
                input_tokens: 10,
                output_tokens: 5,
                cache_read_input_tokens: 0,
                cache_creation_input_tokens: 0,
              },
              total_cost_usd: 0.0001,
              duration_ms: 100,
              modelUsage: {},
              is_error: false,
            },
          };
        },
        async return() {
          return { done: true, value: undefined };
        },
        async throw() {
          return { done: true, value: undefined };
        },
      });

      const result = await service.executeAgent(mockConfig, 'Hello');

      expect(result.status).toBe('completed');
      expect(result.cost).toBeDefined();
    });
  });

  describe('session management', () => {
    it('should create session', async () => {
      const sessionId = await service.createSession();
      expect(sessionId).toBeDefined();
    });

    it('should track active sessions during execution', async () => {
      mockQueryIterator.mockReturnValue({
        async next() {
          return {
            done: false,
            value: {
              type: 'result',
              subtype: 'success',
              usage: {
                input_tokens: 10,
                output_tokens: 5,
                cache_read_input_tokens: 0,
                cache_creation_input_tokens: 0,
              },
              total_cost_usd: 0.0001,
              duration_ms: 100,
              modelUsage: {},
              is_error: false,
            },
          };
        },
        async return() {
          return { done: true, value: undefined };
        },
        async throw() {
          return { done: true, value: undefined };
        },
      });

      await service.streamExecution(mockConfig, 'Hello', () => {});

      const sessions = service.getActiveSessionIds();
      expect(sessions.length).toBeGreaterThan(0);
    });

    it('should close session', async () => {
      const sessionId = await service.createSession();

      mockQueryIterator.mockReturnValue({
        async next() {
          return {
            done: false,
            value: {
              type: 'result',
              subtype: 'success',
              usage: {
                input_tokens: 10,
                output_tokens: 5,
                cache_read_input_tokens: 0,
                cache_creation_input_tokens: 0,
              },
              total_cost_usd: 0.0001,
              duration_ms: 100,
              modelUsage: {},
              is_error: false,
            },
          };
        },
        async return() {
          return { done: true, value: undefined };
        },
        async throw() {
          return { done: true, value: undefined };
        },
      });

      await service.streamExecution(mockConfig, 'Hello', () => {}, {
        sessionId,
      });

      await service.closeSession(sessionId);
      expect(mockQueryInterrupt).toHaveBeenCalled();
    });
  });

  describe('variable substitution', () => {
    it('should apply variables to input', async () => {
      mockQueryIterator.mockReturnValue({
        async next() {
          return {
            done: false,
            value: {
              type: 'result',
              subtype: 'success',
              usage: {
                input_tokens: 10,
                output_tokens: 5,
                cache_read_input_tokens: 0,
                cache_creation_input_tokens: 0,
              },
              total_cost_usd: 0.0001,
              duration_ms: 100,
              modelUsage: {},
              is_error: false,
            },
          };
        },
        async return() {
          return { done: true, value: undefined };
        },
        async throw() {
          return { done: true, value: undefined };
        },
      });

      const result = await service.executeAgent(
        mockConfig,
        'Hello {{name}}, you are {{role}}',
        {
          variables: {
            name: 'Claude',
            role: 'an AI assistant',
          },
        },
      );

      expect(result.status).toBe('completed');
    });
  });
});
