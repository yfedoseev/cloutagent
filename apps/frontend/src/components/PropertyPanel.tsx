import { useEffect } from 'react';
import { usePropertyPanelStore } from '../stores/propertyPanelStore';
import { useCanvasStore } from '../stores/canvas';
import {
  AgentProperties,
  SubagentProperties,
  HookProperties,
  MCPProperties,
} from './properties';

export function PropertyPanel() {
  const { isOpen, nodeId, nodeType, closePanel } = usePropertyPanelStore();
  const { nodes, actions } = useCanvasStore();

  const selectedNode = nodes.find(n => n.id === nodeId);

  // Close panel when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const panel = document.getElementById('property-panel');
      if (panel && !panel.contains(e.target as Node)) {
        closePanel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closePanel]);

  // Close panel on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePanel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closePanel]);

  if (!isOpen || !selectedNode) return null;

  const handleUpdate = (updates: Partial<typeof selectedNode>) => {
    if (updates.data) {
      actions.updateNode(nodeId!, updates.data);
    }
  };

  const handleDelete = () => {
    actions.deleteNode(nodeId!);
    closePanel();
  };

  // Render appropriate property editor based on node type
  const renderProperties = () => {
    switch (nodeType) {
      case 'agent':
        return <AgentProperties node={selectedNode} onChange={handleUpdate} />;
      case 'subagent':
        return (
          <SubagentProperties node={selectedNode} onChange={handleUpdate} />
        );
      case 'hook':
        return <HookProperties node={selectedNode} onChange={handleUpdate} />;
      case 'mcp':
        return <MCPProperties node={selectedNode} onChange={handleUpdate} />;
      default:
        return <div className="p-4 text-gray-400">Unknown node type</div>;
    }
  };

  return (
    <div
      id="property-panel"
      className={`
        fixed right-0 top-0 h-full w-96 bg-gray-800 border-l border-gray-700
        shadow-2xl z-50 overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        md:w-96 sm:w-full
      `}
      role="dialog"
      aria-label="Node properties"
      aria-modal="true"
    >
      {/* Header */}
      <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between z-10">
        <div>
          <h2 className="text-lg font-bold text-white">Properties</h2>
          <p className="text-sm text-gray-400">{nodeType} node</p>
        </div>

        <button
          onClick={closePanel}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close panel"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">{renderProperties()}</div>

      {/* Footer actions */}
      <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-medium transition-colors"
          >
            Delete Node
          </button>

          <button
            onClick={closePanel}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
