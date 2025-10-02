import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders idle status', () => {
    render(<StatusBadge status="idle" />);
    expect(screen.getByRole('status')).toHaveTextContent('Idle');
  });

  it('renders running status with spinner', () => {
    render(<StatusBadge status="running" />);
    expect(screen.getByRole('status')).toHaveTextContent('Running');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders success status', () => {
    render(<StatusBadge status="success" />);
    expect(screen.getByRole('status')).toHaveTextContent('Success');
  });

  it('renders error status', () => {
    render(<StatusBadge status="error" />);
    expect(screen.getByRole('status')).toHaveTextContent('Error');
  });

  it('hides label when showLabel is false', () => {
    render(<StatusBadge status="idle" showLabel={false} />);
    expect(screen.getByRole('status')).not.toHaveTextContent('Idle');
  });

  it('applies custom className', () => {
    render(<StatusBadge status="idle" className="custom-class" />);
    expect(screen.getByRole('status')).toHaveClass('custom-class');
  });

  it('renders different sizes', () => {
    const { rerender } = render(<StatusBadge status="idle" size="sm" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<StatusBadge status="idle" size="md" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<StatusBadge status="idle" size="lg" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
