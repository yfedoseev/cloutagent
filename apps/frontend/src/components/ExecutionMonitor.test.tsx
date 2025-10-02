import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ExecutionMonitor } from './ExecutionMonitor';

// Mock SSEClient
const mockHandlers = new Map<string, (data: any) => void>();
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockOn = vi.fn((event: string, handler: (data: any) => void) => {
  mockHandlers.set(event, handler);
});

vi.mock('../lib/sse-client', () => ({
  SSEClient: vi.fn().mockImplementation(() => ({
    connect: mockConnect,
    disconnect: mockDisconnect,
    on: mockOn,
  })),
}));

describe('ExecutionMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandlers.clear();
  });

  it('should render initial idle state', () => {
    render(<ExecutionMonitor executionId="exec-1" />);

    expect(screen.getByText('Idle')).toBeInTheDocument();
  });

  it('should connect to SSE stream on mount', () => {
    render(<ExecutionMonitor executionId="exec-1" />);

    expect(mockConnect).toHaveBeenCalledWith('exec-1');
  });

  it('should show running status when execution starts', async () => {
    render(<ExecutionMonitor executionId="exec-1" />);

    const startedHandler = mockHandlers.get('execution:started');
    expect(startedHandler).toBeDefined();

    act(() => {
      startedHandler?.({ executionId: 'exec-1', timestamp: Date.now() });
    });

    await waitFor(() => {
      expect(screen.getByText('Running')).toBeInTheDocument();
    });
  });

  it('should display output chunks as they arrive', async () => {
    render(<ExecutionMonitor executionId="exec-1" />);

    const startedHandler = mockHandlers.get('execution:started');
    const outputHandler = mockHandlers.get('execution:output');

    act(() => {
      startedHandler?.({ executionId: 'exec-1' });
      outputHandler?.({ chunk: 'Hello ' });
      outputHandler?.({ chunk: 'World!' });
    });

    await waitFor(() => {
      expect(screen.getByText(/Hello World!/)).toBeInTheDocument();
    });
  });

  it('should display token usage and cost', async () => {
    render(<ExecutionMonitor executionId="exec-1" />);

    const tokenUsageHandler = mockHandlers.get('execution:token-usage');
    expect(tokenUsageHandler).toBeDefined();

    act(() => {
      tokenUsageHandler?.({
        usage: { input: 1000, output: 2000, total: 3000 },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('3,000')).toBeInTheDocument();
      // (1000/1M)*3 + (2000/1M)*15 = 0.003 + 0.03 = 0.033
      expect(screen.getByText(/\$0\.0330/)).toBeInTheDocument();
    });
  });

  it('should show completed state on success', async () => {
    const onComplete = vi.fn();
    render(<ExecutionMonitor executionId="exec-1" onComplete={onComplete} />);

    const completedHandler = mockHandlers.get('execution:completed');
    expect(completedHandler).toBeDefined();

    act(() => {
      completedHandler?.({
        result: { id: 'exec-1', status: 'completed', output: 'Done' },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed' }),
      );
    });
  });

  it('should show error state on failure', async () => {
    const onError = vi.fn();
    render(<ExecutionMonitor executionId="exec-1" onError={onError} />);

    const failedHandler = mockHandlers.get('execution:failed');
    expect(failedHandler).toBeDefined();

    act(() => {
      failedHandler?.({
        error: 'Execution failed: timeout',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByText(/timeout/)).toBeInTheDocument();
      expect(onError).toHaveBeenCalledWith('Execution failed: timeout');
    });
  });

  it('should display current execution step', async () => {
    render(<ExecutionMonitor executionId="exec-1" />);

    const stepHandler = mockHandlers.get('execution:step');
    expect(stepHandler).toBeDefined();

    act(() => {
      stepHandler?.({
        step: 'Executing pre-hooks',
        status: 'running',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Executing pre-hooks')).toBeInTheDocument();
    });
  });

  it('should calculate and display duration', async () => {
    render(<ExecutionMonitor executionId="exec-1" />);

    const startedHandler = mockHandlers.get('execution:started');
    const completedHandler = mockHandlers.get('execution:completed');

    // Start execution
    act(() => {
      startedHandler?.({ executionId: 'exec-1' });
    });

    // Wait a bit before completing
    await new Promise(resolve => setTimeout(resolve, 100));

    act(() => {
      completedHandler?.({
        result: { id: 'exec-1', status: 'completed' },
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Duration:/)).toBeInTheDocument();
    });
  });

  it('should disconnect SSE on unmount', () => {
    const { unmount } = render(<ExecutionMonitor executionId="exec-1" />);

    expect(mockDisconnect).not.toHaveBeenCalled();

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should show waiting message when running with no output', async () => {
    render(<ExecutionMonitor executionId="exec-1" />);

    const startedHandler = mockHandlers.get('execution:started');

    act(() => {
      startedHandler?.({ executionId: 'exec-1' });
    });

    await waitFor(() => {
      expect(screen.getByText('Waiting for output...')).toBeInTheDocument();
    });
  });

  it('should calculate token rate correctly', async () => {
    render(<ExecutionMonitor executionId="exec-1" />);

    const startedHandler = mockHandlers.get('execution:started');
    const tokenUsageHandler = mockHandlers.get('execution:token-usage');
    const completedHandler = mockHandlers.get('execution:completed');

    // Start execution
    act(() => {
      startedHandler?.({ executionId: 'exec-1' });
    });

    // Wait 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));

    act(() => {
      tokenUsageHandler?.({
        usage: { input: 500, output: 500, total: 1000 },
      });
      completedHandler?.({
        result: { id: 'exec-1', status: 'completed' },
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/tokens\/s/)).toBeInTheDocument();
    });
  });

  it('should display detailed token breakdown', async () => {
    render(<ExecutionMonitor executionId="exec-1" />);

    const tokenUsageHandler = mockHandlers.get('execution:token-usage');

    act(() => {
      tokenUsageHandler?.({
        usage: { input: 1500, output: 2500, total: 4000 },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Input:')).toBeInTheDocument();
      expect(screen.getByText('1,500')).toBeInTheDocument();
      expect(screen.getByText('Output:')).toBeInTheDocument();
      expect(screen.getByText('2,500')).toBeInTheDocument();
    });
  });

  it('should handle execution restart with new executionId', async () => {
    const { rerender } = render(<ExecutionMonitor executionId="exec-1" />);

    expect(mockConnect).toHaveBeenCalledWith('exec-1');
    expect(mockConnect).toHaveBeenCalledTimes(1);

    // Change execution ID
    rerender(<ExecutionMonitor executionId="exec-2" />);

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalledWith('exec-2');
      expect(mockConnect).toHaveBeenCalledTimes(2);
    });
  });

  it('should display error with proper formatting', async () => {
    render(<ExecutionMonitor executionId="exec-1" />);

    const failedHandler = mockHandlers.get('execution:failed');

    act(() => {
      failedHandler?.({
        error: 'Network timeout\nRetry limit exceeded',
      });
    });

    await waitFor(() => {
      const errorElement = screen.getByText(/Network timeout/);
      expect(errorElement).toBeInTheDocument();
      expect(errorElement.tagName).toBe('PRE');
    });
  });

  it('should handle zero duration gracefully', async () => {
    render(<ExecutionMonitor executionId="exec-1" />);

    const tokenUsageHandler = mockHandlers.get('execution:token-usage');

    act(() => {
      tokenUsageHandler?.({
        usage: { input: 500, output: 500, total: 1000 },
      });
    });

    await waitFor(() => {
      // Should not crash and should show 0 tokens/s
      expect(screen.getByText(/0 tokens\/s/)).toBeInTheDocument();
    });
  });
});
