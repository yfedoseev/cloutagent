import { describe, it, expect, beforeEach } from 'vitest';
import { usePropertyPanelStore } from './propertyPanelStore';

describe('PropertyPanelStore', () => {
  beforeEach(() => {
    // Reset store before each test
    usePropertyPanelStore.setState({
      isOpen: false,
      nodeId: null,
      nodeType: null,
    });
  });

  it('should initialize with panel closed', () => {
    const state = usePropertyPanelStore.getState();

    expect(state.isOpen).toBe(false);
    expect(state.nodeId).toBe(null);
    expect(state.nodeType).toBe(null);
  });

  it('should open panel with node ID and type', () => {
    const { openPanel } = usePropertyPanelStore.getState();

    openPanel('agent-123', 'agent');

    const state = usePropertyPanelStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.nodeId).toBe('agent-123');
    expect(state.nodeType).toBe('agent');
  });

  it('should close panel and clear state', () => {
    const { openPanel, closePanel } = usePropertyPanelStore.getState();

    // First open the panel
    openPanel('subagent-456', 'subagent');
    expect(usePropertyPanelStore.getState().isOpen).toBe(true);

    // Then close it
    closePanel();

    const state = usePropertyPanelStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.nodeId).toBe(null);
    expect(state.nodeType).toBe(null);
  });

  it('should update node ID while keeping panel open', () => {
    const { openPanel, setNodeId } = usePropertyPanelStore.getState();

    openPanel('hook-789', 'hook');
    expect(usePropertyPanelStore.getState().nodeId).toBe('hook-789');

    setNodeId('mcp-101');

    const state = usePropertyPanelStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.nodeId).toBe('mcp-101');
    expect(state.nodeType).toBe('hook');
  });

  it('should handle opening panel with different node types', () => {
    const { openPanel } = usePropertyPanelStore.getState();

    // Test all four node types
    const nodeTypes = ['agent', 'subagent', 'hook', 'mcp'] as const;

    nodeTypes.forEach((type, index) => {
      openPanel(`${type}-${index}`, type);

      const state = usePropertyPanelStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.nodeId).toBe(`${type}-${index}`);
      expect(state.nodeType).toBe(type);
    });
  });

  it('should allow setting nodeId to null', () => {
    const { openPanel, setNodeId } = usePropertyPanelStore.getState();

    openPanel('agent-999', 'agent');
    setNodeId(null);

    const state = usePropertyPanelStore.getState();
    expect(state.nodeId).toBe(null);
    expect(state.isOpen).toBe(true); // Panel remains open
  });
});
