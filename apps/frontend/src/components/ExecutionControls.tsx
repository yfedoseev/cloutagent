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
          <button
            onClick={handlePause}
            disabled={loading !== null}
            className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            {loading === 'pause' ? <>Pausing...</> : <>Pause</>}
          </button>

          <button
            onClick={handleCancel}
            disabled={loading !== null}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            {loading === 'cancel' ? <>Cancelling...</> : <>Cancel</>}
          </button>
        </>
      )}

      {/* Paused state controls */}
      {status === 'paused' && (
        <>
          <button
            onClick={handleResume}
            disabled={loading !== null}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            {loading === 'resume' ? <>Resuming...</> : <>Resume</>}
          </button>

          <button
            onClick={handleCancel}
            disabled={loading !== null}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            {loading === 'cancel' ? <>Cancelling...</> : <>Cancel</>}
          </button>
        </>
      )}

      {/* Failed state controls */}
      {status === 'failed' && (
        <button
          onClick={handleRetry}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
        >
          Retry
        </button>
      )}

      {/* Error display */}
      {error && <div className="text-sm text-red-400">{error}</div>}
    </div>
  );
}
