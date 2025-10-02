import { useEffect, useState, useCallback } from 'react';
import type { ValidationResult, ValidationError } from '@cloutagent/types';
import { useValidationStore } from '../stores/validationStore';

interface ValidationPanelProps {
  projectId: string;
  workflow: { nodes: any[]; edges: any[] };
  onNodeClick?: (nodeId: string) => void;
}

export function ValidationPanel({ projectId, workflow, onNodeClick }: ValidationPanelProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { setValidationResult: setStoreValidationResult } = useValidationStore();

  const validateWorkflow = useCallback(async () => {
    if (workflow.nodes.length === 0) {
      setValidationResult(null);
      setStoreValidationResult({ valid: true, errors: [], warnings: [] });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow }),
      });

      const result = await response.json();
      setValidationResult(result);
      setStoreValidationResult(result);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, workflow, setStoreValidationResult]);

  useEffect(() => {
    // Auto-validate on workflow changes (debounced)
    const timer = setTimeout(() => {
      validateWorkflow();
    }, 500);

    return () => clearTimeout(timer);
  }, [validateWorkflow]);

  if (!validationResult) return null;

  const totalIssues = validationResult.errors.length + validationResult.warnings.length;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 shadow-2xl z-40">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-750"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          {validationResult.valid ? (
            <div className="flex items-center gap-2 text-green-400">
              <span className="text-xl">✅</span>
              <span className="font-semibold">Workflow Valid</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-400">
              <span className="text-xl">❌</span>
              <span className="font-semibold">
                {validationResult.errors.length} Error{validationResult.errors.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {validationResult.warnings.length > 0 && (
            <div className="flex items-center gap-2 text-yellow-400">
              <span className="text-xl">⚠️</span>
              <span className="font-semibold">
                {validationResult.warnings.length} Warning{validationResult.warnings.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {loading && (
            <div className="text-sm text-gray-400">
              Validating...
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(!isCollapsed);
          }}
          className="text-gray-400 hover:text-white"
        >
          {isCollapsed ? '▲' : '▼'}
        </button>
      </div>

      {/* Issues List */}
      {!isCollapsed && totalIssues > 0 && (
        <div className="max-h-48 overflow-auto px-4 pb-4">
          {validationResult.errors.map((error, i) => (
            <ValidationIssue
              key={`error-${i}`}
              issue={error}
              onNodeClick={onNodeClick}
            />
          ))}
          {validationResult.warnings.map((warning, i) => (
            <ValidationIssue
              key={`warning-${i}`}
              issue={warning}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ValidationIssue({
  issue,
  onNodeClick,
}: {
  issue: ValidationError;
  onNodeClick?: (nodeId: string) => void;
}) {
  const isError = issue.severity === 'error';

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg mb-2 ${
        isError ? 'bg-red-900/20 border border-red-500/50' : 'bg-yellow-900/20 border border-yellow-500/50'
      }`}
    >
      <span className="text-xl flex-shrink-0">
        {isError ? '❌' : '⚠️'}
      </span>

      <div className="flex-1">
        <div className={`font-medium ${isError ? 'text-red-300' : 'text-yellow-300'}`}>
          {issue.message}
        </div>

        {issue.nodeId && (
          <button
            onClick={() => onNodeClick?.(issue.nodeId!)}
            className={`mt-1 text-sm underline ${
              isError ? 'text-red-400 hover:text-red-300' : 'text-yellow-400 hover:text-yellow-300'
            }`}
          >
            View node: {issue.nodeId}
          </button>
        )}

        {issue.nodeIds && issue.nodeIds.length > 0 && (
          <div className="mt-1 text-sm">
            Affected nodes: {issue.nodeIds.join(', ')}
          </div>
        )}

        <div className="mt-1 text-xs text-gray-400">
          Type: {issue.type}
        </div>
      </div>
    </div>
  );
}
