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

  // ============================================================
  // ENHANCED TESTS - TDD Cycle 1.1
  // ============================================================

  describe('Enhanced Validation Display', () => {
    it('should not show validation badge when no errors', () => {
      const data = {
        name: 'Test Subagent',
        type: 'frontend-engineer' as const,
        validationErrors: [],
      };

      const { container } = renderNode(data);
      const validationBadge = container.querySelector('.absolute.-top-2.-right-2');
      expect(validationBadge).toBeFalsy();
    });

    it('should show validation error badge', () => {
      const data = {
        name: 'Test Subagent',
        type: 'frontend-engineer' as const,
        validationErrors: [
          { field: 'type', message: 'Invalid type', severity: 'error' as const },
        ],
      };

      const { container } = renderNode(data);
      const errorBadge = container.querySelector('.bg-red-500');
      expect(errorBadge).toBeTruthy();
    });

    it('should display multiple errors count', () => {
      const data = {
        name: 'Test Subagent',
        type: 'backend-engineer' as const,
        validationErrors: [
          { field: 'name', message: 'Name required', severity: 'error' as const },
          { field: 'type', message: 'Invalid type', severity: 'error' as const },
        ],
      };

      const { container } = renderNode(data);
      const errorBadge = container.querySelector('.bg-red-500');
      expect(errorBadge?.textContent).toBe('2');
    });

    it('should show warning badge', () => {
      const data = {
        name: 'Test Subagent',
        type: 'general-purpose' as const,
        validationErrors: [
          { field: 'description', message: 'Description recommended', severity: 'warning' as const },
        ],
      };

      const { container } = renderNode(data);
      const warningBadge = container.querySelector('.bg-yellow-500');
      expect(warningBadge).toBeTruthy();
    });

    it('should show both errors and warnings', () => {
      const data = {
        name: 'Test Subagent',
        type: 'ml-engineer' as const,
        validationErrors: [
          { field: 'name', message: 'Name too short', severity: 'error' as const },
          { field: 'description', message: 'Add more details', severity: 'warning' as const },
        ],
      };

      const { container } = renderNode(data);
      const errorBadge = container.querySelector('.bg-red-500');
      const warningBadge = container.querySelector('.bg-yellow-500');

      expect(errorBadge).toBeTruthy();
      expect(warningBadge).toBeTruthy();
    });
  });

  describe('Enhanced Connection Handles', () => {
    it('should have purple handle styling', () => {
      const data = {
        name: 'Test Subagent',
        type: 'database-engineer' as const,
      };

      const { container } = renderNode(data);
      const handles = container.querySelectorAll('.react-flow__handle');

      handles.forEach((handle) => {
        expect(handle.classList.contains('!bg-purple-400')).toBe(true);
      });
    });

    it('should have accessibility labels for handles', () => {
      const data = {
        name: 'Test Subagent',
        type: 'ml-engineer' as const,
      };

      renderNode(data);

      const inputHandle = screen.getByLabelText('Input connection');
      const outputHandle = screen.getByLabelText('Output connection');

      expect(inputHandle).toBeTruthy();
      expect(outputHandle).toBeTruthy();
    });

    it('should render input handle at top position', () => {
      const data = {
        name: 'Test Subagent',
        type: 'frontend-engineer' as const,
      };

      const { container } = renderNode(data);
      const handles = container.querySelectorAll('.react-flow__handle');
      const targetHandle = Array.from(handles).find(
        (h) => h.classList.contains('react-flow__handle-top'),
      );

      expect(targetHandle).toBeTruthy();
    });

    it('should render output handle at bottom position', () => {
      const data = {
        name: 'Test Subagent',
        type: 'backend-engineer' as const,
      };

      const { container } = renderNode(data);
      const handles = container.querySelectorAll('.react-flow__handle');
      const sourceHandle = Array.from(handles).find(
        (h) => h.classList.contains('react-flow__handle-bottom'),
      );

      expect(sourceHandle).toBeTruthy();
    });
  });

  describe('Enhanced Selection State', () => {
    it('should apply purple selection shadow glow', () => {
      const data = {
        name: 'Test Subagent',
        type: 'backend-engineer' as const,
      };

      const { container } = renderNode(data, true);
      const node = container.querySelector('.shadow-purple-500\\/50');
      expect(node).toBeTruthy();
    });

    it('should not apply selection styles when not selected', () => {
      const data = {
        name: 'Test Subagent',
        type: 'database-engineer' as const,
      };

      const { container } = renderNode(data, false);
      const node = container.querySelector('.border-gray-700');
      expect(node).toBeTruthy();

      const selectedNode = container.querySelector('.border-purple-500');
      expect(selectedNode).toBeFalsy();
    });

    it('should apply hover shadow effect', () => {
      const data = {
        name: 'Test Subagent',
        type: 'frontend-engineer' as const,
      };

      const { container } = renderNode(data);
      const node = container.querySelector('.hover\\:shadow-xl');
      expect(node).toBeTruthy();
    });
  });

  describe('Enhanced Node Structure', () => {
    it('should have proper sizing constraints', () => {
      const data = {
        name: 'Test Subagent',
        type: 'backend-engineer' as const,
      };

      const { container } = renderNode(data);

      const node = container.querySelector('.min-w-\\[220px\\]');
      expect(node).toBeTruthy();

      const maxWidth = container.querySelector('.max-w-\\[300px\\]');
      expect(maxWidth).toBeTruthy();
    });

    it('should not render "undefined" text anywhere', () => {
      const data = {
        name: 'Valid Subagent',
        type: 'general-purpose' as const,
      };

      const { container } = renderNode(data);
      const bodyText = container.textContent || '';

      expect(bodyText).not.toContain('undefined');
    });
  });

  describe('Edge Cases', () => {
    it('should render with minimal data', () => {
      const data = {
        name: 'Minimal Subagent',
        type: 'general-purpose' as const,
      };

      renderNode(data);

      expect(screen.getByText('Minimal Subagent')).toBeTruthy();
      expect(screen.getByText('general-purpose')).toBeTruthy();
    });

    it('should handle very long descriptions', () => {
      const data = {
        name: 'Test Subagent',
        type: 'frontend-engineer' as const,
        description: 'This is a very long description that should be truncated to prevent layout issues and maintain visual consistency across nodes in the workflow canvas',
      };

      const { container } = renderNode(data);
      expect(container.textContent).toContain('This is a very long description');
    });

    it('should handle execution time of 0', () => {
      const data = {
        name: 'Test Subagent',
        type: 'backend-engineer' as const,
        executionTime: 0,
      };

      renderNode(data);

      expect(screen.getByText('0s')).toBeTruthy();
    });

    it('should handle both result and error (error takes precedence)', () => {
      const data = {
        name: 'Test Subagent',
        type: 'database-engineer' as const,
        result: 'Success',
        error: 'But then failed',
      };

      renderNode(data);

      expect(screen.getByText(/But then failed/)).toBeTruthy();
      expect(screen.queryByText(/Success/)).toBeFalsy();
    });
  });
});
