import { AgentConfig, SubagentConfig, HookConfig, MCPConfig } from './index';

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
