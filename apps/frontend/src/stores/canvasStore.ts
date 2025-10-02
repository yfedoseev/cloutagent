import { create } from 'zustand';
import { Node, Edge, Viewport } from 'reactflow';
import {
  ICanvasActions,
  CanvasState,
  NodeType,
  BaseNodeData,
} from '@cloutagent/types';

interface CanvasStore extends CanvasState {
  actions: ICanvasActions;
  selectedNodeId: string | null;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNodeId: null,

  actions: {
    addNode: (type: NodeType, position: { x: number; y: number }) => {
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: `New ${type}` },
      };
      set(state => ({ nodes: [...state.nodes, newNode] }));
    },

    updateNode: (id: string, data: Partial<BaseNodeData>) => {
      set(state => ({
        nodes: state.nodes.map(node =>
          node.id === id ? { ...node, data: { ...node.data, ...data } } : node,
        ),
      }));
    },

    deleteNode: (id: string) => {
      set(state => ({
        nodes: state.nodes.filter(node => node.id !== id),
        edges: state.edges.filter(
          edge => edge.source !== id && edge.target !== id,
        ),
        selectedNodeId:
          state.selectedNodeId === id ? null : state.selectedNodeId,
      }));
    },

    duplicateNode: (id: string) => {
      const node = get().nodes.find(n => n.id === id);
      if (!node) return;

      const newNode: Node = {
        ...node,
        id: `${node.type}-${Date.now()}`,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        data: {
          ...node.data,
          config: {
            ...node.data.config,
            name: `${node.data.config?.name || 'Untitled'} (Copy)`,
          },
        },
      };

      set(state => ({ nodes: [...state.nodes, newNode] }));
    },

    selectNode: (id: string | null) => set({ selectedNodeId: id }),

    addEdge: (source: string, target: string) => {
      const newEdge: Edge = {
        id: `edge-${source}-${target}`,
        source,
        target,
      };
      set(state => ({ edges: [...state.edges, newEdge] }));
    },

    deleteEdge: (id: string) => {
      set(state => ({ edges: state.edges.filter(edge => edge.id !== id) }));
    },

    setViewport: (viewport: Viewport) => set({ viewport }),

    zoomIn: () => {
      set(state => ({
        viewport: {
          ...state.viewport,
          zoom: Math.min(state.viewport.zoom * 1.2, 2),
        },
      }));
    },

    zoomOut: () => {
      set(state => ({
        viewport: {
          ...state.viewport,
          zoom: Math.max(state.viewport.zoom / 1.2, 0.1),
        },
      }));
    },

    fitView: () => {
      set({ viewport: { x: 0, y: 0, zoom: 1 } });
    },

    saveToProject: async (projectId: string) => {
      const { nodes, edges, viewport } = get();
      const coordinates = { nodes, edges, viewport, version: '1.0' as const };
      // TODO: Call backend API when available
      void projectId;
      void coordinates;
    },

    loadFromProject: async (projectId: string) => {
      // TODO: Call backend API when available
      void projectId;
    },

    validateCanvas: () => {
      const { nodes } = get();
      const errors: Array<{
        nodeId?: string;
        edgeId?: string;
        message: string;
        severity: 'error' | 'warning';
      }> = [];

      // Check for at least one agent node
      const agentNodes = nodes.filter(n => n.type === 'agent');
      if (agentNodes.length === 0) {
        errors.push({
          message: 'At least one Agent node is required',
          severity: 'error',
        });
      }

      // Check for required fields
      nodes.forEach(node => {
        if (!node.data.label) {
          errors.push({
            nodeId: node.id,
            message: 'Node label is required',
            severity: 'error',
          });
        }
      });

      return {
        valid: errors.filter(e => e.severity === 'error').length === 0,
        errors,
      };
    },
  },
}));
