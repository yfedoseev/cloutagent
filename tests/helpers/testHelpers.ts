import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import type { Project } from '@cloutagent/types';

/**
 * Test helper utilities for integration tests
 */

export interface TestProject {
  id: string;
  name: string;
  description?: string;
  apiKey: string;
  hashedApiKey: string;
}

/**
 * Get test project root directory from environment
 */
export function getTestProjectRoot(): string {
  return process.env.TEST_PROJECT_ROOT || '/tmp/cloutagent-test';
}

/**
 * Clean up all test projects
 */
export async function cleanupTestProjects(): Promise<void> {
  const testRoot = getTestProjectRoot();
  try {
    await fs.rm(testRoot, { recursive: true, force: true });
  } catch (error) {
    // Ignore errors if directory doesn't exist
  }
}

/**
 * Create a minimal test project data structure
 */
export function createTestProjectData(overrides?: Partial<Project>): Omit<Project, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: overrides?.name || `Test Project ${Date.now()}`,
    description: overrides?.description || 'A test project for integration testing',
    agent: {
      id: `agent-${Date.now()}`,
      name: 'Test Agent',
      systemPrompt: 'You are a helpful test agent',
      model: 'claude-sonnet-4-5',
      temperature: 0.7,
      maxTokens: 4096,
      enabledTools: [],
      ...overrides?.agent,
    },
    subagents: overrides?.subagents || [],
    hooks: overrides?.hooks || [],
    mcps: overrides?.mcps || [],
    apiKey: overrides?.apiKey || 'hashed-test-key',
    limits: {
      maxTokens: 100000,
      maxCost: 10.0,
      timeout: 300000,
      ...overrides?.limits,
    },
  };
}

/**
 * Wait for a condition to be true with timeout
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeoutMs: number = 5000,
  intervalMs: number = 100,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Timeout waiting for condition after ${timeoutMs}ms`);
}

/**
 * Generate a test API key
 */
export function generateTestAPIKey(): string {
  return `cla_test_${randomUUID().replace(/-/g, '')}`;
}

/**
 * Verify file exists and has content
 */
export async function verifyFileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

/**
 * Verify directory exists
 */
export async function verifyDirectoryExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Read JSON file safely
 */
export async function readJSONFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Mock Anthropic API responses for testing
 */
export function mockAnthropicAPI() {
  // This would be used with vi.mock in actual tests
  return {
    messages: {
      create: async () => ({
        id: 'msg_test123',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'Mock response from Claude',
          },
        ],
        model: 'claude-sonnet-4-5',
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 10,
          output_tokens: 20,
        },
      }),
    },
  };
}

/**
 * Calculate estimated cost from token usage
 */
export function calculateMockCost(inputTokens: number, outputTokens: number): number {
  // Mock pricing (adjust based on actual Claude pricing)
  const inputCostPerToken = 0.000003; // $3 per 1M tokens
  const outputCostPerToken = 0.000015; // $15 per 1M tokens

  return inputTokens * inputCostPerToken + outputTokens * outputCostPerToken;
}

/**
 * Create multiple test projects
 */
export async function createMultipleTestProjects(count: number): Promise<TestProject[]> {
  const projects: TestProject[] = [];

  for (let i = 0; i < count; i++) {
    projects.push({
      id: randomUUID(),
      name: `Test Project ${i + 1}`,
      description: `Test project number ${i + 1}`,
      apiKey: generateTestAPIKey(),
      hashedApiKey: `hashed_${i}`,
    });
  }

  return projects;
}

/**
 * Sleep for testing async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
