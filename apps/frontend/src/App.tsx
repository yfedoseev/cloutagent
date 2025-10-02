import { useState } from 'react';
import { Rocket } from 'lucide-react';
import { ProjectList } from './components/ProjectList';
import { FlowCanvas } from './components/FlowCanvas';
import { NodePalette } from './components/NodePalette';
import { PropertyPanel } from './components/PropertyPanel';
import { VariablesPanel } from './components/VariablesPanel';
import { ThemeToggle } from './components/ThemeToggle';
import { ReactFlowProvider } from 'reactflow';

function App() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [view, setView] = useState<'list' | 'canvas'>('list');
  const [showVariables, setShowVariables] = useState(false);

  const handleCreateProject = () => {
    console.log('Create new project clicked');
    // For now, create a demo project and go straight to canvas
    setSelectedProjectId(`demo-project-${Date.now()}`);
    setView('canvas');
  };

  const handleSelectProject = (projectId: string) => {
    console.log('Selected project:', projectId);
    setSelectedProjectId(projectId);
    setView('canvas');
  };

  // Skip directly to canvas with demo project (temporary shortcut)
  const handleDemoMode = () => {
    setSelectedProjectId('demo-project');
    setView('canvas');
  };

  if (view === 'canvas' && selectedProjectId) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
        {/* Navigation Bar */}
        <div className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between" style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-primary)'
        }}>
          <button
            onClick={() => setView('list')}
            className="btn-secondary font-medium flex items-center gap-2 group"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            <span>Back to Projects</span>
          </button>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setShowVariables(true)}
              className="btn-primary text-white font-semibold flex items-center gap-2 shadow-apple-button hover:shadow-apple-button-hover"
            >
              <span>📦</span>
              <span>Variables</span>
            </button>
            <div className="rounded-xl px-4 py-2" style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-secondary)'
            }}>
              <div className="font-semibold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {selectedProjectId}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden relative">
          <NodePalette />
          <div className="flex-1">
            <ReactFlowProvider>
              <FlowCanvas />
              <PropertyPanel />
            </ReactFlowProvider>
          </div>
        </div>

        {/* Variables Panel */}
        <VariablesPanel
          projectId={selectedProjectId}
          isOpen={showVariables}
          onClose={() => setShowVariables(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Premium Demo Banner */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial"></div>
        <div className="glass-strong border-b border-white/10 p-6 text-center relative">
          <button
            onClick={handleDemoMode}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-apple rounded-2xl font-semibold text-lg text-white shadow-apple-button hover:shadow-apple-button-hover transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Rocket className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="tracking-tight">Open Visual Workflow Builder</span>
          </button>
          <p className="text-white/60 text-sm mt-3 font-medium">
            Skip project setup and explore the canvas
          </p>
        </div>
      </div>

      <ProjectList
        onCreateProject={handleCreateProject}
        onSelectProject={handleSelectProject}
      />
    </div>
  );
}

export default App;
