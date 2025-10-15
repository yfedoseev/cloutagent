import type {
  IMCPClient,
  IMCPClientPool,
  MCPServerConfig,
  MCPTool,
  ToolCallResult,
  PooledMCPClient,
} from '@cloutagent/types';
import { MCPClient } from './MCPClient';

/**
 * MCP Client Pool
 *
 * Manages multiple MCP server connections and aggregates their tools.
 * Handles tool routing, connection failures, and server lifecycle.
 *
 * Key Features:
 * - Parallel server initialization
 * - Graceful error handling (failed servers don't crash the pool)
 * - Tool name conflict resolution (automatic prefixing)
 * - Automatic reconnection support
 * - Tool routing to correct server
 */
export class MCPClientPool implements IMCPClientPool {
  private clients = new Map<string, PooledMCPClient>();
  private toolToServerMap = new Map<string, string>(); // toolName -> serverId

  /**
   * Client factory function for dependency injection (testing)
   * Defaults to creating real MCPClient instances
   */
  private clientFactory: (config: MCPServerConfig) => IMCPClient;

  constructor(clientFactory?: (config: MCPServerConfig) => IMCPClient) {
    this.clientFactory = clientFactory || ((config) => new MCPClient(config));
  }

  /**
   * Initialize the pool with multiple MCP servers
   *
   * Connects to all servers in parallel and discovers their tools.
   * Failed connections are handled gracefully - pool continues with
   * successfully connected servers.
   *
   * @param servers - Array of MCP server configurations
   */
  async initialize(servers: MCPServerConfig[]): Promise<void> {
    // Connect to all servers in parallel
    const connectionPromises = servers.map(async (config) => {
      try {
        const client = this.clientFactory(config);
        const pooledClient: PooledMCPClient = {
          serverId: config.id,
          serverName: config.name,
          client,
          tools: [],
          status: 'disconnected',
        };

        // Store in map immediately
        this.clients.set(config.id, pooledClient);

        // Connect to server
        await client.connect();
        pooledClient.status = 'connected';

        // Discover tools
        const tools = await client.discoverTools();
        pooledClient.tools = tools;

        return { config, client, tools, success: true };
      } catch (error) {
        // Handle connection/discovery failures gracefully
        console.error(
          `[MCP Pool] Failed to initialize server ${config.name}:`,
          error,
        );

        const pooledClient = this.clients.get(config.id);
        if (pooledClient) {
          pooledClient.status = 'error';
          pooledClient.lastError =
            error instanceof Error ? error.message : String(error);
        }

        return { config, client: null, tools: [], success: false };
      }
    });

    // Wait for all connections to complete
    const results = await Promise.all(connectionPromises);

    // Build tool routing map
    await this.buildToolRoutingMap();

    // Log initialization summary
    const successCount = results.filter((r) => r.success).length;
    console.log(
      `[MCP Pool] Initialized ${successCount}/${servers.length} servers`,
    );
  }

  /**
   * Discover all tools from connected servers
   *
   * Aggregates tools from all servers and handles name conflicts
   * by prefixing with server name.
   *
   * @returns Array of all available tools (with prefixes for conflicts)
   */
  async discoverAllTools(): Promise<MCPTool[]> {
    const allTools: MCPTool[] = [];
    const toolNameCounts = new Map<string, number>();

    // First pass: count tool names to detect conflicts
    for (const pooledClient of this.clients.values()) {
      if (pooledClient.status !== 'connected') continue;

      for (const tool of pooledClient.tools) {
        const count = toolNameCounts.get(tool.name) || 0;
        toolNameCounts.set(tool.name, count + 1);
      }
    }

    // Second pass: add tools with prefixes if needed
    for (const pooledClient of this.clients.values()) {
      if (pooledClient.status !== 'connected') continue;

      for (const tool of pooledClient.tools) {
        const hasConflict = (toolNameCounts.get(tool.name) || 0) > 1;

        if (hasConflict) {
          // Prefix with server name to avoid conflict
          allTools.push({
            ...tool,
            name: `${pooledClient.serverId}:${tool.name}`,
          });
        } else {
          // No conflict, use original name
          allTools.push(tool);
        }
      }
    }

    return allTools;
  }

