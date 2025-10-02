import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExecutionHistoryPanel } from './ExecutionHistoryPanel';
import type { ExecutionSummary } from '@cloutagent/types';

global.fetch = vi.fn();
global.confirm = vi.fn(() => true);

const mockExecution: ExecutionSummary = {
  id: 'exec-1',
  projectId: 'proj-1',
  status: 'completed',
  startedAt: new Date('2025-01-01T00:00:00Z'),
  duration: 5000,
  tokenUsage: { input: 100, output: 50, total: 150 },
  costUSD: 0.001,
};

const mockFailedExecution: ExecutionSummary = {
  id: 'exec-failed',
  projectId: 'proj-1',
  status: 'failed',
  startedAt: new Date('2025-01-01T00:00:00Z'),
  duration: 2500,
  tokenUsage: { input: 80, output: 20, total: 100 },
  costUSD: 0.0005,
  error: 'Test execution failed',
};

describe('ExecutionHistoryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ executions: [] }),
    });
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={false}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      expect(screen.queryByText('Execution History')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      expect(screen.getByText('Execution History')).toBeInTheDocument();
    });

    it('should show close button', () => {
      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      expect(screen.getByText('✕')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={onClose}
          onViewExecution={() => {}}
        />,
      );

      const closeButton = screen.getByText('✕');
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Loading executions', () => {
    it('should load executions when panel opens', async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          executions: [mockExecution],
        }),
      });

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/projects/proj-1/executions',
        );
      });
    });

    it('should display loading state while fetching', async () => {
      let resolvePromise: any;
      (global.fetch as any).mockReturnValue(
        new Promise(resolve => {
          resolvePromise = resolve;
        }),
      );

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      expect(screen.getByText(/loading executions/i)).toBeInTheDocument();

      resolvePromise({ json: async () => ({ executions: [] }) });

      await waitFor(() => {
        expect(screen.queryByText(/loading executions/i)).not.toBeInTheDocument();
      });
    });

    it('should display executions after loading', async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          executions: [mockExecution],
        }),
      });

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('exec-1')).toBeInTheDocument();
        expect(screen.getByText('COMPLETED')).toBeInTheDocument();
      });
    });

    it('should show empty state when no executions', async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          executions: [],
        }),
      });

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('No executions found')).toBeInTheDocument();
        expect(
          screen.getByText('Run a workflow to see execution history'),
        ).toBeInTheDocument();
      });
    });

    it('should handle fetch errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to load executions:',
          expect.any(Error),
        );
      });

      consoleError.mockRestore();
    });
  });

  describe('Filtering', () => {
    it('should render filter buttons', () => {
      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    it('should highlight active filter', () => {
      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      const allButton = screen.getByText('All');
      expect(allButton).toHaveClass('bg-blue-600');
    });

    it('should filter by completed status', async () => {
      const user = userEvent.setup();

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      const completedButton = screen.getByText('Completed');
      await user.click(completedButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/projects/proj-1/executions?status=completed',
        );
      });
    });

    it('should filter by failed status', async () => {
      const user = userEvent.setup();

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      const failedButton = screen.getByText('Failed');
      await user.click(failedButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/projects/proj-1/executions?status=failed',
        );
      });
    });

    it('should reload executions when filter changes', async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          executions: [mockFailedExecution],
        }),
      });

      const user = userEvent.setup();

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      const failedButton = screen.getByText('Failed');
      await user.click(failedButton);

      await waitFor(() => {
        expect(screen.getByText('exec-failed')).toBeInTheDocument();
        expect(screen.getByText('FAILED')).toBeInTheDocument();
      });
    });
  });

  describe('Execution cards', () => {
    it('should display execution details', async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          executions: [mockExecution],
        }),
      });

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('exec-1')).toBeInTheDocument();
        expect(screen.getByText('COMPLETED')).toBeInTheDocument();
        expect(screen.getByText(/150 tokens/i)).toBeInTheDocument();
        expect(screen.getByText(/\$0\.0010/)).toBeInTheDocument();
        expect(screen.getByText(/5\.00s/)).toBeInTheDocument();
      });
    });

    it('should display error message for failed executions', async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          executions: [mockFailedExecution],
        }),
      });

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText(/error: test execution failed/i)).toBeInTheDocument();
      });
    });

    it('should format timestamps correctly', async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          executions: [mockExecution],
        }),
      });

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      await waitFor(() => {
        // Check if timestamp is displayed (format depends on locale)
        // Just verify that some timestamp-like text is displayed
        expect(screen.getByText(/2024|2025/)).toBeInTheDocument();
      });
    });

    it('should show View button for all executions', async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          executions: [mockExecution],
        }),
      });

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('View')).toBeInTheDocument();
      });
    });

    it('should show Retry button only for failed executions', async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          executions: [mockExecution, mockFailedExecution],
        }),
      });

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
          onRetryExecution={() => {}}
        />,
      );

      await waitFor(() => {
        const retryButtons = screen.getAllByText('Retry');
        expect(retryButtons).toHaveLength(1); // Only for failed execution
      });
    });

    it('should show Delete button for all executions', async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          executions: [mockExecution],
        }),
      });

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });
  });

  describe('Actions', () => {
    it('should call onViewExecution when View is clicked', async () => {
      const onViewExecution = vi.fn();
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          executions: [mockExecution],
        }),
      });

      const user = userEvent.setup();

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={onViewExecution}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('View')).toBeInTheDocument();
      });

      const viewButton = screen.getByText('View');
      await user.click(viewButton);

      expect(onViewExecution).toHaveBeenCalledWith('exec-1');
    });

    it('should call onRetryExecution when Retry is clicked', async () => {
      const onRetryExecution = vi.fn();
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          executions: [mockFailedExecution],
        }),
      });

      const user = userEvent.setup();

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
          onRetryExecution={onRetryExecution}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);

      expect(onRetryExecution).toHaveBeenCalledWith('exec-failed');
    });

    it('should delete execution with confirmation', async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          executions: [mockExecution],
        }),
      });

      const user = userEvent.setup();

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(global.confirm).toHaveBeenCalledWith(
          'Are you sure you want to delete this execution?',
        );
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/projects/proj-1/executions/exec-1',
          { method: 'DELETE' },
        );
      });
    });

    it('should not delete if user cancels confirmation', async () => {
      (global.confirm as any).mockReturnValueOnce(false);
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          executions: [mockExecution],
        }),
      });

      const user = userEvent.setup();

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      // Clear initial fetch call
      vi.clearAllMocks();
      (global.fetch as any).mockResolvedValue({
        json: async () => ({ executions: [mockExecution] }),
      });

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      expect(global.confirm).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/executions/exec-1'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('should reload executions after successful delete', async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          executions: [mockExecution],
        }),
      });

      const user = userEvent.setup();

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      // Setup delete success
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      // Setup reload response
      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({
          executions: [],
        }),
      });

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('No executions found')).toBeInTheDocument();
      });
    });

    it('should handle delete errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          executions: [mockExecution],
        }),
      });

      const user = userEvent.setup();

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      // Setup delete failure
      (global.fetch as any).mockRejectedValueOnce(new Error('Delete failed'));

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to delete execution:',
          expect.any(Error),
        );
      });

      consoleError.mockRestore();
    });
  });

  describe('Multiple executions', () => {
    it('should display multiple executions', async () => {
      const executions = [
        mockExecution,
        { ...mockExecution, id: 'exec-2', status: 'running' as const },
        { ...mockExecution, id: 'exec-3', status: 'paused' as const },
      ];

      (global.fetch as any).mockResolvedValue({
        json: async () => ({ executions }),
      });

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('exec-1')).toBeInTheDocument();
        expect(screen.getByText('exec-2')).toBeInTheDocument();
        expect(screen.getByText('exec-3')).toBeInTheDocument();
      });
    });

    it('should show different status badges', async () => {
      const executions = [
        { ...mockExecution, status: 'completed' as const },
        { ...mockExecution, id: 'exec-2', status: 'failed' as const },
        { ...mockExecution, id: 'exec-3', status: 'running' as const },
        { ...mockExecution, id: 'exec-4', status: 'paused' as const },
        { ...mockExecution, id: 'exec-5', status: 'cancelled' as const },
      ];

      (global.fetch as any).mockResolvedValue({
        json: async () => ({ executions }),
      });

      render(
        <ExecutionHistoryPanel
          projectId="proj-1"
          isOpen={true}
          onClose={() => {}}
          onViewExecution={() => {}}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('COMPLETED')).toBeInTheDocument();
        expect(screen.getByText('FAILED')).toBeInTheDocument();
        expect(screen.getByText('RUNNING')).toBeInTheDocument();
        expect(screen.getByText('PAUSED')).toBeInTheDocument();
        expect(screen.getByText('CANCELLED')).toBeInTheDocument();
      });
    });
  });
});
