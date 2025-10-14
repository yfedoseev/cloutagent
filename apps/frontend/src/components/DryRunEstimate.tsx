import { useState, useEffect, useRef } from 'react';

interface DryRunEstimateProps {
  projectId: string;
  workflow: { nodes: any[]; edges: any[] };
  onEstimateReady?: (estimate: any) => void;
}

export function DryRunEstimate({
  projectId,
  workflow,
  onEstimateReady,
}: DryRunEstimateProps) {
  const [estimate, setEstimate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const runDryRun = async () => {
    if (workflow.nodes.length === 0) {
      setEstimate(null);
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/test/dry-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - show user-friendly message
          setEstimate({
            valid: false,
            errors: ['Too many requests. Please wait a moment and try again.']
          });
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setEstimate(data);
      onEstimateReady?.(data);
    } catch (error: any) {
      // Ignore abort errors (normal cancellation)
      if (error.name === 'AbortError') {
        return;
      }
      console.error('Dry run failed:', error);
      setEstimate({
        valid: false,
        errors: ['Failed to estimate workflow. Please try again.']
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debounce API calls by 1000ms to prevent rate limiting
    const timer = setTimeout(() => {
      runDryRun();
    }, 1000);

    // Cleanup: cancel timer and abort any pending request
    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflow.nodes, workflow.edges]);

  if (!estimate && !isLoading) return null;

  return (
    <div className="p-4 rounded-lg" style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-primary)'
    }}>
      <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
        💡 Workflow Estimate
        {isLoading && <span className="ml-2 text-xs">Calculating...</span>}
      </div>

      {estimate.valid ? (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
            <span>Estimated Cost:</span>
            <span className="font-mono" style={{ color: 'var(--success)' }}>
              ${estimate.estimatedCost.toFixed(4)}
            </span>
          </div>
          <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
            <span>Estimated Tokens:</span>
            <span className="font-mono">
              {estimate.estimatedTokens.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
            <span>Estimated Duration:</span>
            <span className="font-mono">
              {(estimate.estimatedDuration / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
      ) : (
        <div className="text-sm" style={{ color: 'var(--error)' }}>
          {estimate.errors.map((err: string, i: number) => (
            <div key={i}>• {err}</div>
          ))}
        </div>
      )}
    </div>
  );
}
