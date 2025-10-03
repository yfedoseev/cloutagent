import { Palette, Lightbulb, Link, Settings } from 'lucide-react';

export function CanvasEmptyState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-2xl p-8 max-w-md text-center" style={{
      margin: 'auto',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-primary)',
      boxShadow: 'var(--shadow-md)'
    }}>
      <div>
        <div className="mb-4 flex justify-center">
          <Palette className="w-16 h-16" style={{ color: 'var(--accent-primary)' }} aria-label="Design icon" />
        </div>
        <h3 className="text-2xl font-semibold mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Start Building Your Workflow
        </h3>
        <p className="mb-6 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Drag nodes from the palette or click to add them to the canvas.
          Connect nodes to create your AI workflow.
        </p>
        <div className="flex items-center justify-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <div className="flex items-center gap-1">
            <Lightbulb className="w-4 h-4 inline" aria-hidden="true" />
            <span>Drag to add</span>
          </div>
          <div className="flex items-center gap-1">
            <Link className="w-4 h-4 inline" aria-hidden="true" />
            <span>Connect nodes</span>
          </div>
          <div className="flex items-center gap-1">
            <Settings className="w-4 h-4 inline" aria-hidden="true" />
            <span>Configure properties</span>
          </div>
        </div>
      </div>
    </div>
  );
}
