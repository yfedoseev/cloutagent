import { z } from 'zod';

import {
  NodeType,
  BaseNodeData,
  AgentNodeData,
  SubagentNodeData,
  HookNodeData,
  MCPNodeData,
} from './nodes';

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
