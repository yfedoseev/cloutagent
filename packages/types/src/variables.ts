// Variable Management Types (IC-019)

export type VariableType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'secret';

export interface Variable {
  id: string;
  name: string;
  type: VariableType;
  value: any;
  description?: string;
  scope: 'global' | 'node' | 'execution';
  encrypted: boolean;
  nodeId?: string; // For node-scoped variables
  createdAt: Date;
  updatedAt: Date;
}

export interface VariableScope {
  global: Record<string, Variable>;
  node: Record<string, Record<string, Variable>>; // nodeId -> variableName -> Variable
  execution: Record<string, Variable>;
}

export interface CreateVariableRequest {
  name: string;
  type: VariableType;
  value: any;
  description?: string;
  scope: 'global' | 'node' | 'execution';
  encrypted?: boolean;
  nodeId?: string; // Required for node-scoped variables
}

export interface UpdateVariableRequest {
  value: any;
}

export interface ListVariablesResponse {
  variables: Variable[];
}
