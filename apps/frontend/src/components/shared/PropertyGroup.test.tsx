import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyGroup } from './PropertyGroup';

describe('PropertyGroup', () => {
  it('renders with title', () => {
    render(
      <PropertyGroup title="Basic Settings">
        <div>Content</div>
      </PropertyGroup>,
    );

    expect(screen.getByText('Basic Settings')).toBeInTheDocument();
  });

  it('starts collapsed by default', () => {
    render(
      <PropertyGroup title="Settings">
        <div>Hidden content</div>
      </PropertyGroup>,
    );

    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('starts open when defaultOpen is true', () => {
    render(
      <PropertyGroup title="Settings" defaultOpen={true}>
        <div>Visible content</div>
      </PropertyGroup>,
    );

    expect(screen.getByText('Visible content')).toBeInTheDocument();
  });

  it('toggles open/closed on click', () => {
    render(
      <PropertyGroup title="Settings">
        <div>Toggle content</div>
      </PropertyGroup>,
    );

    const button = screen.getByRole('button', { name: /Settings/i });

    // Initially closed
    expect(screen.queryByText('Toggle content')).not.toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');

    // Click to open
    fireEvent.click(button);
    expect(screen.getByText('Toggle content')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'true');

    // Click to close
    fireEvent.click(button);
    expect(screen.queryByText('Toggle content')).not.toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders with icon', () => {
    render(
      <PropertyGroup title="Settings" icon="⚙️">
        <div>Content</div>
      </PropertyGroup>,
    );

    expect(screen.getByText('⚙️')).toBeInTheDocument();
  });
});
