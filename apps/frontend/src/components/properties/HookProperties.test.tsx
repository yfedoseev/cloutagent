import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HookProperties } from './HookProperties';
import { Node } from 'reactflow';
import { HookNodeData } from '@cloutagent/types';

describe('HookProperties', () => {
  let mockNode: Node<HookNodeData>;
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockNode = {
      id: 'hook-1',
      type: 'hook',
      position: { x: 0, y: 0 },
      data: {
        label: 'Test Hook',
        enabled: true,
        config: {
          id: 'hook-1',
          name: 'Test Hook',
          type: 'pre-execution',
          enabled: true,
        },
      },
    };
    mockOnChange = vi.fn();
  });

  describe('Field Rendering', () => {
    it('should render all form fields', () => {
      render(<HookProperties node={mockNode} onChange={mockOnChange} />);

      expect(screen.getByLabelText(/Hook Name/i)).toBeTruthy();
      expect(screen.getByLabelText(/Hook Type/i)).toBeTruthy();
      expect(screen.getByLabelText(/Enabled/i)).toBeTruthy();
    });

    it('should display current node data', () => {
      render(<HookProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/Hook Name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Test Hook');

      const typeSelect = screen.getByLabelText(
        /Hook Type/i,
      ) as HTMLSelectElement;
      expect(typeSelect.value).toBe('pre-execution');

      const enabledCheckbox = screen.getByLabelText(
        /Enabled/i,
      ) as HTMLInputElement;
      expect(enabledCheckbox.checked).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate required name field', async () => {
      render(<HookProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/Hook Name/i);
      fireEvent.change(nameInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeTruthy();
      });
    });

    it('should clear errors when fixed', async () => {
      render(<HookProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/Hook Name/i);

      fireEvent.change(nameInput, { target: { value: '' } });
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeTruthy();
      });

      fireEvent.change(nameInput, { target: { value: 'New Hook' } });
      await waitFor(() => {
        expect(screen.queryByText('Name is required')).not.toBeTruthy();
      });
    });
  });

  describe('Updates', () => {
    it('should update node on field change', async () => {
      render(<HookProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/Hook Name/i);
      fireEvent.change(nameInput, { target: { value: 'New Hook' } });

      await waitFor(
        () => {
          expect(mockOnChange).toHaveBeenCalledWith(
            expect.objectContaining({
              data: expect.objectContaining({
                config: expect.objectContaining({
                  name: 'New Hook',
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
      render(<HookProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/Hook Name/i);

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
      render(<HookProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/Hook Name/i);
      fireEvent.change(nameInput, { target: { value: '' } });

      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockOnChange).not.toHaveBeenCalled();
      });

      vi.useRealTimers();
    });
  });

  describe('Interactions', () => {
    it('should toggle enabled state', () => {
      render(<HookProperties node={mockNode} onChange={mockOnChange} />);

      const enabledCheckbox = screen.getByLabelText(/Enabled/i);
      expect(enabledCheckbox.checked).toBeTruthy();

      fireEvent.click(enabledCheckbox);
      expect(enabledCheckbox.checked).toBeFalsy();
    });

    it('should update hook type', async () => {
      render(<HookProperties node={mockNode} onChange={mockOnChange} />);

      const typeSelect = screen.getByLabelText(/Hook Type/i);
      fireEvent.change(typeSelect, { target: { value: 'post-execution' } });

      await waitFor(
        () => {
          expect(mockOnChange).toHaveBeenCalledWith(
            expect.objectContaining({
              data: expect.objectContaining({
                config: expect.objectContaining({
                  type: 'post-execution',
                }),
              }),
            }),
          );
        },
        { timeout: 1000 },
      );
    });

    it('should show description for selected hook type', () => {
      render(<HookProperties node={mockNode} onChange={mockOnChange} />);

      expect(screen.getByText(/Runs before agent execution/i)).toBeTruthy();
    });

    it('should update description when type changes', () => {
      const { rerender } = render(
        <HookProperties node={mockNode} onChange={mockOnChange} />,
      );

      const typeSelect = screen.getByLabelText(/Hook Type/i);
      fireEvent.change(typeSelect, { target: { value: 'error' } });

      const updatedNode = {
        ...mockNode,
        data: {
          ...mockNode.data,
          config: {
            ...mockNode.data.config,
            type: 'error' as const,
          },
        },
      };

      rerender(<HookProperties node={updatedNode} onChange={mockOnChange} />);

      expect(screen.getByText(/Runs when an error occurs/i)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels', () => {
      render(<HookProperties node={mockNode} onChange={mockOnChange} />);

      expect(screen.getByLabelText(/Hook Name/i)).toBeTruthy();
      expect(screen.getByLabelText(/Hook Type/i)).toBeTruthy();
      expect(screen.getByLabelText(/Enabled/i)).toBeTruthy();
    });

    it('should show helper text', () => {
      render(<HookProperties node={mockNode} onChange={mockOnChange} />);

      expect(
        screen.getByText(/When this hook should be triggered/i),
      ).toBeTruthy();
      expect(
        screen.getByText(/Disable to temporarily skip this hook/i),
      ).toBeTruthy();
    });
  });
});
