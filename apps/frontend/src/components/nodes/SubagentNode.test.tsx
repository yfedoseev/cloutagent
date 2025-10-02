import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubagentNode } from './SubagentNode';
import { ReactFlowProvider } from 'reactflow';

const renderNode = (data: any, selected = false) => {
  return render(
    <ReactFlowProvider>
      <SubagentNode
        id="test-1"
        type="subagent"
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

describe('SubagentNode', () => {
  it('should render subagent name and type', () => {
    const data = {
      name: 'Frontend Developer',
      type: 'frontend-engineer' as const,
    };

    renderNode(data);

    expect(screen.getByText('Frontend Developer')).toBeTruthy();
    expect(screen.getByText('frontend-engineer')).toBeTruthy();
  });

  it('should display frontend-engineer icon', () => {
    const data = {
      name: 'UI Developer',
      type: 'frontend-engineer' as const,
    };

    renderNode(data);

    expect(screen.getByText('🎨')).toBeTruthy();
  });

  it('should display backend-engineer icon', () => {
    const data = {
      name: 'API Developer',
      type: 'backend-engineer' as const,
    };

    renderNode(data);

    expect(screen.getByText('⚙️')).toBeTruthy();
  });

  it('should display database-engineer icon', () => {
    const data = {
      name: 'DB Developer',
      type: 'database-engineer' as const,
    };

    renderNode(data);

    expect(screen.getByText('🗄️')).toBeTruthy();
  });

  it('should display ml-engineer icon', () => {
    const data = {
      name: 'ML Developer',
      type: 'ml-engineer' as const,
    };

    renderNode(data);

    expect(screen.getByText('🤖')).toBeTruthy();
  });

  it('should display general-purpose icon', () => {
    const data = {
      name: 'General Agent',
      type: 'general-purpose' as const,
    };

    renderNode(data);

    expect(screen.getByText('👤')).toBeTruthy();
  });

  it('should show status indicator when idle', () => {
    const data = {
      name: 'Test Subagent',
      type: 'frontend-engineer' as const,
      status: 'idle' as const,
    };

    const { container } = renderNode(data);

    const statusIndicator = container.querySelector('.bg-gray-500');
    expect(statusIndicator).toBeTruthy();
  });

  it('should show running status with animation', () => {
    const data = {
      name: 'Test Subagent',
      type: 'backend-engineer' as const,
      status: 'running' as const,
    };

    const { container } = renderNode(data);

    const statusIndicator = container.querySelector(
      '.bg-blue-500.animate-pulse',
    );
    expect(statusIndicator).toBeTruthy();
  });

  it('should show completed status', () => {
    const data = {
      name: 'Test Subagent',
      type: 'database-engineer' as const,
      status: 'completed' as const,
    };

    const { container } = renderNode(data);

    const statusIndicator = container.querySelector('.bg-green-500');
    expect(statusIndicator).toBeTruthy();
  });

  it('should show failed status', () => {
    const data = {
      name: 'Test Subagent',
      type: 'ml-engineer' as const,
      status: 'failed' as const,
    };

    const { container } = renderNode(data);

    const statusIndicator = container.querySelector('.bg-red-500');
    expect(statusIndicator).toBeTruthy();
  });

  it('should display description when provided', () => {
    const data = {
      name: 'Test Subagent',
      type: 'frontend-engineer' as const,
      description: 'Handles React component development',
    };

    renderNode(data);

    expect(
      screen.getByText('Handles React component development'),
    ).toBeTruthy();
  });

  it('should display execution time when available', () => {
    const data = {
      name: 'Test Subagent',
      type: 'backend-engineer' as const,
      executionTime: 2500,
    };

    renderNode(data);

    expect(screen.getByText('2.5s')).toBeTruthy();
  });

  it('should display result preview when available', () => {
    const data = {
      name: 'Test Subagent',
      type: 'database-engineer' as const,
      result: 'Successfully created database schema with 5 tables',
    };

    renderNode(data);

    expect(
      screen.getByText(/Successfully created database schema/),
    ).toBeTruthy();
  });

  it('should display error message when failed', () => {
    const data = {
      name: 'Test Subagent',
      type: 'ml-engineer' as const,
      status: 'failed' as const,
      error: 'Model training failed due to insufficient data',
    };

    renderNode(data);

    expect(screen.getByText(/Model training failed/)).toBeTruthy();
  });

  it('should highlight when selected', () => {
    const data = {
      name: 'Test Subagent',
      type: 'frontend-engineer' as const,
    };

    const { container } = renderNode(data, true);

    const node = container.querySelector('.border-purple-500');
    expect(node).toBeTruthy();
  });

  it('should apply purple gradient background', () => {
    const data = {
      name: 'Test Subagent',
      type: 'backend-engineer' as const,
    };

    const { container } = renderNode(data);

    const node = container.querySelector('.from-purple-900.to-purple-800');
    expect(node).toBeTruthy();
  });

  it('should be keyboard accessible with ARIA labels', () => {
    const data = {
      name: 'Frontend Dev',
      type: 'frontend-engineer' as const,
    };

    renderNode(data);

    expect(screen.getByRole('article')).toBeTruthy();
    expect(screen.getByLabelText('Subagent node: Frontend Dev')).toBeTruthy();
  });

  it('should show handles for connections', () => {
    const data = {
      name: 'Test Subagent',
      type: 'general-purpose' as const,
    };

    const { container } = renderNode(data);

    const handles = container.querySelectorAll('.react-flow__handle');
    expect(handles.length).toBe(2);
  });
});
