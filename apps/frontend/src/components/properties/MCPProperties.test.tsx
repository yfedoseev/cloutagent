import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MCPProperties } from './MCPProperties';
import { Node } from 'reactflow';
import { MCPNodeData } from '@cloutagent/types';

describe('MCPProperties', () => {
  let mockNode: Node<MCPNodeData>;
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockNode = {
      id: 'mcp-1',
      type: 'mcp',
      position: { x: 0, y: 0 },
      data: {
        label: 'Test MCP',
        connected: false,
        config: {
          id: 'mcp-1',
          name: 'Test MCP Server',
          type: 'npx',
          connection: '@modelcontextprotocol/server-filesystem',
          enabled: true,
          tools: [],
        },
      },
    };
    mockOnChange = vi.fn();
  });

  describe('Field Rendering', () => {
    it('should render all form fields', () => {
      render(<MCPProperties node={mockNode} onChange={mockOnChange} />);

      expect(screen.getByLabelText(/MCP Server Name/i)).toBeTruthy();
      expect(screen.getByLabelText(/Connection Type/i)).toBeTruthy();
      expect(screen.getByLabelText(/Connection String/i)).toBeTruthy();
      expect(screen.getByLabelText(/Enabled/i)).toBeTruthy();
    });

    it('should display current node data', () => {
      render(<MCPProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(
        /MCP Server Name/i,
      ) as HTMLInputElement;
      expect(nameInput.value).toBe('Test MCP Server');

      const typeSelect = screen.getByLabelText(
        /Connection Type/i,
      ) as HTMLSelectElement;
      expect(typeSelect.value).toBe('npx');

      const connectionInput = screen.getByLabelText(
        /Connection String/i,
      ) as HTMLInputElement;
      expect(connectionInput.value).toBe(
        '@modelcontextprotocol/server-filesystem',
      );
    });
  });

  describe('Validation', () => {
    it('should validate required name field', async () => {
      render(<MCPProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/MCP Server Name/i);
      fireEvent.change(nameInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeTruthy();
      });
    });

    it('should validate required connection field', async () => {
      render(<MCPProperties node={mockNode} onChange={mockOnChange} />);

      const connectionInput = screen.getByLabelText(/Connection String/i);
      fireEvent.change(connectionInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('Connection is required')).toBeTruthy();
      });
    });

    it('should clear errors when fixed', async () => {
      render(<MCPProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/MCP Server Name/i);

      fireEvent.change(nameInput, { target: { value: '' } });
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeTruthy();
      });

      fireEvent.change(nameInput, { target: { value: 'New MCP' } });
      await waitFor(() => {
        expect(screen.queryByText('Name is required')).not.toBeTruthy();
      });
    });
  });

  describe('Updates', () => {
    it('should update node on field change', async () => {
      render(<MCPProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/MCP Server Name/i);
      fireEvent.change(nameInput, { target: { value: 'New MCP Server' } });

      await waitFor(
        () => {
          expect(mockOnChange).toHaveBeenCalledWith(
            expect.objectContaining({
              data: expect.objectContaining({
                config: expect.objectContaining({
                  name: 'New MCP Server',
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
      render(<MCPProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/MCP Server Name/i);

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
      render(<MCPProperties node={mockNode} onChange={mockOnChange} />);

      const nameInput = screen.getByLabelText(/MCP Server Name/i);
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
      render(<MCPProperties node={mockNode} onChange={mockOnChange} />);

      const enabledCheckbox = screen.getByLabelText(/Enabled/i);
      expect(enabledCheckbox.checked).toBeTruthy();

      fireEvent.click(enabledCheckbox);
      expect(enabledCheckbox.checked).toBeFalsy();
    });

    it('should update connection type', async () => {
      render(<MCPProperties node={mockNode} onChange={mockOnChange} />);

      const typeSelect = screen.getByLabelText(/Connection Type/i);
      fireEvent.change(typeSelect, { target: { value: 'uvx' } });

      await waitFor(
        () => {
          expect(mockOnChange).toHaveBeenCalledWith(
            expect.objectContaining({
              data: expect.objectContaining({
                config: expect.objectContaining({
                  type: 'uvx',
                }),
              }),
            }),
          );
        },
        { timeout: 1000 },
      );
    });

    it('should show example for selected connection type', () => {
      render(<MCPProperties node={mockNode} onChange={mockOnChange} />);

      expect(
        screen.getByText(/npx @modelcontextprotocol\/server-/i),
      ).toBeTruthy();
    });

    it('should update example when type changes', () => {
      const { rerender } = render(
        <MCPProperties node={mockNode} onChange={mockOnChange} />,
      );

      const typeSelect = screen.getByLabelText(/Connection Type/i);
      fireEvent.change(typeSelect, { target: { value: 'url' } });

      const updatedNode = {
        ...mockNode,
        data: {
          ...mockNode.data,
          config: {
            ...mockNode.data.config,
            type: 'url' as const,
          },
        },
      };

      rerender(<MCPProperties node={updatedNode} onChange={mockOnChange} />);

      expect(screen.getByText(/https:\/\//i)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels', () => {
      render(<MCPProperties node={mockNode} onChange={mockOnChange} />);

      expect(screen.getByLabelText(/MCP Server Name/i)).toBeTruthy();
      expect(screen.getByLabelText(/Connection Type/i)).toBeTruthy();
      expect(screen.getByLabelText(/Connection String/i)).toBeTruthy();
    });

    it('should show helper text', () => {
      render(<MCPProperties node={mockNode} onChange={mockOnChange} />);

      expect(
        screen.getByText(/How to connect to this MCP server/i),
      ).toBeTruthy();
      expect(
        screen.getByText(/Disable to temporarily skip this server/i),
      ).toBeTruthy();
    });
  });
});
