import type {
  AgentConfig,
  Agent,
  ExecutionOptions,
  SDKExecutionResult,
  SSEEvent,
} from '@cloutagent/types';
import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Claude SDK Service
 *
 * Integrates with Anthropic SDK to execute AI agent workflows.
 * Provides agent creation, execution, streaming, and token tracking capabilities.
 */
export class ClaudeSDKService {
  private apiKey: string | null = null;
  private agents: Map<string, Agent> = new Map();
  private anthropic: Anthropic;

  // Claude Sonnet 4.5 pricing (per 1K tokens)
  private readonly PRICING = {
    'claude-sonnet-4-5': {
      promptTokens: 0.003 / 1000,
      completionTokens: 0.015 / 1000,
    },
    'claude-opus-4': {
      promptTokens: 0.015 / 1000,
      completionTokens: 0.075 / 1000,
    },
  };

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || null;

    // Initialize Anthropic client (will be used only if API key is set)
    if (this.apiKey) {
      this.anthropic = new Anthropic({
        apiKey: this.apiKey,
      });
    }
  }

  /**
   * Create an agent with the specified configuration
   *
   * @param config - Agent configuration including model, system prompt, tools, etc.
   * @returns Created agent instance
   * @throws Error if ANTHROPIC_API_KEY is not set
   */
  async createAgent(config: AgentConfig): Promise<Agent> {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    const agent: Agent = {
      id: config.id,
      name: config.name,
      config: {
        model: config.model,
        systemPrompt: config.systemPrompt,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        enabledTools: config.enabledTools,
      },
    };

    this.agents.set(agent.id, agent);
    return agent;
  }

  /**
   * Execute an agent with the given input
   *
   * @param agent - The agent to execute
   * @param input - The input prompt/message
   * @param options - Execution options (timeout, maxTokens, variables)
   * @returns Execution result with status, output, cost, and duration
   */
  async executeAgent(
    agent: Agent,
    input: string,
    options: ExecutionOptions = {},
  ): Promise<SDKExecutionResult> {
    const executionId = uuidv4();
    const startTime = Date.now();

    try {
      // Apply variable substitution if provided
      let processedSystemPrompt = agent.config.systemPrompt;
      if (options.variables) {
        processedSystemPrompt = this.applyVariables(
          agent.config.systemPrompt,
          options.variables,
        );
      }

      // Execute with timeout if specified
      const timeout = options.timeout || 120000; // Default 120 seconds
      const maxTokens = options.maxTokens || agent.config.maxTokens;

      const result = await this.executeWithTimeout(
        () =>
          this.executeWithSDK(agent, input, processedSystemPrompt, maxTokens),
        timeout,
      );

      const duration = Date.now() - startTime;

      return {
        id: executionId,
        status: 'completed',
        result: result.output,
        cost: {
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          totalCost: this.calculateCost(
            agent.config.model,
            result.promptTokens,
            result.completionTokens,
          ),
        },
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      return {
        id: executionId,
        status: 'failed',
        cost: {
          promptTokens: 0,
          completionTokens: 0,
          totalCost: 0,
        },
        duration,
        error: errorMessage,
      };
    }
  }

  /**
   * Stream execution with SSE event emission and real-time token tracking
   *
   * @param agent - The agent to execute
   * @param input - The input prompt/message
   * @param onEvent - Callback function called for each SSE event
   * @param options - Execution options
   * @returns Execution result after streaming completes
   */
  async streamExecution(
    agent: Agent,
    input: string,
    onEvent: (event: SSEEvent) => void,
    options: ExecutionOptions = {},
  ): Promise<SDKExecutionResult> {
    const executionId = uuidv4();
    const startTime = Date.now();

    try {
      // Emit execution:started event
      onEvent({
        type: 'execution:started',
        timestamp: new Date(),
        executionId,
        data: { agentId: agent.id },
      });

      // Apply variable substitution if provided
      let processedSystemPrompt = agent.config.systemPrompt;
      if (options.variables) {
        processedSystemPrompt = this.applyVariables(
          agent.config.systemPrompt,
          options.variables,
        );
      }

      const timeout = options.timeout || 120000;
      const maxTokens = options.maxTokens || agent.config.maxTokens;

      // Execute streaming with event emission
      const result = await this.executeWithTimeout(
        () =>
          this.streamWithSSE(
            agent,
            input,
            processedSystemPrompt,
            maxTokens,
            executionId,
            onEvent,
          ),
        timeout,
      );

      const duration = Date.now() - startTime;
      const totalCost = this.calculateCost(
        agent.config.model,
        result.promptTokens,
        result.completionTokens,
      );

      // Emit execution:completed event
      onEvent({
        type: 'execution:completed',
        timestamp: new Date(),
        executionId,
        data: {
          result: result.output,
          cost: {
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            totalCost,
          },
          duration,
        },
      });

      return {
        id: executionId,
        status: 'completed',
        result: result.output,
        cost: {
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          totalCost,
        },
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      return {
        id: executionId,
        status: 'failed',
        cost: {
          promptTokens: 0,
          completionTokens: 0,
          totalCost: 0,
        },
        duration,
        error: errorMessage,
      };
    }
  }

  /**
   * Execute with Anthropic SDK
   * Calls the real Anthropic API and returns response with token counts
   *
   * @private
   */
  private async executeWithSDK(
    agent: Agent,
    input: string,
    systemPrompt: string,
    maxTokens: number,
  ): Promise<{
    output: string;
    promptTokens: number;
    completionTokens: number;
  }> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized. Check ANTHROPIC_API_KEY.');
    }

    const response = await this.anthropic.messages.create({
      model: agent.config.model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: input,
        },
      ],
      temperature: agent.config.temperature,
    });

    return {
      output: this.extractTextContent(response.content),
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
    };
  }

  /**
   * Extract text content from Anthropic response content blocks
   *
   * @private
   */
  private extractTextContent(content: Anthropic.ContentBlock[]): string {
    return content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');
  }

  /**
   * Stream with Anthropic SDK and emit SSE events
   * Streams responses in real-time with token tracking and event emission
   *
   * @private
   */
  private async streamWithSSE(
    agent: Agent,
    input: string,
    systemPrompt: string,
    maxTokens: number,
    executionId: string,
    onEvent: (event: SSEEvent) => void,
  ): Promise<{
    output: string;
    promptTokens: number;
    completionTokens: number;
  }> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized. Check ANTHROPIC_API_KEY.');
    }

    let fullOutput = '';
    let inputTokens = 0;
    let outputTokens = 0;

    const stream = await this.anthropic.messages.stream({
      model: agent.config.model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: input,
        },
      ],
      temperature: agent.config.temperature,
    });

    // Listen for text chunks and emit execution:output events
    stream.on('text', (text) => {
      fullOutput += text;

      // Emit execution:output event for each chunk
      onEvent({
        type: 'execution:output',
        timestamp: new Date(),
        executionId,
        data: { chunk: text },
      });
    });

    // Listen for message completion to get usage stats
    stream.on('message', (message) => {
      inputTokens = message.usage.input_tokens;
      outputTokens = message.usage.output_tokens;

      // Emit execution:token-usage event with real-time token tracking
      onEvent({
        type: 'execution:token-usage',
        timestamp: new Date(),
        executionId,
        data: {
          promptTokens: inputTokens,
          completionTokens: outputTokens,
          estimatedCost: this.calculateCost(
            agent.config.model,
            inputTokens,
            outputTokens,
          ),
        },
      });
    });

    // Wait for stream to complete
    await stream.finalMessage();

    return {
      output: fullOutput,
      promptTokens: inputTokens,
      completionTokens: outputTokens,
    };
  }

  /**
   * Execute with timeout wrapper
   *
   * @private
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Execution timeout after ${timeoutMs}ms`)),
          timeoutMs,
        ),
      ),
    ]);
  }

  /**
   * Apply variable substitution to text
   * Replaces {{variableName}} with actual values
   *
   * @private
   */
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

  /**
   * Calculate cost based on token usage and model pricing
   *
   * @private
   */
  private calculateCost(
    model: string,
    promptTokens: number,
    completionTokens: number,
  ): number {
    const pricing =
      this.PRICING[model as keyof typeof this.PRICING] ||
      this.PRICING['claude-sonnet-4-5'];

    const promptCost = promptTokens * pricing.promptTokens;
    const completionCost = completionTokens * pricing.completionTokens;

    return promptCost + completionCost;
  }
}
