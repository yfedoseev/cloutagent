import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Check, Play, CheckCircle2, Wrench, Hammer, XCircle, Circle } from 'lucide-react';
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
  const hookIconMap = {
    'pre-execution': Play,
    'post-execution': CheckCircle2,
    'pre-tool-call': Wrench,
    'post-tool-call': Hammer,
    'on-error': XCircle,
  } as const;

  const TypeIcon = hookIconMap[data.type];

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
      aria-label={`Hook node: ${data.name || 'Unnamed Hook'}`}
    >
      <ValidationBadge
        errors={data.validationErrors?.filter((e) => e.severity === 'error') || []}
        warnings={data.validationErrors?.filter((e) => e.severity === 'warning') || []}
      />

      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-green-400"
        aria-label="Input connection"
      />

      {/* Header with icon and name */}
      <div className="flex items-center gap-2 mb-2">
        <TypeIcon className="w-6 h-6 text-green-300" aria-label={`${data.type} icon`} />

        <div className="flex-1">
          <div className="font-semibold text-white text-sm">{data.name || 'Unnamed Hook'}</div>
          <div className="text-xs text-green-200">{data.type}</div>
        </div>

        {/* Enabled/Disabled indicator */}
        <div className="flex items-center gap-1">
          <Circle
            className={`w-3 h-3 ${data.enabled ? 'fill-green-400 text-green-400' : 'fill-gray-600 text-gray-600'}`}
            aria-label={data.enabled ? 'Enabled' : 'Disabled'}
          />
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
              {data.lastExecution.result === 'success' ? (
                <span className="inline-flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Success</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  <span>Failed</span>
                </span>
              )}
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
