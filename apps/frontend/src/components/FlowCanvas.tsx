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
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useCanvasStore } from '../stores/canvas';
import { usePropertyPanelStore } from '../stores/propertyPanelStore';
import { useValidationStore } from '../stores/validationStore';
import { AgentNode } from './nodes/AgentNode';
import { SubagentNode } from './nodes/SubagentNode';
import { HookNode } from './nodes/HookNode';
import { MCPNode } from './nodes/MCPNode';
import { CanvasEmptyState } from './canvas/CanvasEmptyState';
import { CustomEdge } from './canvas/CustomEdge';
import { apiClient } from '../lib/api-client';
import { ExecutionMonitor } from './ExecutionMonitor';
import { ExecutionControls } from './ExecutionControls';
import { ExecutionHistoryPanel } from './ExecutionHistoryPanel';
import { ValidationPanel } from './ValidationPanel';
import { TestModeToggle } from './TestModeToggle';
import { TestModeExecution } from './TestModeExecution';
import { DryRunEstimate } from './DryRunEstimate';
import { WorkflowData } from '@cloutagent/types';

const nodeTypes: NodeTypes = {
  agent: AgentNode,
  subagent: SubagentNode,
  hook: HookNode,
  mcp: MCPNode,
};

const edgeTypes = {
  default: CustomEdge,
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
      const workflow: WorkflowData = {
        nodes: storeNodes.map(node => ({
          id: node.id,
          type: (node.type as 'agent' | 'subagent' | 'hook' | 'mcp') || 'agent',
          data: { config: node.data },
          position: node.position,
        })),
        edges: storeEdges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
        })),
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
      // Update the entire node data including position
      const nodeData = {
        ...node.data,
        position: node.position,
      };
      actions.updateNode(node.id, nodeData);
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
      const workflow: WorkflowData = {
        nodes: storeNodes.map(node => ({
          id: node.id,
          type: (node.type as 'agent' | 'subagent' | 'hook' | 'mcp') || 'agent',
          data: { config: node.data },
          position: node.position,
        })),
        edges: storeEdges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
        })),
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
        edgeTypes={edgeTypes}
        defaultViewport={viewport}
        fitView
        className="reactflow-dark"
      >
        {/* SVG Gradient Definitions */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>

        {/* Grid Background */}
        <Background
          color="rgba(255, 255, 255, 0.05)"
          gap={20}
          size={1}
        />

        {/* Empty State (when no nodes) */}
        {nodes.length === 0 && <CanvasEmptyState />}

        <Controls className="glass rounded-xl border border-white/10" />
        <MiniMap
          nodeColor={node => {
            switch (node.type) {
              case 'agent':
                return '#3b82f6';
              case 'subagent':
                return '#8b5cf6';
              case 'hook':
                return '#10b981';
              case 'mcp':
                return '#f59e0b';
              default:
                return '#6b7280';
            }
          }}
          className="glass rounded-xl border border-white/10"
          maskColor="rgba(0, 0, 0, 0.6)"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
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
          {/* PRIMARY ACTION - Most important, warm coral */}
          <button
            onClick={handleRunWorkflow}
            disabled={isExecuting || nodes.length === 0}
            className="btn-primary-coral disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? 'Starting...' : testMode ? 'Test Run' : 'Run Workflow'}
          </button>

          {/* SECONDARY ACTION - Glassmorphic */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-glass disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>

          {/* Auto-save timestamp - keep as is */}
          {lastSaved && (
            <span className="text-xs text-gray-400">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}

          {/* TERTIARY ACTION - Minimal ghost */}
          <button
            onClick={() => setShowHistory(true)}
            className="btn-ghost"
          >
            History
          </button>

          {/* DESTRUCTIVE ACTION - Subtle, requires confirmation */}
          <button
            onClick={handleClearCanvas}
            className="btn-destructive"
          >
            Clear Canvas
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
