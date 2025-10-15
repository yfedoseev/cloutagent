import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MCPClientPool } from '../../../src/services/mcp/MCPClientPool';
import type {
  IMCPClient,
  MCPServerConfig,
  MCPTool,
} from '@cloutagent/types';

/**
 * Test Suite for MCP Client Pool
 *
 * Tests the pool manager that handles multiple MCP server connections
 * and aggregates their tools.
 *
 * TDD Approach: These tests define the contract for MCPClientPool implementation
 */

describe('MCPClientPool', () => {
  let pool: MCPClientPool;

  // Mock MCP Clients
  let mockClient1: IMCPClient;
  let mockClient2: IMCPClient;
  let mockClient3: IMCPClient;

  // Mock server configurations
  const server1: MCPServerConfig = {
    id: 'filesystem',
    name: 'Filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
    transport: 'stdio',
  };

  const server2: MCPServerConfig = {
    id: 'memory',
    name: 'Memory',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    transport: 'stdio',
  };

  const server3: MCPServerConfig = {
    id: 'git',
    name: 'Git',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git'],
    transport: 'stdio',
  };

  // Mock tools
  const filesystemTools: MCPTool[] = [
    {
      name: 'read_file',
      description: 'Read file contents',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
        },
        required: ['path'],
      },
    },
    {
      name: 'write_file',
      description: 'Write file contents',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
          content: { type: 'string', description: 'File content' },
        },
        required: ['path', 'content'],
      },
    },
  ];

  const memoryTools: MCPTool[] = [
    {
      name: 'read_file',
      description: 'Read from memory',
      inputSchema: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Memory key' },
        },
        required: ['key'],
      },
    },
    {
      name: 'store',
      description: 'Store in memory',
      inputSchema: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Memory key' },
          value: { type: 'string', description: 'Value to store' },
        },
        required: ['key', 'value'],
      },
    },
  ];

  const gitTools: MCPTool[] = [
    {
      name: 'git_status',
      description: 'Get git status',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];

  beforeEach(() => {
    // Create fresh mock clients for each test
    mockClient1 = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      discoverTools: vi.fn().mockResolvedValue(filesystemTools),
      executeTool: vi.fn().mockResolvedValue({
        id: 'tool-1',
        name: 'read_file',
        input: {},
        output: 'file contents',
        duration: 100,
        success: true,
      }),
      checkHealth: vi.fn().mockResolvedValue(true),
      getStatus: vi.fn().mockReturnValue('connected'),
    } as IMCPClient;

    mockClient2 = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      discoverTools: vi.fn().mockResolvedValue(memoryTools),
      executeTool: vi.fn().mockResolvedValue({
        id: 'tool-2',
        name: 'store',
        input: {},
        output: 'stored',
        duration: 50,
        success: true,
      }),
      checkHealth: vi.fn().mockResolvedValue(true),
      getStatus: vi.fn().mockReturnValue('connected'),
    } as IMCPClient;

    mockClient3 = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      discoverTools: vi.fn().mockResolvedValue(gitTools),
      executeTool: vi.fn().mockResolvedValue({
        id: 'tool-3',
        name: 'git_status',
        input: {},
        output: 'clean',
        duration: 200,
        success: true,
      }),
      checkHealth: vi.fn().mockResolvedValue(true),
      getStatus: vi.fn().mockReturnValue('connected'),
    } as IMCPClient;

    // Create pool with client factory
    pool = new MCPClientPool((config) => {
      if (config.id === 'filesystem') return mockClient1;
      if (config.id === 'memory') return mockClient2;
      if (config.id === 'git') return mockClient3;
      throw new Error(`Unexpected server config: ${config.id}`);
    });
  });

  describe('initialize', () => {
    it('should connect to all servers in parallel', async () => {
      await pool.initialize([server1, server2, server3]);

      expect(mockClient1.connect).toHaveBeenCalledTimes(1);
      expect(mockClient2.connect).toHaveBeenCalledTimes(1);
      expect(mockClient3.connect).toHaveBeenCalledTimes(1);
    });

    it('should discover tools from all servers', async () => {
      await pool.initialize([server1, server2, server3]);

      expect(mockClient1.discoverTools).toHaveBeenCalledTimes(1);
      expect(mockClient2.discoverTools).toHaveBeenCalledTimes(1);
      expect(mockClient3.discoverTools).toHaveBeenCalledTimes(1);
    });

    it('should handle server connection failures gracefully', async () => {
      mockClient2.connect.mockRejectedValue(new Error('Connection failed'));

      // Should not throw - graceful degradation
      await expect(pool.initialize([server1, server2, server3])).resolves.not.toThrow();

      // Server 1 and 3 should still be connected
      expect(mockClient1.connect).toHaveBeenCalled();
      expect(mockClient3.connect).toHaveBeenCalled();
    });

    it('should mark failed servers with error status', async () => {
      mockClient2.connect.mockRejectedValue(new Error('Connection failed'));

      await pool.initialize([server1, server2, server3]);

      const status = pool.getServerStatus();
      expect(status.get('filesystem')).toBe('connected');
      expect(status.get('memory')).toBe('error');
      expect(status.get('git')).toBe('connected');
    });

    it('should handle tool discovery failures gracefully', async () => {
      mockClient2.discoverTools.mockRejectedValue(new Error('Discovery failed'));

      await expect(pool.initialize([server1, server2, server3])).resolves.not.toThrow();

      const status = pool.getServerStatus();
      expect(status.get('memory')).toBe('error');
    });

    it('should handle empty server list', async () => {
      await expect(pool.initialize([])).resolves.not.toThrow();

      const status = pool.getServerStatus();
      expect(status.size).toBe(0);
    });
  });

  describe('discoverAllTools', () => {
    it('should aggregate tools from all connected servers', async () => {
      await pool.initialize([server1, server2, server3]);

      const tools = await pool.discoverAllTools();

      // Should have 5 tools total (2 + 2 + 1)
      expect(tools.length).toBe(5);
    });

    it('should handle tool name conflicts with server prefixing', async () => {
      await pool.initialize([server1, server2]);

      const tools = await pool.discoverAllTools();

      // Both servers have 'read_file' tool
      const readFileTools = tools.filter((t) => t.name.includes('read_file'));
      expect(readFileTools.length).toBe(2);

      // Should be prefixed with server name
      expect(readFileTools.some((t) => t.name === 'filesystem:read_file')).toBe(true);
      expect(readFileTools.some((t) => t.name === 'memory:read_file')).toBe(true);
    });

    it('should not prefix tools with unique names', async () => {
      await pool.initialize([server1, server2, server3]);

      const tools = await pool.discoverAllTools();

      // Unique tools should not have prefix
      const writeFileTool = tools.find((t) => t.name === 'write_file');
      const storeTool = tools.find((t) => t.name === 'store');
      const gitStatusTool = tools.find((t) => t.name === 'git_status');

      expect(writeFileTool).toBeDefined();
      expect(storeTool).toBeDefined();
      expect(gitStatusTool).toBeDefined();
    });

    it('should return empty array if no servers connected', async () => {
      mockClient1.connect.mockRejectedValue(new Error('Failed'));
      mockClient2.connect.mockRejectedValue(new Error('Failed'));
      mockClient3.connect.mockRejectedValue(new Error('Failed'));

      await pool.initialize([server1, server2, server3]);

      const tools = await pool.discoverAllTools();
      expect(tools).toEqual([]);
    });

    it('should only include tools from connected servers', async () => {
      mockClient2.connect.mockRejectedValue(new Error('Failed'));

      await pool.initialize([server1, server2, server3]);

      const tools = await pool.discoverAllTools();

      // Should only have filesystem (2) and git (1) tools
      expect(tools.length).toBe(3);
    });
  });

  describe('executeTool', () => {
    it('should route tool call to correct server', async () => {
      await pool.initialize([server1, server2, server3]);

      const result = await pool.executeTool('git_status', {});

      expect(mockClient3.executeTool).toHaveBeenCalledWith('git_status', {});
      expect(result.success).toBe(true);
    });

    it('should route prefixed tool call to correct server', async () => {
      await pool.initialize([server1, server2]);

      const result = await pool.executeTool('filesystem:read_file', {
        path: '/test.txt',
      });

      expect(mockClient1.executeTool).toHaveBeenCalledWith('read_file', {
        path: '/test.txt',
      });
      expect(result.success).toBe(true);
    });

    it('should handle unknown tool names', async () => {
      await pool.initialize([server1, server2, server3]);

      const result = await pool.executeTool('unknown_tool', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tool not found');
    });

    it('should handle server disconnection with retry', async () => {
      await pool.initialize([server1]);

      // Simulate disconnection
      mockClient1.getStatus.mockReturnValue('disconnected');
      mockClient1.connect.mockResolvedValue(undefined);

      await pool.executeTool('write_file', {
        path: '/test.txt',
        content: 'hello',
      });

      // Should attempt reconnection
      expect(mockClient1.connect).toHaveBeenCalledTimes(2); // Initial + retry
    });

    it('should handle tool execution errors', async () => {
      await pool.initialize([server1]);

      mockClient1.executeTool.mockResolvedValue({
        id: 'tool-1',
        name: 'read_file',
        input: {},
        output: '',
        duration: 100,
        success: false,
        error: 'File not found',
      });

      const result = await pool.executeTool('read_file', { path: '/missing.txt' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });
  });

  describe('getServerStatus', () => {
    it('should return status of all servers', async () => {
      await pool.initialize([server1, server2, server3]);

      const status = pool.getServerStatus();

      expect(status.size).toBe(3);
      expect(status.get('filesystem')).toBe('connected');
      expect(status.get('memory')).toBe('connected');
      expect(status.get('git')).toBe('connected');
    });

    it('should reflect current connection status', async () => {
      await pool.initialize([server1, server2]);

      // Simulate disconnection
      mockClient1.getStatus.mockReturnValue('disconnected');

      const status = pool.getServerStatus();

      expect(status.get('filesystem')).toBe('disconnected');
      expect(status.get('memory')).toBe('connected');
    });
  });

  describe('reconnect', () => {
    it('should reconnect to a specific server', async () => {
      await pool.initialize([server1, server2]);

      // Simulate disconnection
      mockClient1.getStatus.mockReturnValue('disconnected');

      await pool.reconnect('filesystem');

      expect(mockClient1.connect).toHaveBeenCalledTimes(2); // Initial + reconnect
    });

    it('should rediscover tools after reconnection', async () => {
      await pool.initialize([server1]);

      await pool.reconnect('filesystem');

      expect(mockClient1.discoverTools).toHaveBeenCalledTimes(2);
    });

    it('should handle reconnection failures', async () => {
      await pool.initialize([server1]);

      mockClient1.connect.mockRejectedValue(new Error('Reconnection failed'));

      await expect(pool.reconnect('filesystem')).resolves.not.toThrow();

      const status = pool.getServerStatus();
      expect(status.get('filesystem')).toBe('error');
    });

    it('should handle unknown server id', async () => {
      await pool.initialize([server1]);

      await expect(pool.reconnect('unknown')).rejects.toThrow('Server not found');
    });
  });

  describe('shutdown', () => {
    it('should disconnect all servers', async () => {
      await pool.initialize([server1, server2, server3]);

      await pool.shutdown();

      expect(mockClient1.disconnect).toHaveBeenCalledTimes(1);
      expect(mockClient2.disconnect).toHaveBeenCalledTimes(1);
      expect(mockClient3.disconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle shutdown errors gracefully', async () => {
      await pool.initialize([server1, server2]);

      mockClient1.disconnect.mockRejectedValue(new Error('Shutdown failed'));

      await expect(pool.shutdown()).resolves.not.toThrow();
    });

    it('should clear all servers after shutdown', async () => {
      await pool.initialize([server1, server2]);

      await pool.shutdown();

      const status = pool.getServerStatus();
      expect(status.size).toBe(0);
    });
  });

  describe('tool routing map', () => {
    it('should build tool routing map on initialization', async () => {
      await pool.initialize([server1, server2, server3]);

      // Should be able to route calls correctly
      await pool.executeTool('git_status', {});
      expect(mockClient3.executeTool).toHaveBeenCalled();

      await pool.executeTool('store', { key: 'test', value: 'data' });
      expect(mockClient2.executeTool).toHaveBeenCalled();
    });

    it('should update routing map on reconnection', async () => {
      await pool.initialize([server1]);

      // Add new tool to mock
      const newTools: MCPTool[] = [
        ...filesystemTools,
        {
          name: 'delete_file',
          description: 'Delete a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string' },
            },
            required: ['path'],
          },
        },
      ];

      mockClient1.discoverTools.mockResolvedValue(newTools);

      await pool.reconnect('filesystem');

      const tools = await pool.discoverAllTools();
      expect(tools.some((t) => t.name === 'delete_file')).toBe(true);
    });
  });
});
