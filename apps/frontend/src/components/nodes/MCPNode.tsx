import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Circle, Plug, AlertTriangle, Lock, Unlock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ValidationBadge } from './ValidationBadge';
import { getNodeConfig } from '../../hooks/useNodeConfig';
import type { ValidationError } from '@cloutagent/types';

interface MCPNodeData {
  config?: {
    name?: string;
    connection?: string;
    type?: 'url' | 'npx' | 'uvx';
    enabled?: boolean;
    tools?: string[];
  };
  name?: string;
  serverCommand?: string;
  toolsEnabled?: string[];
  status?: 'connected' | 'disconnected' | 'error';
  credentialsConfigured?: boolean;
  lastChecked?: Date;
  error?: string;
  validationErrors?: ValidationError[];
}

export const MCPNode = memo(({ data, selected }: NodeProps<MCPNodeData>) => {
  // Extract config using shared utility
  const config = getNodeConfig<MCPNodeData>(data, {
    name: 'MCP Server',
  });
  const name = config.name;
  const serverCommand = config.connection || data.serverCommand;
  const toolsEnabled = config.tools || data.toolsEnabled;
  const status = data.status || 'disconnected';
  const credentialsConfigured = data.credentialsConfigured ?? false;

  const statusLabels = {
    connected: 'Connected',
    disconnected: 'Disconnected',
    error: 'Error',
  };

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
      aria-label={`MCP node: ${name || 'MCP Server'}`}
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
          backgroundColor: 'var(--node-mcp)',
          border: '2px solid var(--card-bg)',
        }}
        aria-label="Input connection"
      />

      {/* Header with icon and name */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center"
          style={{ backgroundColor: 'var(--node-mcp)', opacity: 0.1 }}
        >
          <Plug className="w-5 h-5" style={{ color: 'var(--node-mcp)' }} aria-label="MCP tool icon" />
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
            {name || 'MCP Server'}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Circle
              className={`w-2 h-2 ${status === 'connected' ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`}
              aria-label={`${status} status`}
            />
            <span style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-xs)',
              lineHeight: 'var(--line-height-normal)',
            }}>
              {statusLabels[status]}
            </span>
          </div>
        </div>
      </div>

      {/* Server command preview */}
      <div
        className="mb-2 p-2 rounded text-xs font-mono line-clamp-2"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)'
        }}
      >
        {serverCommand || 'Not configured'}
      </div>

      {/* Tools count and credentials */}
      <div className="space-y-1 mb-2">
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: 'var(--text-secondary)' }}>Tools:</span>
          <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
            {toolsEnabled?.length ?? 0} enabled
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span style={{ color: 'var(--text-secondary)' }}>Credentials:</span>
          <div className="flex items-center gap-1">
            {credentialsConfigured ? (
              <Lock className="w-3 h-3" style={{ color: 'var(--success)' }} />
            ) : (
              <Unlock className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
            )}
            <span style={{ color: 'var(--text-primary)' }}>
              {credentialsConfigured ? 'Configured' : 'Not configured'}
            </span>
          </div>
        </div>
      </div>

      {/* Last checked */}
      {data.lastChecked && (
        <div className="mb-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          Last checked:{' '}
          <span style={{ color: 'var(--text-primary)' }}>
            {formatDistanceToNow(data.lastChecked, { addSuffix: true })}
          </span>
        </div>
      )}

      {/* Error message */}
      {data.error && (
        <div
          className="mt-2 p-2 rounded text-xs line-clamp-2"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--error)'
          }}
        >
          <span className="inline-flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
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
          backgroundColor: 'var(--node-mcp)',
          border: '2px solid var(--card-bg)',
        }}
        aria-label="Output connection"
      />
    </div>
  );
});

MCPNode.displayName = 'MCPNode';
