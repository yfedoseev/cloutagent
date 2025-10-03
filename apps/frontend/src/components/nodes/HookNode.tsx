import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Check, Play, CheckCircle2, Wrench, Hammer, XCircle, Circle } from 'lucide-react';
import { ValidationBadge } from './ValidationBadge';
import { getNodeConfig } from '../../hooks/useNodeConfig';
import type { ValidationError } from '@cloutagent/types';

interface HookNodeData {
  config?: {
    name?: string;
    type?: 'pre-execution'
      | 'post-execution'
      | 'pre-tool-call'
      | 'post-tool-call'
      | 'on-error';
    enabled?: boolean;
    condition?: string;
    actionType?: 'log' | 'notify' | 'transform' | 'validate';
  };
  name?: string;
  type?:
    | 'pre-execution'
    | 'post-execution'
    | 'pre-tool-call'
    | 'post-tool-call'
    | 'on-error';
  enabled?: boolean;
  condition?: string;
  actionType?: 'log' | 'notify' | 'transform' | 'validate';
  lastExecution?: {
    timestamp: Date;
    result: 'success' | 'failure';
    output?: unknown;
  };
  validationErrors?: ValidationError[];
}

export const HookNode = memo(({ data, selected }: NodeProps<HookNodeData>) => {
  // Extract config using shared utility
  const config = getNodeConfig<HookNodeData>(data, {
    name: 'Unnamed Hook',
    enabled: true,
  });
  const { name, type, enabled, actionType, condition } = config;

  const hookIconMap = {
    'pre-execution': Play,
    'post-execution': CheckCircle2,
    'pre-tool-call': Wrench,
    'post-tool-call': Hammer,
    'on-error': XCircle,
  } as const;

  const TypeIcon = type ? hookIconMap[type] : Play;

  return (
    <div
      className={`
        relative
        px-4 py-3 min-w-[240px] max-w-[320px]
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
      aria-label={`Hook node: ${name || 'Unnamed Hook'}`}
    >
      <ValidationBadge
        errors={data.validationErrors?.filter((e) => e.severity === 'error') || []}
        warnings={data.validationErrors?.filter((e) => e.severity === 'warning') || []}
      />

      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: '10px',
          height: '10px',
          backgroundColor: 'var(--node-hook)',
          border: '2px solid var(--card-bg)',
        }}
        aria-label="Input connection"
      />

      {/* Header with icon and name */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center"
          style={{ backgroundColor: 'var(--node-hook)', opacity: 0.1 }}
        >
          <TypeIcon className="w-5 h-5" style={{ color: 'var(--node-hook)' }} aria-label={`${type} icon`} />
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
            {name || 'Unnamed Hook'}
          </div>
          <div style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-size-xs)',
            lineHeight: 'var(--line-height-normal)',
          }}>
            {type}
          </div>
        </div>

        {/* Enabled/Disabled indicator */}
        <div className="flex items-center gap-1">
          <Circle
            className={`w-2 h-2 ${enabled ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`}
            aria-label={enabled ? 'Enabled' : 'Disabled'}
          />
        </div>
      </div>

      {/* Action type */}
      <div className="mb-2 flex items-center justify-between text-xs">
        <span style={{ color: 'var(--text-secondary)' }}>Action:</span>
        <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
          {actionType}
        </span>
      </div>

      {/* Condition */}
      {condition && (
        <div className="mb-2">
          <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
            Condition:
          </div>
          <div
            className="p-2 rounded text-xs font-mono line-clamp-2"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)'
            }}
          >
            {condition}
          </div>
        </div>
      )}

      {/* Last execution */}
      {data.lastExecution && (
        <div
          className="pt-2 mt-2"
          style={{ borderTop: '1px solid var(--border-primary)' }}
        >
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--text-secondary)' }}>Last run:</span>
            <span
              className={`font-medium ${
                data.lastExecution.result === 'success'
                  ? 'text-green-500'
                  : 'text-red-500'
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
        style={{
          width: '10px',
          height: '10px',
          backgroundColor: 'var(--node-hook)',
          border: '2px solid var(--card-bg)',
        }}
        aria-label="Output connection"
      />
    </div>
  );
});

HookNode.displayName = 'HookNode';
