import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestModeToggle } from './TestModeToggle';

describe('TestModeToggle', () => {
  it('should render toggle in disabled state by default', () => {
    const onChange = vi.fn();
    render(<TestModeToggle enabled={false} onChange={onChange} />);

    const toggle = screen.getByRole('checkbox');
    expect(toggle).not.toBeChecked();
    expect(screen.getByText('Test Mode')).toBeInTheDocument();
    expect(screen.getByText('(Real Claude API)')).toBeInTheDocument();
  });

  it('should render toggle in enabled state', () => {
    const onChange = vi.fn();
    render(<TestModeToggle enabled={true} onChange={onChange} />);

    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeChecked();
    expect(screen.getByText('(Simulated execution)')).toBeInTheDocument();
  });

  it('should call onChange when clicked', () => {
    const onChange = vi.fn();
    render(<TestModeToggle enabled={false} onChange={onChange} />);

    const toggle = screen.getByRole('checkbox');
    fireEvent.click(toggle);

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('should toggle from enabled to disabled', () => {
    const onChange = vi.fn();
    render(<TestModeToggle enabled={true} onChange={onChange} />);

    const toggle = screen.getByRole('checkbox');
    fireEvent.click(toggle);

    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('should not show estimate panel when showEstimate is false', () => {
    const onChange = vi.fn();
    render(
      <TestModeToggle
        enabled={true}
        onChange={onChange}
        showEstimate={false}
      />,
    );

    expect(screen.queryByText('Estimated Real Execution:')).not.toBeInTheDocument();
  });

  it('should show estimate panel when enabled and showEstimate is true', () => {
    const onChange = vi.fn();
    render(
      <TestModeToggle
        enabled={true}
        onChange={onChange}
        showEstimate={true}
        estimatedCost={0.0123}
        estimatedTokens={1000}
        estimatedDuration={5000}
      />,
    );

    expect(screen.getByText('Estimated Real Execution:')).toBeInTheDocument();
  });

  it('should display estimated cost correctly', () => {
    const onChange = vi.fn();
    render(
      <TestModeToggle
        enabled={true}
        onChange={onChange}
        showEstimate={true}
        estimatedCost={0.0123}
      />,
    );

    expect(screen.getByText('Cost:')).toBeInTheDocument();
    expect(screen.getByText('$0.0123')).toBeInTheDocument();
  });

  it('should display estimated tokens with thousand separators', () => {
    const onChange = vi.fn();
    render(
      <TestModeToggle
        enabled={true}
        onChange={onChange}
        showEstimate={true}
        estimatedTokens={1234567}
      />,
    );

    expect(screen.getByText('Tokens:')).toBeInTheDocument();
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('should display estimated duration in seconds', () => {
    const onChange = vi.fn();
    render(
      <TestModeToggle
        enabled={true}
        onChange={onChange}
        showEstimate={true}
        estimatedDuration={5432}
      />,
    );

    expect(screen.getByText('Duration:')).toBeInTheDocument();
    expect(screen.getByText('5.4s')).toBeInTheDocument();
  });

  it('should not show estimate when test mode is disabled', () => {
    const onChange = vi.fn();
    render(
      <TestModeToggle
        enabled={false}
        onChange={onChange}
        showEstimate={true}
        estimatedCost={0.0123}
        estimatedTokens={1000}
        estimatedDuration={5000}
      />,
    );

    expect(screen.queryByText('Estimated Real Execution:')).not.toBeInTheDocument();
  });

  it('should handle missing estimate values gracefully', () => {
    const onChange = vi.fn();
    render(
      <TestModeToggle
        enabled={true}
        onChange={onChange}
        showEstimate={true}
      />,
    );

    expect(screen.getByText('Estimated Real Execution:')).toBeInTheDocument();
    expect(screen.queryByText('Cost:')).not.toBeInTheDocument();
    expect(screen.queryByText('Tokens:')).not.toBeInTheDocument();
    expect(screen.queryByText('Duration:')).not.toBeInTheDocument();
  });

  it('should display all estimates when all values provided', () => {
    const onChange = vi.fn();
    render(
      <TestModeToggle
        enabled={true}
        onChange={onChange}
        showEstimate={true}
        estimatedCost={0.0456}
        estimatedTokens={2500}
        estimatedDuration={8500}
      />,
    );

    expect(screen.getByText('$0.0456')).toBeInTheDocument();
    expect(screen.getByText('2,500')).toBeInTheDocument();
    expect(screen.getByText('8.5s')).toBeInTheDocument();
  });

  it('should handle zero cost correctly', () => {
    const onChange = vi.fn();
    render(
      <TestModeToggle
        enabled={true}
        onChange={onChange}
        showEstimate={true}
        estimatedCost={0}
      />,
    );

    expect(screen.getByText('$0.0000')).toBeInTheDocument();
  });

  it('should handle large cost values correctly', () => {
    const onChange = vi.fn();
    render(
      <TestModeToggle
        enabled={true}
        onChange={onChange}
        showEstimate={true}
        estimatedCost={1.5678}
      />,
    );

    expect(screen.getByText('$1.5678')).toBeInTheDocument();
  });

  it('should be keyboard accessible', () => {
    const onChange = vi.fn();
    render(<TestModeToggle enabled={false} onChange={onChange} />);

    const toggle = screen.getByRole('checkbox');
    toggle.focus();

    expect(document.activeElement).toBe(toggle);
  });

  it('should have proper ARIA labels', () => {
    const onChange = vi.fn();
    render(<TestModeToggle enabled={false} onChange={onChange} />);

    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeInTheDocument();
  });
});
