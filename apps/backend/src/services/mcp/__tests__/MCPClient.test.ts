import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MCPClient } from '../MCPClient';
import type { MCPServerConfig } from '@cloutagent/types';
import { EventEmitter } from 'events';

describe('MCPClient - Stdio Transport', () => {
  let mockProcess: MockChildProcess;
  let spawnSpy: any;

  class MockChildProcess extends EventEmitter {
    stdin = {
      write: vi.fn(),
    };
    stdout = new EventEmitter();
    stderr = new EventEmitter();
    kill = vi.fn();
  }

  beforeEach(() => {
    mockProcess = new MockChildProcess();

    // Mock child_process.spawn
    spawnSpy = vi.fn(() => mockProcess);
    vi.doMock('child_process', () => ({
      spawn: spawnSpy,
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Connection Management', () => {
    it('should spawn MCP server process with correct command and args', async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      // Simulate successful connection
      setTimeout(() => {
        const response = {
          jsonrpc: '2.0',
          id: 1,
          result: {
            protocolVersion: '1.0.0',
            serverInfo: { name: 'filesystem', version: '1.0.0' },
          },
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(response)}\n`);
      }, 10);

      await client.connect();

      expect(spawnSpy).toHaveBeenCalledWith('npx', config.args, {
        env: expect.objectContaining(process.env),
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      expect(client.getStatus()).toBe('connected');
    });

    it('should pass environment variables to spawned process', async () => {
      const config: MCPServerConfig = {
        id: 'test-db',
        name: 'Database',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-postgres'],
        env: {
          DATABASE_URL: 'postgresql://localhost:5432/test',
          DB_POOL_SIZE: '10',
        },
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      setTimeout(() => {
        const response = {
          jsonrpc: '2.0',
          id: 1,
          result: { protocolVersion: '1.0.0' },
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(response)}\n`);
      }, 10);

      await client.connect();

      expect(spawnSpy).toHaveBeenCalledWith('npx', config.args, {
        env: expect.objectContaining({
          DATABASE_URL: 'postgresql://localhost:5432/test',
          DB_POOL_SIZE: '10',
        }),
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    });

    it('should send initialize request on connection', async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      setTimeout(() => {
        const response = {
          jsonrpc: '2.0',
          id: 1,
          result: { protocolVersion: '1.0.0' },
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(response)}\n`);
      }, 10);

      await client.connect();

      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"method":"initialize"'),
      );
      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"protocolVersion":"1.0.0"'),
      );
      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"clientInfo":{"name":"cloutagent"'),
      );
    });

    it('should handle connection failure gracefully', async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      setTimeout(() => {
        mockProcess.emit('exit', 1);
      }, 10);

      await expect(client.connect()).rejects.toThrow('Failed to connect');
      expect(client.getStatus()).toBe('error');
    });

    it('should disconnect and kill process', async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      setTimeout(() => {
        const response = {
          jsonrpc: '2.0',
          id: 1,
          result: { protocolVersion: '1.0.0' },
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(response)}\n`);
      }, 10);

      await client.connect();
      await client.disconnect();

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
      expect(client.getStatus()).toBe('disconnected');
    });
  });

  describe('Tool Discovery', () => {
    it('should discover tools from MCP server', async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      // Simulate successful connection
      setTimeout(() => {
        const initResponse = {
          jsonrpc: '2.0',
          id: 1,
          result: { protocolVersion: '1.0.0' },
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(initResponse)}\n`);
      }, 10);

      await client.connect();

      // Simulate tools/list response
      setTimeout(() => {
        const toolsResponse = {
          jsonrpc: '2.0',
          id: 2,
          result: {
            tools: [
              {
                name: 'read_file',
                description: 'Read a file from the filesystem',
                inputSchema: {
                  type: 'object',
                  properties: {
                    path: {
                      type: 'string',
                      description: 'Path to the file',
                    },
                  },
                  required: ['path'],
                },
              },
              {
                name: 'write_file',
                description: 'Write content to a file',
                inputSchema: {
                  type: 'object',
                  properties: {
                    path: { type: 'string' },
                    content: { type: 'string' },
                  },
                  required: ['path', 'content'],
                },
              },
            ],
          },
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(toolsResponse)}\n`);
      }, 20);

      const tools = await client.discoverTools();

      expect(tools).toHaveLength(2);
      expect(tools[0]).toEqual({
        name: 'read_file',
        description: 'Read a file from the filesystem',
        inputSchema: expect.objectContaining({
          type: 'object',
          properties: expect.objectContaining({
            path: expect.objectContaining({ type: 'string' }),
          }),
        }),
      });
      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"method":"tools/list"'),
      );
    });

    it('should return empty array when server has no tools', async () => {
      const config: MCPServerConfig = {
        id: 'test-empty',
        name: 'EmptyServer',
        command: 'npx',
        args: ['-y', 'some-empty-server'],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      setTimeout(() => {
        const initResponse = {
          jsonrpc: '2.0',
          id: 1,
          result: { protocolVersion: '1.0.0' },
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(initResponse)}\n`);
      }, 10);

      await client.connect();

      setTimeout(() => {
        const toolsResponse = {
          jsonrpc: '2.0',
          id: 2,
          result: { tools: [] },
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(toolsResponse)}\n`);
      }, 20);

      const tools = await client.discoverTools();

      expect(tools).toEqual([]);
    });
  });

  describe('Tool Execution', () => {
    it('should execute tool and return successful result', async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      setTimeout(() => {
        const initResponse = {
          jsonrpc: '2.0',
          id: 1,
          result: { protocolVersion: '1.0.0' },
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(initResponse)}\n`);
      }, 10);

      await client.connect();

      setTimeout(() => {
        const toolResponse = {
          jsonrpc: '2.0',
          id: 2,
          result: {
            content: 'File content here',
            metadata: { size: 100 },
          },
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(toolResponse)}\n`);
      }, 20);

      const result = await client.executeTool('read_file', { path: '/tmp/test.txt' });

      expect(result.success).toBe(true);
      expect(result.name).toBe('read_file');
      expect(result.input).toEqual({ path: '/tmp/test.txt' });
      expect(result.output).toContain('content');
      expect(result.duration).toBeGreaterThan(0);
      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"method":"tools/call"'),
      );
      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"name":"read_file"'),
      );
    });

    it('should handle tool execution errors', async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      setTimeout(() => {
        const initResponse = {
          jsonrpc: '2.0',
          id: 1,
          result: { protocolVersion: '1.0.0' },
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(initResponse)}\n`);
      }, 10);

      await client.connect();

      setTimeout(() => {
        const errorResponse = {
          jsonrpc: '2.0',
          id: 2,
          error: {
            code: -32000,
            message: 'File not found',
          },
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(errorResponse)}\n`);
      }, 20);

      const result = await client.executeTool('read_file', {
        path: '/nonexistent.txt',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('File not found');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should include tool execution duration', async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      setTimeout(() => {
        const initResponse = {
          jsonrpc: '2.0',
          id: 1,
          result: { protocolVersion: '1.0.0' },
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(initResponse)}\n`);
      }, 10);

      await client.connect();

      setTimeout(() => {
        const toolResponse = {
          jsonrpc: '2.0',
          id: 2,
          result: { content: 'test' },
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(toolResponse)}\n`);
      }, 50); // Delay to ensure measurable duration

      const startTime = Date.now();
      const result = await client.executeTool('read_file', { path: '/tmp/test.txt' });
      const endTime = Date.now();

      expect(result.duration).toBeGreaterThan(0);
      expect(result.duration).toBeLessThanOrEqual(endTime - startTime);
    });
  });

  describe('Health Checks', () => {
    it('should return true when server is healthy', async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      setTimeout(() => {
        const initResponse = {
          jsonrpc: '2.0',
          id: 1,
          result: { protocolVersion: '1.0.0' },
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(initResponse)}\n`);
      }, 10);

      await client.connect();

      setTimeout(() => {
        const pingResponse = {
          jsonrpc: '2.0',
          id: 2,
          result: {},
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(pingResponse)}\n`);
      }, 20);

      const isHealthy = await client.checkHealth();

      expect(isHealthy).toBe(true);
      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"method":"ping"'),
      );
    });

    it('should return false when server is unhealthy', async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      setTimeout(() => {
        const initResponse = {
          jsonrpc: '2.0',
          id: 1,
          result: { protocolVersion: '1.0.0' },
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(initResponse)}\n`);
      }, 10);

      await client.connect();

      setTimeout(() => {
        const errorResponse = {
          jsonrpc: '2.0',
          id: 2,
          error: { code: -32603, message: 'Internal error' },
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(errorResponse)}\n`);
      }, 20);

      const isHealthy = await client.checkHealth();

      expect(isHealthy).toBe(false);
    });
  });

  describe('Process Crash Handling', () => {
    it('should handle process exit with non-zero code', async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      setTimeout(() => {
        const initResponse = {
          jsonrpc: '2.0',
          id: 1,
          result: { protocolVersion: '1.0.0' },
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(initResponse)}\n`);
      }, 10);

      await client.connect();

      // Simulate process crash
      mockProcess.emit('exit', 1);

      // Wait for event to be processed
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(client.getStatus()).toBe('error');
    });

    it('should handle process exit with code 0', async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      setTimeout(() => {
        const initResponse = {
          jsonrpc: '2.0',
          id: 1,
          result: { protocolVersion: '1.0.0' },
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(initResponse)}\n`);
      }, 10);

      await client.connect();

      // Simulate graceful exit
      mockProcess.emit('exit', 0);

      // Wait for event to be processed
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(client.getStatus()).toBe('disconnected');
    });

    it('should log stderr output from MCP server', async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        transport: 'stdio',
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const client = new MCPClient(config);

      setTimeout(() => {
        const initResponse = {
          jsonrpc: '2.0',
          id: 1,
          result: { protocolVersion: '1.0.0' },
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(initResponse)}\n`);
      }, 10);

      await client.connect();

      // Simulate stderr output
      mockProcess.stderr.emit('data', 'Warning: something happened\n');

      // Wait for event to be processed
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MCP Filesystem]'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning: something happened'),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout requests after 30 seconds', async () => {
      vi.useFakeTimers();

      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      setTimeout(() => {
        const initResponse = {
          jsonrpc: '2.0',
          id: 1,
          result: { protocolVersion: '1.0.0' },
        };
        mockProcess.stdout.emit('data', `${JSON.stringify(initResponse)}\n`);
      }, 10);

      await client.connect();

      // Start a request that will never respond
      const toolPromise = client.executeTool('read_file', { path: '/tmp/test.txt' });

      // Fast-forward time by 30 seconds
      vi.advanceTimersByTime(30000);

      const result = await toolPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');

      vi.useRealTimers();
    });
  });

  describe('JSON-RPC Protocol', () => {
    it('should send requests with incrementing message IDs', async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      setTimeout(() => {
        mockProcess.stdout.emit(
          'data',
          `${JSON.stringify({ jsonrpc: '2.0', id: 1, result: {} })}\n`,
        );
      }, 10);

      await client.connect();

      setTimeout(() => {
        mockProcess.stdout.emit(
          'data',
          `${JSON.stringify({ jsonrpc: '2.0', id: 2, result: { tools: [] } })}\n`,
        );
      }, 20);

      await client.discoverTools();

      setTimeout(() => {
        mockProcess.stdout.emit(
          'data',
          `${JSON.stringify({ jsonrpc: '2.0', id: 3, result: {} })}\n`,
        );
      }, 30);

      await client.checkHealth();

      const calls = mockProcess.stdin.write.mock.calls;
      const requests = calls.map((call) => JSON.parse(call[0]));

      expect(requests[0].id).toBe(1);
      expect(requests[1].id).toBe(2);
      expect(requests[2].id).toBe(3);
    });

    it('should handle multiple JSON-RPC responses in single data chunk', async () => {
      const config: MCPServerConfig = {
        id: 'test-fs',
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        transport: 'stdio',
      };

      const client = new MCPClient(config);

      setTimeout(() => {
        const multiResponse =
          `${JSON.stringify({ jsonrpc: '2.0', id: 1, result: {} }) 
          }\n${ 
          JSON.stringify({ jsonrpc: '2.0', id: 2, result: { tools: [] } }) 
          }\n`;
        mockProcess.stdout.emit('data', multiResponse);
      }, 10);

      const connectPromise = client.connect();
      const toolsPromise = client.discoverTools();

      await Promise.all([connectPromise, toolsPromise]);

      expect(client.getStatus()).toBe('connected');
    });
  });
});
