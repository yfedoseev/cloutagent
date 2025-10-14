import { useState, useEffect, useCallback } from 'react';
import { useNodeConfig } from './useNodeConfig';

interface UsePropertyFormOptions<T> {
  node: any;
  defaults: T;
  onChange: (updates: any) => void;
  validate?: (data: T) => Record<string, string>;
  debounceMs?: number;
}

interface UsePropertyFormReturn<T> {
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  errors: Record<string, string>;
}

/**
 * Shared hook for property panel form management
 * Handles:
 * - Loading node config (nested or flat)
 * - Auto-save with debounce
 * - Validation
 * - Updating when node changes
 */
export function usePropertyForm<T extends Record<string, any>>({
  node,
  defaults,
  onChange,
  validate,
  debounceMs = 500,
}: UsePropertyFormOptions<T>): UsePropertyFormReturn<T> {
  const initialConfig = useNodeConfig(node, defaults);
  const [formData, setFormData] = useState<T>(initialConfig);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when node changes
  useEffect(() => {
    // Use non-hook version inside useEffect to avoid Rules of Hooks violation
    const nodeConfig = node.data?.config?.config || node.data?.config || {};
    const config = { ...defaults, ...nodeConfig };
    setFormData(config as T);
  }, [node.id, node.data]);

  // Validate and auto-save with proper debouncing
  useEffect(() => {
    // Run validation if provided
    if (validate) {
      const validationErrors = validate(formData);
      setErrors(validationErrors);

      // Don't save if there are errors
      if (Object.keys(validationErrors).length > 0) {
        return;
      }
    }

    // Debounce the save operation
    const timer = setTimeout(() => {
      onChange({
        data: {
          config: {
            id: node.data?.config?.id || node.id,
            ...formData,
          },
        },
      });
    }, debounceMs);

    return () => clearTimeout(timer);
    // Only depend on formData to prevent excessive re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  // Helper to update a single field
  const updateField = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    },
    [],
  );

  return {
    formData,
    setFormData,
    updateField,
    errors,
  };
}
