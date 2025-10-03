import { useEffect, useState, useCallback } from 'react';
import { XCircle, AlertTriangle, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react';
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
    <div className="fixed bottom-0 left-0 right-0 z-40" style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border-primary)',
      boxShadow: 'var(--shadow-lg)'
    }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 cursor-pointer transition-colors"
        style={{
          color: 'var(--text-primary)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          {validationResult.valid ? (
            <div className="flex items-center gap-2" style={{ color: 'var(--success)' }}>
              <CheckCircle className="w-6 h-6" />
              <span className="font-semibold">Workflow Valid</span>
            </div>
          ) : (
            <div className="flex items-center gap-2" style={{ color: 'var(--error)' }}>
              <XCircle className="w-6 h-6" />
              <span className="font-semibold">
                {validationResult.errors.length} Error{validationResult.errors.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {validationResult.warnings.length > 0 && (
            <div className="flex items-center gap-2" style={{ color: 'var(--warning)' }}>
              <AlertTriangle className="w-6 h-6" />
              <span className="font-semibold">
                {validationResult.warnings.length} Warning{validationResult.warnings.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {loading && (
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Validating...
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(!isCollapsed);
          }}
          className="transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          {isCollapsed ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
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
      className="flex items-start gap-3 p-3 rounded-lg mb-2"
      style={{
        background: isError ? 'var(--error-bg)' : 'var(--warning-bg)',
        border: `1px solid ${isError ? 'var(--error)' : 'var(--warning)'}`,
        borderColor: isError ? 'var(--error)' : 'var(--warning)',
        opacity: 0.9
      }}
    >
      <span className="flex-shrink-0 inline-flex">
        {isError ? (
          <XCircle className="w-5 h-5" style={{ color: 'var(--error)' }} />
        ) : (
          <AlertTriangle className="w-5 h-5" style={{ color: 'var(--warning)' }} />
        )}
      </span>

      <div className="flex-1">
        <div className="font-medium" style={{ color: isError ? 'var(--error)' : 'var(--warning)' }}>
          {issue.message}
        </div>

        {issue.nodeId && (
          <button
            onClick={() => onNodeClick?.(issue.nodeId!)}
            className="mt-1 text-sm underline transition-opacity hover:opacity-80"
            style={{ color: isError ? 'var(--error)' : 'var(--warning)' }}
          >
            View node: {issue.nodeId}
          </button>
        )}

        {issue.nodeIds && issue.nodeIds.length > 0 && (
          <div className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Affected nodes: {issue.nodeIds.join(', ')}
          </div>
        )}

        <div className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Type: {issue.type}
        </div>
      </div>
    </div>
  );
}
