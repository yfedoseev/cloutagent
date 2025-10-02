import { useState } from 'react';

interface ExecutionControlsProps {
  executionId: string;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
}

export function ExecutionControls({
  executionId,
  status,
  onPause,
  onResume,
  onCancel,
  onRetry,
}: ExecutionControlsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePause = async () => {
    setLoading('pause');
    setError(null);

    try {
      const response = await fetch(`/api/executions/${executionId}/pause`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to pause execution');
      }

      onPause?.();
    } catch (err) {
      setError((err as Error).message);
      console.error('Pause error:', err);
    } finally {
      setLoading(null);
    }
  };

  const handleResume = async () => {
    setLoading('resume');
    setError(null);

    try {
      const response = await fetch(`/api/executions/${executionId}/resume`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to resume execution');
      }

      onResume?.();
    } catch (err) {
      setError((err as Error).message);
      console.error('Resume error:', err);
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this execution?')) return;

    setLoading('cancel');
    setError(null);

    try {
      const response = await fetch(`/api/executions/${executionId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel execution');
      }

      onCancel?.();
    } catch (err) {
      setError((err as Error).message);
      console.error('Cancel error:', err);
    } finally {
      setLoading(null);
    }
  };

  const handleRetry = () => {
    onRetry?.();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Running state controls */}
      {status === 'running' && (
        <>
          {/* SECONDARY - Pause is important but not primary */}
          <button
            onClick={handlePause}
            disabled={loading !== null}
            className="btn-glass text-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading === 'pause' ? 'Pausing...' : 'Pause'}
          </button>

          {/* DESTRUCTIVE - Cancellation is dangerous */}
          <button
            onClick={handleCancel}
            disabled={loading !== null}
            className="btn-destructive text-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading === 'cancel' ? 'Cancelling...' : 'Cancel'}
          </button>
        </>
      )}

      {/* Paused state controls */}
      {status === 'paused' && (
        <>
          {/* PRIMARY - Resume is most important when paused */}
          <button
            onClick={handleResume}
            disabled={loading !== null}
            className="btn-primary-coral text-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading === 'resume' ? 'Resuming...' : 'Resume'}
          </button>

          {/* DESTRUCTIVE - Cancel option */}
          <button
            onClick={handleCancel}
            disabled={loading !== null}
            className="btn-destructive text-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading === 'cancel' ? 'Cancelling...' : 'Cancel'}
          </button>
        </>
      )}

      {/* Failed state controls */}
      {status === 'failed' && (
        <button
          onClick={handleRetry}
          className="btn-primary-coral text-sm flex items-center gap-1.5"
        >
          Retry
        </button>
      )}

      {/* Error display */}
      {error && <div className="text-sm text-red-400">{error}</div>}
    </div>
  );
}
