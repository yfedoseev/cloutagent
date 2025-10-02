import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentNode } from './AgentNode';
import { ReactFlowProvider } from 'reactflow';

const renderNode = (data: any, selected = false) => {
  return render(
    <ReactFlowProvider>
      <AgentNode
        id="test-1"
        type="agent"
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

describe('AgentNode', () => {
  it('should render agent name and model', () => {
    const data = {
      name: 'Code Generator',
      model: 'Claude Sonnet 4.5',
    };

    renderNode(data);

    expect(screen.getByText('Code Generator')).toBeTruthy();
    expect(screen.getByText('Claude Sonnet 4.5')).toBeTruthy();
  });

  it('should show status indicator when idle', () => {
    const data = {
      name: 'Test Agent',
      model: 'GPT-4',
      status: 'idle' as const,
    };

    const { container } = renderNode(data);

    // Check for status indicator with idle color
    const statusIndicator = container.querySelector('.bg-gray-500');
    expect(statusIndicator).toBeTruthy();
  });

  it('should show animated status indicator when running', () => {
    const data = {
      name: 'Test Agent',
      model: 'GPT-4',
      status: 'running' as const,
    };

    const { container } = renderNode(data);

    // Check for running status with pulse animation
    const statusIndicator = container.querySelector(
      '.bg-blue-500.animate-pulse',
    );
    expect(statusIndicator).toBeTruthy();
  });

  it('should show completed status indicator', () => {
    const data = {
      name: 'Test Agent',
      model: 'GPT-4',
      status: 'completed' as const,
    };

    const { container } = renderNode(data);

    const statusIndicator = container.querySelector('.bg-green-500');
    expect(statusIndicator).toBeTruthy();
  });

  it('should show failed status indicator', () => {
    const data = {
      name: 'Test Agent',
      model: 'GPT-4',
      status: 'failed' as const,
    };

    const { container } = renderNode(data);

    const statusIndicator = container.querySelector('.bg-red-500');
    expect(statusIndicator).toBeTruthy();
  });

  it('should display token count when available', () => {
    const data = {
      name: 'Test Agent',
      model: 'GPT-4',
      tokenUsage: { input: 1500, output: 3200 },
    };

    renderNode(data);

    // Total tokens = 4700
    expect(screen.getByText('4,700')).toBeTruthy();
  });

  it('should show cost when available', () => {
    const data = {
      name: 'Test Agent',
      model: 'GPT-4',
      costUSD: 0.0235,
    };

    renderNode(data);

    expect(screen.getByText('$0.0235')).toBeTruthy();
  });

  it('should highlight when selected', () => {
    const data = {
      name: 'Test Agent',
      model: 'GPT-4',
    };

    const { container } = renderNode(data, true);

    // Check for selected border style
    const node = container.querySelector('.border-blue-500');
    expect(node).toBeTruthy();
  });

  it('should show handles (1 target top, 1 source bottom)', () => {
    const data = {
      name: 'Test Agent',
      model: 'GPT-4',
    };

    const { container } = renderNode(data);

    // Check for Handle components by class
    const handles = container.querySelectorAll('.react-flow__handle');
    expect(handles.length).toBe(2);
  });

  it('should display temperature when provided', () => {
    const data = {
      name: 'Test Agent',
      model: 'GPT-4',
      temperature: 0.7,
    };

    renderNode(data);

    expect(screen.getByText('Temperature:')).toBeTruthy();
    expect(screen.getByText('0.7')).toBeTruthy();
  });

  it('should display max tokens when provided', () => {
    const data = {
      name: 'Test Agent',
      model: 'GPT-4',
      maxTokens: 4096,
    };

    renderNode(data);

    expect(screen.getByText('Max Tokens:')).toBeTruthy();
    expect(screen.getByText('4,096')).toBeTruthy();
  });

  it('should display truncated system prompt', () => {
    const data = {
      name: 'Test Agent',
      model: 'GPT-4',
      systemPrompt:
        'You are a helpful coding assistant that generates clean, production-ready code.',
    };

    renderNode(data);

    expect(
      screen.getByText(
        'You are a helpful coding assistant that generates clean, production-ready code.',
      ),
    ).toBeTruthy();
  });

  it('should be keyboard accessible with ARIA labels', () => {
    const data = {
      name: 'Code Generator',
      model: 'GPT-4',
      status: 'running' as const,
    };

    renderNode(data);

    expect(screen.getByRole('article')).toBeTruthy();
    expect(screen.getByLabelText('Agent node: Code Generator')).toBeTruthy();
    expect(screen.getByLabelText('Status: running')).toBeTruthy();
  });

  it('should display both token usage and cost together', () => {
    const data = {
      name: 'Test Agent',
      model: 'GPT-4',
      tokenUsage: { input: 2000, output: 5000 },
      costUSD: 0.0542,
    };

    renderNode(data);

    expect(screen.getByText('7,000')).toBeTruthy();
    expect(screen.getByText('$0.0542')).toBeTruthy();
  });

  it('should render without optional fields', () => {
    const data = {
      name: 'Minimal Agent',
      model: 'GPT-3.5',
    };

    renderNode(data);

    expect(screen.getByText('Minimal Agent')).toBeTruthy();
    expect(screen.getByText('GPT-3.5')).toBeTruthy();
  });

  it('should apply gradient background styling', () => {
    const data = {
      name: 'Test Agent',
      model: 'GPT-4',
    };

    const { container } = renderNode(data);

    const node = container.querySelector('.from-blue-900.to-blue-800');
    expect(node).toBeTruthy();
  });
});
