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
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral-500"></div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">Test Mode</span>
          <span className="text-xs text-gray-400">
            {enabled ? '(Simulated execution)' : '(Real Claude API)'}
          </span>
        </div>
      </label>

      {enabled && showEstimate && (
        <div className="ml-14 p-3 bg-coral-900/20 border border-coral-500/50 rounded-lg">
          <div className="text-xs font-semibold text-coral-300 mb-2">
            Estimated Real Execution:
          </div>
          <div className="flex flex-col gap-1 text-xs text-gray-300">
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
