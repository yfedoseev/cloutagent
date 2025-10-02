import { useEffect, useState } from 'react';
import { SSEClient } from '../lib/sse-client';
import type { ExecutionResult, TokenUsage } from '@cloutagent/types';

interface ExecutionMonitorProps {
  executionId: string;
  onComplete?: (result: ExecutionResult) => void;
  onError?: (error: string) => void;
}

export function ExecutionMonitor({
  executionId,
  onComplete,
  onError,
}: ExecutionMonitorProps) {
  const [status, setStatus] = useState<
    'idle' | 'running' | 'completed' | 'failed'
  >('idle');
  const [output, setOutput] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<string>('');
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({
    input: 0,
    output: 0,
    total: 0,
  });
  const [cost, setCost] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    const client = new SSEClient();

    client.on('execution:started', () => {
      setStatus('running');
      setStartTime(Date.now());
      setOutput('');
      setError(null);
    });

    client.on('execution:step', (data: { step: string; status: string }) => {
      setCurrentStep(data.step);
    });

    client.on('execution:output', (data: { chunk: string }) => {
      setOutput(prev => prev + data.chunk);
    });

    client.on('execution:token-usage', (data: { usage: TokenUsage }) => {
      setTokenUsage(data.usage);

      // Calculate cost: Claude Sonnet 4.5 pricing
      const inputCost = (data.usage.input / 1_000_000) * 3.0;
      const outputCost = (data.usage.output / 1_000_000) * 15.0;
      setCost(inputCost + outputCost);
    });

    client.on('execution:completed', (data: { result: ExecutionResult }) => {
      setStatus('completed');
      setDuration(Date.now() - startTime);
      onComplete?.(data.result);
    });

    client.on('execution:failed', (data: { error: string }) => {
      setStatus('failed');
      setError(data.error);
      setDuration(Date.now() - startTime);
      onError?.(data.error);
    });

    client.connect(executionId);

    return () => {
      client.disconnect();
    };
  }, [executionId, onComplete, onError, startTime]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Status Bar */}
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <StatusBadge status={status} />
            {currentStep && (
              <span className="text-sm text-gray-400">{currentStep}</span>
            )}
          </div>

          <div className="flex items-center gap-6 text-sm">
            {duration > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Duration:</span>
                <span className="font-mono">
                  {(duration / 1000).toFixed(2)}s
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-gray-400">Tokens:</span>
              <span className="font-mono">
                {tokenUsage.total?.toLocaleString() || '0'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-400">Cost:</span>
              <span className="font-mono text-green-400">
                ${cost.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Output Area */}
      <div className="flex-1 overflow-auto p-6">
        {error ? (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">❌</span>
              <div>
                <div className="font-semibold text-red-400 mb-2">
                  Execution Failed
                </div>
                <pre className="text-sm text-red-300 whitespace-pre-wrap font-mono">
                  {error}
                </pre>
              </div>
            </div>
          </div>
        ) : output ? (
          <div className="bg-gray-800 rounded-lg p-4">
            <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
              {output}
            </pre>
          </div>
        ) : status === 'running' ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-3 text-gray-400">
              <LoadingSpinner />
              <span>Waiting for output...</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Token Usage Details */}
      {tokenUsage.total !== undefined && tokenUsage.total > 0 && (
        <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Input:</span>
              <span className="font-mono">
                {tokenUsage.input.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Output:</span>
              <span className="font-mono">
                {tokenUsage.output.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Rate:</span>
              <span className="font-mono text-blue-400">
                {duration > 0
                  ? (tokenUsage.total / (duration / 1000)).toFixed(0)
                  : '0'}{' '}
                tokens/s
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: 'idle' | 'running' | 'completed' | 'failed';
}) {
  const styles = {
    idle: 'bg-gray-500',
    running: 'bg-blue-500 animate-pulse',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
  };

  const labels = {
    idle: 'Idle',
    running: 'Running',
    completed: 'Completed',
    failed: 'Failed',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${styles[status]}`} />
      <span className="font-semibold">{labels[status]}</span>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="w-5 h-5 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
  );
}
