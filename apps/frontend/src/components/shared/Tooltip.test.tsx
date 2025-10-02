import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('shows tooltip on hover', async () => {
    render(
      <Tooltip content="Helpful info">
        <button>Hover me</button>
      </Tooltip>,
    );

    const button = screen.getByText('Hover me');
    fireEvent.mouseEnter(button);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('Helpful info');
    });
  });

  it('hides tooltip on mouse leave', async () => {
    render(
      <Tooltip content="Helpful info" delay={0}>
        <button>Hover me</button>
      </Tooltip>,
    );

    const button = screen.getByText('Hover me');
    fireEvent.mouseEnter(button);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    fireEvent.mouseLeave(button);

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  it('does not show when disabled', async () => {
    render(
      <Tooltip content="Helpful info" disabled delay={0}>
        <button>Hover me</button>
      </Tooltip>,
    );

    const button = screen.getByText('Hover me');
    fireEvent.mouseEnter(button);

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    }, { timeout: 300 });
  });

  it('hides on Escape key', async () => {
    render(
      <Tooltip content="Helpful info" delay={0}>
        <button>Hover me</button>
      </Tooltip>,
    );

    const button = screen.getByText('Hover me');
    fireEvent.mouseEnter(button);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    fireEvent.keyDown(button, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  it('renders rich content', async () => {
    render(
      <Tooltip
        content={
          <div>
            <strong>Title</strong>
            <p>Description</p>
          </div>
        }
        delay={0}
      >
        <button>Hover me</button>
      </Tooltip>,
    );

    const button = screen.getByText('Hover me');
    fireEvent.mouseEnter(button);

    await waitFor(() => {
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });
});
