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
});
