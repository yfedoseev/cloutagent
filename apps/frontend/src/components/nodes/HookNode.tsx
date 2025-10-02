import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { hookTypeIcons } from './utils';
import { ValidationBadge } from './ValidationBadge';
import type { ValidationError } from '@cloutagent/types';

interface HookNodeData {
  name: string;
  type:
    | 'pre-execution'
    | 'post-execution'
    | 'pre-tool-call'
    | 'post-tool-call'
    | 'on-error';
  enabled: boolean;
  condition?: string;
  actionType: 'log' | 'notify' | 'transform' | 'validate';
  lastExecution?: {
    timestamp: Date;
    result: 'success' | 'failure';
    output?: unknown;
  };
  validationErrors?: ValidationError[];
}

export const HookNode = memo(({ data, selected }: NodeProps<HookNodeData>) => {
  const typeIcon = hookTypeIcons[data.type];

  return (
    <div
      className={`
        relative
        px-4 py-3 rounded-lg border-2 min-w-[240px] max-w-[320px]
        ${selected ? 'border-green-500 shadow-lg shadow-green-500/50' : 'border-gray-700'}
        bg-gradient-to-br from-green-900 to-green-800
        transition-all duration-200
        hover:shadow-xl
      `}
      role="article"
      aria-label={`Hook node: ${data.name}`}
    >
      <ValidationBadge errors={data.validationErrors || []} />

      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-green-400"
        aria-label="Input connection"
      />

      {/* Header with icon and name */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl" role="img" aria-label={`${data.type} icon`}>
          {typeIcon}
        </span>

        <div className="flex-1">
          <div className="font-semibold text-white text-sm">{data.name}</div>
          <div className="text-xs text-green-200">{data.type}</div>
        </div>

        {/* Enabled/Disabled indicator */}
        <div className="flex items-center gap-1">
          <span
            className="text-sm"
            role="img"
            aria-label={data.enabled ? 'Enabled' : 'Disabled'}
          >
            {data.enabled ? '🟢' : '⚫'}
          </span>
          <span className="text-xs text-green-200">
            {data.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Action type */}
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-green-300">Action:</span>
        <span className="font-mono text-green-100">{data.actionType}</span>
      </div>

      {/* Condition */}
      {data.condition && (
        <div className="mb-2">
          <div className="text-xs text-green-300 mb-1">Condition:</div>
          <div className="p-2 bg-green-950/50 rounded text-xs text-green-200 font-mono line-clamp-2">
            {data.condition}
          </div>
        </div>
      )}

      {/* Last execution */}
      {data.lastExecution && (
        <div className="pt-2 mt-2 border-t border-green-700">
          <div className="flex items-center justify-between text-xs">
            <span className="text-green-300">Last run:</span>
            <span
              className={`font-medium ${
                data.lastExecution.result === 'success'
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}
            >
              {data.lastExecution.result === 'success'
                ? '✓ Success'
                : '✗ Failed'}
            </span>
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-green-400"
        aria-label="Output connection"
      />
    </div>
  );
});

HookNode.displayName = 'HookNode';
