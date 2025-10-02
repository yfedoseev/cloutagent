import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Circle, Plug, AlertTriangle, Lock, Unlock } from 'lucide-react';
import { statusColors } from './utils';
import { formatDistanceToNow } from 'date-fns';
import { ValidationBadge } from './ValidationBadge';
import type { ValidationError } from '@cloutagent/types';

interface MCPNodeData {
  name: string;
  serverCommand: string;
  toolsEnabled: string[];
  status: 'connected' | 'disconnected' | 'error';
  credentialsConfigured: boolean;
  lastChecked?: Date;
  error?: string;
  validationErrors?: ValidationError[];
}

export const MCPNode = memo(({ data, selected }: NodeProps<MCPNodeData>) => {
  const statusLabels = {
    connected: 'Connected',
    disconnected: 'Disconnected',
    error: 'Error',
  };

  return (
    <div
      className={`
        relative
        px-4 py-3 rounded-lg border-2 min-w-[240px] max-w-[320px]
        ${selected ? 'border-orange-500 shadow-lg shadow-orange-500/50' : 'border-gray-700'}
        bg-gradient-to-br from-orange-900 to-orange-800
        transition-all duration-200
        hover:shadow-xl
      `}
      role="article"
      aria-label={`MCP node: ${data.name}`}
    >
      <ValidationBadge
        errors={data.validationErrors?.filter((e) => e.severity === 'error') || []}
        warnings={data.validationErrors?.filter((e) => e.severity === 'warning') || []}
      />

      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-orange-400"
        aria-label="Input connection"
      />

      {/* Header with icon and name */}
      <div className="flex items-center gap-2 mb-2">
        <Plug className="w-6 h-6 text-amber-300" aria-label="MCP tool icon" />

        <div className="flex-1">
          <div className="font-semibold text-white text-sm">{data.name}</div>
          <div className="flex items-center gap-1 mt-1">
            <Circle
              className={`w-3 h-3 ${data.status === 'connected' ? 'fill-green-400 text-green-400' : 'fill-red-400 text-red-400'}`}
              aria-label={`${data.status} status`}
            />
            <span className="text-xs text-orange-200">
              {statusLabels[data.status]}
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div
          className={`w-3 h-3 rounded-full ${statusColors[data.status]}`}
          title={data.status}
          aria-label={`Status: ${data.status}`}
        />
      </div>

      {/* Server command preview */}
      <div className="mb-2 p-2 bg-orange-950/50 rounded text-xs text-orange-200 font-mono line-clamp-2">
        {data.serverCommand}
      </div>

      {/* Tools count and credentials */}
      <div className="space-y-1 mb-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-orange-300">Tools:</span>
          <span className="font-mono text-orange-100">
            {data.toolsEnabled?.length ?? 0} enabled
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-orange-300">Credentials:</span>
          <div className="flex items-center gap-1">
            {data.credentialsConfigured ? (
              <Lock className="w-3 h-3 text-green-400" />
            ) : (
              <Unlock className="w-3 h-3 text-orange-300" />
            )}
            <span className="text-orange-100">
              {data.credentialsConfigured ? 'Configured' : 'Not configured'}
            </span>
          </div>
        </div>
      </div>

      {/* Last checked */}
      {data.lastChecked && (
        <div className="mb-2 text-xs text-orange-300">
          Last checked:{' '}
          <span className="text-orange-200">
            {formatDistanceToNow(data.lastChecked, { addSuffix: true })}
          </span>
        </div>
      )}

      {/* Error message */}
      {data.error && (
        <div className="mt-2 p-2 bg-red-950/50 rounded text-xs text-red-300 line-clamp-2">
          <span className="inline-flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            <span>{data.error}</span>
          </span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-orange-400"
        aria-label="Output connection"
      />
    </div>
  );
});

MCPNode.displayName = 'MCPNode';
