import { Palette, Lightbulb, Link, Settings } from 'lucide-react';

export function CanvasEmptyState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none glass-strong rounded-2xl p-8 max-w-md text-center" style={{ margin: 'auto' }}>
      <div>
        <div className="mb-4 flex justify-center">
          <Palette className="w-16 h-16 text-blue-400" aria-label="Design icon" />
        </div>
        <h3 className="text-2xl font-semibold text-white/90 mb-2 tracking-tight">
          Start Building Your Workflow
        </h3>
        <p className="text-white/60 mb-6 text-sm leading-relaxed">
          Drag nodes from the palette or click to add them to the canvas.
          Connect nodes to create your AI workflow.
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-white/50">
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
