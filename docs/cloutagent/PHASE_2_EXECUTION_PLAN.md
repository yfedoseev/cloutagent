# Phase 2: Visual Flow Builder - Detailed Execution Plan

**Duration**: Weeks 3-4
**Parallel Execution**: Up to 5 agents can work simultaneously
**Status**: Ready for execution after Phase 1 completion

---

## Dependencies from Phase 1

**Required Completions:**
- ✅ TASK-001: Shared types package with all interfaces
- ✅ TASK-005: REST API routes for projects
- ✅ TASK-010: Frontend API client

**Phase 2 builds on:**
- Project CRUD operations from backend
- TypeScript types from `@cloutagent/types`
- API client for fetching/saving projects

---

## Interface Contracts (Must be defined FIRST)

### IC-007: Canvas State Management Interface

```typescript
// packages/types/src/canvas.ts
import { Node, Edge, Viewport } from 'reactflow';

export interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
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
```

### IC-008: Node Type Definitions

```typescript
// packages/types/src/nodes.ts
export type NodeType = 'agent' | 'subagent' | 'hook' | 'mcp';

export interface BaseNodeData {
  label: string;
  description?: string;
}

export interface AgentNodeData extends BaseNodeData {
  config: AgentConfig;
  status?: 'idle' | 'running' | 'success' | 'error';
}

export interface SubagentNodeData extends BaseNodeData {
  config: SubagentConfig;
  status?: 'idle' | 'running' | 'success' | 'error';
}

export interface HookNodeData extends BaseNodeData {
  config: HookConfig;
  enabled: boolean;
}

export interface MCPNodeData extends BaseNodeData {
  config: MCPConfig;
  connected: boolean;
}

// Custom node props for ReactFlow
export type CustomNodeProps<T = BaseNodeData> = {
  id: string;
  data: T;
  selected: boolean;
};
```

### IC-009: Property Panel Interface

```typescript
// packages/types/src/property-panel.ts
export interface PropertyPanelState {
  isOpen: boolean;
  nodeId: string | null;
  nodeType: NodeType | null;
}

export interface PropertyPanelProps {
  nodeId: string;
  nodeType: NodeType;
  initialData: BaseNodeData;
  onSave: (data: BaseNodeData) => void;
  onClose: () => void;
}

// Form validation schemas (Zod)
export interface NodeValidationSchema {
  agent: z.ZodSchema<AgentNodeData>;
  subagent: z.ZodSchema<SubagentNodeData>;
  hook: z.ZodSchema<HookNodeData>;
  mcp: z.ZodSchema<MCPNodeData>;
}
```

### IC-010: Canvas Actions Interface

```typescript
// packages/types/src/canvas-actions.ts
export interface ICanvasActions {
  // Node operations
  addNode(type: NodeType, position: { x: number; y: number }): void;
  updateNode(id: string, data: Partial<BaseNodeData>): void;
  deleteNode(id: string): void;
  selectNode(id: string | null): void;

  // Edge operations
  addEdge(source: string, target: string): void;
  deleteEdge(id: string): void;

  // Canvas operations
  setViewport(viewport: Viewport): void;
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
```

---

## Task Breakdown

### Track 1: State Management & Core Setup

#### TASK-012: Zustand Store for Canvas State
**Agent**: `frontend-engineer`
**Priority**: P0 (Blocks all frontend tasks)
**Estimated Time**: 3 hours
**Dependencies**: Phase 1 TASK-001, TASK-010

**Description**:
Create Zustand store for managing canvas state (nodes, edges, viewport) with persistence to localStorage and backend.

**Files to Create**:
- `packages/types/src/canvas.ts` - IC-007 interface
- `packages/types/src/nodes.ts` - IC-008 interface
- `packages/types/src/property-panel.ts` - IC-009 interface
- `packages/types/src/canvas-actions.ts` - IC-010 interface
- `apps/frontend/src/stores/canvasStore.ts` - Zustand store implementation
- `apps/frontend/src/stores/canvasStore.test.ts` - Unit tests

