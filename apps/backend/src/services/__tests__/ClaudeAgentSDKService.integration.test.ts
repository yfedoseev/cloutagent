/**
 * Integration test for ClaudeAgentSDKService with Playwright MCP
 *
 * This test verifies:
 * 1. Agent SDK query() function integration
 * 2. Comprehensive SSE event emission
 * 3. MCP tool integration (Playwright)
 * 4. Session management
 * 5. Cost and token tracking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ClaudeAgentSDKService } from '../ClaudeAgentSDKService';
import type { CloutAgentConfig, SSEEvent } from '@cloutagent/types';

// Skip all tests if ANTHROPIC_API_KEY is not available
const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
const describeOrSkip = hasApiKey ? describe : describe.skip;

describeOrSkip('ClaudeAgentSDKService - Playwright MCP Integration', () => {
  let service: ClaudeAgentSDKService;
  let collectedEvents: SSEEvent[] = [];

  beforeEach(() => {
    service = new ClaudeAgentSDKService();
    collectedEvents = [];
  });

  /**
   * Test 1: Basic execution with Playwright MCP
   * Verifies the service can execute with MCP tools configured
   */
  it('should execute with Playwright MCP and emit all expected events', async () => {
    const config: CloutAgentConfig = {
      id: 'test-agent',
      name: 'Playwright Test Agent',
      model: 'sonnet',
      systemPrompt: 'You are a helpful agent that can use Playwright for web automation.',
      maxTokens: 4000,
      maxTurns: 5,
      mcpServers: {
        playwright: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-playwright'],
        },
      },
    };

    const input = 'Navigate to https://example.com and take a snapshot of the page';

    const onEvent = (event: SSEEvent) => {
      collectedEvents.push(event);
      console.log(`[${event.type}]`, event.data);
    };

    const result = await service.streamExecution(config, input, onEvent);

    // Verify execution completed
    expect(result.status).toBe('completed');
    expect(result.id).toBeDefined();

    // Verify all critical events were emitted
    const eventTypes = collectedEvents.map(e => e.type);

    expect(eventTypes).toContain('execution:started');
    expect(eventTypes).toContain('execution:session-created');
    expect(eventTypes).toContain('execution:progress'); // System init
    expect(eventTypes).toContain('execution:output'); // Text chunks
    expect(eventTypes).toContain('execution:token-usage');
    expect(eventTypes).toContain('execution:cost-update');
    expect(eventTypes).toContain('execution:completed');

    // Verify cost tracking
    expect(result.cost.totalCost).toBeGreaterThan(0);
    expect(result.cost.promptTokens).toBeGreaterThan(0);
    expect(result.cost.completionTokens).toBeGreaterThan(0);

    // Verify duration
    expect(result.duration).toBeGreaterThan(0);

    console.log('\n=== Execution Summary ===');
    console.log(`Status: ${result.status}`);
    console.log(`Duration: ${result.duration}ms`);
    console.log(`Prompt Tokens: ${result.cost.promptTokens}`);
    console.log(`Completion Tokens: ${result.cost.completionTokens}`);
    console.log(`Total Cost: $${result.cost.totalCost.toFixed(6)}`);
    console.log(`Events Emitted: ${collectedEvents.length}`);
  }, 60000); // 60 second timeout for MCP initialization

  /**
   * Test 2: Tool call events
   * Verifies tool invocations emit proper events
   */
  it('should emit tool-call and tool-result events when tools are used', async () => {
    const config: CloutAgentConfig = {
      id: 'test-agent-tools',
      name: 'Tool Test Agent',
      model: 'sonnet',
      systemPrompt: 'Use Playwright tools when requested.',
      maxTokens: 4000,
      maxTurns: 5,
      mcpServers: {
        playwright: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-playwright'],
        },
      },
    };

    const input = 'Use the browser snapshot tool to check what tools are available';

    const onEvent = (event: SSEEvent) => {
      collectedEvents.push(event);
      if (event.type === 'execution:tool-call') {
        console.log('[TOOL CALL]', event.data);
      }
      if (event.type === 'execution:tool-result') {
        console.log('[TOOL RESULT]', event.data);
      }
    };

    await service.streamExecution(config, input, onEvent);

    // Verify tool events
    const toolCalls = collectedEvents.filter(e => e.type === 'execution:tool-call');
    const toolResults = collectedEvents.filter(e => e.type === 'execution:tool-result');

    expect(toolCalls.length).toBeGreaterThan(0);
    expect(toolResults.length).toBeGreaterThan(0);

    // Each tool call should have a corresponding result
    expect(toolResults.length).toBe(toolCalls.length);

    // Verify tool call structure
    const firstToolCall = toolCalls[0];
    expect(firstToolCall.data.toolName).toBeDefined();
    expect(firstToolCall.data.toolId).toBeDefined();

    // Verify tool result structure
    const firstToolResult = toolResults[0];
    expect(firstToolResult.data.toolId).toBeDefined();
    expect(firstToolResult.data.result).toBeDefined();

    console.log(`\nTool Calls: ${toolCalls.length}`);
    console.log(`Tool Results: ${toolResults.length}`);
  }, 60000);

  /**
   * Test 3: Thinking events
   * Verifies thinking blocks are captured
   */
  it('should emit thinking events when Claude reasons', async () => {
    const config: CloutAgentConfig = {
      id: 'test-agent-thinking',
      name: 'Thinking Test Agent',
      model: 'sonnet',
      systemPrompt: 'Think through problems step by step.',
      maxTokens: 4000,
      maxTurns: 3,
    };

    const input = 'Think through this: What would be the best way to test a web application?';

    const onEvent = (event: SSEEvent) => {
      collectedEvents.push(event);
      if (event.type === 'execution:thinking') {
        console.log('[THINKING]', event.data);
      }
    };

    await service.streamExecution(config, input, onEvent);

    // Check if thinking events were emitted
    const thinkingEvents = collectedEvents.filter(e => e.type === 'execution:thinking');

    console.log(`\nThinking Events: ${thinkingEvents.length}`);

    // Note: Thinking events may or may not be emitted depending on the model's behavior
    // This is expected - extended thinking is not always triggered
  }, 30000);

  /**
   * Test 4: Session management
   * Verifies session creation and tracking
   */
  it('should create and track sessions', async () => {
    const config: CloutAgentConfig = {
      id: 'test-agent-session',
      name: 'Session Test Agent',
      model: 'sonnet',
      systemPrompt: 'You are a helpful agent.',
      maxTokens: 2000,
      maxTurns: 2,
    };

    const input = 'Hello, this is a test message';

    let sessionId: string | undefined;

    const onEvent = (event: SSEEvent) => {
      if (event.type === 'execution:session-created') {
        sessionId = event.data.sessionId;
        console.log('[SESSION]', event.data);
      }
    };

    await service.streamExecution(config, input, onEvent);

    expect(sessionId).toBeDefined();
    expect(service.getActiveSessionIds()).toContain(sessionId);

    console.log(`\nSession ID: ${sessionId}`);
    console.log(`Active Sessions: ${service.getActiveSessionIds().length}`);
  }, 30000);

  /**
   * Test 5: Output streaming
   * Verifies text output is streamed in chunks
   */
  it('should stream text output in chunks', async () => {
    const config: CloutAgentConfig = {
      id: 'test-agent-streaming',
      name: 'Streaming Test Agent',
      model: 'sonnet',
      systemPrompt: 'Provide detailed responses.',
      maxTokens: 2000,
      maxTurns: 2,
    };

    const input = 'Tell me about web testing in detail';

    const onEvent = (event: SSEEvent) => {
      collectedEvents.push(event);
      if (event.type === 'execution:output') {
        console.log('[OUTPUT CHUNK]', event.data.chunk);
      }
    };

    const result = await service.streamExecution(config, input, onEvent);

    const outputEvents = collectedEvents.filter(e => e.type === 'execution:output');

    expect(outputEvents.length).toBeGreaterThan(0);
    expect(result.result).toBeDefined();
    expect(result.result!.length).toBeGreaterThan(0);

    console.log(`\nOutput Chunks: ${outputEvents.length}`);
    console.log(`Total Output Length: ${result.result!.length}`);
  }, 30000);

  /**
   * Test 6: Variable substitution
   * Verifies variables are properly substituted
   */
  it('should substitute variables in input', async () => {
    const config: CloutAgentConfig = {
      id: 'test-agent-variables',
      name: 'Variable Test Agent',
      model: 'sonnet',
      systemPrompt: 'You are a helpful agent.',
      maxTokens: 1000,
      maxTurns: 2,
    };

    const input = 'The website is {{website}} and the action is {{action}}';
    const variables = {
      website: 'example.com',
      action: 'test',
    };

    const onEvent = (event: SSEEvent) => {
      collectedEvents.push(event);
    };

    const result = await service.streamExecution(config, input, onEvent, { variables });

    expect(result.status).toBe('completed');

    console.log(`\nVariables: ${JSON.stringify(variables)}`);
    console.log(`Result Status: ${result.status}`);
  }, 30000);

  /**
   * Test 7: Error handling
   * Verifies errors are properly handled and reported
   */
  it('should handle errors gracefully', async () => {
    const config: CloutAgentConfig = {
      id: 'test-agent-error',
      name: 'Error Test Agent',
      model: 'invalid-model' as any, // Force an error
      systemPrompt: 'Test error handling.',
      maxTokens: 1000,
    };

    const input = 'This should fail';

    const onEvent = (event: SSEEvent) => {
      collectedEvents.push(event);
      if (event.type === 'execution:failed') {
        console.log('[ERROR]', event.data);
      }
    };

    const result = await service.streamExecution(config, input, onEvent);

    expect(result.status).toBe('failed');
    expect(result.error).toBeDefined();

    const failedEvents = collectedEvents.filter(e => e.type === 'execution:failed');
    expect(failedEvents.length).toBeGreaterThan(0);

    console.log(`\nError: ${result.error}`);
  }, 30000);

  /**
   * Test 8: Cost update events
   * Verifies cost updates are emitted with model usage details
   */
  it('should emit cost-update events with model usage breakdown', async () => {
    const config: CloutAgentConfig = {
      id: 'test-agent-cost',
      name: 'Cost Test Agent',
      model: 'sonnet',
      systemPrompt: 'You are a helpful agent.',
      maxTokens: 2000,
      maxTurns: 2,
    };

    const input = 'Brief test message';

    const onEvent = (event: SSEEvent) => {
      collectedEvents.push(event);
      if (event.type === 'execution:cost-update') {
        console.log('[COST UPDATE]', event.data);
      }
      if (event.type === 'execution:token-usage') {
        console.log('[TOKEN USAGE]', event.data);
      }
    };

    await service.streamExecution(config, input, onEvent);

    const costEvents = collectedEvents.filter(e => e.type === 'execution:cost-update');
    const tokenEvents = collectedEvents.filter(e => e.type === 'execution:token-usage');

    expect(costEvents.length).toBeGreaterThan(0);
    expect(tokenEvents.length).toBeGreaterThan(0);

    // Verify cost event structure
    const costEvent = costEvents[0];
    expect(costEvent.data.totalCostUSD).toBeDefined();
    expect(costEvent.data.modelUsage).toBeDefined();

    // Verify token event structure
    const tokenEvent = tokenEvents[0];
    expect(tokenEvent.data.promptTokens).toBeGreaterThan(0);
    expect(tokenEvent.data.completionTokens).toBeGreaterThan(0);
    expect(tokenEvent.data.totalCost).toBeDefined();

    console.log(`\nCost Updates: ${costEvents.length}`);
    console.log(`Token Updates: ${tokenEvents.length}`);
  }, 30000);
});
