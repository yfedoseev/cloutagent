import { useCallback, useEffect, useRef, DragEvent, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Panel,
  NodeTypes,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useCanvasStore } from '../stores/canvas';
import { usePropertyPanelStore } from '../stores/propertyPanelStore';
import { useValidationStore } from '../stores/validationStore';
import { AgentNode, SubagentNode, HookNode, MCPNode } from './nodes';
import { apiClient } from '../lib/api-client';
import { ExecutionMonitor } from './ExecutionMonitor';
import { ExecutionControls } from './ExecutionControls';
import { ExecutionHistoryPanel } from './ExecutionHistoryPanel';
import { ValidationPanel } from './ValidationPanel';
import { TestModeToggle } from './TestModeToggle';
import { TestModeExecution } from './TestModeExecution';
import { DryRunEstimate } from './DryRunEstimate';

const nodeTypes: NodeTypes = {
  agent: AgentNode,
  subagent: SubagentNode,
  hook: HookNode,
  mcp: MCPNode,
};

interface FlowCanvasProps {
  projectId?: string;
}

export function FlowCanvas({ projectId = 'default-project' }: FlowCanvasProps) {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    viewport,
    selectedNodeId,
    actions,
  } = useCanvasStore();
  const { openPanel } = usePropertyPanelStore();
  const { getNodeErrors } = useValidationStore();
  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(
    null,
  );
  const [showMonitor, setShowMonitor] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<'running' | 'paused' | 'completed' | 'failed' | 'cancelled'>('running');
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // Load workflow on mount
  useEffect(() => {
    async function loadWorkflow() {
      try {
        const workflow = await apiClient.loadWorkflow(projectId);
        if (workflow && workflow.nodes.length > 0) {
          // Update canvas store with loaded workflow
          useCanvasStore.setState({
            nodes: workflow.nodes as any[],
            edges: workflow.edges as any[],
            viewport: workflow.viewport,
          });
        }
      } catch (error) {
        console.error('Failed to load workflow:', error);
      }
    }

    loadWorkflow();
  }, [projectId]);

  // Sync store nodes/edges to local state with validation errors
  useEffect(() => {
    // Add validation errors to nodes
    const nodesWithValidation = storeNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        validationErrors: getNodeErrors(node.id),
      },
    }));
    setNodes(nodesWithValidation);
  }, [storeNodes, setNodes, getNodeErrors]);

  useEffect(() => {
    setEdges(storeEdges);
  }, [storeEdges, setEdges]);

  // Autosave every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const workflow = {
        nodes: storeNodes,
        edges: storeEdges,
        viewport,
        version: '1.0.0',
      };

      await apiClient.autosaveWorkflow(projectId, workflow);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [projectId, storeNodes, storeEdges, viewport]);

  // Handle node connection
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        actions.addEdge(connection.source, connection.target);
        setEdges(eds => addEdge(connection, eds));
      }
    },
    [actions, setEdges],
  );

  // Handle node drag end - update positions in store
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: any) => {
      actions.updateNode(node.id, { position: node.position });
    },
    [actions],
  );

  // Handle viewport change
  const onMoveEnd = useCallback(
    (_event: any, viewport: any) => {
      actions.setViewport(viewport);
    },
    [actions],
  );

  // Handle node selection and open property panel
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      actions.selectNode(node.id);
      openPanel(node.id, node.type);
    },
    [actions, openPanel],
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Delete selected node on Backspace or Delete
      if (
        (event.key === 'Backspace' || event.key === 'Delete') &&
        selectedNodeId
      ) {
        event.preventDefault();
        actions.deleteNode(selectedNodeId);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, actions]);

  // Handle drop from palette
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type || !reactFlowWrapper.current) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.current?.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      }) || { x: 0, y: 0 };

      actions.addNode(type as any, position);
    },
    [actions],
  );

  // Manual save
  const handleSave = useCallback(async () => {
    setIsSaving(true);

    try {
      const workflow = {
        nodes: storeNodes,
        edges: storeEdges,
        viewport,
        version: '1.0.0',
      };

      await apiClient.saveWorkflow(projectId, workflow);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  }, [projectId, storeNodes, storeEdges, viewport]);

  // Handle clear canvas
  const handleClearCanvas = useCallback(() => {
    if (
      confirm(
        'Are you sure you want to clear the canvas? This will remove all nodes and edges.',
      )
    ) {
      useCanvasStore.setState({
        nodes: [],
        edges: [],
        selectedNodeId: null,
      });
    }
  }, []);

  // Handle run workflow
  const handleRunWorkflow = useCallback(async (input?: any) => {
    if (testMode) {
      setShowTestPanel(true);
      return;
    }

    setIsExecuting(true);
    setExecutionStatus('running');
    try {
      const response = await fetch('/api/executions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          input: input || 'Execute workflow',
          workflow: { nodes: storeNodes, edges: storeEdges, viewport },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start execution');
      }

      const { executionId } = await response.json();
      setActiveExecutionId(executionId);
      setShowMonitor(true);
    } catch (error) {
      console.error('Failed to start execution:', error);
      alert('Failed to start workflow execution');
      setExecutionStatus('failed');
    } finally {
      setIsExecuting(false);
    }
  }, [testMode, projectId, storeNodes, storeEdges, viewport]);

  // Handle retry execution
  const handleRetryExecution = useCallback(async (executionId: string) => {
    try {
      // Load execution details
      const response = await fetch(`/api/projects/${projectId}/executions/${executionId}`);
      const { execution } = await response.json();

      // Re-run with same input
      await handleRunWorkflow(execution.input);
    } catch (error) {
      console.error('Failed to retry execution:', error);
      alert('Failed to retry execution');
    }
  }, [projectId, handleRunWorkflow]);

  // Handle validation panel node click
  const handleValidationNodeClick = useCallback(
    (nodeId: string) => {
      const node = storeNodes.find(n => n.id === nodeId);
      if (node && reactFlowInstance.current) {
        // Center on node with smooth animation
        reactFlowInstance.current.setCenter(
          node.position.x + 150, // Offset to center of node
          node.position.y + 100,
          { zoom: 1.5, duration: 800 },
        );

        // Select node and open property panel
        actions.selectNode(nodeId);
        openPanel(nodeId, node.type!);
      }
    },
    [storeNodes, actions, openPanel],
  );

  return (
    <div
      ref={reactFlowWrapper}
      className="h-screen w-full"
      style={{ background: '#111827' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onMoveEnd={onMoveEnd}
        onNodeClick={onNodeClick}
        onInit={instance => {
          reactFlowInstance.current = instance;
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        defaultViewport={viewport}
        fitView
        className="reactflow-dark"
      >
        <Background
          color="#374151"
          gap={16}
          size={1}
          variant="dots"
          style={{ backgroundColor: '#111827' }}
        />
        <Controls className="bg-gray-800 border border-gray-700" />
        <MiniMap
          nodeColor={node => {
            switch (node.type) {
              case 'agent':
                return '#1E3A8A';
              case 'subagent':
                return '#581C87';
              case 'hook':
                return '#14532D';
              case 'mcp':
                return '#7C2D12';
              default:
                return '#374151';
            }
          }}
          className="bg-gray-800 border border-gray-700"
          style={{ backgroundColor: '#1F2937' }}
          maskColor="rgba(0, 0, 0, 0.6)"
        />
        <Panel position="top-left">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
            <TestModeToggle
              enabled={testMode}
              onChange={setTestMode}
              showEstimate={true}
              estimatedCost={estimate?.estimatedCost}
              estimatedTokens={estimate?.estimatedTokens}
              estimatedDuration={estimate?.estimatedDuration}
            />
          </div>
        </Panel>
        <Panel position="top-right" className="space-x-2 flex items-center">
          <div className="text-white text-sm bg-gray-800 px-3 py-2 rounded border border-gray-700">
            <div>Nodes: {nodes.length}</div>
            <div>Edges: {edges.length}</div>
            <div>Zoom: {(viewport.zoom * 100).toFixed(0)}%</div>
          </div>
          <button
            onClick={handleRunWorkflow}
            disabled={isExecuting || nodes.length === 0}
            className={`px-4 py-2 rounded text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              testMode
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isExecuting
              ? 'Starting...'
              : testMode
                ? '🧪 Test Run'
                : '▶️ Run Workflow'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          {lastSaved && (
            <span className="text-xs text-gray-400">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleClearCanvas}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm font-medium transition-colors"
          >
            Clear Canvas
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm font-medium transition-colors"
          >
            History
          </button>
        </Panel>
        <Panel position="bottom-left">
          <DryRunEstimate
            projectId={projectId}
            workflow={{ nodes, edges }}
            onEstimateReady={setEstimate}
          />
        </Panel>
      </ReactFlow>

      {/* Test Mode Execution Panel */}
      {testMode && showTestPanel && (
        <div className="fixed bottom-0 right-0 w-1/2 h-1/2 bg-gray-800 border-l border-t border-gray-700 shadow-2xl overflow-auto z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                Test Mode Execution
              </h3>
              <button
                onClick={() => setShowTestPanel(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <TestModeExecution
              projectId={projectId}
              workflow={{ nodes, edges }}
              input="Test input"
              onComplete={result => {
                console.log('Test complete:', result);
              }}
            />
          </div>
        </div>
      )}

      {/* Execution Monitor Drawer */}
      {showMonitor && activeExecutionId && (
        <div className="fixed bottom-0 right-0 w-1/2 h-1/2 shadow-2xl border-l border-t border-gray-700 z-50">
          <div className="h-full flex flex-col bg-gray-900">
            {/* Monitor Header */}
            <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
              <div className="flex items-center gap-4">
                <h3 className="text-white font-semibold">Execution Monitor</h3>
                <ExecutionControls
                  executionId={activeExecutionId}
                  status={executionStatus}
                  onPause={() => setExecutionStatus('paused')}
                  onResume={() => setExecutionStatus('running')}
                  onCancel={() => {
                    setExecutionStatus('cancelled');
                    setShowMonitor(false);
                    setActiveExecutionId(null);
                  }}
                />
              </div>
              <button
                onClick={() => setShowMonitor(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Monitor Content */}
            <div className="flex-1 overflow-hidden">
              <ExecutionMonitor
                executionId={activeExecutionId}
                onComplete={() => {
                  // Keep monitor open to show results
                  console.log('Execution completed');
                }}
                onError={error => {
                  console.error('Execution failed:', error);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Execution History Panel */}
      <ExecutionHistoryPanel
        projectId={projectId}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onViewExecution={(executionId) => {
          setActiveExecutionId(executionId);
          setShowMonitor(true);
          setShowHistory(false);
        }}
        onRetryExecution={handleRetryExecution}
      />

      {/* Validation Panel */}
      <ValidationPanel
        projectId={projectId}
        workflow={{ nodes: storeNodes, edges: storeEdges }}
        onNodeClick={handleValidationNodeClick}
      />
    </div>
  );
}
