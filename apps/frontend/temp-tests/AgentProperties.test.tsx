import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentProperties } from './AgentProperties';
import { Node } from 'reactflow';
import { AgentNodeData } from '@cloutagent/types';

describe('AgentProperties', () => {
  let mockNode: Node<AgentNodeData>;
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockNode = {
      id: 'agent-1',
      type: 'agent',
      position: { x: 0, y: 0 },
      data: {
        label: 'Test Agent',
        config: {
          id: 'agent-1',
          name: 'Test Agent',
          model: 'claude-sonnet-4-5',
          systemPrompt: 'You are a helpful assistant',
          temperature: 1.0,
          maxTokens: 4096,
          enabledTools: ['bash'],
        },
      },
    };
    mockOnChange = vi.fn();
  });

  // Field Rendering Tests
  describe('Field Rendering', () => {
    it('should render all form fields', () => {
      render(<AgentProperties node={mockNode} onChange={mockOnChange} />);

      expect(screen.getByLabelText(/Agent Name/i)).toBeTruthy();
      expect(screen.getByLabelText(/Model/i)).toBeTruthy();
      expect(screen.getByLabelText(/System Prompt/i)).toBeTruthy();
      expect(screen.getByLabelText(/Temperature/i)).toBeTruthy();
      expect(screen.getByLabelText(/Max Tokens/i)).toBeTruthy();
      expect(screen.getByLabelText(/Max Cost/i)).toBeTruthy();
      expect(screen.getByLabelText(/Timeout/i)).toBeTruthy();
    });

    it('should display current node data', () => {
      render(<AgentProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(
        /Agent Name/i,
      ) as HTMLInputElement;
      expect(nameInput.value).toBe('Test Agent');

      const modelSelect = screen.getByLabelText(/Model/i) as HTMLSelectElement;
      expect(modelSelect.value).toBe('claude-sonnet-4-5');

      const promptTextarea = screen.getByLabelText(
        /System Prompt/i,
      ) as HTMLTextAreaElement;
      expect(promptTextarea.value).toBe('You are a helpful assistant');
    });

    it('should render section headers', () => {
      render(<AgentProperties node={mockNode} onChange={mockOnChange} />);

      expect(screen.getByText('Basic Information')).toBeTruthy();
      expect(screen.getByText('System Prompt')).toBeTruthy();
      expect(screen.getByText('Advanced Settings')).toBeTruthy();
      expect(screen.getByText('Enabled Tools')).toBeTruthy();
    });

    it('should render cost estimate section', () => {
      render(<AgentProperties node={mockNode} onChange={mockOnChange} />);

      expect(screen.getByText(/Estimated Cost per Execution/i)).toBeTruthy();
      expect(screen.getByText(/~\$/)).toBeTruthy();
    });
  });

  // Validation Tests
  describe('Validation', () => {
    it('should validate required name field', async () => {
      render(<AgentProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/Agent Name/i);
      fireEvent.change(nameInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeTruthy();
      });
    });

    it('should validate temperature range (0-1)', async () => {
      render(<AgentProperties node={mockNode} onChange={mockOnChange} />);

      const tempSlider = screen.getByLabelText(/Temperature/i);

      // Test below minimum
      fireEvent.change(tempSlider, { target: { value: '-0.1' } });
      await waitFor(() => {
        expect(
          screen.getByText('Temperature must be between 0 and 1'),
        ).toBeTruthy();
      });

      // Test above maximum
      fireEvent.change(tempSlider, { target: { value: '1.1' } });
      await waitFor(() => {
        expect(
          screen.getByText('Temperature must be between 0 and 1'),
        ).toBeTruthy();
      });
    });

    it('should validate max tokens range (1-200000)', async () => {
      render(<AgentProperties node={mockNode} onChange={mockOnChange} />);

      const tokensInput = screen.getByLabelText(/Max Tokens/i);

      // Test below minimum
      fireEvent.change(tokensInput, { target: { value: '0' } });
      await waitFor(() => {
        expect(
          screen.getByText('Max tokens must be between 1 and 200,000'),
        ).toBeTruthy();
      });

      // Test above maximum
      fireEvent.change(tokensInput, { target: { value: '200001' } });
      await waitFor(() => {
        expect(
          screen.getByText('Max tokens must be between 1 and 200,000'),
        ).toBeTruthy();
      });
    });

    it('should validate positive max cost', async () => {
      render(<AgentProperties node={mockNode} onChange={mockOnChange} />);

      const costInput = screen.getByLabelText(/Max Cost/i);
      fireEvent.change(costInput, { target: { value: '-1' } });

      await waitFor(() => {
        expect(screen.getByText('Max cost must be positive')).toBeTruthy();
      });
    });

    it('should clear errors when fixed', async () => {
      render(<AgentProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/Agent Name/i);

      // Trigger error
      fireEvent.change(nameInput, { target: { value: '' } });
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeTruthy();
      });

      // Fix error
      fireEvent.change(nameInput, { target: { value: 'New Name' } });
      await waitFor(() => {
        expect(screen.queryByText('Name is required')).not.toBeTruthy();
      });
    });
  });

  // Update Tests
  describe('Updates', () => {
    it('should update node on field change', async () => {
      render(<AgentProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/Agent Name/i);
      fireEvent.change(nameInput, { target: { value: 'New Agent Name' } });

      await waitFor(
        () => {
          expect(mockOnChange).toHaveBeenCalledWith(
            expect.objectContaining({
              data: expect.objectContaining({
                config: expect.objectContaining({
                  name: 'New Agent Name',
                }),
              }),
            }),
          );
        },
        { timeout: 1000 },
      );
    });

    it('should debounce updates (500ms)', async () => {
      vi.useFakeTimers();
      render(<AgentProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/Agent Name/i);

      // Rapid changes
      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.change(nameInput, { target: { value: 'Ab' } });
      fireEvent.change(nameInput, { target: { value: 'Abc' } });

      // Should not call onChange yet
      expect(mockOnChange).not.toHaveBeenCalled();

      // Fast forward 500ms
      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledTimes(1);
      });

      vi.useRealTimers();
    });

    it('should not update if validation fails', async () => {
      vi.useFakeTimers();
      render(<AgentProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/Agent Name/i);
      fireEvent.change(nameInput, { target: { value: '' } });

      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockOnChange).not.toHaveBeenCalled();
      });

      vi.useRealTimers();
    });

    it('should show validation errors immediately', async () => {
      render(<AgentProperties node={mockNode} onChange={mockOnChange} />);

      const tempSlider = screen.getByLabelText(/Temperature/i);
      fireEvent.change(tempSlider, { target: { value: '2' } });

      // Error should appear immediately, not debounced
      await waitFor(
        () => {
          expect(
            screen.getByText('Temperature must be between 0 and 1'),
          ).toBeTruthy();
        },
        { timeout: 100 },
      );
    });
  });

  // Interaction Tests
  describe('Interactions', () => {
    it('should update temperature with slider', async () => {
      render(<AgentProperties node={mockNode} onChange={mockOnChange} />);

      const tempSlider = screen.getByLabelText(/Temperature/i);
      fireEvent.change(tempSlider, { target: { value: '0.5' } });

      expect(screen.getByText(/Temperature: 0.50/)).toBeTruthy();
    });

    it('should toggle tools on checkbox change', async () => {
      render(<AgentProperties node={mockNode} onChange={mockOnChange} />);

      const bashCheckbox = screen.getByLabelText('bash');
      expect(bashCheckbox.checked).toBeTruthy();

      fireEvent.click(bashCheckbox);
      expect(bashCheckbox.checked).toBeFalsy();

      const computerCheckbox = screen.getByLabelText('computer');
      expect(computerCheckbox.checked).toBeFalsy();

      fireEvent.click(computerCheckbox);
      expect(computerCheckbox.checked).toBeTruthy();
    });

    it('should calculate cost estimate', () => {
      const nodeWithTokens = {
        ...mockNode,
        data: {
          ...mockNode.data,
          config: {
            ...mockNode.data.config,
            maxTokens: 10000,
          },
        },
      };

      render(<AgentProperties node={nodeWithTokens} onChange={mockOnChange} />);

      // Cost = (10000 / 1000000) * 15 = 0.15
      expect(screen.getByText(/~\$0.1500/)).toBeTruthy();
    });

    it('should handle optional fields (maxCost, timeout)', async () => {
      render(<AgentProperties node={mockNode} onChange={mockOnChange} />);

      const costInput = screen.getByLabelText(/Max Cost/i);
      const timeoutInput = screen.getByLabelText(/Timeout/i);

      expect((costInput as HTMLInputElement).value).toBe('');
      expect((timeoutInput as HTMLInputElement).value).toBe('');

      fireEvent.change(costInput, { target: { value: '10.50' } });
      fireEvent.change(timeoutInput, { target: { value: '60' } });

      await waitFor(
        () => {
          expect(mockOnChange).toHaveBeenCalled();
        },
        { timeout: 1000 },
      );
    });

    it('should update model selection', async () => {
      render(<AgentProperties node={mockNode} onChange={mockOnChange} />);

      const modelSelect = screen.getByLabelText(/Model/i);
      fireEvent.change(modelSelect, { target: { value: 'claude-opus-4' } });

      await waitFor(
        () => {
          expect(mockOnChange).toHaveBeenCalledWith(
            expect.objectContaining({
              data: expect.objectContaining({
                config: expect.objectContaining({
                  model: 'claude-opus-4',
                }),
              }),
            }),
          );
        },
        { timeout: 1000 },
      );
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have proper labels', () => {
      render(<AgentProperties node={mockNode} onChange={mockOnChange} />);

      expect(screen.getByLabelText(/Agent Name/i)).toBeTruthy();
      expect(screen.getByLabelText(/Model/i)).toBeTruthy();
      expect(screen.getByLabelText(/System Prompt/i)).toBeTruthy();
      expect(screen.getByLabelText(/Temperature/i)).toBeTruthy();
    });

    it('should show helper text', () => {
      render(<AgentProperties node={mockNode} onChange={mockOnChange} />);

      expect(
        screen.getByText('Sonnet: Balanced, Opus: Most capable, Haiku: Fastest'),
      ).toBeTruthy();
      expect(
        screen.getByText("Define the agent's role and behavior"),
      ).toBeTruthy();
      expect(
        screen.getByText('Maximum response length (1-200,000)'),
      ).toBeTruthy();
    });

    it('should mark required fields', () => {
      render(<AgentProperties node={mockNode} onChange={mockOnChange} />);

      const nameLabel = screen.getByText(/Agent Name/).closest('label');
      expect(nameLabel?.textContent).toContain('*');
    });
  });
});
