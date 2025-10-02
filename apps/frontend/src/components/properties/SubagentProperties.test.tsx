import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubagentProperties } from './SubagentProperties';
import { Node } from 'reactflow';
import { SubagentNodeData } from '@cloutagent/types';

describe('SubagentProperties', () => {
  let mockNode: Node<SubagentNodeData>;
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockNode = {
      id: 'subagent-1',
      type: 'subagent',
      position: { x: 0, y: 0 },
      data: {
        label: 'Test Subagent',
        config: {
          id: 'subagent-1',
          name: 'Test Subagent',
          type: 'frontend-engineer',
          prompt: 'Build UI components',
          tools: ['bash', 'text-editor'],
          parallel: false,
        },
      },
    };
    mockOnChange = vi.fn();
  });

  describe('Field Rendering', () => {
    it('should render all form fields', () => {
      render(<SubagentProperties node={mockNode} onChange={mockOnChange} />);

      expect(screen.getByLabelText(/Subagent Name/i)).toBeTruthy();
      expect(screen.getByLabelText(/Type/i)).toBeTruthy();
      expect(screen.getByLabelText(/Prompt/i)).toBeTruthy();
      expect(screen.getByLabelText(/Parallel Execution/i)).toBeTruthy();
    });

    it('should display current node data', () => {
      render(<SubagentProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(
        /Subagent Name/i,
      ) as HTMLInputElement;
      expect(nameInput.value).toBe('Test Subagent');

      const typeSelect = screen.getByLabelText(/Type/i) as HTMLSelectElement;
      expect(typeSelect.value).toBe('frontend-engineer');

      const promptTextarea = screen.getByLabelText(
        /Prompt/i,
      ) as HTMLTextAreaElement;
      expect(promptTextarea.value).toBe('Build UI components');
    });
  });

  describe('Validation', () => {
    it('should validate required name field', async () => {
      render(<SubagentProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/Subagent Name/i);
      fireEvent.change(nameInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeTruthy();
      });
    });

    it('should validate required prompt field', async () => {
      render(<SubagentProperties node={mockNode} onChange={mockOnChange} />);

      const promptInput = screen.getByLabelText(/Prompt/i);
      fireEvent.change(promptInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('Prompt is required')).toBeTruthy();
      });
    });

    it('should validate max parallel instances', async () => {
      const parallelNode = {
        ...mockNode,
        data: {
          ...mockNode.data,
          config: {
            ...mockNode.data.config,
            parallel: true,
            maxParallelInstances: 10,
          },
        },
      };

      render(
        <SubagentProperties node={parallelNode} onChange={mockOnChange} />,
      );

      const maxInstancesInput = screen.getByLabelText(
        /Max Parallel Instances/i,
      );
      fireEvent.change(maxInstancesInput, { target: { value: '0' } });

      await waitFor(() => {
        expect(
          screen.getByText('Max parallel instances must be at least 1'),
        ).toBeTruthy();
      });
    });

    it('should clear errors when fixed', async () => {
      render(<SubagentProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/Subagent Name/i);

      fireEvent.change(nameInput, { target: { value: '' } });
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeTruthy();
      });

      fireEvent.change(nameInput, { target: { value: 'New Name' } });
      await waitFor(() => {
        expect(screen.queryByText('Name is required')).not.toBeTruthy();
      });
    });
  });

  describe('Updates', () => {
    it('should update node on field change', async () => {
      render(<SubagentProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/Subagent Name/i);
      fireEvent.change(nameInput, { target: { value: 'New Subagent' } });

      await waitFor(
        () => {
          expect(mockOnChange).toHaveBeenCalledWith(
            expect.objectContaining({
              data: expect.objectContaining({
                config: expect.objectContaining({
                  name: 'New Subagent',
                }),
              }),
            }),
          );
        },
        { timeout: 1000 },
      );
    });

    it('should debounce updates', async () => {
      vi.useFakeTimers();
      render(<SubagentProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/Subagent Name/i);

      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.change(nameInput, { target: { value: 'Ab' } });

      expect(mockOnChange).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledTimes(1);
      });

      vi.useRealTimers();
    });

    it('should not update if validation fails', async () => {
      vi.useFakeTimers();
      render(<SubagentProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/Subagent Name/i);
      fireEvent.change(nameInput, { target: { value: '' } });

      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockOnChange).not.toHaveBeenCalled();
      });

      vi.useRealTimers();
    });
  });

  describe('Interactions', () => {
    it('should toggle parallel execution', () => {
      render(<SubagentProperties node={mockNode} onChange={mockOnChange} />);

      const parallelCheckbox = screen.getByLabelText(/Parallel Execution/i);
      expect(parallelCheckbox.checked).toBeFalsy();

      fireEvent.click(parallelCheckbox);
      expect(parallelCheckbox.checked).toBeTruthy();
    });

    it('should show max parallel instances when parallel enabled', () => {
      const parallelNode = {
        ...mockNode,
        data: {
          ...mockNode.data,
          config: {
            ...mockNode.data.config,
            parallel: true,
          },
        },
      };

      render(
        <SubagentProperties node={parallelNode} onChange={mockOnChange} />,
      );

      expect(screen.getByLabelText(/Max Parallel Instances/i)).toBeTruthy();
    });

    it('should toggle tools', () => {
      render(<SubagentProperties node={mockNode} onChange={mockOnChange} />);

      const bashCheckbox = screen.getByLabelText('bash');
      expect(bashCheckbox.checked).toBeTruthy();

      fireEvent.click(bashCheckbox);
      expect(bashCheckbox.checked).toBeFalsy();
    });

    it('should update type selection', async () => {
      render(<SubagentProperties node={mockNode} onChange={mockOnChange} />);

      const typeSelect = screen.getByLabelText(/Type/i);
      fireEvent.change(typeSelect, { target: { value: 'backend-engineer' } });

      await waitFor(
        () => {
          expect(mockOnChange).toHaveBeenCalledWith(
            expect.objectContaining({
              data: expect.objectContaining({
                config: expect.objectContaining({
                  type: 'backend-engineer',
                }),
              }),
            }),
          );
        },
        { timeout: 1000 },
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels', () => {
      render(<SubagentProperties node={mockNode} onChange={mockOnChange} />);

      expect(screen.getByLabelText(/Subagent Name/i)).toBeTruthy();
      expect(screen.getByLabelText(/Type/i)).toBeTruthy();
      expect(screen.getByLabelText(/Prompt/i)).toBeTruthy();
    });

    it('should show helper text', () => {
      render(<SubagentProperties node={mockNode} onChange={mockOnChange} />);

      expect(
        screen.getByText(/Specialized role for this subagent/i),
      ).toBeTruthy();
      expect(
        screen.getByText(/Task instructions for this subagent/i),
      ).toBeTruthy();
    });
  });
});
