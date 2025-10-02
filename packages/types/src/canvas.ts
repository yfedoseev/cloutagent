// Canvas state types (compatible with ReactFlow)
export interface CanvasNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: CanvasViewport;
}

export interface UICoordinates {
  canvasState: CanvasState;
  zoom: number;
  selectedNodeId: string | null;
  editorPreferences: {
    theme: 'light' | 'dark';
    gridEnabled: boolean;
    minimapEnabled: boolean;
    snapToGrid: boolean;
  };
}

// Storage format for .ui/flow-coordinates.json
export interface FlowCoordinatesFile {
  version: '1.0';
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, any>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type?: string;
  }>;
  viewport: { x: number; y: number; zoom: number };
}
