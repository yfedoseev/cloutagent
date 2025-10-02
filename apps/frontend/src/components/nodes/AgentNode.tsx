import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { statusColors } from './utils';
import { ValidationBadge } from './ValidationBadge';
import type { ValidationError } from '@cloutagent/types';

interface AgentNodeData {
  name: string;
  model: string;
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
    const totalTokens = data.tokenUsage
      ? data.tokenUsage.input + data.tokenUsage.output
      : 0;

    return (
      <div
        className={`
        relative
        px-4 py-3 rounded-lg border-2 min-w-[220px] max-w-[300px]
        ${selected ? 'border-blue-500 shadow-lg shadow-blue-500/50' : 'border-gray-700'}
        bg-gradient-to-br from-blue-900 to-blue-800
        transition-all duration-200
        hover:shadow-xl
      `}
        role="article"
        aria-label={`Agent node: ${data.name}`}
      >
        <ValidationBadge errors={data.validationErrors || []} />

        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-blue-400"
          aria-label="Input connection"
        />

        {/* Header with icon and name */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl" role="img" aria-label="Agent icon">
            🤖
          </span>

          <div className="flex-1">
            <div className="font-semibold text-white text-sm">{data.name}</div>
            <div className="text-xs text-blue-200">{data.model}</div>
          </div>

          {/* Status indicator */}
          {data.status && (
            <div
              className={`w-3 h-3 rounded-full ${statusColors[data.status]}`}
              title={data.status}
              aria-label={`Status: ${data.status}`}
            />
          )}
        </div>

        {/* Configuration info */}
        {(data.temperature !== undefined || data.maxTokens) && (
          <div className="space-y-1 text-xs text-blue-100 mb-2">
            {data.temperature !== undefined && (
              <div className="flex justify-between">
                <span className="text-blue-300">Temperature:</span>
                <span className="font-mono">{data.temperature}</span>
              </div>
            )}

            {data.maxTokens && (
              <div className="flex justify-between">
                <span className="text-blue-300">Max Tokens:</span>
                <span className="font-mono">
                  {data.maxTokens.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* System prompt preview (truncated) */}
        {data.systemPrompt && (
          <div className="mb-2 p-2 bg-blue-950/50 rounded text-xs text-blue-200 line-clamp-2">
            {data.systemPrompt}
          </div>
        )}

        {/* Execution stats */}
        {(data.tokenUsage || data.costUSD !== undefined) && (
          <div className="pt-2 mt-2 border-t border-blue-700 space-y-1">
            {data.tokenUsage && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-300">🪙 Tokens:</span>
                <span className="font-mono text-blue-100">
                  {totalTokens.toLocaleString()}
                </span>
              </div>
            )}

            {data.costUSD !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-300">💰 Cost:</span>
                <span className="font-mono text-green-300">
                  ${data.costUSD.toFixed(4)}
                </span>
              </div>
            )}
          </div>
        )}

        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-blue-400"
          aria-label="Output connection"
        />
      </div>
    );
  },
);

AgentNode.displayName = 'AgentNode';
