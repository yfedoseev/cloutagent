import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { statusColors, subagentTypeIcons, formatDuration } from './utils';
import { ValidationBadge } from './ValidationBadge';
import type { ValidationError } from '@cloutagent/types';

interface SubagentNodeData {
  name: string;
  type:
    | 'frontend-engineer'
    | 'backend-engineer'
    | 'database-engineer'
    | 'ml-engineer'
    | 'general-purpose';
  description?: string;
  status?: 'idle' | 'running' | 'completed' | 'failed';
  executionTime?: number;
  result?: string;
  error?: string;
  validationErrors?: ValidationError[];
}

export const SubagentNode = memo(
  ({ data, selected }: NodeProps<SubagentNodeData>) => {
    const typeIcon = subagentTypeIcons[data.type];

    return (
      <div
        className={`
        relative
        px-4 py-3 rounded-lg border-2 min-w-[220px] max-w-[300px]
        ${selected ? 'border-purple-500 shadow-lg shadow-purple-500/50' : 'border-gray-700'}
        bg-gradient-to-br from-purple-900 to-purple-800
        transition-all duration-200
        hover:shadow-xl
      `}
        role="article"
        aria-label={`Subagent node: ${data.name}`}
      >
        <ValidationBadge errors={data.validationErrors || []} />

        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-purple-400"
          aria-label="Input connection"
        />

        {/* Header with icon and name */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-2xl"
            role="img"
            aria-label={`${data.type} icon`}
          >
            {typeIcon}
          </span>

          <div className="flex-1">
            <div className="font-semibold text-white text-sm">{data.name}</div>
            <div className="text-xs text-purple-200">{data.type}</div>
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

        {/* Description */}
        {data.description && (
          <div className="mb-2 p-2 bg-purple-950/50 rounded text-xs text-purple-200">
            {data.description}
          </div>
        )}

        {/* Execution time */}
        {data.executionTime !== undefined && (
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-purple-300">⏱️ Execution:</span>
            <span className="font-mono text-purple-100">
              {formatDuration(data.executionTime)}
            </span>
          </div>
        )}

        {/* Result or Error */}
        {data.result && !data.error && (
          <div className="mt-2 p-2 bg-purple-950/50 rounded text-xs text-green-300 line-clamp-2">
            ✓ {data.result}
          </div>
        )}

        {data.error && (
          <div className="mt-2 p-2 bg-red-950/50 rounded text-xs text-red-300 line-clamp-2">
            ✗ {data.error}
          </div>
        )}

        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-purple-400"
          aria-label="Output connection"
        />
      </div>
    );
  },
);

SubagentNode.displayName = 'SubagentNode';
