import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VariablesPanel } from './VariablesPanel';

// Mock fetch
global.fetch = vi.fn();

describe('VariablesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    (global.fetch as any).mockResolvedValue({
      json: async () => ({ variables: [] }),
    });

    render(<VariablesPanel projectId="proj-1" isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('Variables')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const { container } = render(
      <VariablesPanel projectId="proj-1" isOpen={false} onClose={() => {}} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('should load and display variables', async () => {
    (global.fetch as any).mockResolvedValue({
      json: async () => ({
        variables: [
          {
            id: 'var-1',
            name: 'apiKey',
            type: 'string',
            scope: 'global',
            value: 'sk-test-123',
          },
          {
            id: 'var-2',
            name: 'count',
            type: 'number',
            scope: 'node',
            value: 42,
          },
        ],
      }),
    });

    render(<VariablesPanel projectId="proj-1" isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('apiKey')).toBeInTheDocument();
      expect(screen.getByText('count')).toBeInTheDocument();
    });
  });

  it('should filter variables by scope', async () => {
    (global.fetch as any).mockResolvedValue({
      json: async () => ({
        variables: [
          { id: 'var-1', name: 'global1', scope: 'global', type: 'string', value: 'a' },
          { id: 'var-2', name: 'node1', scope: 'node', type: 'string', value: 'b' },
        ],
      }),
    });

    render(<VariablesPanel projectId="proj-1" isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('global1')).toBeInTheDocument();
    });

    // Click "Node" filter
    fireEvent.click(screen.getByText('Node'));

    await waitFor(() => {
      expect(screen.queryByText('global1')).not.toBeInTheDocument();
      expect(screen.getByText('node1')).toBeInTheDocument();
    });
  });

  it('should delete variable on confirmation', async () => {
    (global.fetch as any).mockResolvedValue({
      json: async () => ({
        variables: [
          { id: 'var-1', name: 'toDelete', scope: 'global', type: 'string', value: 'test' },
        ],
      }),
    });

    // Mock confirm
    global.confirm = vi.fn(() => true);

    render(<VariablesPanel projectId="proj-1" isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('toDelete')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects/proj-1/variables/var-1',
        { method: 'DELETE' },
      );
    });
  });

  it('should show empty state when no variables', async () => {
    (global.fetch as any).mockResolvedValue({
      json: async () => ({ variables: [] }),
    });

    render(<VariablesPanel projectId="proj-1" isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('No variables yet')).toBeInTheDocument();
    });
  });

  it('should open create modal on button click', async () => {
    (global.fetch as any).mockResolvedValue({
      json: async () => ({ variables: [] }),
    });

    render(<VariablesPanel projectId="proj-1" isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('+ New Variable')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ New Variable'));

    await waitFor(() => {
      expect(screen.getByText('Create Variable')).toBeInTheDocument();
    });
  });

  it('should mask secret variable values', async () => {
    (global.fetch as any).mockResolvedValue({
      json: async () => ({
        variables: [
          {
            id: 'var-1',
            name: 'apiSecret',
            type: 'secret',
            scope: 'global',
            value: 'super-secret-key',
          },
        ],
      }),
    });

    render(<VariablesPanel projectId="proj-1" isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('apiSecret')).toBeInTheDocument();
      // Secret value should be masked
      expect(screen.getByText(/••••••••••/)).toBeInTheDocument();
      // Actual value should NOT be visible
      expect(screen.queryByText('super-secret-key')).not.toBeInTheDocument();
    });
  });

  it('should display object variables as formatted JSON', async () => {
    (global.fetch as any).mockResolvedValue({
      json: async () => ({
        variables: [
          {
            id: 'var-1',
            name: 'config',
            type: 'object',
            scope: 'global',
            value: { key: 'value', nested: { prop: 123 } },
          },
        ],
      }),
    });

    render(<VariablesPanel projectId="proj-1" isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('config')).toBeInTheDocument();
      // Check for JSON content
      expect(screen.getByText(/"key"/)).toBeInTheDocument();
    });
  });
});
