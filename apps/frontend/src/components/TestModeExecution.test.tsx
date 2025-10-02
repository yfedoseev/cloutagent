import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestModeExecution } from './TestModeExecution';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('TestModeExecution', () => {
  const mockWorkflow = {
    nodes: [
      { id: 'node-1', type: 'agent', data: { config: { name: 'Test Agent' } } },
    ],
    edges: [{ id: 'edge-1', source: 'node-1', target: 'node-2' }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render run test button', () => {
    render(
      <TestModeExecution
        projectId="proj-1"
        workflow={mockWorkflow}
        input="Test input"
      />,
    );

    expect(screen.getByText('🧪 Run Test')).toBeInTheDocument();
  });

  it('should show loading state when running test', async () => {
    mockFetch.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({
                result: {
                  id: 'test-1',
                  status: 'completed',
                  output: 'Test output',
                  steps: [],
                  duration: 1000,
                  tokenUsage: { input: 100, output: 50, total: 150 },
                  costUSD: 0.001,
                },
              }),
            });
          }, 100),
        ),
    );

    render(
      <TestModeExecution
        projectId="proj-1"
        workflow={mockWorkflow}
        input="Test input"
      />,
    );

    const button = screen.getByText('🧪 Run Test');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('⏳ Running Test...')).toBeInTheDocument();
    });
  });

  it('should call correct API endpoint with workflow data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          id: 'test-1',
          status: 'completed',
          output: 'Test output',
          steps: [],
          duration: 1000,
          tokenUsage: { input: 100, output: 50, total: 150 },
          costUSD: 0.001,
        },
      }),
    });

    render(
      <TestModeExecution
        projectId="proj-123"
        workflow={mockWorkflow}
        input="My test input"
      />,
    );

    fireEvent.click(screen.getByText('🧪 Run Test'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-123/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: mockWorkflow,
          input: 'My test input',
        }),
      });
    });
  });

  it('should display success result when test passes', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          id: 'test-1',
          status: 'completed',
          output: '[TEST MODE] Simulated output',
          steps: [
            { message: 'Validation complete' },
            { message: 'Agent execution simulated' },
          ],
          duration: 2500,
          tokenUsage: { input: 500, output: 300, total: 800 },
          costUSD: 0.0123,
        },
      }),
    });

    render(
      <TestModeExecution
        projectId="proj-1"
        workflow={mockWorkflow}
        input="Test input"
      />,
    );

    fireEvent.click(screen.getByText('🧪 Run Test'));

    await waitFor(() => {
      expect(screen.getByText('✅')).toBeInTheDocument();
      expect(screen.getByText('Test Passed')).toBeInTheDocument();
    });
  });

  it('should display execution steps', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          id: 'test-1',
          status: 'completed',
          output: 'Output',
          steps: [
            { message: 'Step 1: Validation' },
            { message: 'Step 2: Execution' },
            { message: 'Step 3: Complete' },
          ],
          duration: 1000,
          tokenUsage: { input: 100, output: 50, total: 150 },
          costUSD: 0.001,
        },
      }),
    });

    render(
      <TestModeExecution
        projectId="proj-1"
        workflow={mockWorkflow}
        input="Test input"
      />,
    );

    fireEvent.click(screen.getByText('🧪 Run Test'));

    await waitFor(() => {
      expect(screen.getByText('Execution Steps:')).toBeInTheDocument();
      expect(screen.getByText('Step 1: Validation')).toBeInTheDocument();
      expect(screen.getByText('Step 2: Execution')).toBeInTheDocument();
      expect(screen.getByText('Step 3: Complete')).toBeInTheDocument();
    });
  });

  it('should display simulated output', async () => {
    const testOutput = '[TEST MODE] This is simulated output\nLine 2\nLine 3';
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          id: 'test-1',
          status: 'completed',
          output: testOutput,
          steps: [],
          duration: 1000,
          tokenUsage: { input: 100, output: 50, total: 150 },
          costUSD: 0.001,
        },
      }),
    });

    render(
      <TestModeExecution
        projectId="proj-1"
        workflow={mockWorkflow}
        input="Test input"
      />,
    );

    fireEvent.click(screen.getByText('🧪 Run Test'));

    await waitFor(() => {
      expect(screen.getByText('Simulated Output:')).toBeInTheDocument();
      const preElement = screen.getByText((content, element) => {
        return element?.tagName === 'PRE' && content.includes('[TEST MODE]');
      });
      expect(preElement).toBeInTheDocument();
    });
  });

  it('should display metrics correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          id: 'test-1',
          status: 'completed',
          output: 'Output',
          steps: [],
          duration: 3456,
          tokenUsage: { input: 1200, output: 800, total: 2000 },
          costUSD: 0.0345,
        },
      }),
    });

    render(
      <TestModeExecution
        projectId="proj-1"
        workflow={mockWorkflow}
        input="Test input"
      />,
    );

    fireEvent.click(screen.getByText('🧪 Run Test'));

    await waitFor(() => {
      expect(screen.getByText('3.46s')).toBeInTheDocument();
      expect(screen.getByText('2,000')).toBeInTheDocument();
      expect(screen.getByText('$0.0345')).toBeInTheDocument();
    });
  });

  it('should display warning banner about simulation', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          id: 'test-1',
          status: 'completed',
          output: 'Output',
          steps: [],
          duration: 1000,
          tokenUsage: { input: 100, output: 50, total: 150 },
          costUSD: 0.001,
        },
      }),
    });

    render(
      <TestModeExecution
        projectId="proj-1"
        workflow={mockWorkflow}
        input="Test input"
      />,
    );

    fireEvent.click(screen.getByText('🧪 Run Test'));

    await waitFor(() => {
      expect(
        screen.getByText(
          /This was a simulated execution\. Real execution may differ/,
        ),
      ).toBeInTheDocument();
    });
  });

  it('should display error on test failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: 'Bad Request',
    });

    render(
      <TestModeExecution
        projectId="proj-1"
        workflow={mockWorkflow}
        input="Test input"
      />,
    );

    fireEvent.click(screen.getByText('🧪 Run Test'));

    await waitFor(() => {
      expect(screen.getByText('Test Failed')).toBeInTheDocument();
      expect(screen.getByText('Test execution failed')).toBeInTheDocument();
    });
  });

  it('should display network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(
      <TestModeExecution
        projectId="proj-1"
        workflow={mockWorkflow}
        input="Test input"
      />,
    );

    fireEvent.click(screen.getByText('🧪 Run Test'));

    await waitFor(() => {
      expect(screen.getByText('Test Failed')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should call onComplete callback on success', async () => {
    const onComplete = vi.fn();
    const result = {
      id: 'test-1',
      status: 'completed',
      output: 'Output',
      steps: [],
      duration: 1000,
      tokenUsage: { input: 100, output: 50, total: 150 },
      costUSD: 0.001,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ result }),
    });

    render(
      <TestModeExecution
        projectId="proj-1"
        workflow={mockWorkflow}
        input="Test input"
        onComplete={onComplete}
      />,
    );

    fireEvent.click(screen.getByText('🧪 Run Test'));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(result);
    });
  });

  it('should not call onComplete on error', async () => {
    const onComplete = vi.fn();
    mockFetch.mockResolvedValue({ ok: false });

    render(
      <TestModeExecution
        projectId="proj-1"
        workflow={mockWorkflow}
        input="Test input"
        onComplete={onComplete}
      />,
    );

    fireEvent.click(screen.getByText('🧪 Run Test'));

    await waitFor(() => {
      expect(screen.getByText('Test Failed')).toBeInTheDocument();
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('should disable button while test is running', async () => {
    mockFetch.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000)),
    );

    render(
      <TestModeExecution
        projectId="proj-1"
        workflow={mockWorkflow}
        input="Test input"
      />,
    );

    const button = screen.getByText('🧪 Run Test') as HTMLButtonElement;
    expect(button.disabled).toBe(false);

    fireEvent.click(button);

    await waitFor(() => {
      expect(button.disabled).toBe(true);
    });
  });

  it('should clear previous results when running new test', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          id: 'test-1',
          status: 'completed',
          output: 'First output',
          steps: [],
          duration: 1000,
          tokenUsage: { input: 100, output: 50, total: 150 },
          costUSD: 0.001,
        },
      }),
    });

    render(
      <TestModeExecution
        projectId="proj-1"
        workflow={mockWorkflow}
        input="Test input"
      />,
    );

    fireEvent.click(screen.getByText('🧪 Run Test'));

    await waitFor(() => {
      expect(screen.getByText('First output')).toBeInTheDocument();
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          id: 'test-2',
          status: 'completed',
          output: 'Second output',
          steps: [],
          duration: 1000,
          tokenUsage: { input: 100, output: 50, total: 150 },
          costUSD: 0.001,
        },
      }),
    });

    fireEvent.click(screen.getByText('🧪 Run Test'));

    await waitFor(() => {
      expect(screen.queryByText('First output')).not.toBeInTheDocument();
      expect(screen.getByText('Second output')).toBeInTheDocument();
    });
  });

  it('should handle failed test status', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          id: 'test-1',
          status: 'failed',
          output: 'Failed output',
          steps: [{ message: 'Error occurred' }],
          duration: 1000,
          tokenUsage: { input: 100, output: 50, total: 150 },
          costUSD: 0.001,
        },
      }),
    });

    render(
      <TestModeExecution
        projectId="proj-1"
        workflow={mockWorkflow}
        input="Test input"
      />,
    );

    fireEvent.click(screen.getByText('🧪 Run Test'));

    await waitFor(() => {
      expect(screen.getByText('❌')).toBeInTheDocument();
      expect(screen.getByText('Test Failed')).toBeInTheDocument();
    });
  });

  it('should format cost with 4 decimal places', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          id: 'test-1',
          status: 'completed',
          output: 'Output',
          steps: [],
          duration: 1000,
          tokenUsage: { input: 100, output: 50, total: 150 },
          costUSD: 0.00015,
        },
      }),
    });

    render(
      <TestModeExecution
        projectId="proj-1"
        workflow={mockWorkflow}
        input="Test input"
      />,
    );

    fireEvent.click(screen.getByText('🧪 Run Test'));

    await waitFor(() => {
      expect(screen.getByText(/\$0\.000[12]/)).toBeInTheDocument();
    });
  });

  it('should not display output section if no output', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          id: 'test-1',
          status: 'completed',
          output: null,
          steps: [],
          duration: 1000,
          tokenUsage: { input: 100, output: 50, total: 150 },
          costUSD: 0.001,
        },
      }),
    });

    render(
      <TestModeExecution
        projectId="proj-1"
        workflow={mockWorkflow}
        input="Test input"
      />,
    );

    fireEvent.click(screen.getByText('🧪 Run Test'));

    await waitFor(() => {
      expect(screen.getByText('Test Passed')).toBeInTheDocument();
    });

    expect(screen.queryByText('Simulated Output:')).not.toBeInTheDocument();
  });
});
