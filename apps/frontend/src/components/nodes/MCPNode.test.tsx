import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MCPNode } from './MCPNode';
import { ReactFlowProvider } from 'reactflow';

const renderNode = (data: any, selected = false) => {
  return render(
    <ReactFlowProvider>
      <MCPNode
        id="test-1"
        type="mcp"
        data={data}
        selected={selected}
        isConnectable={true}
        xPos={0}
        yPos={0}
        dragging={false}
        zIndex={1}
      />
    </ReactFlowProvider>,
  );
};

describe('MCPNode', () => {
  it('should render MCP server name', () => {
    const data = {
      name: 'GitHub MCP',
      serverCommand: 'npx @modelcontextprotocol/server-github',
      toolsEnabled: ['search_repositories', 'create_issue'],
      status: 'connected' as const,
      credentialsConfigured: true,
    };

    renderNode(data);

    expect(screen.getByText('GitHub MCP')).toBeTruthy();
  });

  it('should display connected status', () => {
    const data = {
      name: 'Test MCP',
      serverCommand: 'mcp-server',
      toolsEnabled: [],
      status: 'connected' as const,
      credentialsConfigured: true,
    };

    const { container } = renderNode(data);

    expect(screen.getByText('🟢')).toBeTruthy();
    expect(screen.getByText('Connected')).toBeTruthy();
    const statusIndicator = container.querySelector('.bg-green-500');
    expect(statusIndicator).toBeTruthy();
  });

  it('should display disconnected status', () => {
    const data = {
      name: 'Test MCP',
      serverCommand: 'mcp-server',
      toolsEnabled: [],
      status: 'disconnected' as const,
      credentialsConfigured: false,
    };

    const { container } = renderNode(data);

    expect(screen.getByText('🔴')).toBeTruthy();
    expect(screen.getByText('Disconnected')).toBeTruthy();
    const statusIndicator = container.querySelector('.bg-gray-500');
    expect(statusIndicator).toBeTruthy();
  });

  it('should display error status', () => {
    const data = {
      name: 'Test MCP',
      serverCommand: 'mcp-server',
      toolsEnabled: [],
      status: 'error' as const,
      credentialsConfigured: true,
      error: 'Connection failed',
    };

    const { container } = renderNode(data);

    expect(screen.getByText('🔴')).toBeTruthy();
    expect(screen.getByText('Error')).toBeTruthy();
    const statusIndicator = container.querySelector('.bg-red-500');
    expect(statusIndicator).toBeTruthy();
  });

  it('should display tool count', () => {
    const data = {
      name: 'GitHub MCP',
      serverCommand: 'npx @modelcontextprotocol/server-github',
      toolsEnabled: ['search_repositories', 'create_issue', 'list_issues'],
      status: 'connected' as const,
      credentialsConfigured: true,
    };

    renderNode(data);

    expect(screen.getByText('Tools:')).toBeTruthy();
    expect(screen.getByText('3 enabled')).toBeTruthy();
  });

  it('should show credentials configured indicator', () => {
    const data = {
      name: 'Test MCP',
      serverCommand: 'mcp-server',
      toolsEnabled: [],
      status: 'connected' as const,
      credentialsConfigured: true,
    };

    renderNode(data);

    expect(screen.getByText('🔐')).toBeTruthy();
    expect(screen.getByText('Configured')).toBeTruthy();
  });

  it('should show credentials not configured indicator', () => {
    const data = {
      name: 'Test MCP',
      serverCommand: 'mcp-server',
      toolsEnabled: [],
      status: 'disconnected' as const,
      credentialsConfigured: false,
    };

    renderNode(data);

    expect(screen.getByText('🔓')).toBeTruthy();
    expect(screen.getByText('Not configured')).toBeTruthy();
  });

  it('should display server command preview', () => {
    const data = {
      name: 'GitHub MCP',
      serverCommand: 'npx @modelcontextprotocol/server-github',
      toolsEnabled: [],
      status: 'connected' as const,
      credentialsConfigured: true,
    };

    renderNode(data);

    expect(
      screen.getByText(/npx @modelcontextprotocol\/server-github/),
    ).toBeTruthy();
  });

  it('should display error message when status is error', () => {
    const data = {
      name: 'Test MCP',
      serverCommand: 'mcp-server',
      toolsEnabled: [],
      status: 'error' as const,
      credentialsConfigured: true,
      error: 'Failed to connect to server',
    };

    renderNode(data);

    expect(screen.getByText(/Failed to connect to server/)).toBeTruthy();
  });

  it('should display last checked time when available', () => {
    const data = {
      name: 'Test MCP',
      serverCommand: 'mcp-server',
      toolsEnabled: [],
      status: 'connected' as const,
      credentialsConfigured: true,
      lastChecked: new Date('2025-01-15T10:30:00Z'),
    };

    renderNode(data);

    expect(screen.getByText('Last checked:')).toBeTruthy();
  });

  it('should highlight when selected', () => {
    const data = {
      name: 'Test MCP',
      serverCommand: 'mcp-server',
      toolsEnabled: [],
      status: 'connected' as const,
      credentialsConfigured: true,
    };

    const { container } = renderNode(data, true);

    const node = container.querySelector('.border-orange-500');
    expect(node).toBeTruthy();
  });

  it('should apply orange gradient background', () => {
    const data = {
      name: 'Test MCP',
      serverCommand: 'mcp-server',
      toolsEnabled: [],
      status: 'connected' as const,
      credentialsConfigured: true,
    };

    const { container } = renderNode(data);

    const node = container.querySelector('.from-orange-900.to-orange-800');
    expect(node).toBeTruthy();
  });

  it('should be keyboard accessible with ARIA labels', () => {
    const data = {
      name: 'GitHub MCP',
      serverCommand: 'npx @modelcontextprotocol/server-github',
      toolsEnabled: ['search_repositories'],
      status: 'connected' as const,
      credentialsConfigured: true,
    };

    renderNode(data);

    expect(screen.getByRole('article')).toBeTruthy();
    expect(screen.getByLabelText('MCP node: GitHub MCP')).toBeTruthy();
  });

  it('should show handles for connections', () => {
    const data = {
      name: 'Test MCP',
      serverCommand: 'mcp-server',
      toolsEnabled: [],
      status: 'connected' as const,
      credentialsConfigured: true,
    };

    const { container } = renderNode(data);

    const handles = container.querySelectorAll('.react-flow__handle');
    expect(handles.length).toBe(2);
  });

  it('should display MCP icon', () => {
    const data = {
      name: 'Test MCP',
      serverCommand: 'mcp-server',
      toolsEnabled: [],
      status: 'connected' as const,
      credentialsConfigured: true,
    };

    renderNode(data);

    expect(screen.getByText('🔌')).toBeTruthy();
  });

  it('should handle multiple enabled tools', () => {
    const data = {
      name: 'GitHub MCP',
      serverCommand: 'npx @modelcontextprotocol/server-github',
      toolsEnabled: ['tool1', 'tool2', 'tool3', 'tool4', 'tool5'],
      status: 'connected' as const,
      credentialsConfigured: true,
    };

    renderNode(data);

    expect(screen.getByText('5 enabled')).toBeTruthy();
  });
});
