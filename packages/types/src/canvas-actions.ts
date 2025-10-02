import { CanvasViewport } from './canvas';
import { NodeType, BaseNodeData } from './nodes';

export interface ICanvasActions {
  // Node operations
  addNode(type: NodeType, position: { x: number; y: number }): void;
  updateNode(id: string, data: Partial<BaseNodeData>): void;
  deleteNode(id: string): void;
  duplicateNode(id: string): void;
  selectNode(id: string | null): void;

  // Edge operations
  addEdge(source: string, target: string): void;
  deleteEdge(id: string): void;

  // Canvas operations
  setViewport(viewport: CanvasViewport): void;
  zoomIn(): void;
  zoomOut(): void;
  fitView(): void;

  // Persistence
  saveToProject(projectId: string): Promise<void>;
  loadFromProject(projectId: string): Promise<void>;

  // Validation
  validateCanvas(): ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    nodeId?: string;
    edgeId?: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
}
