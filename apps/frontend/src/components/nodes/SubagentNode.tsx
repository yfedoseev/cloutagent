import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Check, Palette, Settings, Database, Bot, User, Clock, XCircle } from 'lucide-react';
import { statusColors, formatDuration } from './utils';
import { ValidationBadge } from './ValidationBadge';
import { getNodeConfig } from '../../hooks/useNodeConfig';
import type { ValidationError } from '@cloutagent/types';

interface SubagentNodeData {
  config?: {
    name?: string;
    type?: 'frontend-engineer'
      | 'backend-engineer'
      | 'database-engineer'
      | 'ml-engineer'
      | 'general-purpose';
    description?: string;
  };
  name?: string;
  type?:
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

const subagentIconMap = {
  'frontend-engineer': Palette,
  'backend-engineer': Settings,
  'database-engineer': Database,
  'ml-engineer': Bot,
  'general-purpose': User,
} as const;

export const SubagentNode = memo(
  ({ data, selected }: NodeProps<SubagentNodeData>) => {
    // Extract config using shared utility
    const config = getNodeConfig<SubagentNodeData>(data, {
      name: 'Unnamed Subagent',
    });
    const { name, type, description } = config;

    const TypeIcon = type ? subagentIconMap[type] || User : User;

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
        aria-label={`Subagent node: ${name || 'Unnamed Subagent'}`}
      >
        <ValidationBadge
          errors={data.validationErrors?.filter((e) => e.severity === 'error') || []}
          warnings={data.validationErrors?.filter((e) => e.severity === 'warning') || []}
        />

        <Handle
          type="target"
          position={Position.Top}
          style={{
            width: '10px',
            height: '10px',
            backgroundColor: 'var(--node-subagent)',
            border: '2px solid var(--card-bg)',
          }}
          aria-label="Input connection"
        />

        {/* Header with icon and name */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ backgroundColor: 'var(--node-subagent)', opacity: 0.1 }}
          >
            <TypeIcon className="w-5 h-5" style={{ color: 'var(--node-subagent)' }} aria-label={`${type || 'generic'} icon`} />
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
              {name || 'Unnamed Subagent'}
            </div>
            <div style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-xs)',
              lineHeight: 'var(--line-height-normal)',
            }}>
              {type}
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

        {/* Description */}
        {description && (
          <div
            className="mb-2 p-2 rounded text-xs"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)'
            }}
          >
            {description}
          </div>
        )}

        {/* Execution time */}
        {data.executionTime !== undefined && (
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
              <Clock className="w-3 h-3" />
              <span>Execution:</span>
            </span>
            <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
              {formatDuration(data.executionTime)}
            </span>
          </div>
        )}

        {/* Result or Error */}
        {data.result && !data.error && (
          <div
            className="mt-2 p-2 rounded text-xs line-clamp-2"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--success)'
            }}
          >
            <span className="inline-flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>{data.result}</span>
            </span>
          </div>
        )}

        {data.error && (
          <div
            className="mt-2 p-2 rounded text-xs line-clamp-2"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--error)'
            }}
          >
            <span className="inline-flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              <span>{data.error}</span>
            </span>
          </div>
        )}

        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            width: '10px',
            height: '10px',
            backgroundColor: 'var(--node-subagent)',
            border: '2px solid var(--card-bg)',
          }}
          aria-label="Output connection"
        />
      </div>
    );
  },
);

SubagentNode.displayName = 'SubagentNode';
