import { create } from 'zustand';
import { Node, Edge, Viewport } from 'reactflow';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ICanvasActions,
  CanvasState,
  NodeType,
  FlowCoordinatesFile,
} from '@cloutagent/types';
import { apiClient } from '../lib/api-client';

interface CanvasStore extends CanvasState {
  selectedNodeId: string | null;
  actions: ICanvasActions;
}

export const useCanvasStore = create<CanvasStore>()(
  persist(
    immer((set, get) => ({
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodeId: null,

      actions: {
        addNode: (type: NodeType, position: { x: number; y: number }) => {
          set(state => {
            // Create node with valid default configuration
            // Note: Backend validation expects data.config for most fields
            const defaultConfigs: Record<NodeType, any> = {
              agent: {
                config: {
                  name: 'Claude Agent',
                  model: 'claude-sonnet-4-5',
                  systemPrompt: 'You are a helpful AI assistant.',
                  temperature: 1.0,
                  maxTokens: 4096,
                },
              },
              subagent: {
                config: {
                  name: 'Unnamed Subagent',
                  type: 'code-reviewer',
                  prompt: 'Review code for best practices and potential issues.',
                },
              },
              hook: {
                config: {
                  name: 'Unnamed Hook',
                  event: 'on-start',
                  action: 'log',
                },
              },
              mcp: {
                config: {
                  name: 'Unnamed Tool',
                  toolName: '',
                  description: '',
                },
              },
            };

            const newNode: Node = {
              id: `${type}-${Date.now()}`,
              type,
              position,
              data: defaultConfigs[type] || { label: `New ${type}` },
            };
            state.nodes.push(newNode);
          });
        },

        updateNode: (id: string, data: Partial<any>) => {
          set(state => {
            const node = state.nodes.find((n: Node) => n.id === id);
            if (node) {
              node.data = { ...node.data, ...data };
            }
          });
        },

        deleteNode: (id: string) => {
          set(state => {
            state.nodes = state.nodes.filter((node: Node) => node.id !== id);
            state.edges = state.edges.filter(
              (edge: Edge) => edge.source !== id && edge.target !== id,
            );
          });
        },

        duplicateNode: (id: string) => {
          set(state => {
            const node = state.nodes.find((n: Node) => n.id === id);
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

            state.nodes.push(newNode);
          });
        },

        selectNode: (id: string | null) => {
          set({ selectedNodeId: id });
        },

        addEdge: (source: string, target: string) => {
          set(state => {
            const edgeId = `edge-${source}-${target}`;

            // Prevent duplicate edges
            const edgeExists = state.edges.some(
              (e: Edge) => e.source === source && e.target === target,
            );

            if (!edgeExists) {
              const newEdge: Edge = {
                id: edgeId,
                source,
                target,
              };
              state.edges.push(newEdge);
            }
          });
        },

        deleteEdge: (id: string) => {
          set(state => {
            state.edges = state.edges.filter((edge: Edge) => edge.id !== id);
          });
        },

        setViewport: (viewport: Viewport) => {
          set({ viewport });
        },

        zoomIn: () => {
          set(state => {
            state.viewport.zoom = Math.min(state.viewport.zoom * 1.2, 2);
          });
        },

        zoomOut: () => {
          set(state => {
            state.viewport.zoom = Math.max(state.viewport.zoom * 0.8, 0.1);
          });
        },

        fitView: () => {
          // This would typically be implemented with ReactFlow's fitView function
          // For now, reset viewport
          set(state => {
            state.viewport = { x: 0, y: 0, zoom: 1 };
          });
        },

        saveToProject: async (projectId: string) => {
          const { nodes, edges, viewport } = get();

          const coordinates: FlowCoordinatesFile = {
            version: '1.0',
            nodes: nodes.map(node => ({
              id: node.id,
              type: node.type || 'default',
              position: node.position,
              data: node.data,
            })),
            edges: edges.map(edge => ({
              id: edge.id,
              source: edge.source,
              target: edge.target,
              type: edge.type,
            })),
            viewport: {
              x: viewport.x,
              y: viewport.y,
              zoom: viewport.zoom,
            },
          };

          await apiClient.saveFlowCoordinates(projectId, coordinates);
        },

        loadFromProject: async (projectId: string) => {
          const coordinates = await apiClient.getFlowCoordinates(projectId);

          set({
            nodes: coordinates.nodes as Node[],
            edges: coordinates.edges as Edge[],
            viewport: coordinates.viewport,
          });
        },

        validateCanvas: () => {
          const { nodes, edges } = get();
          const errors: Array<{
            nodeId?: string;
            edgeId?: string;
            message: string;
            severity: 'error' | 'warning';
          }> = [];

          // Check for at least one agent node
          const agentNodes = nodes.filter((n: Node) => n.type === 'agent');
          if (agentNodes.length === 0) {
            errors.push({
              message: 'At least one Agent node is required',
              severity: 'error',
            });
          }

          // Check for required fields in each node
          nodes.forEach((node: Node) => {
            if (!node.data.label) {
              errors.push({
                nodeId: node.id,
                message: 'Node label is required',
                severity: 'error',
              });
            }
          });

          // Check for disconnected nodes (warnings)
          nodes.forEach((node: Node) => {
            const hasConnection = edges.some(
              (e: Edge) => e.source === node.id || e.target === node.id,
            );
            if (!hasConnection && node.type !== 'agent') {
              errors.push({
                nodeId: node.id,
                message: 'Node is not connected',
                severity: 'warning',
              });
            }
          });

          return {
            valid: errors.filter(e => e.severity === 'error').length === 0,
            errors,
          };
        },
      },
    })),
    {
      name: 'canvas-storage',
      partialize: state => ({
        nodes: state.nodes,
        edges: state.edges,
        viewport: state.viewport,
      }),
    },
  ),
);
