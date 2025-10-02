import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HookNode } from './HookNode';
import { ReactFlowProvider } from 'reactflow';

const renderNode = (data: any, selected = false) => {
  return render(
    <ReactFlowProvider>
      <HookNode
        id="test-1"
        type="hook"
        data={data}
        selected={selected}
        isConnectable={true}
        xPos={0}
        yPos={0}
        dragging={false}
        zIndex={1}
      />
    </ReactFlowProvider>,
  );
};

describe('HookNode', () => {
  it('should render hook name and type', () => {
    const data = {
      name: 'Validation Hook',
      type: 'pre-execution' as const,
      enabled: true,
      actionType: 'validate' as const,
    };

    renderNode(data);

    expect(screen.getByText('Validation Hook')).toBeTruthy();
    expect(screen.getByText('pre-execution')).toBeTruthy();
  });

  it('should display pre-execution icon', () => {
    const data = {
      name: 'Pre Hook',
      type: 'pre-execution' as const,
      enabled: true,
      actionType: 'log' as const,
    };

    renderNode(data);

    expect(screen.getByText('▶️')).toBeTruthy();
  });

  it('should display post-execution icon', () => {
    const data = {
      name: 'Post Hook',
      type: 'post-execution' as const,
      enabled: true,
      actionType: 'notify' as const,
    };

    renderNode(data);

    expect(screen.getByText('✅')).toBeTruthy();
  });

  it('should display pre-tool-call icon', () => {
    const data = {
      name: 'Tool Pre Hook',
      type: 'pre-tool-call' as const,
      enabled: true,
      actionType: 'transform' as const,
    };

    renderNode(data);

    expect(screen.getByText('🔧')).toBeTruthy();
  });

  it('should display post-tool-call icon', () => {
    const data = {
      name: 'Tool Post Hook',
      type: 'post-tool-call' as const,
      enabled: true,
      actionType: 'log' as const,
    };

    renderNode(data);

    expect(screen.getByText('🔨')).toBeTruthy();
  });

  it('should display on-error icon', () => {
    const data = {
      name: 'Error Hook',
      type: 'on-error' as const,
      enabled: true,
      actionType: 'notify' as const,
    };

    renderNode(data);

    expect(screen.getByText('❌')).toBeTruthy();
  });

  it('should show enabled indicator', () => {
    const data = {
      name: 'Test Hook',
      type: 'pre-execution' as const,
      enabled: true,
      actionType: 'log' as const,
    };

    renderNode(data);

    expect(screen.getByText('Enabled')).toBeTruthy();
    expect(screen.getByText('🟢')).toBeTruthy();
  });

  it('should show disabled indicator', () => {
    const data = {
      name: 'Test Hook',
      type: 'pre-execution' as const,
      enabled: false,
      actionType: 'log' as const,
    };

    renderNode(data);

    expect(screen.getByText('Disabled')).toBeTruthy();
    expect(screen.getByText('⚫')).toBeTruthy();
  });

  it('should display action type', () => {
    const data = {
      name: 'Logger Hook',
      type: 'pre-execution' as const,
      enabled: true,
      actionType: 'log' as const,
    };

    renderNode(data);

    expect(screen.getByText('Action:')).toBeTruthy();
    expect(screen.getByText('log')).toBeTruthy();
  });

  it('should display condition when provided', () => {
    const data = {
      name: 'Conditional Hook',
      type: 'pre-execution' as const,
      enabled: true,
      actionType: 'validate' as const,
      condition: 'input.length > 100',
    };

    renderNode(data);

    expect(screen.getByText('Condition:')).toBeTruthy();
    expect(screen.getByText('input.length > 100')).toBeTruthy();
  });

  it('should display last execution success', () => {
    const data = {
      name: 'Test Hook',
      type: 'post-execution' as const,
      enabled: true,
      actionType: 'notify' as const,
      lastExecution: {
        timestamp: new Date('2025-01-15T10:30:00Z'),
        result: 'success' as const,
      },
    };

    renderNode(data);

    expect(screen.getByText('Last run:')).toBeTruthy();
    expect(screen.getByText('✓ Success')).toBeTruthy();
  });

  it('should display last execution failure', () => {
    const data = {
      name: 'Test Hook',
      type: 'on-error' as const,
      enabled: true,
      actionType: 'log' as const,
      lastExecution: {
        timestamp: new Date('2025-01-15T10:30:00Z'),
        result: 'failure' as const,
      },
    };

    renderNode(data);

    expect(screen.getByText('Last run:')).toBeTruthy();
    expect(screen.getByText('✗ Failed')).toBeTruthy();
  });

  it('should highlight when selected', () => {
    const data = {
      name: 'Test Hook',
      type: 'pre-execution' as const,
      enabled: true,
      actionType: 'log' as const,
    };

    const { container } = renderNode(data, true);

    const node = container.querySelector('.border-green-500');
    expect(node).toBeTruthy();
  });

  it('should apply green gradient background', () => {
    const data = {
      name: 'Test Hook',
      type: 'pre-execution' as const,
      enabled: true,
      actionType: 'log' as const,
    };

    const { container } = renderNode(data);

    const node = container.querySelector('.from-green-900.to-green-800');
    expect(node).toBeTruthy();
  });

  it('should be keyboard accessible with ARIA labels', () => {
    const data = {
      name: 'Validation Hook',
      type: 'pre-execution' as const,
      enabled: true,
      actionType: 'validate' as const,
    };

    renderNode(data);

    expect(screen.getByRole('article')).toBeTruthy();
    expect(screen.getByLabelText('Hook node: Validation Hook')).toBeTruthy();
  });

  it('should show horizontal handles (left and right)', () => {
    const data = {
      name: 'Test Hook',
      type: 'pre-tool-call' as const,
      enabled: true,
      actionType: 'transform' as const,
    };

    const { container } = renderNode(data);

    const handles = container.querySelectorAll('.react-flow__handle');
    expect(handles.length).toBe(2);
  });

  it('should display all action types correctly', () => {
    const actionTypes = ['log', 'notify', 'transform', 'validate'] as const;

    actionTypes.forEach(actionType => {
      const data = {
        name: `Test ${actionType}`,
        type: 'pre-execution' as const,
        enabled: true,
        actionType,
      };

      const { unmount } = renderNode(data);
      expect(screen.getByText(actionType)).toBeTruthy();
      unmount();
    });
  });

  // ============================================================
  // ENHANCED TESTS - TDD Cycle 1.1
  // ============================================================

  describe('Enhanced Validation Display', () => {
    it('should not show validation badge when no errors', () => {
      const data = {
        name: 'Test Hook',
        type: 'pre-execution' as const,
        enabled: true,
        actionType: 'log' as const,
        validationErrors: [],
      };

      const { container } = renderNode(data);
      const validationBadge = container.querySelector('.absolute.-top-2.-right-2');
      expect(validationBadge).toBeFalsy();
    });

    it('should show validation error badge', () => {
      const data = {
        name: 'Test Hook',
        type: 'pre-execution' as const,
        enabled: true,
        actionType: 'log' as const,
        validationErrors: [
          { field: 'condition', message: 'Invalid syntax', severity: 'error' as const },
        ],
      };

      const { container } = renderNode(data);
      const errorBadge = container.querySelector('.bg-red-500');
      expect(errorBadge).toBeTruthy();
    });

    it('should display error count', () => {
      const data = {
        name: 'Test Hook',
        type: 'on-error' as const,
        enabled: true,
        actionType: 'notify' as const,
        validationErrors: [
          { field: 'name', message: 'Name required', severity: 'error' as const },
          { field: 'actionType', message: 'Action type required', severity: 'error' as const },
        ],
      };

      const { container } = renderNode(data);
      const errorBadge = container.querySelector('.bg-red-500');
      expect(errorBadge?.textContent).toBe('2');
    });

    it('should show warning badge', () => {
      const data = {
        name: 'Test Hook',
        type: 'pre-tool-call' as const,
        enabled: false,
        actionType: 'log' as const,
        validationErrors: [
          { field: 'enabled', message: 'Hook is disabled', severity: 'warning' as const },
        ],
      };

      const { container } = renderNode(data);
      const warningBadge = container.querySelector('.bg-yellow-500');
      expect(warningBadge).toBeTruthy();
    });
  });

  describe('Enhanced Connection Handles', () => {
    it('should have green handle styling', () => {
      const data = {
        name: 'Test Hook',
        type: 'post-execution' as const,
        enabled: true,
        actionType: 'validate' as const,
      };

      const { container } = renderNode(data);
      const handles = container.querySelectorAll('.react-flow__handle');

      handles.forEach((handle) => {
        expect(handle.classList.contains('!bg-green-400')).toBe(true);
      });
    });

    it('should have accessibility labels for handles', () => {
      const data = {
        name: 'Test Hook',
        type: 'pre-execution' as const,
        enabled: true,
        actionType: 'log' as const,
      };

      renderNode(data);

      const inputHandle = screen.getByLabelText('Input connection');
      const outputHandle = screen.getByLabelText('Output connection');

      expect(inputHandle).toBeTruthy();
      expect(outputHandle).toBeTruthy();
    });

    it('should render input handle at left position', () => {
      const data = {
        name: 'Test Hook',
        type: 'pre-tool-call' as const,
        enabled: true,
        actionType: 'transform' as const,
      };

      const { container } = renderNode(data);
      const handles = container.querySelectorAll('.react-flow__handle');
      const targetHandle = Array.from(handles).find(
        (h) => h.classList.contains('react-flow__handle-left'),
      );

      expect(targetHandle).toBeTruthy();
    });

    it('should render output handle at right position', () => {
      const data = {
        name: 'Test Hook',
        type: 'post-tool-call' as const,
        enabled: true,
        actionType: 'notify' as const,
      };

      const { container } = renderNode(data);
      const handles = container.querySelectorAll('.react-flow__handle');
      const sourceHandle = Array.from(handles).find(
        (h) => h.classList.contains('react-flow__handle-right'),
      );

      expect(sourceHandle).toBeTruthy();
    });
  });

  describe('Enhanced Selection State', () => {
    it('should apply green selection shadow glow', () => {
      const data = {
        name: 'Test Hook',
        type: 'pre-execution' as const,
        enabled: true,
        actionType: 'log' as const,
      };

      const { container } = renderNode(data, true);
      const node = container.querySelector('.shadow-green-500\\/50');
      expect(node).toBeTruthy();
    });

    it('should not apply selection styles when not selected', () => {
      const data = {
        name: 'Test Hook',
        type: 'post-execution' as const,
        enabled: true,
        actionType: 'notify' as const,
      };

      const { container } = renderNode(data, false);
      const node = container.querySelector('.border-gray-700');
      expect(node).toBeTruthy();

      const selectedNode = container.querySelector('.border-green-500');
      expect(selectedNode).toBeFalsy();
    });

    it('should apply hover shadow effect', () => {
      const data = {
        name: 'Test Hook',
        type: 'on-error' as const,
        enabled: true,
        actionType: 'log' as const,
      };

      const { container } = renderNode(data);
      const node = container.querySelector('.hover\\:shadow-xl');
      expect(node).toBeTruthy();
    });
  });

  describe('Enhanced Node Structure', () => {
    it('should have proper sizing constraints', () => {
      const data = {
        name: 'Test Hook',
        type: 'pre-execution' as const,
        enabled: true,
        actionType: 'validate' as const,
      };

      const { container } = renderNode(data);

      const node = container.querySelector('.min-w-\\[240px\\]');
      expect(node).toBeTruthy();

      const maxWidth = container.querySelector('.max-w-\\[320px\\]');
      expect(maxWidth).toBeTruthy();
    });

    it('should not render "undefined" text anywhere', () => {
      const data = {
        name: 'Valid Hook',
        type: 'pre-tool-call' as const,
        enabled: true,
        actionType: 'transform' as const,
      };

      const { container } = renderNode(data);
      const bodyText = container.textContent || '';

      expect(bodyText).not.toContain('undefined');
    });
  });

  describe('Edge Cases', () => {
    it('should render with minimal data', () => {
      const data = {
        name: 'Minimal Hook',
        type: 'pre-execution' as const,
        enabled: false,
        actionType: 'log' as const,
      };

      renderNode(data);

      expect(screen.getByText('Minimal Hook')).toBeTruthy();
      expect(screen.getByText('pre-execution')).toBeTruthy();
      expect(screen.getByText('log')).toBeTruthy();
    });

    it('should handle very long condition expressions', () => {
      const data = {
        name: 'Complex Hook',
        type: 'pre-execution' as const,
        enabled: true,
        actionType: 'validate' as const,
        condition: 'input.length > 100 && input.includes("test") && output.status === "success"',
      };

      const { container } = renderNode(data);
      expect(container.textContent).toContain('input.length > 100');
    });

    it('should handle undefined lastExecution', () => {
      const data = {
        name: 'Test Hook',
        type: 'post-execution' as const,
        enabled: true,
        actionType: 'notify' as const,
        // lastExecution not provided
      };

      renderNode(data);

      expect(screen.queryByText('Last run:')).toBeFalsy();
    });

    it('should display condition in code style', () => {
      const data = {
        name: 'Test Hook',
        type: 'pre-execution' as const,
        enabled: true,
        actionType: 'validate' as const,
        condition: 'x > 10',
      };

      renderNode(data);

      const conditionElement = screen.getByText('x > 10');
      expect(conditionElement.classList.contains('font-mono')).toBe(true);
    });
  });
});
