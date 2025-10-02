import { useCanvasStore } from '../stores/canvas';

const nodeTemplates = [
  {
    type: 'agent',
    label: 'Agent',
    icon: '🤖',
    description: 'Main AI agent with Claude',
    color: 'blue',
  },
  {
    type: 'subagent',
    label: 'Subagent',
    icon: '👥',
    description: 'Specialized task agent',
    color: 'purple',
  },
  {
    type: 'hook',
    label: 'Hook',
    icon: '🪝',
    description: 'Event handler',
    color: 'green',
  },
  {
    type: 'mcp',
    label: 'MCP Tool',
    icon: '🔌',
    description: 'External tool integration',
    color: 'orange',
  },
] as const;

const colorClasses = {
  blue: 'bg-blue-900/50 hover:bg-blue-800/70 border-blue-700 hover:border-blue-600',
  purple:
    'bg-purple-900/50 hover:bg-purple-800/70 border-purple-700 hover:border-purple-600',
  green:
    'bg-green-900/50 hover:bg-green-800/70 border-green-700 hover:border-green-600',
  orange:
    'bg-orange-900/50 hover:bg-orange-800/70 border-orange-700 hover:border-orange-600',
};

export function NodePalette() {
  const { actions } = useCanvasStore();

  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    nodeType: string,
  ) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleAddNode = (type: string) => {
    // Add node at a semi-random position to avoid stacking
    const randomOffset = Math.random() * 100;
    actions.addNode(type as any, {
      x: 250 + randomOffset,
      y: 250 + randomOffset,
    });
  };

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 p-4 flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-white font-bold text-lg mb-1">Node Palette</h3>
        <p className="text-gray-400 text-xs">
          Drag nodes onto the canvas or click to add
        </p>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto">
        {nodeTemplates.map(template => (
          <div
            key={template.type}
            draggable
            onDragStart={e => onDragStart(e, template.type)}
            onClick={() => handleAddNode(template.type)}
            className={`p-3 rounded-lg border-2 cursor-move transition-all ${
              colorClasses[template.color]
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{template.icon}</span>
              <span className="font-semibold text-white">{template.label}</span>
            </div>
            <p className="text-xs text-gray-300">{template.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 space-y-1">
          <p>
            <kbd className="px-1 py-0.5 bg-gray-900 rounded text-gray-300">
              Del
            </kbd>{' '}
            Delete selected
          </p>
          <p>
            <kbd className="px-1 py-0.5 bg-gray-900 rounded text-gray-300">
              Scroll
            </kbd>{' '}
            Zoom canvas
          </p>
        </div>
      </div>
    </div>
  );
}
