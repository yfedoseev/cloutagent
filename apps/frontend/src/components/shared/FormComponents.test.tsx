import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextField, SelectField, TextareaField } from './FormComponents';

describe('TextField', () => {
  it('renders with label', () => {
    render(<TextField label="Username" />);
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(<TextField label="Email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<TextField label="Password" error="Password is required" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Password is required');
  });

  it('displays help text when no error', () => {
    render(<TextField label="Email" helpText="Enter your email address" />);
    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
  });

  it('calls onChange handler', () => {
    const handleChange = vi.fn();
    render(<TextField label="Name" onChange={handleChange} />);

    const input = screen.getByLabelText('Name');
    fireEvent.change(input, { target: { value: 'John' } });

    expect(handleChange).toHaveBeenCalled();
  });

  it('renders with icon', () => {
    render(<TextField label="Search" icon={<span>🔍</span>} />);
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });

  it('has correct aria attributes when error', () => {
    render(<TextField label="Email" error="Invalid email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('SelectField', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ];

  it('renders with label and options', () => {
    render(<SelectField label="Choose" options={options} />);
    expect(screen.getByLabelText('Choose')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(<SelectField label="Status" options={options} required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(
      <SelectField
        label="Status"
        options={options}
        error="Please select an option"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Please select an option');
  });

  it('calls onChange handler', () => {
    const handleChange = vi.fn();
    render(<SelectField label="Status" options={options} onChange={handleChange} />);

    const select = screen.getByLabelText('Status');
    fireEvent.change(select, { target: { value: 'option2' } });

    expect(handleChange).toHaveBeenCalled();
  });
});

describe('TextareaField', () => {
  it('renders with label', () => {
    render(<TextareaField label="Description" />);
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(<TextareaField label="Comments" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<TextareaField label="Bio" error="Bio is required" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Bio is required');
  });

  it('displays help text when no error', () => {
    render(<TextareaField label="Notes" helpText="Max 500 characters" />);
    expect(screen.getByText('Max 500 characters')).toBeInTheDocument();
  });

  it('calls onChange handler', () => {
    const handleChange = vi.fn();
    render(<TextareaField label="Message" onChange={handleChange} />);

    const textarea = screen.getByLabelText('Message');
    fireEvent.change(textarea, { target: { value: 'Hello' } });

    expect(handleChange).toHaveBeenCalled();
  });
});
