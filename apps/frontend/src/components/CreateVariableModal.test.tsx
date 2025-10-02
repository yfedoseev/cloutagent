import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateVariableModal } from './CreateVariableModal';

global.fetch = vi.fn();

describe('CreateVariableModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should submit valid string variable', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ variable: {} }),
    });

    const onSuccess = vi.fn();

    render(
      <CreateVariableModal
        projectId="proj-1"
        onClose={() => {}}
        onSuccess={onSuccess}
      />,
    );

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('variableName'), {
      target: { value: 'myVar' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter value'), {
      target: { value: 'test value' },
    });

    // Submit
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects/proj-1/variables',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'myVar',
            type: 'string',
            scope: 'global',
            value: 'test value',
          }),
        }),
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should validate variable name format', async () => {
    render(
      <CreateVariableModal
        projectId="proj-1"
        onClose={() => {}}
        onSuccess={() => {}}
      />,
    );

    // Invalid name (starts with number)
    fireEvent.change(screen.getByPlaceholderText('variableName'), {
      target: { value: '123invalid' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter value'), {
      target: { value: 'test' },
    });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText(/must be alphanumeric/)).toBeInTheDocument();
    });
  });

  it('should handle number type correctly', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ variable: {} }),
    });

    const onSuccess = vi.fn();

    render(
      <CreateVariableModal
        projectId="proj-1"
        onClose={() => {}}
        onSuccess={onSuccess}
      />,
    );

    // Select number type
    const typeSelect = screen.getByRole('combobox', { name: /type/i });
    fireEvent.change(typeSelect, { target: { value: 'number' } });

    fireEvent.change(screen.getByPlaceholderText('variableName'), {
      target: { value: 'count' },
    });

    // Number input should appear
    const numberInput = screen.getByRole('spinbutton');
    fireEvent.change(numberInput, { target: { value: '42' } });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects/proj-1/variables',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'count',
            type: 'number',
            scope: 'global',
            value: 42,
          }),
        }),
      );
    });
  });

  it('should require value for number type', async () => {
    render(
      <CreateVariableModal
        projectId="proj-1"
        onClose={() => {}}
        onSuccess={() => {}}
      />,
    );

    // Select number type
    const typeSelect = screen.getByRole('combobox', { name: /type/i });
    fireEvent.change(typeSelect, { target: { value: 'number' } });

    fireEvent.change(screen.getByPlaceholderText('variableName'), {
      target: { value: 'count' },
    });

    // Number input exists and is required
    const numberInput = screen.getByRole('spinbutton');
    expect(numberInput).toBeRequired();
  });

  it('should handle boolean type with dropdown', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ variable: {} }),
    });

    render(
      <CreateVariableModal
        projectId="proj-1"
        onClose={() => {}}
        onSuccess={() => {}}
      />,
    );

    // Select boolean type
    const typeSelect = screen.getByRole('combobox', { name: /type/i });
    fireEvent.change(typeSelect, { target: { value: 'boolean' } });

    fireEvent.change(screen.getByPlaceholderText('variableName'), {
      target: { value: 'isActive' },
    });

    // Boolean dropdown should appear
    const booleanSelect = screen.getAllByRole('combobox')[2]; // Type, Scope, Value
    fireEvent.change(booleanSelect, { target: { value: 'true' } });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects/proj-1/variables',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'isActive',
            type: 'boolean',
            scope: 'global',
            value: true,
          }),
        }),
      );
    });
  });

  it('should handle object type with JSON validation', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ variable: {} }),
    });

    render(
      <CreateVariableModal
        projectId="proj-1"
        onClose={() => {}}
        onSuccess={() => {}}
      />,
    );

    // Select object type
    const typeSelect = screen.getByRole('combobox', { name: /type/i });
    fireEvent.change(typeSelect, { target: { value: 'object' } });

    fireEvent.change(screen.getByPlaceholderText('variableName'), {
      target: { value: 'config' },
    });

    // Textarea should appear
    const textarea = screen.getByRole('textbox', { name: /value/i });
    fireEvent.change(textarea, {
      target: { value: '{"key": "value", "count": 123}' },
    });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects/proj-1/variables',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'config',
            type: 'object',
            scope: 'global',
            value: { key: 'value', count: 123 },
          }),
        }),
      );
    });
  });

  it('should validate invalid JSON for object type', async () => {
    render(
      <CreateVariableModal
        projectId="proj-1"
        onClose={() => {}}
        onSuccess={() => {}}
      />,
    );

    // Select object type
    const typeSelect = screen.getByRole('combobox', { name: /type/i });
    fireEvent.change(typeSelect, { target: { value: 'object' } });

    fireEvent.change(screen.getByPlaceholderText('variableName'), {
      target: { value: 'config' },
    });

    // Invalid JSON
    const textarea = screen.getByRole('textbox', { name: /value/i });
    fireEvent.change(textarea, {
      target: { value: '{invalid json}' },
    });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText(/Invalid JSON/)).toBeInTheDocument();
    });
  });

  it('should handle array type', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ variable: {} }),
    });

    render(
      <CreateVariableModal
        projectId="proj-1"
        onClose={() => {}}
        onSuccess={() => {}}
      />,
    );

    // Select array type
    const typeSelect = screen.getByRole('combobox', { name: /type/i });
    fireEvent.change(typeSelect, { target: { value: 'array' } });

    fireEvent.change(screen.getByPlaceholderText('variableName'), {
      target: { value: 'items' },
    });

    const textarea = screen.getByRole('textbox', { name: /value/i });
    fireEvent.change(textarea, {
      target: { value: '["item1", "item2", "item3"]' },
    });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects/proj-1/variables',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'items',
            type: 'array',
            scope: 'global',
            value: ['item1', 'item2', 'item3'],
          }),
        }),
      );
    });
  });

  it('should handle secret type with password input', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ variable: {} }),
    });

    render(
      <CreateVariableModal
        projectId="proj-1"
        onClose={() => {}}
        onSuccess={() => {}}
      />,
    );

    // Select secret type
    const typeSelect = screen.getByRole('combobox', { name: /type/i });
    fireEvent.change(typeSelect, { target: { value: 'secret' } });

    fireEvent.change(screen.getByPlaceholderText('variableName'), {
      target: { value: 'apiKey' },
    });

    // Password input should appear
    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.change(passwordInput, {
      target: { value: 'super-secret-key' },
    });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects/proj-1/variables',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'apiKey',
            type: 'secret',
            scope: 'global',
            value: 'super-secret-key',
          }),
        }),
      );
    });
  });

  it('should support edit mode', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ variable: {} }),
    });

    const editVariable = {
      id: 'var-1',
      name: 'existingVar',
      type: 'string' as const,
      scope: 'global' as const,
      value: 'old value',
      encrypted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(
      <CreateVariableModal
        projectId="proj-1"
        onClose={() => {}}
        onSuccess={() => {}}
        editVariable={editVariable}
      />,
    );

    // Should show "Edit Variable" title
    expect(screen.getByText('Edit Variable')).toBeInTheDocument();

    // Name field should be disabled
    const nameInput = screen.getByDisplayValue('existingVar');
    expect(nameInput).toBeDisabled();

    // Update value
    const valueInput = screen.getByDisplayValue('old value');
    fireEvent.change(valueInput, { target: { value: 'new value' } });

    // Submit should use PUT
    fireEvent.click(screen.getByText('Update'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects/proj-1/variables/var-1',
        expect.objectContaining({
          method: 'PUT',
        }),
      );
    });
  });

  it('should display API error messages', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Variable name already exists' }),
    });

    render(
      <CreateVariableModal
        projectId="proj-1"
        onClose={() => {}}
        onSuccess={() => {}}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('variableName'), {
      target: { value: 'duplicate' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter value'), {
      target: { value: 'test' },
    });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('Variable name already exists')).toBeInTheDocument();
    });
  });

  it('should close modal on cancel', () => {
    const onClose = vi.fn();

    render(
      <CreateVariableModal
        projectId="proj-1"
        onClose={onClose}
        onSuccess={() => {}}
      />,
    );

    fireEvent.click(screen.getByText('Cancel'));

    expect(onClose).toHaveBeenCalled();
  });
});
