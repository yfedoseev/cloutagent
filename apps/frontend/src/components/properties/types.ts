import { Node } from 'reactflow';

export interface PropertyEditorProps {
  node: Node<any>;
  onChange: (updates: Partial<Node<any>>) => void;
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
