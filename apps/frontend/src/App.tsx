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
            className="btn btn-ghost btn-sm group"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            <span className="hidden sm:inline">Back to Projects</span>
            <span className="sm:hidden">Back</span>
          </button>

          {/* Workflow Controls - will be populated by FlowCanvas */}
          <div id="workflow-toolbar" className="flex items-center gap-1 md:gap-2 flex-1 justify-center" />

          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <ThemeToggle />
            <button
              onClick={() => setShowVariables(true)}
              className="btn btn-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="hidden sm:inline">Variables</span>
            </button>
            <div className="hidden md:flex items-center rounded-xl px-4" style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-secondary)',
              maxWidth: '200px',
              height: '40px'
            }}>
              <div className="font-semibold text-sm tracking-tight" style={{
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }} title={selectedProjectId}>
                {selectedProjectId}
              </div>
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
                    <div
                      className="flex items-center gap-2"
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'nowrap',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {/* Primary Action */}
                      <button
                        onClick={controls.handleRunWorkflow}
                        disabled={controls.isExecuting || controls.nodes.length === 0 || controls.hasValidationErrors}
                        className="btn btn-primary"
                        title={controls.hasValidationErrors ? 'Fix validation errors before running' : controls.testMode ? 'Test Run' : 'Run Workflow'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="hidden xl:inline">{controls.isExecuting ? 'Starting...' : controls.testMode ? 'Test Run' : 'Run Workflow'}</span>
                      </button>

                      {/* Secondary Actions */}
                      <button
                        onClick={controls.handleSave}
                        disabled={controls.isSaving}
                        className="btn btn-secondary"
                        title={controls.isSaving ? 'Saving...' : 'Save'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        <span className="hidden xl:inline">{controls.isSaving ? 'Saving...' : 'Save'}</span>
                      </button>

                      <button
                        onClick={() => controls.setShowHistory(true)}
                        className="btn btn-secondary"
                        title="History"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="hidden xl:inline">History</span>
                      </button>

                      {/* Utility Actions */}
                      <button
                        onClick={controls.handleResetView}
                        className="btn btn-ghost"
                        title="Reset View"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        <span className="hidden xl:inline">Reset View</span>
                      </button>

                      {/* Danger Action */}
                      <button
                        onClick={controls.handleClearCanvas}
                        className="btn btn-danger"
                        title="Clear Canvas"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="hidden xl:inline">Clear Canvas</span>
                      </button>
                    </div>,
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
            className="btn btn-primary btn-lg group"
          >
            <Rocket className="group-hover:scale-110 transition-transform" />
            <span>Open Visual Workflow Builder</span>
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