**Implementation Skeleton**:
```typescript
// apps/frontend/src/stores/canvasStore.ts
import { create } from 'zustand';
import { Node, Edge, Viewport } from 'reactflow';
import { ICanvasActions, CanvasState } from '@cloutagent/types';
import { apiClient } from '../lib/api-client';

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
    addNode: (type, position) => {
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: `New ${type}` },
      };
      set((state) => ({ nodes: [...state.nodes, newNode] }));
    },

    updateNode: (id, data) => {
      set((state) => ({
        nodes: state.nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...data } } : node
        ),
      }));
    },

    deleteNode: (id) => {
      set((state) => ({
        nodes: state.nodes.filter((node) => node.id !== id),
        edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
      }));
    },

    selectNode: (id) => set({ selectedNodeId: id }),

    addEdge: (source, target) => {
      const newEdge: Edge = {
        id: `edge-${source}-${target}`,
        source,
        target,
      };
      set((state) => ({ edges: [...state.edges, newEdge] }));
    },

    deleteEdge: (id) => {
      set((state) => ({ edges: state.edges.filter((edge) => edge.id !== id) }));
    },

    saveToProject: async (projectId) => {
      const { nodes, edges, viewport } = get();
      const coordinates = { nodes, edges, viewport, version: '1.0' };
      // Call backend API to save .ui/flow-coordinates.json
      await apiClient.saveFlowCoordinates(projectId, coordinates);
    },

    loadFromProject: async (projectId) => {
      const coordinates = await apiClient.getFlowCoordinates(projectId);
      set({ nodes: coordinates.nodes, edges: coordinates.edges, viewport: coordinates.viewport });
    },

    validateCanvas: () => {
      const { nodes, edges } = get();
      const errors = [];

      // Check for disconnected agent nodes
      const agentNodes = nodes.filter((n) => n.type === 'agent');
      if (agentNodes.length === 0) {
        errors.push({ message: 'At least one Agent node is required', severity: 'error' });
      }

      // Check for required fields
      nodes.forEach((node) => {
        if (!node.data.label) {
          errors.push({ nodeId: node.id, message: 'Node label is required', severity: 'error' });
        }
      });

      return { valid: errors.filter((e) => e.severity === 'error').length === 0, errors };
    },
  },
}));
```

**Acceptance Criteria**:
- [ ] Implements `ICanvasActions` interface exactly
- [ ] Persists state to localStorage on changes
- [ ] Loads state from backend on mount
- [ ] Saves state to backend on demand
- [ ] Validation checks for required nodes
- [ ] Unit tests cover all actions
- [ ] Tests verify state updates correctly

**Test Cases**:
```typescript
describe('canvasStore', () => {
  test('addNode - adds node with correct structure');
  test('updateNode - updates only specified fields');
  test('deleteNode - removes node and connected edges');
  test('addEdge - creates edge between nodes');
  test('validateCanvas - returns errors for invalid state');
  test('saveToProject - calls API with correct data');
  test('loadFromProject - populates state from API');
});
```

---

#### TASK-013: Backend API for Flow Coordinates
**Agent**: `backend-engineer`
**Priority**: P0
**Estimated Time**: 2 hours
**Dependencies**: Phase 1 TASK-002, TASK-005

**Description**:
Add backend endpoints for saving/loading flow coordinates (`.ui/flow-coordinates.json`).

**Files to Modify**:
- `apps/backend/src/routes/projects.ts` - Add flow coordinate routes

