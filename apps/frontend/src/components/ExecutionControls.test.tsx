import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExecutionControls } from './ExecutionControls';

global.fetch = vi.fn();

describe('ExecutionControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  describe('Running state', () => {
    it('should render pause and cancel buttons for running status', () => {
      render(<ExecutionControls executionId="exec-1" status="running" />);

      expect(screen.getByText(/pause/i)).toBeInTheDocument();
      expect(screen.getByText(/cancel/i)).toBeInTheDocument();
      expect(screen.queryByText(/resume/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/retry/i)).not.toBeInTheDocument();
    });

    it('should call pause API when pause button is clicked', async () => {
      const onPause = vi.fn();
      const user = userEvent.setup();
      render(
        <ExecutionControls
          executionId="exec-1"
          status="running"
          onPause={onPause}
        />,
      );

      const pauseButton = screen.getByText(/pause/i);
      await user.click(pauseButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/executions/exec-1/pause',
          { method: 'POST' },
        );
        expect(onPause).toHaveBeenCalled();
      });
    });

    it('should call cancel API with confirmation', async () => {
      const onCancel = vi.fn();
      const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const user = userEvent.setup();

      render(
        <ExecutionControls
          executionId="exec-1"
          status="running"
          onCancel={onCancel}
        />,
      );

      const cancelButton = screen.getByText(/cancel/i);
      await user.click(cancelButton);

      await waitFor(() => {
        expect(confirmMock).toHaveBeenCalledWith(
          'Are you sure you want to cancel this execution?',
        );
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/executions/exec-1/cancel',
          { method: 'POST' },
        );
        expect(onCancel).toHaveBeenCalled();
      });

      confirmMock.mockRestore();
    });

    it('should not cancel if user rejects confirmation', async () => {
      const onCancel = vi.fn();
      const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(false);
      const user = userEvent.setup();

      render(
        <ExecutionControls
          executionId="exec-1"
          status="running"
          onCancel={onCancel}
        />,
      );

      const cancelButton = screen.getByText(/cancel/i);
      await user.click(cancelButton);

      expect(confirmMock).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();

      confirmMock.mockRestore();
    });
  });

  describe('Paused state', () => {
    it('should render resume and cancel buttons for paused status', () => {
      render(<ExecutionControls executionId="exec-1" status="paused" />);

      expect(screen.getByText(/resume/i)).toBeInTheDocument();
      expect(screen.getByText(/cancel/i)).toBeInTheDocument();
      expect(screen.queryByText(/pause/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/retry/i)).not.toBeInTheDocument();
    });

    it('should call resume API when resume button is clicked', async () => {
      const onResume = vi.fn();
      const user = userEvent.setup();

      render(
        <ExecutionControls
          executionId="exec-1"
          status="paused"
          onResume={onResume}
        />,
      );

      const resumeButton = screen.getByText(/resume/i);
      await user.click(resumeButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/executions/exec-1/resume',
          { method: 'POST' },
        );
        expect(onResume).toHaveBeenCalled();
      });
    });
  });

  describe('Failed state', () => {
    it('should render retry button for failed status', () => {
      render(<ExecutionControls executionId="exec-1" status="failed" />);

      expect(screen.getByText(/retry/i)).toBeInTheDocument();
      expect(screen.queryByText(/pause/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/resume/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/cancel/i)).not.toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const onRetry = vi.fn();
      const user = userEvent.setup();

      render(
        <ExecutionControls
          executionId="exec-1"
          status="failed"
          onRetry={onRetry}
        />,
      );

      const retryButton = screen.getByText(/retry/i);
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled(); // Retry doesn't call API directly
    });
  });

  describe('Completed state', () => {
    it('should render no controls for completed status', () => {
      render(<ExecutionControls executionId="exec-1" status="completed" />);

      expect(screen.queryByText(/pause/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/resume/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/cancel/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/retry/i)).not.toBeInTheDocument();
    });
  });

  describe('Cancelled state', () => {
    it('should render no controls for cancelled status', () => {
      render(<ExecutionControls executionId="exec-1" status="cancelled" />);

      expect(screen.queryByText(/pause/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/resume/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/cancel/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/retry/i)).not.toBeInTheDocument();
    });
  });

  describe('Loading states', () => {
    it('should show loading state when pausing', async () => {
      let resolvePromise: any;
      (global.fetch as any).mockReturnValue(
        new Promise(resolve => {
          resolvePromise = resolve;
        }),
      );

      const user = userEvent.setup();
      render(<ExecutionControls executionId="exec-1" status="running" />);

      const pauseButton = screen.getByText(/pause/i);
      await user.click(pauseButton);

      expect(screen.getByText(/pausing/i)).toBeInTheDocument();
      expect(pauseButton).toBeDisabled();

      resolvePromise({ ok: true, json: async () => ({}) });

      await waitFor(() => {
        expect(screen.queryByText(/pausing/i)).not.toBeInTheDocument();
      });
    });

    it('should show loading state when resuming', async () => {
      let resolvePromise: any;
      (global.fetch as any).mockReturnValue(
        new Promise(resolve => {
          resolvePromise = resolve;
        }),
      );

      const user = userEvent.setup();
      render(<ExecutionControls executionId="exec-1" status="paused" />);

      const resumeButton = screen.getByText(/resume/i);
      await user.click(resumeButton);

      expect(screen.getByText(/resuming/i)).toBeInTheDocument();
      expect(resumeButton).toBeDisabled();

      resolvePromise({ ok: true, json: async () => ({}) });

      await waitFor(() => {
        expect(screen.queryByText(/resuming/i)).not.toBeInTheDocument();
      });
    });

    it('should show loading state when cancelling', async () => {
      const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
      let resolvePromise: any;
      (global.fetch as any).mockReturnValue(
        new Promise(resolve => {
          resolvePromise = resolve;
        }),
      );

      const user = userEvent.setup();
      render(<ExecutionControls executionId="exec-1" status="running" />);

      const cancelButton = screen.getByText(/cancel/i);
      await user.click(cancelButton);

      expect(screen.getByText(/cancelling/i)).toBeInTheDocument();
      expect(cancelButton).toBeDisabled();

      resolvePromise({ ok: true, json: async () => ({}) });

      await waitFor(() => {
        expect(screen.queryByText(/cancelling/i)).not.toBeInTheDocument();
      });

      confirmMock.mockRestore();
    });

    it('should disable all buttons during loading', async () => {
      const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
      let resolvePromise: any;
      (global.fetch as any).mockReturnValue(
        new Promise(resolve => {
          resolvePromise = resolve;
        }),
      );

      const user = userEvent.setup();
      render(<ExecutionControls executionId="exec-1" status="running" />);

      const pauseButton = screen.getByText(/pause/i);
      await user.click(pauseButton);

      // All buttons should be disabled
      expect(pauseButton).toBeDisabled();
      expect(screen.getByText(/cancel/i)).toBeDisabled();

      resolvePromise({ ok: true, json: async () => ({}) });

      confirmMock.mockRestore();
    });
  });

  describe('Error handling', () => {
    it('should display error message when pause fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      const user = userEvent.setup();
      render(<ExecutionControls executionId="exec-1" status="running" />);

      const pauseButton = screen.getByText(/pause/i);
      await user.click(pauseButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to pause execution/i)).toBeInTheDocument();
      });
    });

    it('should display error message when resume fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      const user = userEvent.setup();
      render(<ExecutionControls executionId="exec-1" status="paused" />);

      const resumeButton = screen.getByText(/resume/i);
      await user.click(resumeButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to resume execution/i)).toBeInTheDocument();
      });
    });

    it('should display error message when cancel fails', async () => {
      const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      const user = userEvent.setup();
      render(<ExecutionControls executionId="exec-1" status="running" />);

      const cancelButton = screen.getByText(/cancel/i);
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to cancel execution/i)).toBeInTheDocument();
      });

      confirmMock.mockRestore();
    });

    it('should handle network errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const user = userEvent.setup();
      render(<ExecutionControls executionId="exec-1" status="running" />);

      const pauseButton = screen.getByText(/pause/i);
      await user.click(pauseButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
        expect(consoleError).toHaveBeenCalledWith('Pause error:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should clear error message on successful operation', async () => {
      // First fail
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      const user = userEvent.setup();
      render(<ExecutionControls executionId="exec-1" status="running" />);

      const pauseButton = screen.getByText(/pause/i);
      await user.click(pauseButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to pause execution/i)).toBeInTheDocument();
      });

      // Then succeed
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await user.click(pauseButton);

      await waitFor(() => {
        expect(screen.queryByText(/failed to pause execution/i)).not.toBeInTheDocument();
      });
    });
  });
});
