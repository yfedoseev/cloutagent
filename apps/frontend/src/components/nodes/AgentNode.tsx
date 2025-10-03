import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Bot } from 'lucide-react';
import { statusColors } from './utils';
import { ValidationBadge } from './ValidationBadge';
import { getNodeConfig } from '../../hooks/useNodeConfig';
import type { ValidationError } from '@cloutagent/types';

// Format model name for display
const formatModelName = (model: string): string => {
  const modelMap: Record<string, string> = {
    'claude-sonnet-4-5': 'Sonnet 4.5',
    'claude-opus-4': 'Opus 4',
    'claude-haiku-3.5': 'Haiku 3.5',
    'claude-haiku-3-5': 'Haiku 3.5',
  };
  return modelMap[model] || model;
};

interface AgentNodeData {
  config?: {
    name?: string;
    model?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  };
  name?: string;
  model?: string;
  systemPrompt?: string;
  status?: 'idle' | 'running' | 'completed' | 'failed';
  tokenUsage?: { input: number; output: number };
  costUSD?: number;
  temperature?: number;
  maxTokens?: number;
  validationErrors?: ValidationError[];
}

export const AgentNode = memo(
  ({ data, selected }: NodeProps<AgentNodeData>) => {
    // Extract config using shared utility
    const config = getNodeConfig<AgentNodeData>(data, {
      name: 'Claude Agent',
      model: 'claude-sonnet-4-5',
    });
    const { name, model } = config;

    const totalTokens = data.tokenUsage
      ? data.tokenUsage.input + data.tokenUsage.output
      : 0;

    const errors = data.validationErrors?.filter((e) => e.severity === 'error') || [];
    const warnings = data.validationErrors?.filter((e) => e.severity === 'warning') || [];

    return (
      <div
        className={`
        relative
        px-4 py-3 min-w-[220px] max-w-[300px]
        transition-all duration-200
        ${selected ? 'border-2' : 'border'}
      `}
        style={{
          borderRadius: '10px',
          backgroundColor: 'var(--card-bg)',
          borderColor: selected ? 'var(--accent-primary)' : 'var(--border-primary)',
          boxShadow: selected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
          animation: 'nodeAppear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        role="article"
        aria-label={`Agent node: ${name || 'Claude Agent'}`}
      >
        {/* Validation Badge - only render when errors or warnings exist */}
        {(errors.length > 0 || warnings.length > 0) && (
          <ValidationBadge errors={errors} warnings={warnings} />
        )}

        <Handle
          type="target"
          position={Position.Top}
          style={{
            width: '10px',
            height: '10px',
            backgroundColor: 'var(--accent-primary)',
            border: '2px solid var(--card-bg)',
          }}
          aria-label="Input connection"
        />

        {/* Header with icon and name */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent-primary)', opacity: 0.1 }}
          >
            <Bot className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} aria-label="Agent icon" />
          </div>

          <div className="flex-1">
            <div
              style={{
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                lineHeight: 'var(--line-height-tight)',
              }}
            >
              {name || 'Claude Agent'}
            </div>
            <div style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-xs)',
              lineHeight: 'var(--line-height-normal)',
            }}>
              {model ? formatModelName(model) : 'Sonnet 4.5'}
            </div>
          </div>

          {/* Status indicator */}
          {data.status && (
            <div
              className={`w-2 h-2 rounded-full ${statusColors[data.status]}`}
              title={data.status}
              aria-label={`Status: ${data.status}`}
            />
          )}
        </div>

        {/* Configuration info */}
        {(data.temperature !== undefined || data.maxTokens !== undefined) && (
          <div className="space-y-1 text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
            {data.temperature !== undefined && (
              <div className="flex justify-between">
                <span>Temperature:</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                  {data.temperature}
                </span>
              </div>
            )}

            {data.maxTokens !== undefined && (
              <div className="flex justify-between">
                <span>Max Tokens:</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                  {data.maxTokens.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* System prompt preview (truncated) */}
        {data.systemPrompt && (
          <div
            className="mb-2 p-2 rounded text-xs line-clamp-2"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)'
            }}
          >
            {data.systemPrompt}
          </div>
        )}

        {/* Execution stats */}
        {(data.tokenUsage || data.costUSD !== undefined) && (
          <div
            className="pt-2 mt-2 space-y-1"
            style={{ borderTop: '1px solid var(--border-primary)' }}
          >
            {data.tokenUsage && (
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>🪙 Tokens:</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                  {totalTokens.toLocaleString()}
                </span>
              </div>
            )}

            {data.costUSD !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>💰 Cost:</span>
                <span className="font-mono" style={{ color: 'var(--success)' }}>
                  ${data.costUSD.toFixed(4)}
                </span>
              </div>
            )}
          </div>
        )}

        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            width: '10px',
            height: '10px',
            backgroundColor: 'var(--accent-primary)',
            border: '2px solid var(--card-bg)',
          }}
          aria-label="Output connection"
        />
      </div>
    );
  },
);

AgentNode.displayName = 'AgentNode';
