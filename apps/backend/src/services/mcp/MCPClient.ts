import { spawn, ChildProcess } from 'child_process';
import type {
  IMCPClient,
  MCPServerConfig,
  MCPTool,
  ToolCallResult,
  JSONRPCRequest,
  JSONRPCResponse,
} from '@cloutagent/types';
import { MCPError } from '@cloutagent/types';

/**
 * MCP Client Implementation with Stdio Transport
 *
 * Implements the Model Context Protocol client that communicates with MCP servers
 * via stdio (standard input/output) using JSON-RPC 2.0 protocol.
 */
export class MCPClient implements IMCPClient {
  private process: ChildProcess | null = null;
  private messageId = 0;
  private pendingRequests = new Map<
    number,
    {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
      timeout?: NodeJS.Timeout;
    }
  >();
  private status: 'connected' | 'connecting' | 'disconnected' | 'error' =
    'disconnected';
  private buffer = '';

  constructor(private config: MCPServerConfig) {}

  /**
   * Connect to the MCP server
   *
   * Spawns the server process and sends initialization handshake
   */
  async connect(): Promise<void> {
    this.status = 'connecting';

    try {
      // Spawn MCP server process
      this.process = spawn(this.config.command, this.config.args, {
        env: { ...process.env, ...this.config.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Handle stdout (JSON-RPC responses)
      this.process.stdout?.on('data', (data: Buffer) => {
        this.handleResponse(data.toString());
      });

      // Handle stderr (error logs)
      this.process.stderr?.on('data', (data: Buffer) => {
        console.error(`[MCP ${this.config.name}] ${data.toString()}`);
      });

      // Handle process exit
      this.process.on('exit', (code: number | null) => {
        console.log(
          `[MCP ${this.config.name}] Process exited with code ${code}`,
        );
        this.status = code === 0 ? 'disconnected' : 'error';

        // Reject all pending requests
        for (const [id, request] of this.pendingRequests.entries()) {
          request.reject(
            new Error(`Process exited with code ${code} before response`),
          );
          if (request.timeout) {
            clearTimeout(request.timeout);
          }
          this.pendingRequests.delete(id);
        }
      });

      // Send initialization request
      await this.sendRequest('initialize', {
        protocolVersion: '1.0.0',
        clientInfo: {
          name: 'cloutagent',
          version: '1.0.0',
        },
        capabilities: {},
      });

      this.status = 'connected';
    } catch (error) {
      this.status = 'error';
      throw new MCPError(
        `Failed to connect to MCP server: ${error instanceof Error ? error.message : String(error)}`,
        this.config.id,
        'CONNECTION_FAILED',
        error,
      );
    }
  }

  /**
   * Disconnect from the MCP server
   *
   * Kills the server process gracefully
   */
  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }

    // Clear all pending requests
    for (const [id, request] of this.pendingRequests.entries()) {
      request.reject(new Error('Client disconnected'));
      if (request.timeout) {
        clearTimeout(request.timeout);
      }
      this.pendingRequests.delete(id);
    }

    this.status = 'disconnected';
  }

  /**
   * Discover available tools from the MCP server
   *
   * Sends tools/list request and returns tool definitions
   */
  async discoverTools(): Promise<MCPTool[]> {
    const response = await this.sendRequest('tools/list', {});
    return response.tools || [];
  }

  /**
   * Execute a tool on the MCP server
   *
   * @param toolName - Name of the tool to execute
   * @param args - Tool arguments
   * @returns Tool execution result with output and metadata
   */
  async executeTool(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<ToolCallResult> {
    const startTime = Date.now();

    try {
      const response = await this.sendRequest('tools/call', {
        name: toolName,
        arguments: args,
      });

      return {
        id: `tool-${Date.now()}`,
        name: toolName,
        input: args,
        output: JSON.stringify(response),
        duration: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      return {
        id: `tool-${Date.now()}`,
        name: toolName,
        input: args,
        output: '',
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check server health
   *
   * Sends ping request to verify server is responsive
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.sendRequest('ping', {});
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): 'connected' | 'connecting' | 'disconnected' | 'error' {
    return this.status;
  }

  /**
   * Send JSON-RPC 2.0 request to MCP server
   *
   * @param method - RPC method name
   * @param params - Method parameters
   * @returns Promise resolving to method result
   */
  private async sendRequest(
    method: string,
    params: Record<string, unknown>,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.process || !this.process.stdin) {
        reject(new Error('MCP process not connected'));
        return;
      }

      const id = ++this.messageId;
      const request: JSONRPCRequest = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      // Set timeout for request (30 seconds)
      const timeout = setTimeout(() => {
        const pending = this.pendingRequests.get(id);
        if (pending) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 30000);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      // Send request to server
      const requestStr = `${JSON.stringify(request)}\n`;
      this.process.stdin.write(requestStr);
    });
  }

  /**
   * Handle JSON-RPC responses from server
   *
   * Parses responses and resolves/rejects pending requests
   *
   * @param data - Raw data from stdout
   */
  private handleResponse(data: string): void {
    // Append to buffer
    this.buffer += data;

    // Split by newlines
    const lines = this.buffer.split('\n');

    // Keep the last incomplete line in the buffer
    this.buffer = lines.pop() || '';

    // Process complete lines
    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const response: JSONRPCResponse = JSON.parse(line);

        if (
          typeof response.id === 'number' &&
          this.pendingRequests.has(response.id)
        ) {
          const pending = this.pendingRequests.get(response.id)!;
          this.pendingRequests.delete(response.id);

          // Clear timeout
          if (pending.timeout) {
            clearTimeout(pending.timeout);
          }

          if (response.error) {
            pending.reject(
              new Error(response.error.message || 'MCP request failed'),
            );
          } else {
            pending.resolve(response.result);
          }
        }
      } catch (error) {
        console.error('[MCP] Failed to parse response:', error, 'Line:', line);
      }
    }
  }
}
