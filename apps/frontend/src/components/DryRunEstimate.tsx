import { useState, useEffect } from 'react';

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

  const runDryRun = async () => {
    if (workflow.nodes.length === 0) {
      setEstimate(null);
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/test/dry-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow }),
      });

      const data = await response.json();
      setEstimate(data);
      onEstimateReady?.(data);
    } catch (error) {
      console.error('Dry run failed:', error);
    }
  };

  useEffect(() => {
    runDryRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflow.nodes, workflow.edges]);

  if (!estimate) return null;

  return (
    <div className="p-4 rounded-lg" style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-primary)'
    }}>
      <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
        💡 Workflow Estimate
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
