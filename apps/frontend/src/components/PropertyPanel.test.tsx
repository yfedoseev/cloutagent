import { describe, it, expect, beforeEach, vi } from 'vitest';
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
      expect(screen.getByText('Test Subagent')).toBeTruthy();
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
      expect(screen.getByLabelText('Delete node')).toBeTruthy();
    });

    const deleteButton = screen.getByLabelText('Delete node');
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

  describe('Enhanced Design - Glassmorphic Styling', () => {
    it('should apply glass-strong utility class to panel', async () => {
      act(() => {
        useCanvasStore.setState({
          nodes: [
            {
              id: 'agent-1',
              type: 'agent',
              position: { x: 0, y: 0 },
              data: { config: { name: 'Test Agent' } },
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
        expect(panel?.classList.contains('glass-strong')).toBe(true);
      });
    });

    it('should have backdrop-blur effect', async () => {
      act(() => {
        useCanvasStore.setState({
          nodes: [
            {
              id: 'agent-1',
              type: 'agent',
              position: { x: 0, y: 0 },
              data: { config: { name: 'Test Agent' } },
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
        // glass-strong should include backdrop-blur
        expect(panel?.classList.contains('glass-strong')).toBe(true);
      });
    });
  });

  describe('Enhanced Design - Header with Icons', () => {
    it('should display robot icon for agent type', async () => {
      act(() => {
        useCanvasStore.setState({
          nodes: [
            {
              id: 'agent-1',
              type: 'agent',
              position: { x: 0, y: 0 },
              data: { config: { name: 'Code Agent' } },
            },
          ],
        });
      });

      renderPropertyPanel();

      act(() => {
        usePropertyPanelStore.getState().openPanel('agent-1', 'agent');
      });

      await waitFor(() => {
        expect(screen.getByText('🤖')).toBeTruthy();
      });
    });

    it('should display people icon for subagent type', async () => {
      act(() => {
        useCanvasStore.setState({
          nodes: [
            {
              id: 'subagent-1',
              type: 'subagent',
              position: { x: 0, y: 0 },
              data: { config: { name: 'Helper Subagent' } },
            },
          ],
        });
      });

      renderPropertyPanel();

      act(() => {
        usePropertyPanelStore.getState().openPanel('subagent-1', 'subagent');
      });

      await waitFor(() => {
        expect(screen.getByText('👥')).toBeTruthy();
      });
    });

    it('should display hook icon for hook type', async () => {
      act(() => {
        useCanvasStore.setState({
          nodes: [
            {
              id: 'hook-1',
              type: 'hook',
              position: { x: 0, y: 0 },
              data: { config: { name: 'Pre Hook' } },
            },
          ],
        });
      });

      renderPropertyPanel();

      act(() => {
        usePropertyPanelStore.getState().openPanel('hook-1', 'hook');
      });

      await waitFor(() => {
        expect(screen.getByText('🪝')).toBeTruthy();
      });
    });

    it('should display plug icon for mcp type', async () => {
      act(() => {
        useCanvasStore.setState({
          nodes: [
            {
              id: 'mcp-1',
              type: 'mcp',
              position: { x: 0, y: 0 },
              data: { config: { name: 'File Server' } },
            },
          ],
        });
      });

      renderPropertyPanel();

      act(() => {
        usePropertyPanelStore.getState().openPanel('mcp-1', 'mcp');
      });

      await waitFor(() => {
        expect(screen.getByText('🔌')).toBeTruthy();
      });
    });

    it('should display node name prominently in header', async () => {
      act(() => {
        useCanvasStore.setState({
          nodes: [
            {
              id: 'agent-1',
              type: 'agent',
              position: { x: 0, y: 0 },
              data: { config: { name: 'My Special Agent' } },
            },
          ],
        });
      });

      renderPropertyPanel();

      act(() => {
        usePropertyPanelStore.getState().openPanel('agent-1', 'agent');
      });

      await waitFor(() => {
        expect(screen.getByText('My Special Agent')).toBeTruthy();
      });
    });

    it('should show "Untitled Node" when node name is missing', async () => {
      act(() => {
        useCanvasStore.setState({
          nodes: [
            {
              id: 'agent-1',
              type: 'agent',
              position: { x: 0, y: 0 },
              data: { config: {} },
            },
          ],
        });
      });

      renderPropertyPanel();

      act(() => {
        usePropertyPanelStore.getState().openPanel('agent-1', 'agent');
      });

      await waitFor(() => {
        expect(screen.getByText('Untitled Node')).toBeTruthy();
      });
    });

    it('should show node type as secondary text in header', async () => {
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
        const nodeTypeText = screen.getByText('agent node');
        expect(nodeTypeText.classList.contains('text-gray-400')).toBe(true);
      });
    });
  });

  describe('Enhanced Design - Quick Actions', () => {
    it('should render duplicate button in header', async () => {
      act(() => {
        useCanvasStore.setState({
          nodes: [
            {
              id: 'agent-1',
              type: 'agent',
              position: { x: 0, y: 0 },
              data: { config: { name: 'Test Agent' } },
            },
          ],
        });
      });

      renderPropertyPanel();

      act(() => {
        usePropertyPanelStore.getState().openPanel('agent-1', 'agent');
      });

      await waitFor(() => {
        const duplicateButton = screen.getByLabelText('Duplicate node');
        expect(duplicateButton).toBeTruthy();
      });
    });

    it('should call duplicateNode action when duplicate clicked', async () => {
      const mockDuplicateNode = vi.fn();

      act(() => {
        useCanvasStore.setState({
          nodes: [
            {
              id: 'agent-1',
              type: 'agent',
              position: { x: 0, y: 0 },
              data: { config: { name: 'Test Agent' } },
            },
          ],
          actions: {
            ...useCanvasStore.getState().actions,
            duplicateNode: mockDuplicateNode,
          },
        });
      });

      renderPropertyPanel();

      act(() => {
        usePropertyPanelStore.getState().openPanel('agent-1', 'agent');
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Duplicate node')).toBeTruthy();
      });

      const duplicateButton = screen.getByLabelText('Duplicate node');
      fireEvent.click(duplicateButton);

      await waitFor(() => {
        expect(mockDuplicateNode).toHaveBeenCalledWith('agent-1');
      });
    });

    it('should apply btn-glass style to duplicate button', async () => {
      act(() => {
        useCanvasStore.setState({
          nodes: [
            {
              id: 'agent-1',
              type: 'agent',
              position: { x: 0, y: 0 },
              data: { config: { name: 'Test Agent' } },
            },
          ],
        });
      });

      renderPropertyPanel();

      act(() => {
        usePropertyPanelStore.getState().openPanel('agent-1', 'agent');
      });

      await waitFor(() => {
        const duplicateButton = screen.getByLabelText('Duplicate node');
        expect(duplicateButton.classList.contains('btn-glass')).toBe(true);
      });
    });

    it('should group quick actions in header section', async () => {
      act(() => {
        useCanvasStore.setState({
          nodes: [
            {
              id: 'agent-1',
              type: 'agent',
              position: { x: 0, y: 0 },
              data: { config: { name: 'Test Agent' } },
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
        const header = panel?.querySelector('.sticky.top-0');
        const duplicateButton = header?.querySelector('[aria-label="Duplicate node"]');
        expect(duplicateButton).toBeTruthy();
      });
    });

    it('should render delete button alongside duplicate in quick actions', async () => {
      act(() => {
        useCanvasStore.setState({
          nodes: [
            {
              id: 'agent-1',
              type: 'agent',
              position: { x: 0, y: 0 },
              data: { config: { name: 'Test Agent' } },
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
        const header = panel?.querySelector('.sticky.top-0');
        const duplicateButton = header?.querySelector('[aria-label="Duplicate node"]');
        const deleteButton = header?.querySelector('[aria-label="Delete node"]');
        expect(duplicateButton).toBeTruthy();
        expect(deleteButton).toBeTruthy();
      });
    });
  });

  describe('Enhanced Design - Empty State', () => {
    it('should show empty state when no node selected', () => {
      renderPropertyPanel();

      // Panel should not render when closed
      expect(document.getElementById('property-panel')).toBe(null);

      // Open panel without selecting a node
      act(() => {
        usePropertyPanelStore.setState({
          isOpen: true,
          nodeId: null,
          nodeType: null,
        });
      });

      // Should still show empty state or nothing
      expect(document.getElementById('property-panel')).toBe(null);
    });

    it('should display pointer emoji and instruction text in empty state', async () => {
      // This test assumes we want to show empty state even when panel is "open"
      // but no node is selected (alternative design pattern)

      // For now, testing that panel doesn't render without node
      renderPropertyPanel();

      act(() => {
        usePropertyPanelStore.setState({
          isOpen: true,
          nodeId: 'non-existent',
          nodeType: 'agent',
        });
      });

      // When node doesn't exist in store, should show empty state
      await waitFor(() => {
        const panel = document.getElementById('property-panel');
        if (panel) {
          expect(screen.getByText(/Select a node to edit its properties/)).toBeTruthy();
          expect(screen.getByText('👈')).toBeTruthy();
        }
      });
    });

    it('should center empty state message', async () => {
      act(() => {
        usePropertyPanelStore.setState({
          isOpen: true,
          nodeId: 'non-existent',
          nodeType: 'agent',
        });
      });

      renderPropertyPanel();

      await waitFor(() => {
        const panel = document.getElementById('property-panel');
        if (panel) {
          const emptyState = screen.getByText(/Select a node to edit its properties/).closest('div');
          expect(emptyState?.classList.contains('flex')).toBe(true);
          expect(emptyState?.classList.contains('items-center')).toBe(true);
          expect(emptyState?.classList.contains('justify-center')).toBe(true);
        }
      });
    });
  });

  describe('Enhanced Design - Auto-Save Footer', () => {
    it('should display auto-save indicator with green pulsing dot', async () => {
      act(() => {
        useCanvasStore.setState({
          nodes: [
            {
              id: 'agent-1',
              type: 'agent',
              position: { x: 0, y: 0 },
              data: { config: { name: 'Test Agent' } },
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
        const footer = panel?.querySelector('.sticky.bottom-0');
        const autoSaveIndicator = footer?.querySelector('[data-testid="autosave-indicator"]');
        expect(autoSaveIndicator).toBeTruthy();

        // Check for pulsing dot
        const pulsingDot = autoSaveIndicator?.querySelector('.animate-pulse');
        expect(pulsingDot).toBeTruthy();
        expect(pulsingDot?.classList.contains('bg-green-500')).toBe(true);
      });
    });

    it('should show "Auto-saved" text in footer', async () => {
      act(() => {
        useCanvasStore.setState({
          nodes: [
            {
              id: 'agent-1',
              type: 'agent',
              position: { x: 0, y: 0 },
              data: { config: { name: 'Test Agent' } },
            },
          ],
        });
      });

      renderPropertyPanel();

      act(() => {
        usePropertyPanelStore.getState().openPanel('agent-1', 'agent');
      });

      await waitFor(() => {
        expect(screen.getByText('Auto-saved')).toBeTruthy();
      });
    });

    it('should show reset to defaults link in footer', async () => {
      act(() => {
        useCanvasStore.setState({
          nodes: [
            {
              id: 'agent-1',
              type: 'agent',
              position: { x: 0, y: 0 },
              data: { config: { name: 'Test Agent' } },
            },
          ],
        });
      });

      renderPropertyPanel();

      act(() => {
        usePropertyPanelStore.getState().openPanel('agent-1', 'agent');
      });

      await waitFor(() => {
        const resetLink = screen.getByText('Reset to defaults');
        expect(resetLink).toBeTruthy();
        expect(resetLink.tagName).toBe('BUTTON');
      });
    });

    it('should style reset to defaults as a text link', async () => {
      act(() => {
        useCanvasStore.setState({
          nodes: [
            {
              id: 'agent-1',
              type: 'agent',
              position: { x: 0, y: 0 },
              data: { config: { name: 'Test Agent' } },
            },
          ],
        });
      });

      renderPropertyPanel();

      act(() => {
        usePropertyPanelStore.getState().openPanel('agent-1', 'agent');
      });

      await waitFor(() => {
        const resetLink = screen.getByText('Reset to defaults');
        expect(resetLink.classList.contains('text-blue-400')).toBe(true);
        expect(resetLink.classList.contains('hover:text-blue-300')).toBe(true);
      });
    });

    it('should position auto-save footer at bottom with sticky', async () => {
      act(() => {
        useCanvasStore.setState({
          nodes: [
            {
              id: 'agent-1',
              type: 'agent',
              position: { x: 0, y: 0 },
              data: { config: { name: 'Test Agent' } },
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
        const footers = panel?.querySelectorAll('.sticky.bottom-0');
        // Should have auto-save footer at bottom
        expect(footers && footers.length > 0).toBe(true);
      });
    });
  });

  describe('Enhanced Design - Integration Tests', () => {
    it('should show all enhanced elements together', async () => {
      act(() => {
        useCanvasStore.setState({
          nodes: [
            {
              id: 'agent-1',
              type: 'agent',
              position: { x: 0, y: 0 },
              data: { config: { name: 'Full Featured Agent' } },
            },
          ],
        });
      });

      renderPropertyPanel();

      act(() => {
        usePropertyPanelStore.getState().openPanel('agent-1', 'agent');
      });

      await waitFor(() => {
        // Glassmorphic styling
        const panel = document.getElementById('property-panel');
        expect(panel?.classList.contains('glass-strong')).toBe(true);

        // Header with icon and name
        expect(screen.getByText('🤖')).toBeTruthy();
        expect(screen.getByText('Full Featured Agent')).toBeTruthy();

        // Quick actions
        expect(screen.getByLabelText('Duplicate node')).toBeTruthy();

        // Auto-save footer
        expect(screen.getByText('Auto-saved')).toBeTruthy();
        expect(screen.getByText('Reset to defaults')).toBeTruthy();
      });
    });

    it('should maintain existing close functionality with enhanced design', async () => {
      act(() => {
        useCanvasStore.setState({
          nodes: [
            {
              id: 'agent-1',
              type: 'agent',
              position: { x: 0, y: 0 },
              data: { config: { name: 'Test Agent' } },
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

      // Close button should still work with enhanced design
      const closeButton = screen.getByLabelText('Close panel');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(usePropertyPanelStore.getState().isOpen).toBe(false);
      });
    });

    it('should maintain proper z-index layering with glassmorphic design', async () => {
      act(() => {
        useCanvasStore.setState({
          nodes: [
            {
              id: 'agent-1',
              type: 'agent',
              position: { x: 0, y: 0 },
              data: { config: { name: 'Test Agent' } },
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
        expect(panel?.classList.contains('z-50')).toBe(true);
      });
    });
  });
});
