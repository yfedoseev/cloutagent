import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ValidationPanel } from './ValidationPanel';

global.fetch = vi.fn();

describe('ValidationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display validation errors', async () => {
    (global.fetch as any).mockResolvedValue({
      json: async () => ({
        valid: false,
        errors: [
          {
            type: 'agent',
            severity: 'error',
            message: 'Agent node must have a model configured',
            nodeId: 'agent-1',
          },
        ],
        warnings: [],
      }),
    });

    const workflow = {
      nodes: [{ id: 'agent-1', type: 'agent', data: {} }],
      edges: [],
    };

    render(<ValidationPanel projectId="proj-1" workflow={workflow} />);

    await waitFor(() => {
      expect(screen.getByText(/Agent node must have a model/)).toBeInTheDocument();
    });
  });

  it('should display validation warnings', async () => {
    (global.fetch as any).mockResolvedValue({
      json: async () => ({
        valid: true,
        errors: [],
        warnings: [
          {
            type: 'optimization',
            severity: 'warning',
            message: 'Consider adding subagents',
          },
        ],
      }),
    });

    const workflow = {
      nodes: [{ id: 'agent-1', type: 'agent', data: {} }],
      edges: [],
    };

    render(<ValidationPanel projectId="proj-1" workflow={workflow} />);

    await waitFor(() => {
      expect(screen.getByText(/Consider adding subagents/)).toBeInTheDocument();
    });
  });

  it('should show valid state when no errors', async () => {
    (global.fetch as any).mockResolvedValue({
      json: async () => ({
        valid: true,
        errors: [],
        warnings: [],
      }),
    });

    const workflow = {
      nodes: [{ id: 'agent-1', type: 'agent', data: { config: { model: 'claude-sonnet-4-5' } } }],
      edges: [],
    };

    render(<ValidationPanel projectId="proj-1" workflow={workflow} />);

    await waitFor(() => {
      expect(screen.getByText('Workflow Valid')).toBeInTheDocument();
    });
  });

  it('should collapse and expand panel', async () => {
    (global.fetch as any).mockResolvedValue({
      json: async () => ({
        valid: false,
        errors: [{ type: 'agent', severity: 'error', message: 'Test error' }],
        warnings: [],
      }),
    });

    const workflow = { nodes: [{ id: 'a', type: 'agent', data: {} }], edges: [] };

    render(<ValidationPanel projectId="proj-1" workflow={workflow} />);

    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    // Click collapse
    fireEvent.click(screen.getByText('▼'));

    await waitFor(() => {
      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });

  it('should call onNodeClick when clicking node link', async () => {
    const onNodeClick = vi.fn();

    (global.fetch as any).mockResolvedValue({
      json: async () => ({
        valid: false,
        errors: [
          {
            type: 'agent',
            severity: 'error',
            message: 'Error on node',
            nodeId: 'agent-1',
          },
        ],
        warnings: [],
      }),
    });

    const workflow = { nodes: [{ id: 'agent-1', type: 'agent', data: {} }], edges: [] };

    render(<ValidationPanel projectId="proj-1" workflow={workflow} onNodeClick={onNodeClick} />);

    await waitFor(() => {
      expect(screen.getByText(/View node: agent-1/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/View node: agent-1/));

    expect(onNodeClick).toHaveBeenCalledWith('agent-1');
  });

  it('should debounce validation on workflow changes', async () => {
    vi.useFakeTimers();

    (global.fetch as any).mockResolvedValue({
      json: async () => ({ valid: true, errors: [], warnings: [] }),
    });

    const { rerender } = render(
      <ValidationPanel
        projectId="proj-1"
        workflow={{ nodes: [], edges: [] }}
      />,
    );

    // Change workflow multiple times quickly
    rerender(
      <ValidationPanel
        projectId="proj-1"
        workflow={{ nodes: [{ id: '1', type: 'agent', data: {} }], edges: [] }}
      />,
    );

    rerender(
      <ValidationPanel
        projectId="proj-1"
        workflow={{ nodes: [{ id: '1', type: 'agent', data: {} }, { id: '2', type: 'subagent', data: {} }], edges: [] }}
      />,
    );

    // Should only call fetch once after debounce
    expect(global.fetch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(500);

    // Wait for the fetch to complete
    await vi.runAllTimersAsync();

    expect(global.fetch).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('should hide panel when no validation result', () => {
    const workflow = { nodes: [], edges: [] };

    const { container } = render(
      <ValidationPanel projectId="proj-1" workflow={workflow} />,
    );

    // Panel should not render anything initially
    expect(container.firstChild).toBeNull();
  });

  it('should display multiple errors and warnings', async () => {
    (global.fetch as any).mockResolvedValue({
      json: async () => ({
        valid: false,
        errors: [
          {
            type: 'agent',
            severity: 'error',
            message: 'Error 1',
            nodeId: 'agent-1',
          },
          {
            type: 'agent',
            severity: 'error',
            message: 'Error 2',
            nodeId: 'agent-2',
          },
        ],
        warnings: [
          {
            type: 'optimization',
            severity: 'warning',
            message: 'Warning 1',
          },
        ],
      }),
    });

    const workflow = {
      nodes: [
        { id: 'agent-1', type: 'agent', data: {} },
        { id: 'agent-2', type: 'agent', data: {} },
      ],
      edges: [],
    };

    render(<ValidationPanel projectId="proj-1" workflow={workflow} />);

    await waitFor(() => {
      expect(screen.getByText('2 Errors')).toBeInTheDocument();
      expect(screen.getByText('1 Warning')).toBeInTheDocument();
      expect(screen.getByText('Error 1')).toBeInTheDocument();
      expect(screen.getByText('Error 2')).toBeInTheDocument();
      expect(screen.getByText('Warning 1')).toBeInTheDocument();
    });
  });
});
