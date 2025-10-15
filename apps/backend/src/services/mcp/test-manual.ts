#!/usr/bin/env tsx
/**
 * Manual Test Script for MCPClient
 *
 * Run with: npx tsx src/services/mcp/test-manual.ts
 */

import { MCPClient } from './MCPClient';
import type { MCPServerConfig } from '@cloutagent/types';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

async function runManualTests() {
  console.log('=== MCP Client Manual Test ===\n');

  // Create temp directory
  const tempDir = path.join(os.tmpdir(), `mcp-manual-test-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });
  console.log(`✓ Created temp directory: ${tempDir}\n`);

  // Create test file
  const testFile = path.join(tempDir, 'test.txt');
  await fs.writeFile(testFile, 'Hello from manual MCP test!');
  console.log(`✓ Created test file: ${testFile}\n`);

  const config: MCPServerConfig = {
    id: 'test-fs',
    name: 'Filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', tempDir],
    transport: 'stdio',
  };

  const client = new MCPClient(config);

  try {
    // Test 1: Connection
    console.log('Test 1: Connecting to MCP server...');
    await client.connect();
    console.log(`✓ Connected successfully! Status: ${client.getStatus()}\n`);

    // Test 2: Tool Discovery
    console.log('Test 2: Discovering tools...');
    const tools = await client.discoverTools();
    console.log(`✓ Found ${tools.length} tools:`);
    tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log('');

    // Test 3: Tool Execution (Success)
    console.log('Test 3: Executing read_file tool...');
    const result1 = await client.executeTool('read_file', { path: 'test.txt' });
    console.log('✓ Tool execution completed:');
    console.log(`  - Success: ${result1.success}`);
    console.log(`  - Duration: ${result1.duration}ms`);
    console.log(`  - Output: ${result1.output.substring(0, 100)}...\n`);

    // Test 4: Tool Execution (Error)
    console.log('Test 4: Executing read_file with nonexistent file...');
    const result2 = await client.executeTool('read_file', { path: 'nonexistent.txt' });
    console.log('✓ Tool execution completed:');
    console.log(`  - Success: ${result2.success}`);
    console.log(`  - Error: ${result2.error}\n`);

    // Test 5: Health Check
    console.log('Test 5: Checking server health...');
    const isHealthy = await client.checkHealth();
    console.log(`✓ Health check: ${isHealthy ? 'Healthy' : 'Unhealthy'}\n`);

    // Test 6: Disconnect
    console.log('Test 6: Disconnecting...');
    await client.disconnect();
    console.log(`✓ Disconnected! Status: ${client.getStatus()}\n`);

    console.log('=== All Tests Passed! ===\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log('✓ Cleaned up temp directory\n');
    } catch (error) {
      console.error('Failed to cleanup:', error);
    }
  }
}

runManualTests().catch(console.error);
