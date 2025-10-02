import { Node } from 'reactflow';
import { BaseNodeData } from '@cloutagent/types';

export interface PropertyEditorProps {
  node: Node<BaseNodeData>;
  onChange: (updates: Partial<Node<BaseNodeData>>) => void;
}

export interface ValidationErrors {
  [field: string]: string;
}

export interface FormField {
  label: string;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}
