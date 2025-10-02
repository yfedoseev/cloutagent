# Custom Node Components for CloutAgent

This directory contains production-ready custom node components for CloutAgent's visual workflow builder, built on ReactFlow.

## Components

### 1. AgentNode (Blue Theme)
Main AI agent node for orchestrating workflow execution.

**Data Interface:**
```typescript
interface AgentNodeData {
  name: string;
  model: string;
  systemPrompt?: string;
  status?: 'idle' | 'running' | 'completed' | 'failed';
  tokenUsage?: { input: number; output: number };
  costUSD?: number;
  temperature?: number;
  maxTokens?: number;
}
```

**Features:**
- Blue gradient background (`from-blue-900 to-blue-800`)
- Status indicator with animations (pulse for running)
- Token usage and cost tracking
- System prompt preview (truncated)
- Configuration display (temperature, max tokens)
- Vertical handles (top input, bottom output)

**Tests:** 16/16 passing ✓

### 2. SubagentNode (Purple Theme)
Specialized agent nodes for parallel task execution.

**Data Interface:**
```typescript
interface SubagentNodeData {
  name: string;
  type: 'frontend-engineer' | 'backend-engineer' | 'database-engineer' | 'ml-engineer' | 'general-purpose';
  description?: string;
  status?: 'idle' | 'running' | 'completed' | 'failed';
  executionTime?: number;
  result?: string;
  error?: string;
}
```

**Features:**
- Purple gradient background (`from-purple-900 to-purple-800`)
- Type-specific icons (🎨 frontend, ⚙️ backend, 🗄️ database, 🤖 ML, 👤 general)
- Execution time display
- Result/error preview with visual indicators
- Status animations
- Vertical handles (top input, bottom output)

**Tests:** 18/18 passing ✓

### 3. HookNode (Green Theme)
Event hooks for workflow lifecycle management.

**Data Interface:**
```typescript
interface HookNodeData {
  name: string;
  type: 'pre-execution' | 'post-execution' | 'pre-tool-call' | 'post-tool-call' | 'on-error';
  enabled: boolean;
  condition?: string;
  actionType: 'log' | 'notify' | 'transform' | 'validate';
  lastExecution?: {
    timestamp: Date;
    result: 'success' | 'failure';
    output?: unknown;
  };
}
```

**Features:**
- Green gradient background (`from-green-900 to-green-800`)
- Type-specific icons (▶️ pre, ✅ post, 🔧 tool-pre, 🔨 tool-post, ❌ error)
- Enabled/disabled toggle indicator
- Condition expression preview
- Last execution status
- **Horizontal handles** (left input, right output)

**Tests:** 17/17 passing ✓

### 4. MCPNode (Orange Theme)
Model Context Protocol server integration nodes.

**Data Interface:**
```typescript
interface MCPNodeData {
  name: string;
  serverCommand: string;
  toolsEnabled: string[];
  status: 'connected' | 'disconnected' | 'error';
  credentialsConfigured: boolean;
  lastChecked?: Date;
  error?: string;
}
```

**Features:**
- Orange gradient background (`from-orange-900 to-orange-800`)
- Connection status indicator (🟢 connected, 🔴 disconnected/error)
- Server command preview
- Tool count display
- Credentials configuration indicator (🔐/🔓)
- Last checked timestamp (relative time)
- Error message display
- Vertical handles (top input, bottom output)

**Tests:** 16/16 passing ✓

## Design System

### Color Scheme
- **Agent:** Blue (`border-blue-500`, `from-blue-900 to-blue-800`)
- **Subagent:** Purple (`border-purple-500`, `from-purple-900 to-purple-800`)
- **Hook:** Green (`border-green-500`, `from-green-900 to-green-800`)
- **MCP:** Orange (`border-orange-500`, `from-orange-900 to-orange-800`)

### Typography
- **Title:** 14px (`text-sm`), semibold, white
- **Subtitle:** 12px (`text-xs`), colored by theme
- **Body:** 12px (`text-xs`), varied by context
- **Monospace:** For technical data (tokens, durations, code)

### Spacing
- **Padding:** `px-4 py-3` (16px horizontal, 12px vertical)
- **Gaps:** `gap-2` (8px) for flex containers
- **Margins:** `mb-2` (8px) between sections

### Visual Effects
- **Borders:** 2px, colored by selection state
- **Shadows:** Elevation on hover (`hover:shadow-xl`) and selection
- **Transitions:** Smooth 200ms for all state changes
- **Animations:** Pulse effect for `running` status

### Status Colors
```typescript
export const statusColors = {
  idle: 'bg-gray-500',
  running: 'bg-blue-500 animate-pulse',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  connected: 'bg-green-500',
  disconnected: 'bg-gray-500',
  error: 'bg-red-500',
};
```

## Accessibility

All nodes include:
- `role="article"` for semantic structure
- `aria-label` on container with node name
- `aria-label` on handles for screen readers
- `aria-label` on status indicators
- Keyboard navigation support (via ReactFlow)
- Proper color contrast (WCAG AA compliant)

## Usage

### Basic Usage
```typescript
import { nodeTypes } from './components/nodes';
import ReactFlow from 'reactflow';

function WorkflowCanvas() {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
    />
  );
}
```

### Creating Node Data
```typescript
// Agent node
const agentNode = {
  id: 'agent-1',
  type: 'agent',
  position: { x: 100, y: 100 },
  data: {
    name: 'Code Generator',
    model: 'Claude Sonnet 4.5',
    temperature: 0.7,
    maxTokens: 4096,
    status: 'running',
  },
};

// Subagent node
const subagentNode = {
  id: 'subagent-1',
  type: 'subagent',
  position: { x: 300, y: 100 },
  data: {
    name: 'Frontend Developer',
    type: 'frontend-engineer',
    description: 'Builds React components',
    status: 'completed',
    executionTime: 2500,
  },
};
```

## Testing

All components have comprehensive test coverage:

```bash
# Run all node tests
npm test -- src/components/nodes --run

# Run specific node tests
npm test -- AgentNode.test.tsx --run
npm test -- SubagentNode.test.tsx --run
npm test -- HookNode.test.tsx --run
npm test -- MCPNode.test.tsx --run
```

**Total Test Coverage:** 67 tests, 100% passing ✓

## Performance Considerations

- All components use `React.memo()` for efficient re-rendering
- Components only re-render when `data` or `selected` props change
- Status animations use CSS animations (GPU-accelerated)
- Text truncation uses CSS `line-clamp` for performance
- Handle rendering optimized by ReactFlow

## Future Enhancements

Potential improvements for Phase 3+:
- [ ] Interactive tooltips on hover
- [ ] Inline editing of node properties
- [ ] Drag-and-drop file attachments
- [ ] Real-time collaboration indicators
- [ ] Custom color themes
- [ ] Node grouping/clustering
- [ ] Performance metrics visualization
- [ ] Undo/redo support

## File Structure

```
src/components/nodes/
├── AgentNode.tsx          # Main agent component
├── AgentNode.test.tsx     # Agent tests (16)
├── SubagentNode.tsx       # Subagent component
├── SubagentNode.test.tsx  # Subagent tests (18)
├── HookNode.tsx           # Hook component
├── HookNode.test.tsx      # Hook tests (17)
├── MCPNode.tsx            # MCP component
├── MCPNode.test.tsx       # MCP tests (16)
├── utils.ts               # Shared utilities
├── index.ts               # Exports and registry
└── README.md              # This file
```

## Dependencies

- `react` ^19.1.0
- `reactflow` ^11.10.0
- `date-fns` ^3.0.0 (for MCPNode timestamp formatting)

## License

MIT
