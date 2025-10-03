import { useState, useEffect } from 'react';
import type { ExecutionSummary } from '@cloutagent/types';

interface ExecutionHistoryPanelProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onViewExecution: (executionId: string) => void;
  onRetryExecution?: (executionId: string) => void;
}

export function ExecutionHistoryPanel({
  projectId,
  isOpen,
  onClose,
  onViewExecution,
  onRetryExecution,
}: ExecutionHistoryPanelProps) {
  const [executions, setExecutions] = useState<ExecutionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed'>('all');

  useEffect(() => {
    if (isOpen) {
      loadExecutions();
    }
  }, [isOpen, filter]);

  const loadExecutions = async () => {
    setLoading(true);
    try {
      const url = `/api/projects/${projectId}/executions${filter !== 'all' ? `?status=${filter}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setExecutions(data.executions || []);
    } catch (error) {
      console.error('Failed to load executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (executionId: string) => {
    if (!confirm('Are you sure you want to delete this execution?')) return;

    try {
      await fetch(`/api/projects/${projectId}/executions/${executionId}`, {
        method: 'DELETE',
      });
      await loadExecutions();
    } catch (error) {
      console.error('Failed to delete execution:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)'
    }}>
      <div className="rounded-lg w-[900px] h-[700px] flex flex-col" style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-xl)'
      }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{
          borderBottom: '1px solid var(--border-primary)'
        }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Execution History</h2>
          <button
            onClick={onClose}
            className="text-xl transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 px-6 py-3" style={{
          borderBottom: '1px solid var(--border-primary)'
        }}>
          <FilterButton
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            All
          </FilterButton>
          <FilterButton
            active={filter === 'completed'}
            onClick={() => setFilter('completed')}
          >
            Completed
          </FilterButton>
          <FilterButton
            active={filter === 'failed'}
            onClick={() => setFilter('failed')}
          >
            Failed
          </FilterButton>
        </div>

        {/* Execution List */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div style={{ color: 'var(--text-secondary)' }}>Loading executions...</div>
            </div>
          ) : executions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>
              <div className="text-4xl mb-4">📋</div>
              <div className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                No executions found
              </div>
              <div className="text-sm">
                Run a workflow to see execution history
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {executions.map(execution => (
                <ExecutionCard
                  key={execution.id}
                  execution={execution}
                  onView={() => onViewExecution(execution.id)}
                  onRetry={() => onRetryExecution?.(execution.id)}
                  onDelete={() => handleDelete(execution.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-lg text-sm font-medium transition-all"
      style={active ? {
        background: 'var(--accent-primary)',
        color: 'white'
      } : {
        background: 'var(--bg-tertiary)',
        color: 'var(--text-secondary)'
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = 'var(--bg-secondary)';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'var(--bg-tertiary)';
      }}
    >
      {children}
    </button>
  );
}

interface ExecutionCardProps {
  execution: ExecutionSummary;
  onView: () => void;
  onRetry: () => void;
  onDelete: () => void;
}

function ExecutionCard({ execution, onView, onRetry, onDelete }: ExecutionCardProps) {
  const statusColors: Record<string, string> = {
    completed: 'bg-green-500/20 text-green-300 border-green-500',
    failed: 'bg-red-500/20 text-red-300 border-red-500',
    running: 'bg-blue-500/20 text-blue-300 border-blue-500',
    paused: 'bg-yellow-500/20 text-yellow-300 border-yellow-500',
    cancelled: 'bg-gray-500/20 text-gray-300 border-gray-500',
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  return (
    <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[execution.status]}`}
            >
              {execution.status.toUpperCase()}
            </span>

            <span className="text-sm text-gray-400">
              {formatDate(execution.startedAt)}
            </span>

            {execution.duration && (
              <span className="text-sm text-gray-400">
                {formatDuration(execution.duration)}
              </span>
            )}
          </div>

          <div className="text-sm text-gray-300 mb-2">
            <span className="font-mono text-xs text-gray-500">
              {execution.id}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>{execution.tokenUsage.total.toLocaleString()} tokens</span>
            <span>${execution.costUSD.toFixed(4)}</span>
          </div>

          {execution.error && (
            <div className="mt-2 text-sm text-red-400 truncate">
              Error: {execution.error}
            </div>
          )}
        </div>

        <div className="flex gap-2 ml-4">
          <button
            onClick={onView}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
          >
            View
          </button>

          {execution.status === 'failed' && (
            <button
              onClick={onRetry}
              className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm"
            >
              Retry
            </button>
          )}

          <button
            onClick={onDelete}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
