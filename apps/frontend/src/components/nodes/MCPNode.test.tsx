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

  // ============================================================
  // ENHANCED TESTS - TDD Cycle 1.1
  // ============================================================

  describe('Critical Bug Fix - Undefined toolsEnabled', () => {
    it('should handle undefined toolsEnabled gracefully', () => {
      const data = {
        name: 'Test MCP',
        serverCommand: 'npx mcp-server',
        // toolsEnabled intentionally undefined
        status: 'connected' as const,
        credentialsConfigured: true,
      };

      // Should not throw error
      renderNode(data);

      expect(screen.getByText('Test MCP')).toBeTruthy();
      expect(screen.getByText('0 enabled')).toBeTruthy();
    });

    it('should handle null toolsEnabled gracefully', () => {
      const data = {
        name: 'Test MCP',
        serverCommand: 'npx mcp-server',
        toolsEnabled: null as any,
        status: 'connected' as const,
        credentialsConfigured: true,
      };

      renderNode(data);

      expect(screen.getByText('Test MCP')).toBeTruthy();
      expect(screen.getByText('0 enabled')).toBeTruthy();
    });

    it('should handle empty array toolsEnabled', () => {
      const data = {
        name: 'Test MCP',
        serverCommand: 'npx mcp-server',
        toolsEnabled: [],
        status: 'connected' as const,
        credentialsConfigured: true,
      };

      renderNode(data);

      expect(screen.getByText('0 enabled')).toBeTruthy();
    });
  });

  describe('Enhanced Validation Display', () => {
    it('should not show validation badge when no errors', () => {
      const data = {
        name: 'Test MCP',
        serverCommand: 'npx mcp-server',
        toolsEnabled: [],
        status: 'connected' as const,
        credentialsConfigured: true,
        validationErrors: [],
      };

      const { container } = renderNode(data);
      const validationBadge = container.querySelector('.absolute.-top-2.-right-2');
      expect(validationBadge).toBeFalsy();
    });

    it('should show validation error badge', () => {
      const data = {
        name: 'Test MCP',
        serverCommand: 'npx mcp-server',
        toolsEnabled: [],
        status: 'error' as const,
        credentialsConfigured: false,
        validationErrors: [
          { field: 'credentials', message: 'Credentials required', severity: 'error' as const },
        ],
      };

      const { container } = renderNode(data);
      const errorBadge = container.querySelector('.bg-red-500');
      expect(errorBadge).toBeTruthy();
    });

    it('should display error count', () => {
      const data = {
        name: 'Test MCP',
        serverCommand: 'npx mcp-server',
        toolsEnabled: [],
        status: 'error' as const,
        credentialsConfigured: false,
        validationErrors: [
          { field: 'serverCommand', message: 'Command required', severity: 'error' as const },
          { field: 'credentials', message: 'Credentials required', severity: 'error' as const },
        ],
      };

      const { container } = renderNode(data);
      const errorBadge = container.querySelector('.bg-red-500');
      expect(errorBadge?.textContent).toBe('2');
    });

    it('should show warning badge', () => {
      const data = {
        name: 'Test MCP',
        serverCommand: 'npx mcp-server',
        toolsEnabled: [],
        status: 'connected' as const,
        credentialsConfigured: true,
        validationErrors: [
          { field: 'toolsEnabled', message: 'No tools enabled', severity: 'warning' as const },
        ],
      };

      const { container } = renderNode(data);
      const warningBadge = container.querySelector('.bg-yellow-500');
      expect(warningBadge).toBeTruthy();
    });
  });

  describe('Enhanced Connection Handles', () => {
    it('should have orange handle styling', () => {
      const data = {
        name: 'Test MCP',
        serverCommand: 'npx mcp-server',
        toolsEnabled: ['tool1'],
        status: 'connected' as const,
        credentialsConfigured: true,
      };

      const { container } = renderNode(data);
      const handles = container.querySelectorAll('.react-flow__handle');

      handles.forEach((handle) => {
        expect(handle.classList.contains('!bg-orange-400')).toBe(true);
      });
    });

    it('should have accessibility labels for handles', () => {
      const data = {
        name: 'Test MCP',
        serverCommand: 'npx mcp-server',
        toolsEnabled: [],
        status: 'connected' as const,
        credentialsConfigured: true,
      };

      renderNode(data);

      const inputHandle = screen.getByLabelText('Input connection');
      const outputHandle = screen.getByLabelText('Output connection');

      expect(inputHandle).toBeTruthy();
      expect(outputHandle).toBeTruthy();
    });

    it('should render input handle at top position', () => {
      const data = {
        name: 'Test MCP',
        serverCommand: 'npx mcp-server',
        toolsEnabled: [],
        status: 'connected' as const,
        credentialsConfigured: true,
      };

      const { container } = renderNode(data);
      const handles = container.querySelectorAll('.react-flow__handle');
      const targetHandle = Array.from(handles).find(
        (h) => h.classList.contains('react-flow__handle-top'),
      );

      expect(targetHandle).toBeTruthy();
    });

    it('should render output handle at bottom position', () => {
      const data = {
        name: 'Test MCP',
        serverCommand: 'npx mcp-server',
        toolsEnabled: [],
        status: 'connected' as const,
        credentialsConfigured: true,
      };

      const { container } = renderNode(data);
      const handles = container.querySelectorAll('.react-flow__handle');
      const sourceHandle = Array.from(handles).find(
        (h) => h.classList.contains('react-flow__handle-bottom'),
      );

      expect(sourceHandle).toBeTruthy();
    });
  });

  describe('Enhanced Selection State', () => {
    it('should apply orange selection shadow glow', () => {
      const data = {
        name: 'Test MCP',
        serverCommand: 'npx mcp-server',
        toolsEnabled: [],
        status: 'connected' as const,
        credentialsConfigured: true,
      };

      const { container } = renderNode(data, true);
      const node = container.querySelector('.shadow-orange-500\\/50');
      expect(node).toBeTruthy();
    });

    it('should not apply selection styles when not selected', () => {
      const data = {
        name: 'Test MCP',
        serverCommand: 'npx mcp-server',
        toolsEnabled: [],
        status: 'connected' as const,
        credentialsConfigured: true,
      };

      const { container } = renderNode(data, false);
      const node = container.querySelector('.border-gray-700');
      expect(node).toBeTruthy();

      const selectedNode = container.querySelector('.border-orange-500');
      expect(selectedNode).toBeFalsy();
    });

    it('should apply hover shadow effect', () => {
      const data = {
        name: 'Test MCP',
        serverCommand: 'npx mcp-server',
        toolsEnabled: [],
        status: 'connected' as const,
        credentialsConfigured: true,
      };

      const { container } = renderNode(data);
      const node = container.querySelector('.hover\\:shadow-xl');
      expect(node).toBeTruthy();
    });
  });

  describe('Enhanced Node Structure', () => {
    it('should have proper sizing constraints', () => {
      const data = {
        name: 'Test MCP',
        serverCommand: 'npx mcp-server',
        toolsEnabled: [],
        status: 'connected' as const,
        credentialsConfigured: true,
      };

      const { container } = renderNode(data);

      const node = container.querySelector('.min-w-\\[240px\\]');
      expect(node).toBeTruthy();

      const maxWidth = container.querySelector('.max-w-\\[320px\\]');
      expect(maxWidth).toBeTruthy();
    });

    it('should not render "undefined" text anywhere', () => {
      const data = {
        name: 'Valid MCP',
        serverCommand: 'npx mcp-server',
        toolsEnabled: [],
        status: 'connected' as const,
        credentialsConfigured: true,
      };

      const { container } = renderNode(data);
      const bodyText = container.textContent || '';

      expect(bodyText).not.toContain('undefined');
    });
  });

  describe('Server Connection Status', () => {
    it('should show different status indicator colors', () => {
      const statuses: Array<'connected' | 'disconnected' | 'error'> = ['connected', 'disconnected', 'error'];

      statuses.forEach(status => {
        const data = {
          name: `MCP ${status}`,
          serverCommand: 'npx mcp-server',
          toolsEnabled: [],
          status,
          credentialsConfigured: true,
        };

        const { container, unmount } = renderNode(data);

        if (status === 'connected') {
          const indicator = container.querySelector('.bg-green-500');
          expect(indicator).toBeTruthy();
        } else if (status === 'disconnected') {
          const indicator = container.querySelector('.bg-gray-500');
          expect(indicator).toBeTruthy();
        } else if (status === 'error') {
          const indicator = container.querySelector('.bg-red-500');
          expect(indicator).toBeTruthy();
        }

        unmount();
      });
    });

    it('should display appropriate status icons', () => {
      const data = {
        name: 'Test MCP',
        serverCommand: 'npx mcp-server',
        toolsEnabled: [],
        status: 'connected' as const,
        credentialsConfigured: true,
      };

      renderNode(data);

      expect(screen.getByText('🟢')).toBeTruthy();
      expect(screen.getByText('Connected')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should render with minimal data', () => {
      const data = {
        name: 'Minimal MCP',
        serverCommand: 'npx mcp',
        toolsEnabled: [],
        status: 'disconnected' as const,
        credentialsConfigured: false,
      };

      renderNode(data);

      expect(screen.getByText('Minimal MCP')).toBeTruthy();
      expect(screen.getByText('Disconnected')).toBeTruthy();
    });

    it('should handle very long server commands', () => {
      const data = {
        name: 'Test MCP',
        serverCommand: 'npx @modelcontextprotocol/server-github --env production --port 8080 --config ./config.json',
        toolsEnabled: [],
        status: 'connected' as const,
        credentialsConfigured: true,
      };

      const { container } = renderNode(data);
      expect(container.textContent).toContain('npx @modelcontextprotocol/server-github');
    });

    it('should not display error when no error message provided', () => {
      const data = {
        name: 'Test MCP',
        serverCommand: 'npx mcp-server',
        toolsEnabled: [],
        status: 'error' as const,
        credentialsConfigured: true,
        // error message not provided
      };

      renderNode(data);

      expect(screen.queryByText(/⚠️/)).toBeFalsy();
    });

    it('should not display last checked when undefined', () => {
      const data = {
        name: 'Test MCP',
        serverCommand: 'npx mcp-server',
        toolsEnabled: [],
        status: 'connected' as const,
        credentialsConfigured: true,
        // lastChecked not provided
      };

      renderNode(data);

      expect(screen.queryByText('Last checked:')).toBeFalsy();
    });

    it('should handle large number of tools', () => {
      const data = {
        name: 'GitHub MCP',
        serverCommand: 'npx @modelcontextprotocol/server-github',
        toolsEnabled: Array.from({ length: 50 }, (_, i) => `tool_${i}`),
        status: 'connected' as const,
        credentialsConfigured: true,
      };

      renderNode(data);

      expect(screen.getByText('50 enabled')).toBeTruthy();
    });
  });
});