**New Routes**:
```typescript
// GET /api/v1/projects/:id/flow-coordinates
router.get('/:id/flow-coordinates', authMiddleware.authenticate, async (req, res) => {
  const projectId = req.params.id;
  const coordinatesPath = path.join(getProjectPath(projectId), '.ui', 'flow-coordinates.json');

  if (!fs.existsSync(coordinatesPath)) {
    return res.json({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 }, version: '1.0' });
  }

  const coordinates = JSON.parse(await fs.readFile(coordinatesPath, 'utf-8'));
  res.json(coordinates);
});

// PUT /api/v1/projects/:id/flow-coordinates
router.put('/:id/flow-coordinates', authMiddleware.authenticate, async (req, res) => {
  const projectId = req.params.id;
  const coordinates = req.body; // FlowCoordinatesFile

  // Validate schema
  const schema = z.object({
    version: z.literal('1.0'),
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
    viewport: z.object({ x: z.number(), y: z.number(), zoom: z.number() }),
  });

  const validated = schema.parse(coordinates);

  // Ensure .ui directory exists
  const uiDir = path.join(getProjectPath(projectId), '.ui');
  await fs.mkdir(uiDir, { recursive: true });

  // Atomic write
  const tempPath = path.join(uiDir, 'flow-coordinates.json.tmp');
  const finalPath = path.join(uiDir, 'flow-coordinates.json');

  await fs.writeFile(tempPath, JSON.stringify(validated, null, 2));
  await fs.rename(tempPath, finalPath);

  res.json({ success: true });
});
```

**Acceptance Criteria**:
- [ ] GET returns empty coordinates if file doesn't exist
- [ ] GET returns saved coordinates if file exists
- [ ] PUT validates schema with Zod
- [ ] PUT creates .ui directory if missing
- [ ] PUT uses atomic write (temp file + rename)
- [ ] Integration tests verify round-trip save/load

---

### Track 2: ReactFlow Canvas & UI Components

#### TASK-014: ReactFlow Canvas Setup
**Agent**: `frontend-engineer`
**Priority**: P0
**Estimated Time**: 4 hours
**Dependencies**: TASK-012

**Description**:
Set up ReactFlow canvas with basic controls, minimap, and background grid.

**Files to Create**:
- `apps/frontend/src/components/Canvas/Canvas.tsx` - Main canvas component
- `apps/frontend/src/components/Canvas/Canvas.test.tsx` - Tests
- `apps/frontend/src/components/Canvas/Controls.tsx` - Custom controls
- `apps/frontend/src/components/Canvas/MiniMap.tsx` - Custom minimap

**Implementation Skeleton**:
```typescript
// apps/frontend/src/components/Canvas/Canvas.tsx
import { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useCanvasStore } from '../../stores/canvasStore';
import { AgentNode } from './nodes/AgentNode';
import { SubagentNode } from './nodes/SubagentNode';
import { HookNode } from './nodes/HookNode';
import { MCPNode } from './nodes/MCPNode';

const nodeTypes = {
  agent: AgentNode,
  subagent: SubagentNode,
  hook: HookNode,
  mcp: MCPNode,
};

export function Canvas() {
  const { nodes, edges, actions } = useCanvasStore();
  const [localNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [localEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  const onConnect = useCallback(
    (connection: Connection) => {
      actions.addEdge(connection.source!, connection.target!);
      setEdges((eds) => addEdge(connection, eds));
    },
    [actions, setEdges]
  );

  return (
    <div className="h-screen w-full">
      <ReactFlow
        nodes={localNodes}
        edges={localEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Canvas renders with ReactFlow
- [ ] Background grid displays
- [ ] Controls (zoom, fit view) work
- [ ] MiniMap shows canvas overview
- [ ] Connects to Zustand store
- [ ] Syncs local state with store state
- [ ] Tests verify all controls functional

---

#### TASK-015: Custom Node Components
**Agent**: `frontend-engineer` + `ui-ux-designer`
**Priority**: P0
**Estimated Time**: 6 hours
**Dependencies**: TASK-014

**Description**:
Create custom ReactFlow node components for Agent, Subagent, Hook, and MCP with styling and status indicators.

**Files to Create**:
- `apps/frontend/src/components/Canvas/nodes/AgentNode.tsx`
- `apps/frontend/src/components/Canvas/nodes/SubagentNode.tsx`
- `apps/frontend/src/components/Canvas/nodes/HookNode.tsx`
- `apps/frontend/src/components/Canvas/nodes/MCPNode.tsx`
- `apps/frontend/src/components/Canvas/nodes/BaseNode.tsx` - Shared base
- `apps/frontend/src/components/Canvas/nodes/NodeStyles.module.css`

**Design Requirements** (ui-ux-designer):
- **Agent Node**: Rounded rectangle, coral accent, prominent size (200x120px)
- **Subagent Node**: Smaller rectangle (160x100px), blue accent
- **Hook Node**: Diamond shape (100x100px), yellow accent
- **MCP Node**: Hexagon shape (140x100px), green accent
- **Status Indicators**: Dot in corner (gray=idle, blue=running, green=success, red=error)
- **Dark Mode**: All colors adjusted for dark background

**Implementation Skeleton**:
```typescript
// apps/frontend/src/components/Canvas/nodes/AgentNode.tsx
import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { CustomNodeProps, AgentNodeData } from '@cloutagent/types';
import { Play, Settings } from 'lucide-react';

