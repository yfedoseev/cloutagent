import { Bot, Users, Webhook, Plug } from 'lucide-react';
import { useCanvasStore } from '../stores/canvas';

const nodeTemplates = [
  {
    type: 'agent',
    label: 'Agent',
    Icon: Bot,
    description: 'Main AI agent with Claude',
    iconColor: 'var(--node-agent)',
  },
  {
    type: 'subagent',
    label: 'Subagent',
    Icon: Users,
    description: 'Specialized task agent',
    iconColor: 'var(--node-subagent)',
  },
  {
    type: 'hook',
    label: 'Hook',
    Icon: Webhook,
    description: 'Event handler',
    iconColor: 'var(--node-hook)',
  },
  {
    type: 'mcp',
    label: 'MCP Tool',
    Icon: Plug,
    description: 'External tool integration',
    iconColor: 'var(--node-mcp)',
  },
] as const;

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
    <div
      className="w-64 flex flex-col h-full overflow-hidden"
      style={{
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-primary)',
      }}
    >
      {/* Header Section */}
      <div
        className="px-4 py-4"
        style={{
          borderBottom: '1px solid var(--border-primary)',
        }}
      >
        <h3
          className="font-semibold mb-1"
          style={{
            fontSize: 'var(--font-size-base)',
            letterSpacing: 'var(--letter-spacing-tight)',
            color: 'var(--text-primary)',
          }}
        >
          Components
        </h3>
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--line-height-normal)',
          }}
        >
          Drag to canvas or click to add
        </p>
      </div>

      {/* Node Templates Section */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-2">
          {nodeTemplates.map(template => (
            <div
              key={template.type}
              draggable
              onDragStart={e => onDragStart(e, template.type)}
              onClick={() => handleAddNode(template.type)}
              className="cursor-move transition-all"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                transitionDuration: '0.2s',
                transitionTimingFunction: 'var(--ease-ios)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-primary)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-md)',
                    background: `color-mix(in srgb, ${template.iconColor} 10%, transparent)`,
                  }}
                >
                  <template.Icon
                    className="w-4 h-4"
                    style={{ color: template.iconColor }}
                    aria-label={`${template.label} icon`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-medium mb-0.5"
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-primary)',
                      lineHeight: 'var(--line-height-tight)',
                    }}
                  >
                    {template.label}
                  </div>
                  <p
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      lineHeight: 'var(--line-height-normal)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {template.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcuts Section */}
      <div
        className="px-4 py-3"
        style={{
          borderTop: '1px solid var(--border-primary)',
          background: 'var(--bg-secondary)',
        }}
      >
        <div className="space-y-2" style={{ fontSize: 'var(--font-size-xs)' }}>
          <div className="flex items-center gap-2">
            <kbd
              className="px-2 py-0.5 font-medium"
              style={{
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-primary)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              Del
            </kbd>
            <span style={{ color: 'var(--text-tertiary)' }}>Delete selected</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd
              className="px-2 py-0.5 font-medium"
              style={{
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-primary)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              Scroll
            </kbd>
            <span style={{ color: 'var(--text-tertiary)' }}>Zoom canvas</span>
          </div>
        </div>
      </div>
    </div>
  );
}
