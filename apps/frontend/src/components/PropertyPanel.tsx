import { useEffect } from 'react';
import { Bot, Users, Webhook, Plug, Package } from 'lucide-react';
import { usePropertyPanelStore } from '../stores/propertyPanelStore';
import { useCanvasStore } from '../stores/canvas';
import {
  AgentProperties,
  SubagentProperties,
  HookProperties,
  MCPProperties,
} from './properties';

// Node icon mapping
const nodeIcons = {
  agent: Bot,
  subagent: Users,
  hook: Webhook,
  mcp: Plug,
};

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

  // Empty state when no node is selected
  if (!isOpen || !selectedNode) {
    return null;
  }

  const handleUpdate = (updates: Partial<typeof selectedNode>) => {
    if (updates.data) {
      actions.updateNode(nodeId!, updates.data);
    }
  };

  const handleDelete = () => {
    actions.deleteNode(nodeId!);
    closePanel();
  };

  const handleDuplicate = () => {
    if (!selectedNode) return;
    actions.duplicateNode(selectedNode.id);
    closePanel();
  };

  const handleResetDefaults = () => {
    // Reset to default values based on node type
    // This is a placeholder - implementation depends on node type defaults
    // TODO: Implement reset functionality per node type
  };

  const NodeIcon =
    nodeIcons[nodeType as keyof typeof nodeIcons] || Package;

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
        fixed right-0 top-0 h-full w-96
        shadow-2xl z-50 overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        md:w-96 sm:w-full
      `}
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        borderLeft: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-xl)',
      }}
      role="dialog"
      aria-label="Node properties"
      aria-modal="true"
    >
      {/* Header */}
      <div className="panel-header sticky top-0 p-4 z-10" style={{
        background: 'var(--glass-bg-strong)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-primary)',
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Node Icon */}
            <NodeIcon
              className="w-8 h-8"
              style={{ color: 'var(--accent-primary)' }}
              aria-label={`${nodeType} icon`}
            />

            {/* Node Name & Type */}
            <div>
              <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                {selectedNode.data.config?.name || 'Untitled Node'}
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {nodeType} node
              </p>
            </div>
          </div>

          <button
            onClick={closePanel}
            className="transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
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

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-3">
          <button
            className="btn-glass text-xs flex-1"
            onClick={handleDuplicate}
            aria-label="Duplicate node"
          >
            Duplicate
          </button>
          <button
            className="btn-glass text-xs flex-1"
            style={{ color: 'var(--error)' }}
            onClick={handleDelete}
            aria-label="Delete node"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">{renderProperties()}</div>

      {/* Footer with auto-save indicator */}
      <div className="panel-footer sticky bottom-0 p-4" style={{
        background: 'var(--glass-bg-strong)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-primary)',
      }}>
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <div
            className="flex items-center gap-2"
            data-testid="autosave-indicator"
          >
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--success)' }}></div>
            <span>Auto-saved</span>
          </div>
          <button
            className="transition-colors"
            style={{ color: 'var(--accent-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-secondary-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent-secondary)'}
            onClick={handleResetDefaults}
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </div>
  );
}