  /**
   * Execute a tool on the appropriate server
   *
   * Routes the tool call to the correct server based on tool name.
   * Handles prefixed tool names (e.g., "filesystem:read_file").
   * Attempts reconnection if server is disconnected.
   *
   * @param toolName - Name of the tool (may include server prefix)
   * @param args - Tool arguments
   * @returns Tool execution result
   */
  async executeTool(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<ToolCallResult> {
    const startTime = Date.now();

    // Find server that provides this tool
    const serverId = this.toolToServerMap.get(toolName);

    if (!serverId) {
      return {
        id: `tool-${Date.now()}`,
        name: toolName,
        input: args,
        output: '',
        duration: Date.now() - startTime,
        success: false,
        error: `Tool not found: ${toolName}`,
      };
    }

    const pooledClient = this.clients.get(serverId);

    if (!pooledClient) {
      return {
        id: `tool-${Date.now()}`,
        name: toolName,
        input: args,
        output: '',
        duration: Date.now() - startTime,
        success: false,
        error: `Server not found: ${serverId}`,
      };
    }

    // Check if server is connected
    if (
      pooledClient.status === 'disconnected' ||
      pooledClient.client.getStatus() === 'disconnected'
    ) {
      // Attempt reconnection
      await this.reconnect(serverId);

      // Check if reconnection succeeded
      if (pooledClient.status === 'error') {
        return {
          id: `tool-${Date.now()}`,
          name: toolName,
          input: args,
          output: '',
          duration: Date.now() - startTime,
          success: false,
          error: `Failed to reconnect to server: ${pooledClient.lastError || 'Unknown error'}`,
        };
      }
    }

    // Extract actual tool name (remove prefix if present)
    const actualToolName = toolName.includes(':')
      ? toolName.split(':')[1]
      : toolName;

    // Execute tool on the server
    try {
      return await pooledClient.client.executeTool(actualToolName, args);
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
   * Get status of all servers in the pool
   *
   * @returns Map of server ID to connection status
   */
  getServerStatus(): Map<string, 'connected' | 'disconnected' | 'error'> {
    const statusMap = new Map<string, 'connected' | 'disconnected' | 'error'>();

    for (const [serverId, pooledClient] of this.clients.entries()) {
      // If pool status is error, keep it as error (from initialization failures)
      if (pooledClient.status === 'error') {
        statusMap.set(serverId, 'error');
        continue;
      }

      // Otherwise, get live status from client
      const liveStatus = pooledClient.client.getStatus();

      // Map client status to pool status
      if (liveStatus === 'connected') {
        statusMap.set(serverId, 'connected');
      } else if (liveStatus === 'error') {
        statusMap.set(serverId, 'error');
      } else {
        statusMap.set(serverId, 'disconnected');
      }
    }

    return statusMap;
  }

  /**
   * Reconnect to a specific server
   *
   * Attempts to reconnect to a disconnected server and rediscover its tools.
   * Handles failures gracefully by setting error status.
   *
   * @param serverId - ID of the server to reconnect
   * @throws Error if server not found
   */
  async reconnect(serverId: string): Promise<void> {
    const pooledClient = this.clients.get(serverId);

    if (!pooledClient) {
      throw new Error(`Server not found: ${serverId}`);
    }

    try {
      // Reconnect
      await pooledClient.client.connect();
      pooledClient.status = 'connected';
      delete pooledClient.lastError;

      // Rediscover tools
      const tools = await pooledClient.client.discoverTools();
      pooledClient.tools = tools;

      // Rebuild routing map
      await this.buildToolRoutingMap();

      console.log(`[MCP Pool] Successfully reconnected to ${serverId}`);
    } catch (error) {
      pooledClient.status = 'error';
      pooledClient.lastError =
        error instanceof Error ? error.message : String(error);

      console.error(`[MCP Pool] Failed to reconnect to ${serverId}:`, error);
      // Don't throw - handle gracefully
    }
  }

  /**
   * Shutdown all server connections
   *
   * Gracefully disconnects all servers and clears the pool.
   */
  async shutdown(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.values()).map(
      async (pooledClient) => {
        try {
          await pooledClient.client.disconnect();
        } catch (error) {
          console.error(
            `[MCP Pool] Error disconnecting ${pooledClient.serverId}:`,
            error,
          );
        }
      },
    );

    await Promise.all(disconnectPromises);

    // Clear all state
    this.clients.clear();
    this.toolToServerMap.clear();

    console.log('[MCP Pool] Shutdown complete');
  }

  /**
   * Build tool routing map
   *
   * Creates a map of tool names to server IDs for fast routing.
   * Handles name conflicts with prefixing.
   *
   * @private
   */
  private async buildToolRoutingMap(): Promise<void> {
    this.toolToServerMap.clear();

    const toolNameCounts = new Map<string, number>();

    // First pass: count tool names to detect conflicts
    for (const pooledClient of this.clients.values()) {
      if (pooledClient.status !== 'connected') continue;

      for (const tool of pooledClient.tools) {
        const count = toolNameCounts.get(tool.name) || 0;
        toolNameCounts.set(tool.name, count + 1);
      }
    }

    // Second pass: build routing map
    for (const pooledClient of this.clients.values()) {
      if (pooledClient.status !== 'connected') continue;

      for (const tool of pooledClient.tools) {
        const hasConflict = (toolNameCounts.get(tool.name) || 0) > 1;

        if (hasConflict) {
          // Map prefixed name to server
          const prefixedName = `${pooledClient.serverId}:${tool.name}`;
          this.toolToServerMap.set(prefixedName, pooledClient.serverId);
        } else {
          // Map original name to server
          this.toolToServerMap.set(tool.name, pooledClient.serverId);
        }
      }
    }
  }
}
