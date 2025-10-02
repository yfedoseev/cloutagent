import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CanvasEmptyState } from './CanvasEmptyState';

describe('CanvasEmptyState', () => {
  it('should render with glassmorphic styling', () => {
    const { container } = render(<CanvasEmptyState />);
    const emptyStateElement = container.firstChild;
    expect(emptyStateElement).toHaveClass('glass-strong');
  });

  it('should display main heading', () => {
    const { getByText } = render(<CanvasEmptyState />);
    expect(getByText(/start building your workflow/i)).toBeInTheDocument();
  });

  it('should show descriptive instructions', () => {
    const { getByText } = render(<CanvasEmptyState />);
    expect(getByText(/drag nodes from the palette/i)).toBeInTheDocument();
  });

  it('should display visual icon or emoji', () => {
    const { getByText } = render(<CanvasEmptyState />);
    expect(getByText('🎨')).toBeInTheDocument();
  });

  it('should show tip about dragging to add nodes', () => {
    const { getByText } = render(<CanvasEmptyState />);
    expect(getByText(/💡 drag to add/i)).toBeInTheDocument();
  });

  it('should show tip about connecting nodes', () => {
    const { getByText } = render(<CanvasEmptyState />);
    expect(getByText(/🔗 connect nodes/i)).toBeInTheDocument();
  });

  it('should show tip about configuring properties', () => {
    const { getByText } = render(<CanvasEmptyState />);
    expect(getByText(/⚙️ configure properties/i)).toBeInTheDocument();
  });

  it('should have proper centering and positioning', () => {
    const { container } = render(<CanvasEmptyState />);
    const emptyStateElement = container.firstChild;
    expect(emptyStateElement).toHaveClass('absolute');
    expect(emptyStateElement).toHaveClass('inset-0');
    expect(emptyStateElement).toHaveClass('flex');
    expect(emptyStateElement).toHaveClass('items-center');
    expect(emptyStateElement).toHaveClass('justify-center');
  });

  it('should be non-interactive with pointer-events-none', () => {
    const { container } = render(<CanvasEmptyState />);
    const emptyStateElement = container.firstChild;
    expect(emptyStateElement).toHaveClass('pointer-events-none');
  });

  it('should have accessible text with proper contrast', () => {
    const { container } = render(<CanvasEmptyState />);
    // Verify component renders (actual contrast testing done via CSS)
    expect(container.firstChild).toBeInTheDocument();
    // Visual text should use text-white/90, text-white/60 classes
    const heading = container.querySelector('h3');
    expect(heading).toHaveClass('text-white/90');
  });

  it('should render content card with rounded corners', () => {
    const { container } = render(<CanvasEmptyState />);
    const contentCard = container.querySelector('.glass-strong');
    expect(contentCard).toHaveClass('rounded-2xl');
  });

  it('should have proper padding for content', () => {
    const { container } = render(<CanvasEmptyState />);
    const contentCard = container.querySelector('.glass-strong');
    expect(contentCard).toHaveClass('p-8');
  });

  it('should limit content width for readability', () => {
    const { container } = render(<CanvasEmptyState />);
    const contentCard = container.querySelector('.glass-strong');
    expect(contentCard).toHaveClass('max-w-md');
  });

  it('should center-align text content', () => {
    const { container } = render(<CanvasEmptyState />);
    const contentCard = container.querySelector('.glass-strong');
    expect(contentCard).toHaveClass('text-center');
  });

  it('should display icon with proper size', () => {
    const { container } = render(<CanvasEmptyState />);
    const iconElement = container.querySelector('.text-6xl');
    expect(iconElement).toBeInTheDocument();
    expect(iconElement?.textContent).toBe('🎨');
  });

  it('should style heading with proper size and weight', () => {
    const { container } = render(<CanvasEmptyState />);
    const heading = container.querySelector('h3');
    expect(heading).toHaveClass('text-2xl');
    expect(heading).toHaveClass('font-semibold');
  });

  it('should style description with muted color', () => {
    const { container } = render(<CanvasEmptyState />);
    const description = container.querySelector('p');
    expect(description).toHaveClass('text-white/60');
  });

  it('should display tips in horizontal layout', () => {
    const { container } = render(<CanvasEmptyState />);
    const tipsContainer = container.querySelector('.flex.items-center.justify-center');
    expect(tipsContainer).toBeInTheDocument();
    expect(tipsContainer).toHaveClass('gap-4');
  });

  it('should style tips with muted text', () => {
    const { container } = render(<CanvasEmptyState />);
    const tipsContainer = container.querySelector('.text-white\\/50');
    expect(tipsContainer).toBeInTheDocument();
  });

  it('should render all three tips with proper formatting', () => {
    const { getByText } = render(<CanvasEmptyState />);

    // Verify all three tips are present
    const dragTip = getByText(/💡 drag to add/i);
    const connectTip = getByText(/🔗 connect nodes/i);
    const configureTip = getByText(/⚙️ configure properties/i);

    expect(dragTip).toBeInTheDocument();
    expect(connectTip).toBeInTheDocument();
    expect(configureTip).toBeInTheDocument();
  });
});
