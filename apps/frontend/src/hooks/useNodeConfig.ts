import { useMemo } from 'react';

/**
 * Extract node configuration from nested or flat structure
 * Handles both node.data.config.config (incorrectly nested) and node.data.config (correct)
 */
export function useNodeConfig<T extends Record<string, any>>(
  node: any,
  defaults: T
): T {
  return useMemo(() => {
    const nodeConfig = node.data?.config?.config || node.data?.config || {};
    return { ...defaults, ...nodeConfig };
  }, [node.id, node.data]);
}

/**
 * Non-hook version for use in node components
 */
export function getNodeConfig<T extends Record<string, any>>(
  data: any,
  defaults: Partial<T> = {}
): Partial<T> {
  const nodeConfig = data?.config || {};
  return { ...defaults, ...nodeConfig };
}
