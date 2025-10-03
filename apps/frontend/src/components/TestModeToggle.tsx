interface TestModeToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  showEstimate?: boolean;
  estimatedCost?: number;
  estimatedTokens?: number;
  estimatedDuration?: number;
}

export function TestModeToggle({
  enabled,
  onChange,
  showEstimate = false,
  estimatedCost,
  estimatedTokens,
  estimatedDuration,
}: TestModeToggleProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-3 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            checked={enabled}
            onChange={e => onChange(e.target.checked)}
            className="sr-only peer"
          />
          <div
            className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-5 after:w-5 after:transition-all"
            style={{
              backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--input-border)',
              border: `2px solid ${enabled ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
            }}
          >
            <div
              className="absolute top-[2px] left-[2px] h-5 w-5 rounded-full transition-all shadow-sm"
              style={{
                backgroundColor: 'var(--bg-primary)',
                transform: enabled ? 'translateX(20px)' : 'translateX(0)',
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Test Mode</span>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {enabled ? '(Simulated execution)' : '(Real Claude API)'}
          </span>
        </div>
      </label>

      {enabled && showEstimate && (
        <div className="ml-14 p-3 rounded-lg" style={{
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--border-secondary)'
        }}>
          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            Estimated Real Execution:
          </div>
          <div className="flex flex-col gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {estimatedCost !== undefined && (
              <div className="flex justify-between">
                <span>Cost:</span>
                <span className="font-mono">${estimatedCost.toFixed(4)}</span>
              </div>
            )}
            {estimatedTokens !== undefined && (
              <div className="flex justify-between">
                <span>Tokens:</span>
                <span className="font-mono">
                  {estimatedTokens.toLocaleString()}
                </span>
              </div>
            )}
            {estimatedDuration !== undefined && (
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-mono">
                  {(estimatedDuration / 1000).toFixed(1)}s
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
