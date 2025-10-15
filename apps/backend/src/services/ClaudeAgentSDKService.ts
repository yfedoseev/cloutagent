import { query, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import type {
  CloutAgentConfig,
  AgentSDKExecutionOptions,
  SDKExecutionResult,
  SSEEvent,
  SessionInfo,
} from '@cloutagent/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Claude Agent SDK Service
 *
 * Wraps the Anthropic Agent SDK with comprehensive streaming support.
 * Emits SSE events for ALL agent actions:
 * - Tool calls and results
 * - Thinking blocks
 * - Text output chunks
 * - Token usage with cache details
 * - Cost tracking
 * - Session management
 */
export class ClaudeAgentSDKService {
  private apiKey: string;
  private activeSessions: Map<string, SessionInfo> = new Map();

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
  }

  /**
   * Execute agent with streaming SSE events for ALL actions
   */
  async streamExecution(
    config: CloutAgentConfig,
    input: string,
    onEvent: (event: SSEEvent) => void,
    options: AgentSDKExecutionOptions = {},
  ): Promise<SDKExecutionResult> {
    const executionId = uuidv4();
    const startTime = Date.now();

    try {
      // Apply variable substitution
      const processedInput = this.applyVariables(
        input,
        options.variables || {},
      );

      // Build query options
      const queryOptions = {
        model: config.model,
        customSystemPrompt: config.systemPrompt,
        maxTurns: config.maxTurns || 10,
        maxThinkingTokens: config.maxTokens,
        mcpServers: config.mcpServers || {},
        allowedTools: config.allowedTools,
        disallowedTools: config.disallowedTools,
        permissionMode: 'bypassPermissions' as const,
        includePartialMessages: true, // CRITICAL for real-time streaming
        resume: options.sessionId,
        forkSession: options.forkFrom,
        apiKey: this.apiKey,
      };

      // Emit started event
      onEvent({
        type: 'execution:started',
        timestamp: new Date(),
        executionId,
        data: { agentId: config.id, model: config.model },
      });

      // Create query
      const q = query({ prompt: processedInput, options: queryOptions });

      // Track session
      const sessionId = options.sessionId || uuidv4();
      this.activeSessions.set(sessionId, {
        sessionId,
        query: q,
        createdAt: new Date(),
        lastActivity: new Date(),
        config,
      });

      // Emit session created
      onEvent({
        type: 'execution:session-created',
        timestamp: new Date(),
        executionId,
        data: { sessionId },
      });

      let fullOutput = '';
      let promptTokens = 0;
      let completionTokens = 0;
      let totalCostUSD = 0;

      // Stream messages and map to SSE events
      for await (const message of q) {
        this.updateSessionActivity(sessionId);

        // Map each SDKMessage type to appropriate SSE events
        await this.mapSDKMessageToSSE(message, executionId, onEvent, {
          fullOutput: text => {
            fullOutput += text;
          },
          updateTokens: (input, output) => {
            promptTokens = input;
            completionTokens = output;
          },
          updateCost: cost => {
            totalCostUSD = cost;
          },
        });
      }

      const duration = Date.now() - startTime;

      // Emit completed event
      onEvent({
        type: 'execution:completed',
        timestamp: new Date(),
        executionId,
        data: {
          result: fullOutput,
          cost: {
            promptTokens,
            completionTokens,
            totalCost: totalCostUSD,
          },
          duration,
          sessionId,
        },
      });

      return {
        id: executionId,
        status: 'completed',
        result: fullOutput,
        cost: {
          promptTokens,
          completionTokens,
          totalCost: totalCostUSD,
        },
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      onEvent({
        type: 'execution:failed',
        timestamp: new Date(),
        executionId,
        data: { error: errorMessage },
      });

      return {
        id: executionId,
        status: 'failed',
        cost: { promptTokens: 0, completionTokens: 0, totalCost: 0 },
        duration,
        error: errorMessage,
      };
    }
  }

  /**
   * Map SDKMessage to SSE events
   * This is where we emit events for EVERY action
   */
  private async mapSDKMessageToSSE(
    message: SDKMessage,
    executionId: string,
    onEvent: (event: SSEEvent) => void,
    accumulators: {
      fullOutput: (text: string) => void;
      updateTokens: (
        input: number,
        output: number,
        cacheRead?: number,
        cacheCreation?: number
      ) => void;
      updateCost: (cost: number) => void;
    },
  ): Promise<void> {
    const timestamp = new Date();

    switch (message.type) {
      case 'system':
        if (message.subtype === 'init') {
          // System initialized - emit progress
          onEvent({
            type: 'execution:progress',
            timestamp,
            executionId,
            data: {
              status: 'initialized',
              model: message.model,
              tools: message.tools,
              mcpServers: message.mcp_servers,
            },
          });
        }
        break;

      case 'stream_event': {
        // Real-time streaming chunks from Anthropic SDK
        const event = message.event;

        if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            // Text output chunk
            const text = event.delta.text;
            accumulators.fullOutput(text);

            onEvent({
              type: 'execution:output',
              timestamp,
              executionId,
              data: { chunk: text },
            });
          }
        } else if (event.type === 'content_block_start') {
          const block = event.content_block;

          if (block.type === 'tool_use') {
            // Tool call started
            onEvent({
              type: 'execution:tool-call',
              timestamp,
              executionId,
              data: {
                toolName: block.name,
                toolId: block.id,
                // Args will come in subsequent deltas or assistant message
              },
            });
          } else if (block.type === 'thinking') {
            // Claude is thinking/reasoning (extended thinking mode)
            onEvent({
              type: 'execution:thinking',
              timestamp,
              executionId,
              data: { status: 'started' },
            });
          }
        }
        break;
      }

      case 'assistant': {
        // Full assistant message
        const content = message.message.content;

        for (const block of content) {
          if (block.type === 'tool_use') {
            // Complete tool call with arguments
            onEvent({
              type: 'execution:tool-call',
              timestamp,
              executionId,
              data: {
                toolName: block.name,
                toolId: block.id,
                toolArgs: block.input,
              },
            });
          } else if (block.type === 'text') {
            // Text output (if not already emitted via stream_event)
            const text = block.text;
            if (text) {
              accumulators.fullOutput(text);

              onEvent({
                type: 'execution:output',
                timestamp,
                executionId,
                data: { chunk: text },
              });
            }
          }
        }
        break;
      }

      case 'user': {
        // User message (tool results from SDK)
        const userContent = message.message.content;

        // Content can be string or array - only process if array
        if (Array.isArray(userContent)) {
          for (const block of userContent) {
            if (typeof block !== 'string' && block.type === 'tool_result') {
              // Tool execution result
              onEvent({
                type: 'execution:tool-result',
                timestamp,
                executionId,
                data: {
                  toolId: block.tool_use_id,
                  result: block.content,
                  isError: block.is_error || false,
                },
              });
            }
          }
        }
        break;
      }

      case 'result':
        // Final result with complete token usage and cost
        if (message.subtype === 'success') {
          const usage = message.usage;
          const cost = message.total_cost_usd;

          accumulators.updateTokens(
            usage.input_tokens,
            usage.output_tokens,
            usage.cache_read_input_tokens,
            usage.cache_creation_input_tokens,
          );
          accumulators.updateCost(cost);

          // Emit final token usage with cache details
          onEvent({
            type: 'execution:token-usage',
            timestamp,
            executionId,
            data: {
              promptTokens: usage.input_tokens,
              completionTokens: usage.output_tokens,
              cacheReadTokens: usage.cache_read_input_tokens || 0,
              cacheCreationTokens: usage.cache_creation_input_tokens || 0,
              totalCost: cost,
            },
          });

          // Emit cost update with model usage breakdown
          onEvent({
            type: 'execution:cost-update',
            timestamp,
            executionId,
            data: {
              totalCostUSD: cost,
              modelUsage: message.modelUsage,
              duration: message.duration_ms,
            },
          });
        } else {
          // Error result
          onEvent({
            type: 'execution:failed',
            timestamp,
            executionId,
            data: {
              error: message.subtype,
              isError: message.is_error,
            },
          });
        }
        break;
    }
  }

  /**
   * Non-streaming execution (simpler, but less real-time feedback)
   */
  async executeAgent(
    config: CloutAgentConfig,
    input: string,
    options: AgentSDKExecutionOptions = {},
  ): Promise<SDKExecutionResult> {
    // Use streamExecution with no-op event handler
    return this.streamExecution(config, input, () => {}, options);
  }

  /**
   * Session management methods
   */
  async createSession(): Promise<string> {
    const sessionId = uuidv4();
    // Sessions are created lazily on first query
    return sessionId;
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      await session.query.interrupt();
      this.activeSessions.delete(sessionId);
    }
  }

  getActiveSessionIds(): string[] {
    return Array.from(this.activeSessions.keys());
  }

  private updateSessionActivity(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  private applyVariables(
    text: string,
    variables: Record<string, string>,
  ): string {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }
}
