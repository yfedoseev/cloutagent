/**
 * Shared utilities for custom node components
 */

// Status color mapping
export const statusColors = {
  idle: 'bg-gray-500',
  running: 'bg-blue-500 animate-pulse',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  connected: 'bg-green-500',
  disconnected: 'bg-gray-500',
  error: 'bg-red-500',
} as const;

// Icon mapping
export const nodeTypeIcons = {
  agent: '🤖',
  subagent: '👥',
  hook: '🪝',
  mcp: '🔌',
} as const;

// Subagent type-specific icons
export const subagentTypeIcons = {
  'frontend-engineer': '🎨',
  'backend-engineer': '⚙️',
  'database-engineer': '🗄️',
  'ml-engineer': '🤖',
  'general-purpose': '👤',
} as const;

// Hook type-specific icons
export const hookTypeIcons = {
  'pre-execution': '▶️',
  'post-execution': '✅',
  'pre-tool-call': '🔧',
  'post-tool-call': '🔨',
  'on-error': '❌',
} as const;

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Truncate text to maximum length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Get connection status icon
 */
export function getConnectionStatusIcon(connected: boolean): string {
  return connected ? '🟢' : '🔴';
}
