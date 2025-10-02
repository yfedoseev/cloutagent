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

describe('AgentNode - Enhanced Design', () => {
  // ============================================================
  // SECTION 1: Basic Rendering
  // ============================================================

  describe('Basic Rendering', () => {
    it('should render agent name and model', () => {
      const data = {
        name: 'Code Generator',
        model: 'Claude Sonnet 4.5',
      };

      renderNode(data);

      expect(screen.getByText('Code Generator')).toBeTruthy();
      expect(screen.getByText('Claude Sonnet 4.5')).toBeTruthy();
    });

    it('should render agent icon (🤖)', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
      };

      renderNode(data);

      const icon = screen.getByLabelText('Agent icon');
      expect(icon).toBeTruthy();
      expect(icon.textContent).toBe('🤖');
    });

    it('should not render "undefined" in title', () => {
      const data = {
        name: 'Valid Agent Name',
        model: 'Claude Sonnet 4',
      };

      const { container } = renderNode(data);
      const bodyText = container.textContent || '';

      expect(bodyText).not.toContain('undefined');
    });

    it('should display model information correctly', () => {
      const data = {
        name: 'Test Agent',
        model: 'Claude Sonnet 4.5',
      };

      renderNode(data);

      const modelText = screen.getByText('Claude Sonnet 4.5');
      expect(modelText).toBeTruthy();
      expect(modelText.classList.contains('text-blue-200')).toBe(true);
    });
  });

  // ============================================================
  // SECTION 2: Status Badge Display
  // ============================================================

  describe('Status Badge Display', () => {
    it('should show idle status indicator by default', () => {
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

    it('should show running status with animated pulse', () => {
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

    it('should show success status with green indicator', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
        status: 'completed' as const,
      };

      const { container } = renderNode(data);

      const statusIndicator = container.querySelector('.bg-green-500');
      expect(statusIndicator).toBeTruthy();
    });

    it('should show error status with red indicator', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
        status: 'failed' as const,
      };

      const { container } = renderNode(data);

      const statusIndicator = container.querySelector('.bg-red-500');
      expect(statusIndicator).toBeTruthy();
    });

    it('should not show status indicator when status is undefined', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
        // status not provided
      };

      const { container } = renderNode(data);

      const statusIndicators = container.querySelectorAll(
        '.bg-gray-500, .bg-blue-500, .bg-green-500, .bg-red-500',
      );
      // Should only find handle backgrounds, not status indicators
      expect(statusIndicators.length).toBeLessThanOrEqual(2); // Only handles
    });
  });

  // ============================================================
  // SECTION 3: Validation Display (Enhanced)
  // ============================================================

  describe('Validation Display', () => {
    it('should not show validation badge when no errors', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
        validationErrors: [],
      };

      const { container } = renderNode(data);

      const validationBadge = container.querySelector('.absolute.-top-2.-right-2');
      expect(validationBadge).toBeFalsy();
    });

    it('should show validation error badge when errors present', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
        validationErrors: [
          { field: 'model', message: 'Invalid model', severity: 'error' as const },
        ],
      };

      const { container } = renderNode(data);

      const errorBadge = container.querySelector('.bg-red-500');
      expect(errorBadge).toBeTruthy();
    });

    it('should display error count correctly', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
        validationErrors: [
          { field: 'model', message: 'Invalid model', severity: 'error' as const },
          { field: 'name', message: 'Name required', severity: 'error' as const },
        ],
      };

      const { container } = renderNode(data);

      const errorBadge = container.querySelector('.bg-red-500');
      expect(errorBadge?.textContent).toBe('2');
    });

    it('should show warning badge when warnings present', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
        validationErrors: [
          { field: 'temperature', message: 'High temperature', severity: 'warning' as const },
        ],
      };

      const { container } = renderNode(data);

      const warningBadge = container.querySelector('.bg-yellow-500');
      expect(warningBadge).toBeTruthy();
    });

    it('should show both error and warning badges', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
        validationErrors: [
          { field: 'model', message: 'Invalid model', severity: 'error' as const },
          { field: 'temperature', message: 'High temperature', severity: 'warning' as const },
        ],
      };

      const { container } = renderNode(data);

      const errorBadge = container.querySelector('.bg-red-500');
      const warningBadge = container.querySelector('.bg-yellow-500');

      expect(errorBadge).toBeTruthy();
      expect(warningBadge).toBeTruthy();
    });

    it('should display validation badge tooltip with error count', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
        validationErrors: [
          { field: 'model', message: 'Invalid model', severity: 'error' as const },
          { field: 'name', message: 'Name required', severity: 'error' as const },
        ],
      };

      const { container } = renderNode(data);

      const errorBadge = container.querySelector('.bg-red-500');
      const title = errorBadge?.getAttribute('title');

      expect(title).toContain('2 errors');
    });
  });

  // ============================================================
  // SECTION 4: Connection Handles (Enhanced)
  // ============================================================

  describe('Connection Handles', () => {
    it('should render input handle at top', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
      };

      const { container } = renderNode(data);

      const handles = container.querySelectorAll('.react-flow__handle');
      const targetHandle = Array.from(handles).find(
        (h) => h.classList.contains('react-flow__handle-top'),
      );

      expect(targetHandle).toBeTruthy();
    });

    it('should render output handle at bottom', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
      };

      const { container } = renderNode(data);

      const handles = container.querySelectorAll('.react-flow__handle');
      const sourceHandle = Array.from(handles).find(
        (h) => h.classList.contains('react-flow__handle-bottom'),
      );

      expect(sourceHandle).toBeTruthy();
    });

    it('should have correct handle styling (blue background)', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
      };

      const { container } = renderNode(data);

      const handles = container.querySelectorAll('.react-flow__handle');

      handles.forEach((handle) => {
        expect(handle.classList.contains('!bg-blue-400')).toBe(true);
      });
    });

    it('should have proper accessibility labels for handles', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
      };

      renderNode(data);

      const inputHandle = screen.getByLabelText('Input connection');
      const outputHandle = screen.getByLabelText('Output connection');

      expect(inputHandle).toBeTruthy();
      expect(outputHandle).toBeTruthy();
    });

    it('should render exactly 2 handles (1 input, 1 output)', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
      };

      const { container } = renderNode(data);

      const handles = container.querySelectorAll('.react-flow__handle');
      expect(handles.length).toBe(2);
    });
  });

  // ============================================================
  // SECTION 5: Selection State (Enhanced)
  // ============================================================

  describe('Selection State', () => {
    it('should apply selection border when selected', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
      };

      const { container } = renderNode(data, true);

      const node = container.querySelector('.border-blue-500');
      expect(node).toBeTruthy();
    });

    it('should apply selection shadow glow when selected', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
      };

      const { container } = renderNode(data, true);

      const node = container.querySelector('.shadow-blue-500\\/50');
      expect(node).toBeTruthy();
    });

    it('should not apply selection styles when not selected', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
      };

      const { container } = renderNode(data, false);

      const node = container.querySelector('.border-gray-700');
      expect(node).toBeTruthy();

      const selectedNode = container.querySelector('.border-blue-500');
      expect(selectedNode).toBeFalsy();
    });

    it('should apply hover shadow effect class', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
      };

      const { container } = renderNode(data);

      const node = container.querySelector('.hover\\:shadow-xl');
      expect(node).toBeTruthy();
    });
  });

  // ============================================================
  // SECTION 6: Node Structure (Enhanced Design)
  // ============================================================

  describe('Node Structure', () => {
    it('should have gradient background (blue theme)', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
      };

      const { container } = renderNode(data);

      const node = container.querySelector('.from-blue-900.to-blue-800');
      expect(node).toBeTruthy();
    });

    it('should have rounded corners and proper spacing', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
      };

      const { container } = renderNode(data);

      const node = container.querySelector('.rounded-lg');
      expect(node).toBeTruthy();

      const paddedNode = container.querySelector('.px-4.py-3');
      expect(paddedNode).toBeTruthy();
    });

    it('should have minimum width constraint', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
      };

      const { container } = renderNode(data);

      const node = container.querySelector('.min-w-\\[220px\\]');
      expect(node).toBeTruthy();
    });

    it('should have maximum width constraint', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
      };

      const { container } = renderNode(data);

      const node = container.querySelector('.max-w-\\[300px\\]');
      expect(node).toBeTruthy();
    });
  });

  // ============================================================
  // SECTION 7: Configuration Display
  // ============================================================

  describe('Configuration Display', () => {
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

    it('should display temperature 0 correctly (falsy check)', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
        temperature: 0,
      };

      renderNode(data);

      expect(screen.getByText('Temperature:')).toBeTruthy();
      expect(screen.getByText('0')).toBeTruthy();
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

    it('should not display config section when no config provided', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
      };

      renderNode(data);

      expect(screen.queryByText('Temperature:')).toBeFalsy();
      expect(screen.queryByText('Max Tokens:')).toBeFalsy();
    });
  });

  // ============================================================
  // SECTION 8: Execution Stats
  // ============================================================

  describe('Execution Stats', () => {
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

    it('should not show stats section when no stats provided', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
      };

      const { container } = renderNode(data);

      expect(container.textContent).not.toContain('Tokens:');
      expect(container.textContent).not.toContain('Cost:');
    });
  });

  // ============================================================
  // SECTION 9: Accessibility
  // ============================================================

  describe('Accessibility', () => {
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

    it('should have proper role attribute', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
      };

      const { container } = renderNode(data);

      const article = container.querySelector('[role="article"]');
      expect(article).toBeTruthy();
    });

    it('should have descriptive aria-label for node', () => {
      const data = {
        name: 'My Custom Agent',
        model: 'GPT-4',
      };

      renderNode(data);

      const node = screen.getByLabelText('Agent node: My Custom Agent');
      expect(node).toBeTruthy();
    });
  });

  // ============================================================
  // SECTION 10: Edge Cases
  // ============================================================

  describe('Edge Cases', () => {
    it('should render without optional fields', () => {
      const data = {
        name: 'Minimal Agent',
        model: 'GPT-3.5',
      };

      renderNode(data);

      expect(screen.getByText('Minimal Agent')).toBeTruthy();
      expect(screen.getByText('GPT-3.5')).toBeTruthy();
    });

    it('should handle empty token usage (0 tokens)', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
        tokenUsage: { input: 0, output: 0 },
      };

      renderNode(data);

      expect(screen.getByText('0')).toBeTruthy();
    });

    it('should handle very long names gracefully', () => {
      const data = {
        name: 'This is a very long agent name that might cause wrapping issues',
        model: 'GPT-4',
      };

      renderNode(data);

      expect(screen.getByText('This is a very long agent name that might cause wrapping issues')).toBeTruthy();
    });

    it('should handle cost of $0.0000', () => {
      const data = {
        name: 'Test Agent',
        model: 'GPT-4',
        costUSD: 0,
      };

      renderNode(data);

      expect(screen.getByText('$0.0000')).toBeTruthy();
    });
  });
});
