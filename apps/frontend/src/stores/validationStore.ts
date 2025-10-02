import { create } from 'zustand';
import type { ValidationResult, ValidationError } from '@cloutagent/types';

interface ValidationStore {
  validationResult: ValidationResult | null;
  nodeErrors: Map<string, ValidationError[]>;

  setValidationResult: (result: ValidationResult) => void;
  getNodeErrors: (nodeId: string) => ValidationError[];
  clearValidation: () => void;
}

export const useValidationStore = create<ValidationStore>((set, get) => ({
  validationResult: null,
  nodeErrors: new Map(),

  setValidationResult: (result: ValidationResult) => {
    // Build map of nodeId -> errors
    const nodeErrors = new Map<string, ValidationError[]>();

    for (const error of [...result.errors, ...result.warnings]) {
      if (error.nodeId) {
        if (!nodeErrors.has(error.nodeId)) {
          nodeErrors.set(error.nodeId, []);
        }
        nodeErrors.get(error.nodeId)!.push(error);
      }

      if (error.nodeIds) {
        for (const nodeId of error.nodeIds) {
          if (!nodeErrors.has(nodeId)) {
            nodeErrors.set(nodeId, []);
          }
          nodeErrors.get(nodeId)!.push(error);
        }
      }
    }

    set({ validationResult: result, nodeErrors });
  },

  getNodeErrors: (nodeId: string) => {
    return get().nodeErrors.get(nodeId) || [];
  },

  clearValidation: () => {
    set({ validationResult: null, nodeErrors: new Map() });
  },
}));
