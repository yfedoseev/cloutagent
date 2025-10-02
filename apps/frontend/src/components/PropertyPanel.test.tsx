import { describe, it, expect, beforeEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { PropertyPanel } from './PropertyPanel';
import { usePropertyPanelStore } from '../stores/propertyPanelStore';
import { useCanvasStore } from '../stores/canvas';
import { ReactFlowProvider } from 'reactflow';

const renderPropertyPanel = () => {
  return render(
    <ReactFlowProvider>
      <PropertyPanel />
    </ReactFlowProvider>,
  );
};

describe('PropertyPanel', () => {
  beforeEach(() => {
    // Reset both stores before each test
    act(() => {
      usePropertyPanelStore.setState({
        isOpen: false,
        nodeId: null,
        nodeType: null,
      });

      useCanvasStore.setState({
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeId: null,
      });
    });
  });

  it('should be hidden by default', () => {
    renderPropertyPanel();

    const panel = document.getElementById('property-panel');
    expect(panel).toBe(null);
  });

  it('should slide in when opened', async () => {
    // Add a test node
    act(() => {
      useCanvasStore.setState({
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            position: { x: 0, y: 0 },
            data: {
              config: { name: 'Test Agent', model: 'claude-sonnet-4.5' },
            },
          },
        ],
      });
    });

    renderPropertyPanel();

    act(() => {
      usePropertyPanelStore.getState().openPanel('agent-1', 'agent');
    });

    await waitFor(() => {
      const panel = document.getElementById('property-panel');
      expect(panel).not.toBe(null);
      expect(panel?.classList.contains('translate-x-0')).toBe(true);
    });
  });

  it('should display correct node type in header', async () => {
    act(() => {
      useCanvasStore.setState({
        nodes: [
          {
            id: 'subagent-1',
            type: 'subagent',
            position: { x: 0, y: 0 },
            data: { config: { name: 'Test Subagent' } },
          },
        ],
      });
    });

    renderPropertyPanel();

    act(() => {
      usePropertyPanelStore.getState().openPanel('subagent-1', 'subagent');
    });

    await waitFor(() => {
      expect(screen.getByText('Properties')).toBeTruthy();
      expect(screen.getByText('subagent node')).toBeTruthy();
    });
  });

  it('should render AgentProperties for agent nodes', async () => {
    act(() => {
      useCanvasStore.setState({
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            position: { x: 0, y: 0 },
            data: { config: { name: 'Code Agent', model: 'claude-opus-4' } },
          },
        ],
      });
    });

    renderPropertyPanel();

    act(() => {
      usePropertyPanelStore.getState().openPanel('agent-1', 'agent');
    });

    await waitFor(() => {
      expect(screen.getByText('Basic Information')).toBeTruthy();
      expect(screen.getByText('Agent Name')).toBeTruthy();
    });
  });

  it('should render SubagentProperties for subagent nodes', async () => {
    act(() => {
      useCanvasStore.setState({
        nodes: [
          {
            id: 'subagent-1',
            type: 'subagent',
            position: { x: 0, y: 0 },
            data: { config: { name: 'Helper', type: 'frontend-engineer' } },
          },
        ],
      });
    });

    renderPropertyPanel();

    act(() => {
      usePropertyPanelStore.getState().openPanel('subagent-1', 'subagent');
    });

    await waitFor(() => {
      expect(screen.getByText('Subagent Name')).toBeTruthy();
    });
  });

  it('should render HookProperties for hook nodes', async () => {
    act(() => {
      useCanvasStore.setState({
        nodes: [
          {
            id: 'hook-1',
            type: 'hook',
            position: { x: 0, y: 0 },
            data: { config: { name: 'Pre Hook', type: 'pre-execution' } },
          },
        ],
      });
    });

    renderPropertyPanel();

    act(() => {
      usePropertyPanelStore.getState().openPanel('hook-1', 'hook');
    });

    await waitFor(() => {
      expect(screen.getByText('Hook Name')).toBeTruthy();
    });
  });

  it('should render MCPProperties for mcp nodes', async () => {
    act(() => {
      useCanvasStore.setState({
        nodes: [
          {
            id: 'mcp-1',
            type: 'mcp',
            position: { x: 0, y: 0 },
            data: { config: { name: 'File Server', type: 'npx' } },
          },
        ],
      });
    });

    renderPropertyPanel();

    act(() => {
      usePropertyPanelStore.getState().openPanel('mcp-1', 'mcp');
    });

    await waitFor(() => {
      expect(screen.getByText('MCP Server Name')).toBeTruthy();
    });
  });

  it('should close when X button clicked', async () => {
    act(() => {
      useCanvasStore.setState({
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            position: { x: 0, y: 0 },
            data: { config: { name: 'Test' } },
          },
        ],
      });
    });

    renderPropertyPanel();

    act(() => {
      usePropertyPanelStore.getState().openPanel('agent-1', 'agent');
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Close panel')).toBeTruthy();
    });

    const closeButton = screen.getByLabelText('Close panel');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(usePropertyPanelStore.getState().isOpen).toBe(false);
    });
  });

  it('should close when clicking outside', async () => {
    act(() => {
      useCanvasStore.setState({
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            position: { x: 0, y: 0 },
            data: { config: { name: 'Test' } },
          },
        ],
      });
    });

    renderPropertyPanel();

    act(() => {
      usePropertyPanelStore.getState().openPanel('agent-1', 'agent');
    });

    await waitFor(() => {
      expect(document.getElementById('property-panel')).not.toBe(null);
    });

    // Click outside the panel
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(usePropertyPanelStore.getState().isOpen).toBe(false);
    });
  });

  it('should delete node and close on delete button', async () => {
    act(() => {
      useCanvasStore.setState({
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            position: { x: 0, y: 0 },
            data: { config: { name: 'To Delete' } },
          },
        ],
      });
    });

    renderPropertyPanel();

    act(() => {
      usePropertyPanelStore.getState().openPanel('agent-1', 'agent');
    });

    await waitFor(() => {
      expect(screen.getByText('Delete Node')).toBeTruthy();
    });

    const deleteButton = screen.getByText('Delete Node');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      // Node should be deleted
      expect(useCanvasStore.getState().nodes.length).toBe(0);
      // Panel should be closed
      expect(usePropertyPanelStore.getState().isOpen).toBe(false);
    });
  });

  it('should have proper ARIA attributes', async () => {
    act(() => {
      useCanvasStore.setState({
        nodes: [
          {
            id: 'agent-1',
            type: 'agent',
            position: { x: 0, y: 0 },
            data: { config: { name: 'Test' } },
          },
        ],
      });
    });

    renderPropertyPanel();

    act(() => {
      usePropertyPanelStore.getState().openPanel('agent-1', 'agent');
    });

    await waitFor(() => {
      const panel = document.getElementById('property-panel');
      expect(panel?.getAttribute('role')).toBe('dialog');
      expect(panel?.getAttribute('aria-label')).toBe('Node properties');
      expect(panel?.getAttribute('aria-modal')).toBe('true');
    });
  });

  it('should show unknown node type message for invalid types', async () => {
    act(() => {
      useCanvasStore.setState({
        nodes: [
          {
            id: 'unknown-1',
            type: 'unknown',
            position: { x: 0, y: 0 },
            data: { name: 'Unknown' },
          },
        ],
      });
    });

    renderPropertyPanel();

    act(() => {
      usePropertyPanelStore.getState().openPanel('unknown-1', 'unknown');
    });

    await waitFor(() => {
      expect(screen.getByText('Unknown node type')).toBeTruthy();
    });
  });
});
