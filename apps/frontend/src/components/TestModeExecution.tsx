import { useState } from 'react';
import type { ExecutionResult } from '@cloutagent/types';

interface TestModeExecutionProps {
  projectId: string;
  workflow: { nodes: any[]; edges: any[] };
  input: string;
  onComplete?: (result: ExecutionResult) => void;
}

export function TestModeExecution({
  projectId,
  workflow,
  input,
  onComplete,
}: TestModeExecutionProps) {
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow, input }),
      });

      if (!response.ok) {
        throw new Error('Test execution failed');
      }

      const data = await response.json();
      setResult(data.result);
      onComplete?.(data.result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Run Test Button */}
      <button
        onClick={runTest}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-semibold text-white transition-colors"
      >
        {loading ? '⏳ Running Test...' : '🧪 Run Test'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <div className="font-semibold text-red-400 mb-2">Test Failed</div>
          <div className="text-sm text-red-300">{error}</div>
        </div>
      )}

      {/* Test Result */}
      {result && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">
              {result.status === 'completed' ? '✅' : '❌'}
            </span>
            <span className="font-bold text-lg text-white">
              Test {result.status === 'completed' ? 'Passed' : 'Failed'}
            </span>
          </div>

          {/* Execution Steps */}
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-400 mb-2">
              Execution Steps:
            </div>
            <div className="space-y-1">
              {result.steps.map((step, i) => (
                <div
                  key={i}
                  className="text-xs text-gray-300 flex items-center gap-2"
                >
                  <span className="text-green-400">✓</span>
                  <span>{step.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Output */}
          {result.output && (
            <div className="mb-4">
              <div className="text-sm font-semibold text-gray-400 mb-2">
                Simulated Output:
              </div>
              <pre className="text-xs bg-gray-900 p-3 rounded border border-gray-700 overflow-auto max-h-48 whitespace-pre-wrap font-mono">
                {result.output}
              </pre>
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4 p-3 bg-gray-900 rounded border border-gray-700">
            <div>
              <div className="text-xs text-gray-400">Duration</div>
              <div className="font-mono text-sm text-white">
                {((result.duration || 0) / 1000).toFixed(2)}s
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Tokens</div>
              <div className="font-mono text-sm text-white">
                {result.tokenUsage.total.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Estimated Cost</div>
              <div className="font-mono text-sm text-green-400">
                ${result.costUSD.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/50 rounded">
            <div className="text-xs text-yellow-300">
              ⚠️ This was a simulated execution. Real execution may differ in
              output and duration.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
