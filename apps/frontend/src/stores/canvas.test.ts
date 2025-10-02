import { describe, it, expect, beforeEach, vi } from 'vitest';

import { apiClient } from '../lib/api-client';
import { useCanvasStore } from './canvas';

// Mock API client
vi.mock('../lib/api-client', () => ({
  apiClient: {
    saveFlowCoordinates: vi.fn(),
    getFlowCoordinates: vi.fn(),
  },
}));

describe('Canvas Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useCanvasStore.setState({
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodeId: null,
    });
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with empty state', () => {
    const state = useCanvasStore.getState();

    expect(state.nodes).toEqual([]);
    expect(state.edges).toEqual([]);
    expect(state.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    expect(state.selectedNodeId).toBeNull();
  });

  it('should add node to canvas', () => {
    const { actions } = useCanvasStore.getState();

    actions.addNode('agent', { x: 100, y: 100 });

    const state = useCanvasStore.getState();
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0].type).toBe('agent');
    expect(state.nodes[0].position).toEqual({ x: 100, y: 100 });
    expect(state.nodes[0].data.label).toBe('New agent');
  });

  it('should update node properties', () => {
    const { actions } = useCanvasStore.getState();

    // Add a node first
    actions.addNode('agent', { x: 100, y: 100 });
    const nodeId = useCanvasStore.getState().nodes[0].id;

    // Update the node
    actions.updateNode(nodeId, {
      label: 'Updated Agent',
      description: 'Test description',
    });

    const state = useCanvasStore.getState();
    expect(state.nodes[0].data.label).toBe('Updated Agent');
    expect(state.nodes[0].data.description).toBe('Test description');
  });

  it('should delete node and connected edges', () => {
    const { actions } = useCanvasStore.getState();

    // Add two nodes
    actions.addNode('agent', { x: 100, y: 100 });
    actions.addNode('subagent', { x: 300, y: 100 });

    const state1 = useCanvasStore.getState();
    const node1Id = state1.nodes[0].id;
    const node2Id = state1.nodes[1].id;

    // Add edge between them
    actions.addEdge(node1Id, node2Id);

    // Delete first node
    actions.deleteNode(node1Id);

    const state2 = useCanvasStore.getState();
    expect(state2.nodes).toHaveLength(1);
    expect(state2.nodes[0].id).toBe(node2Id);
    expect(state2.edges).toHaveLength(0); // Edge should be deleted too
  });

  it('should add edge between nodes', () => {
    const { actions } = useCanvasStore.getState();

    // Add two nodes
    actions.addNode('agent', { x: 100, y: 100 });
    actions.addNode('subagent', { x: 300, y: 100 });

    const state1 = useCanvasStore.getState();
    const node1Id = state1.nodes[0].id;
    const node2Id = state1.nodes[1].id;

    // Add edge
    actions.addEdge(node1Id, node2Id);

    const state2 = useCanvasStore.getState();
    expect(state2.edges).toHaveLength(1);
    expect(state2.edges[0].source).toBe(node1Id);
    expect(state2.edges[0].target).toBe(node2Id);
  });

  it('should prevent invalid connections', () => {
    const { actions } = useCanvasStore.getState();

    // This test verifies that duplicate edges are not created
    actions.addNode('agent', { x: 100, y: 100 });
    actions.addNode('subagent', { x: 300, y: 100 });

    const state1 = useCanvasStore.getState();
    const node1Id = state1.nodes[0].id;
    const node2Id = state1.nodes[1].id;

    // Add edge twice
    actions.addEdge(node1Id, node2Id);
    actions.addEdge(node1Id, node2Id);

    const state2 = useCanvasStore.getState();
    expect(state2.edges).toHaveLength(1); // Should only have one edge
  });

  it('should update viewport on zoom/pan', () => {
    const { actions } = useCanvasStore.getState();

    actions.setViewport({ x: 100, y: 200, zoom: 1.5 });

    const state = useCanvasStore.getState();
    expect(state.viewport).toEqual({ x: 100, y: 200, zoom: 1.5 });
  });

  it('should load workflow from API', async () => {
    const mockCoordinates = {
      version: '1.0' as const,
      nodes: [
        {
          id: 'node-1',
          type: 'agent',
          position: { x: 100, y: 100 },
          data: { label: 'Test Agent' },
        },
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    vi.mocked(apiClient.getFlowCoordinates).mockResolvedValue(mockCoordinates);

    const { actions } = useCanvasStore.getState();
    await actions.loadFromProject('test-project-id');

    const state = useCanvasStore.getState();
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0].id).toBe('node-1');
    expect(apiClient.getFlowCoordinates).toHaveBeenCalledWith(
      'test-project-id',
    );
  });

  it('should persist workflow to backend', async () => {
    vi.mocked(apiClient.saveFlowCoordinates).mockResolvedValue();

    const { actions } = useCanvasStore.getState();

    // Add some nodes and edges
    actions.addNode('agent', { x: 100, y: 100 });
    actions.addNode('subagent', { x: 300, y: 100 });

    const state1 = useCanvasStore.getState();
    const node1Id = state1.nodes[0].id;
    const node2Id = state1.nodes[1].id;

    actions.addEdge(node1Id, node2Id);

    // Save to project
    await actions.saveToProject('test-project-id');

    expect(apiClient.saveFlowCoordinates).toHaveBeenCalledWith(
      'test-project-id',
      expect.objectContaining({
        version: '1.0',
        nodes: expect.any(Array),
        edges: expect.any(Array),
        viewport: expect.any(Object),
      }),
    );
  });

  it('should validate canvas and return errors', () => {
    const { actions } = useCanvasStore.getState();

    // Empty canvas should be invalid
    let result = actions.validateCanvas();
    expect(result.valid).toBe(false);
    expect(
      result.errors.some(e => e.message.includes('Agent node is required')),
    ).toBe(true);

    // Add an agent node
    actions.addNode('agent', { x: 100, y: 100 });

    // Now it should be valid
    result = actions.validateCanvas();
    expect(result.valid).toBe(true);
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
  });

  it('should select and deselect nodes', () => {
    const { actions } = useCanvasStore.getState();

    actions.addNode('agent', { x: 100, y: 100 });
    const nodeId = useCanvasStore.getState().nodes[0].id;

    // Select node
    actions.selectNode(nodeId);
    expect(useCanvasStore.getState().selectedNodeId).toBe(nodeId);

    // Deselect node
    actions.selectNode(null);
    expect(useCanvasStore.getState().selectedNodeId).toBeNull();
  });

  it('should handle zoom in/out operations', () => {
    const { actions } = useCanvasStore.getState();

    // Zoom in
    actions.zoomIn();
    expect(useCanvasStore.getState().viewport.zoom).toBeGreaterThan(1);

    // Zoom out
    const currentZoom = useCanvasStore.getState().viewport.zoom;
    actions.zoomOut();
    expect(useCanvasStore.getState().viewport.zoom).toBeLessThan(currentZoom);
  });

  it('should delete edge by id', () => {
    const { actions } = useCanvasStore.getState();

    // Add nodes and edge
    actions.addNode('agent', { x: 100, y: 100 });
    actions.addNode('subagent', { x: 300, y: 100 });

    const state1 = useCanvasStore.getState();
    const node1Id = state1.nodes[0].id;
    const node2Id = state1.nodes[1].id;

    actions.addEdge(node1Id, node2Id);

    const edgeId = useCanvasStore.getState().edges[0].id;

    // Delete edge
    actions.deleteEdge(edgeId);

    expect(useCanvasStore.getState().edges).toHaveLength(0);
  });
});
