import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClient } from '../MCPClient';
import type { MCPServerConfig } from '@cloutagent/types';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Integration Tests for MCPClient with Real MCP Server
 *
 * These tests use @modelcontextprotocol/server-filesystem to verify
 * the MCPClient works correctly with a real MCP server.
 */
describe('MCPClient - Integration Tests with Real MCP Server', () => {
  let tempDir: string;
  let testFilePath: string;

  beforeAll(async () => {
    // Create temp directory for testing
    tempDir = path.join(os.tmpdir(), `mcp-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    // Create a test file
    testFilePath = path.join(tempDir, 'test.txt');
    await fs.writeFile(testFilePath, 'Hello from MCP integration test!');

    console.log(`Test directory created: ${tempDir}`);
  });

  afterAll(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log(`Test directory cleaned up: ${tempDir}`);
    } catch (error) {
      console.error('Failed to clean up test directory:', error);
    }
  });

  it(
    'should connect to filesystem MCP server',
    async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', tempDir],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      try {
        await client.connect();
        expect(client.getStatus()).toBe('connected');
      } finally {
        await client.disconnect();
      }
    },
    { timeout: 30000 },
  );

  it(
    'should discover tools from filesystem MCP server',
    async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', tempDir],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      try {
        await client.connect();

        const tools = await client.discoverTools();

        expect(tools).toBeDefined();
        expect(Array.isArray(tools)).toBe(true);
        expect(tools.length).toBeGreaterThan(0);

        // Check for expected filesystem tools
        const toolNames = tools.map((t) => t.name);
        expect(toolNames).toContain('read_file');

        // Verify tool structure
        const readFileTool = tools.find((t) => t.name === 'read_file');
        expect(readFileTool).toBeDefined();
        expect(readFileTool!.description).toBeDefined();
        expect(readFileTool!.inputSchema).toBeDefined();
        expect(readFileTool!.inputSchema.type).toBe('object');
        expect(readFileTool!.inputSchema.properties).toBeDefined();
      } finally {
        await client.disconnect();
      }
    },
    { timeout: 30000 },
  );

  it(
    'should execute read_file tool successfully',
    async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', tempDir],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      try {
        await client.connect();

        const result = await client.executeTool('read_file', {
          path: 'test.txt',
        });

        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.name).toBe('read_file');
        expect(result.input).toEqual({ path: 'test.txt' });
        expect(result.output).toContain('Hello from MCP integration test!');
        expect(result.duration).toBeGreaterThan(0);
        expect(result.error).toBeUndefined();
      } finally {
        await client.disconnect();
      }
    },
    { timeout: 30000 },
  );

  it(
    'should handle tool execution errors gracefully',
    async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', tempDir],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      try {
        await client.connect();

        const result = await client.executeTool('read_file', {
          path: 'nonexistent-file.txt',
        });

        expect(result).toBeDefined();
        expect(result.success).toBe(false);
        expect(result.name).toBe('read_file');
        expect(result.error).toBeDefined();
        expect(result.duration).toBeGreaterThan(0);
      } finally {
        await client.disconnect();
      }
    },
    { timeout: 30000 },
  );

  it(
    'should check server health',
    async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', tempDir],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      try {
        await client.connect();

        const isHealthy = await client.checkHealth();

        expect(isHealthy).toBe(true);
      } finally {
        await client.disconnect();
      }
    },
    { timeout: 30000 },
  );

  it(
    'should disconnect cleanly',
    async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', tempDir],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      await client.connect();
      expect(client.getStatus()).toBe('connected');

      await client.disconnect();
      expect(client.getStatus()).toBe('disconnected');
    },
    { timeout: 30000 },
  );

  it(
    'should handle multiple sequential tool calls',
    async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', tempDir],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      try {
        await client.connect();

        // First call
        const result1 = await client.executeTool('read_file', {
          path: 'test.txt',
        });
        expect(result1.success).toBe(true);

        // Second call
        const result2 = await client.executeTool('read_file', {
          path: 'test.txt',
        });
        expect(result2.success).toBe(true);

        // Verify both calls succeeded
        expect(result1.output).toEqual(result2.output);
      } finally {
        await client.disconnect();
      }
    },
    { timeout: 30000 },
  );
});