export const AgentNode = memo(({ id, data, selected }: CustomNodeProps<AgentNodeData>) => {
  const statusColor = {
    idle: 'bg-gray-400',
    running: 'bg-blue-500 animate-pulse',
    success: 'bg-green-500',
    error: 'bg-red-500',
  }[data.status || 'idle'];

  return (
    <div
      className={`
        relative px-4 py-3 rounded-lg border-2 bg-gray-900
        ${selected ? 'border-orange-500 shadow-lg' : 'border-gray-700'}
        min-w-[200px] min-h-[120px]
      `}
    >
      {/* Status indicator */}
      <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${statusColor}`} />

      {/* Content */}
      <div className="flex items-center gap-2 mb-2">
        <Play className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold text-white">{data.label}</h3>
      </div>

      {data.description && (
        <p className="text-sm text-gray-400 line-clamp-2">{data.description}</p>
      )}

      <div className="mt-2 text-xs text-gray-500">
        Model: {data.config.model}
      </div>

      {/* Handles for connections */}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
});

AgentNode.displayName = 'AgentNode';
```

**Acceptance Criteria**:
- [ ] All 4 node types implemented with correct shapes
- [ ] Status indicators show correct colors
- [ ] Selected state highlighted
- [ ] Dark mode colors applied
- [ ] Handles positioned correctly for connections
- [ ] Responsive to different label lengths
- [ ] Tests verify rendering with different data

---

#### TASK-016: Node Palette Sidebar
**Agent**: `frontend-engineer`
**Priority**: P1
**Estimated Time**: 3 hours
**Dependencies**: TASK-015

**Description**:
Create draggable node palette sidebar for adding nodes to canvas.

**Files to Create**:
- `apps/frontend/src/components/Palette/NodePalette.tsx`
- `apps/frontend/src/components/Palette/DraggableNode.tsx`

**Implementation Skeleton**:
```typescript
// apps/frontend/src/components/Palette/NodePalette.tsx
import { DraggableNode } from './DraggableNode';
import { Play, Users, Hook, Hexagon } from 'lucide-react';

export function NodePalette() {
  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 p-4">
      <h2 className="text-white font-semibold mb-4">Nodes</h2>

      <div className="space-y-2">
        <DraggableNode
          type="agent"
          label="Agent"
          icon={<Play />}
          description="Main executor"
        />
        <DraggableNode
          type="subagent"
          label="Subagent"
          icon={<Users />}
          description="Specialized task"
        />
        <DraggableNode
          type="hook"
          label="Hook"
          icon={<Hook />}
          description="Lifecycle callback"
        />
        <DraggableNode
          type="mcp"
          label="MCP"
          icon={<Hexagon />}
          description="External tool"
        />
      </div>
    </div>
  );
}

// apps/frontend/src/components/Palette/DraggableNode.tsx
export function DraggableNode({ type, label, icon, description }) {
  const onDragStart = (event: DragEvent) => {
    event.dataTransfer!.setData('application/reactflow', type);
    event.dataTransfer!.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="p-3 bg-gray-700 rounded cursor-move hover:bg-gray-600 transition"
    >
      <div className="flex items-center gap-2 text-white">
        {icon}
        <div>
          <div className="font-medium">{label}</div>
          <div className="text-xs text-gray-400">{description}</div>
        </div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Palette displays all 4 node types
- [ ] Nodes are draggable
- [ ] Drop on canvas creates node at position
- [ ] Hover effects work
- [ ] Icons match node types
- [ ] Tests verify drag and drop

---

### Track 3: Property Panel & Forms

#### TASK-017: Property Panel Container
**Agent**: `frontend-engineer`
**Priority**: P1
**Estimated Time**: 3 hours
**Dependencies**: TASK-012, TASK-015

**Description**:
Create slide-in property panel that opens when node is selected.

**Files to Create**:
- `apps/frontend/src/components/PropertyPanel/PropertyPanel.tsx`
- `apps/frontend/src/components/PropertyPanel/PropertyPanel.test.tsx`

**Implementation Skeleton**:
```typescript
// apps/frontend/src/components/PropertyPanel/PropertyPanel.tsx
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useCanvasStore } from '../../stores/canvasStore';
import { AgentForm } from './forms/AgentForm';
import { SubagentForm } from './forms/SubagentForm';
import { HookForm } from './forms/HookForm';
import { MCPForm } from './forms/MCPForm';

export function PropertyPanel() {
  const { selectedNodeId, nodes, actions } = useCanvasStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) return null;

  const handleSave = (data: any) => {
    actions.updateNode(selectedNodeId!, data);
    actions.selectNode(null);
  };

  const handleClose = () => {
    actions.selectNode(null);
  };

  const FormComponent = {
    agent: AgentForm,
    subagent: SubagentForm,
    hook: HookForm,
    mcp: MCPForm,
  }[selectedNode.type];

  return (
    <Sheet open={!!selectedNodeId} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="w-[600px] overflow-y-auto">
        <FormComponent
          nodeId={selectedNodeId!}
          initialData={selectedNode.data}
          onSave={handleSave}
          onClose={handleClose}
        />
      </SheetContent>
    </Sheet>
  );
}
```

**Acceptance Criteria**:
- [ ] Opens when node selected
- [ ] Closes when clicking outside or X button
- [ ] Loads correct form based on node type
- [ ] Passes initial data to form
- [ ] Saves changes to store
- [ ] Smooth slide-in animation

---

#### TASK-018: Agent Configuration Form
**Agent**: `frontend-engineer`
**Priority**: P1
**Estimated Time**: 5 hours
**Dependencies**: TASK-017

**Description**:
Create React Hook Form + Zod form for configuring Agent nodes.

**Files to Create**:
- `apps/frontend/src/components/PropertyPanel/forms/AgentForm.tsx`
- `apps/frontend/src/components/PropertyPanel/forms/AgentForm.test.tsx`

**Form Fields**:
- Name (text input, required)
- System Prompt (textarea, required)
- Model (select: claude-sonnet-4-5, claude-opus-4)
- Temperature (slider 0-1)
- Max Tokens (number input)
- Enabled Tools (multi-select checkboxes)

**Implementation Skeleton**:
```typescript
// apps/frontend/src/components/PropertyPanel/forms/AgentForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AgentNodeData } from '@cloutagent/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

const agentSchema = z.object({
  label: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  config: z.object({
    name: z.string(),
    systemPrompt: z.string().min(1, 'System prompt is required'),
    model: z.enum(['claude-sonnet-4-5', 'claude-opus-4']),
    temperature: z.number().min(0).max(1),
    maxTokens: z.number().int().min(1).max(200000),
    enabledTools: z.array(z.string()),
  }),
});

export function AgentForm({ nodeId, initialData, onSave, onClose }) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(agentSchema),
    defaultValues: initialData,
  });

  const temperature = watch('config.temperature');

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <h2 className="text-2xl font-bold">Configure Agent</h2>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-2">Name</label>
        <Input {...register('label')} />
        {errors.label && <p className="text-red-500 text-sm mt-1">{errors.label.message}</p>}
      </div>

      {/* System Prompt */}
      <div>
        <label className="block text-sm font-medium mb-2">System Prompt</label>
        <Textarea {...register('config.systemPrompt')} rows={6} />
        {errors.config?.systemPrompt && (
          <p className="text-red-500 text-sm mt-1">{errors.config.systemPrompt.message}</p>
        )}
      </div>

      {/* Model */}
      <div>
        <label className="block text-sm font-medium mb-2">Model</label>
        <Select {...register('config.model')}>
          <option value="claude-sonnet-4-5">Claude Sonnet 4.5</option>
          <option value="claude-opus-4">Claude Opus 4</option>
        </Select>
      </div>

      {/* Temperature */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Temperature: {temperature}
        </label>
        <Slider
          value={[temperature]}
          onValueChange={([val]) => setValue('config.temperature', val)}
          min={0}
          max={1}
          step={0.1}
        />
      </div>

      {/* Tools */}
      <div>
        <label className="block text-sm font-medium mb-2">Enabled Tools</label>
        <div className="space-y-2">
          {['bash', 'file_create', 'str_replace', 'view'].map((tool) => (
            <label key={tool} className="flex items-center gap-2">
              <input type="checkbox" {...register('config.enabledTools')} value={tool} />
              <span>{tool}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

**Acceptance Criteria**:
- [ ] All fields render correctly
- [ ] Validation works with Zod schema
- [ ] Form pre-populates with initial data
- [ ] Save updates node in store
- [ ] Cancel closes panel without saving
- [ ] Error messages display for invalid inputs
- [ ] Tests verify form submission

---

### Track 4: Test Mode & Validation

#### TASK-019: Test Mode Validation Service
**Agent**: `backend-engineer`
**Priority**: P1
**Estimated Time**: 4 hours
**Dependencies**: Phase 1 complete

**Description**:
Create validation service that checks canvas configuration without executing.

**Files to Create**:
- `apps/backend/src/services/CanvasValidator.ts`
- `apps/backend/src/services/CanvasValidator.test.ts`
- `apps/backend/src/routes/validation.ts`

**Validation Rules**:
1. At least one Agent node required
2. All nodes have required fields
3. All referenced variables exist
4. MCP servers are accessible
5. No circular dependencies
6. Estimate cost based on prompt tokens

**Implementation Skeleton**:
```typescript
// apps/backend/src/services/CanvasValidator.ts
export class CanvasValidator {
  async validate(canvas: FlowCoordinatesFile, project: Project): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Check for agent node
    const agentNodes = canvas.nodes.filter((n) => n.type === 'agent');
    if (agentNodes.length === 0) {
      errors.push({
        severity: 'error',
        message: 'At least one Agent node is required',
      });
    }

    // Check required fields
    canvas.nodes.forEach((node) => {
      if (!node.data.label) {
        errors.push({
          nodeId: node.id,
          severity: 'error',
          message: 'Node label is required',
        });
      }

      // Type-specific validation
      if (node.type === 'agent' && !node.data.config?.systemPrompt) {
        errors.push({
          nodeId: node.id,
          severity: 'error',
          message: 'System prompt is required',
        });
      }
    });

    // Check for disconnected nodes (warnings)
    canvas.nodes.forEach((node) => {
      const hasConnection = canvas.edges.some(
        (e) => e.source === node.id || e.target === node.id
      );
      if (!hasConnection && node.type !== 'agent') {
        errors.push({
          nodeId: node.id,
          severity: 'warning',
          message: 'Node is not connected',
        });
      }
    });

    // Estimate cost
    const estimatedTokens = this.estimateTokens(canvas, project);
    const estimatedCost = this.calculateCost(estimatedTokens);

    return {
      valid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
      estimatedCost,
      estimatedTokens,
    };
  }

  private estimateTokens(canvas: FlowCoordinatesFile, project: Project): number {
    // Simple estimation: ~4 chars per token
    let totalChars = 0;

    canvas.nodes.forEach((node) => {
      if (node.type === 'agent' && node.data.config?.systemPrompt) {
        totalChars += node.data.config.systemPrompt.length;
      }
    });

    return Math.ceil(totalChars / 4);
  }
}
```

**API Route**:
```typescript
// POST /api/v1/projects/:id/validate
router.post('/:id/validate', authMiddleware.authenticate, async (req, res) => {
  const canvas = req.body; // FlowCoordinatesFile
  const project = req.project;

  const validator = new CanvasValidator();
  const result = await validator.validate(canvas, project);

  res.json(result);
});
```

**Acceptance Criteria**:
- [ ] Validates all required rules
- [ ] Returns errors with node IDs
- [ ] Distinguishes error vs warning
- [ ] Estimates cost correctly
- [ ] API endpoint works
- [ ] Tests cover all validation rules

---

### Track 5: Polish & Integration

#### TASK-020: Dark/Light Theme Toggle
**Agent**: `frontend-engineer`
**Priority**: P2
**Estimated Time**: 2 hours
**Dependencies**: TASK-014

**Description**:
Implement theme toggle with persistence to localStorage.

**Files to Create**:
- `apps/frontend/src/hooks/useTheme.ts`
- `apps/frontend/src/components/ThemeToggle.tsx`

**Acceptance Criteria**:
- [ ] Toggle switches between light/dark
- [ ] Persists to localStorage
- [ ] All components respect theme
- [ ] Smooth transition animation

---

#### TASK-021: Save/Load Integration
**Agent**: `frontend-engineer`
**Priority**: P1
**Estimated Time**: 3 hours
**Dependencies**: TASK-012, TASK-013

**Description**:
Wire up auto-save and manual save/load functionality.

**Features**:
- Auto-save every 30 seconds (debounced)
- Manual save button
- Load on project open
- Show save status indicator

**Acceptance Criteria**:
- [ ] Auto-save works without blocking UI
- [ ] Manual save provides feedback
- [ ] Load restores exact canvas state
- [ ] Handles network errors gracefully

---

## Execution Strategy

### Day 1-2: Foundation
1. TASK-012: Zustand store (P0) - **Blocks everything**
2. TASK-013: Backend API (P0) - **Parallel with TASK-012**

### Day 3-5: Canvas & Nodes
3. TASK-014: ReactFlow setup (P0)
4. TASK-015: Custom nodes (P0) - **Needs design from ui-ux-designer**
5. TASK-016: Node palette (P1)

### Day 6-8: Forms & Configuration
6. TASK-017: Property panel (P1)
7. TASK-018: Agent form (P1)
8. Similar forms for Subagent, Hook, MCP (not detailed here)

### Day 9-10: Validation & Polish
9. TASK-019: Test mode validation (P1)
10. TASK-020: Theme toggle (P2)
11. TASK-021: Save/load integration (P1)

---

## Success Criteria for Phase 2

- [ ] Canvas renders with ReactFlow
- [ ] All 4 node types draggable from palette
- [ ] Nodes can be connected with edges
- [ ] Property panel opens on node select
- [ ] Agent configuration form works
- [ ] Test mode validates canvas
- [ ] Save/load persists canvas state
- [ ] Dark/light theme toggle works
- [ ] No console errors
- [ ] 80%+ test coverage

---

**Ready for execution after Phase 1!** 🎨
