import { useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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
        <div className="sticky top-0 z-50 px-3 md:px-6 py-2 md:py-3 flex items-center justify-between gap-2 md:gap-4" style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-primary)'
        }}>
          <button
            onClick={() => setView('list')}
            className="btn-ghost font-medium flex items-center gap-1 md:gap-2 group flex-shrink-0 text-sm md:text-base px-2 md:px-3"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            <span className="hidden sm:inline">Back to Projects</span>
            <span className="sm:hidden">Back</span>
          </button>

          {/* Workflow Controls - will be populated by FlowCanvas */}
          <div id="workflow-toolbar" className="flex items-center gap-1 md:gap-2 flex-1 justify-center overflow-x-auto" />

          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <ThemeToggle />
            <button
              onClick={() => setShowVariables(true)}
              className="btn-primary text-white font-semibold flex items-center gap-1 md:gap-2 shadow-apple-button hover:shadow-apple-button-hover text-sm md:text-base px-3 md:px-4"
            >
              <span>📦</span>
              <span className="hidden sm:inline">Variables</span>
            </button>
            <div className="hidden md:flex flex-col gap-1 rounded-xl px-4 py-2" style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-secondary)'
            }}>
              <div className="font-semibold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {selectedProjectId}
              </div>
              {lastSaved && (
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Saved {lastSaved.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden relative">
          <NodePalette />
          <div className="flex-1">
            <ReactFlowProvider>
              <FlowCanvas
                onSave={setLastSaved}
                renderToolbar={(controls) => {
                  const toolbarElement = document.getElementById('workflow-toolbar');
                  if (!toolbarElement) return null;

                  return createPortal(
                    <>
                      <button
                        onClick={controls.handleRunWorkflow}
                        disabled={controls.isExecuting || controls.nodes.length === 0}
                        className="btn-primary-coral disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {controls.isExecuting ? 'Starting...' : controls.testMode ? 'Test Run' : 'Run Workflow'}
                      </button>
                      <button
                        onClick={controls.handleSave}
                        disabled={controls.isSaving}
                        className="btn-glass disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {controls.isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={controls.handleResetView}
                        className="btn-ghost"
                      >
                        Reset View
                      </button>
                      <button
                        onClick={() => controls.setShowHistory(true)}
                        className="btn-ghost"
                      >
                        History
                      </button>
                      <button
                        onClick={controls.handleClearCanvas}
                        className="btn-destructive"
                      >
                        Clear Canvas
                      </button>
                    </>,
                    toolbarElement
                  );
                }}
              />
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
      {/* Demo Banner */}
      <div className="relative overflow-hidden">
        <div className="p-6 text-center relative" style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-primary)'
        }}>
          <button
            onClick={handleDemoMode}
            className="btn-primary group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Rocket className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="tracking-tight">Open Visual Workflow Builder</span>
          </button>
          <p className="text-sm mt-3 font-medium" style={{ color: 'var(--text-secondary)' }}>
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
