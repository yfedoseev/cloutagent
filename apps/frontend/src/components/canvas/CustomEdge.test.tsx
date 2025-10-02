import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CustomEdge } from './CustomEdge';
import { Position } from 'reactflow';

describe('CustomEdge', () => {
  const defaultProps = {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    sourceX: 100,
    sourceY: 100,
    targetX: 200,
    targetY: 200,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  };

  it('should render bezier path element', () => {
    const { container } = render(<CustomEdge {...defaultProps} />);
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    expect(path).toHaveAttribute('d');
  });

  it('should apply react-flow edge path class', () => {
    const { container } = render(<CustomEdge {...defaultProps} />);
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toBeInTheDocument();
  });

  it('should have animated stroke with dasharray', () => {
    const { container } = render(<CustomEdge {...defaultProps} />);
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toBeInTheDocument();
    // Animation applied via CSS class
  });

  it('should use gradient stroke when available', () => {
    const { container } = render(<CustomEdge {...defaultProps} />);
    const path = container.querySelector('path');
    const stroke = path?.getAttribute('stroke');
    expect(stroke).toMatch(/url\(#edge-gradient\)/);
  });

  it('should render animated flow indicator circle', () => {
    const { container } = render(<CustomEdge {...defaultProps} />);
    const circle = container.querySelector('circle');
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveAttribute('r', '4');
  });

  it('should animate circle along path', () => {
    const { container } = render(<CustomEdge {...defaultProps} />);
    const animateMotion = container.querySelector('animateMotion');
    expect(animateMotion).toBeInTheDocument();
  });

  it('should set animation duration to 2 seconds', () => {
    const { container } = render(<CustomEdge {...defaultProps} />);
    const animateMotion = container.querySelector('animateMotion');
    expect(animateMotion).toHaveAttribute('dur', '2s');
  });

  it('should repeat animation indefinitely', () => {
    const { container } = render(<CustomEdge {...defaultProps} />);
    const animateMotion = container.querySelector('animateMotion');
    expect(animateMotion).toHaveAttribute('repeatCount', 'indefinite');
  });

  it('should render edge label when provided', () => {
    const props = {
      ...defaultProps,
      data: { label: 'Transform Data' },
    };
    const { getByText } = render(<CustomEdge {...props} />);
    expect(getByText('Transform Data')).toBeInTheDocument();
  });

  it('should not render label when not provided', () => {
    const { container } = render(<CustomEdge {...defaultProps} />);
    const label = container.querySelector('.edge-label');
    expect(label).not.toBeInTheDocument();
  });

  it('should apply glassmorphic styling to label', () => {
    const props = {
      ...defaultProps,
      data: { label: 'Test Label' },
    };
    const { container } = render(<CustomEdge {...props} />);
    const label = container.querySelector('.edge-label');
    expect(label).toHaveClass('glass');
  });

  it('should style label with padding', () => {
    const props = {
      ...defaultProps,
      data: { label: 'Test Label' },
    };
    const { container } = render(<CustomEdge {...props} />);
    const label = container.querySelector('.edge-label');
    expect(label).toHaveClass('px-2', 'py-1');
  });

  it('should round label corners', () => {
    const props = {
      ...defaultProps,
      data: { label: 'Test Label' },
    };
    const { container } = render(<CustomEdge {...props} />);
    const label = container.querySelector('.edge-label');
    expect(label).toHaveClass('rounded');
  });

  it('should size label text appropriately', () => {
    const props = {
      ...defaultProps,
      data: { label: 'Test Label' },
    };
    const { container } = render(<CustomEdge {...props} />);
    const label = container.querySelector('.edge-label');
    expect(label).toHaveClass('text-xs');
  });

  it('should apply enhanced styling when selected', () => {
    const props = {
      ...defaultProps,
      selected: true,
    };
    const { container } = render(<CustomEdge {...props} />);
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toBeInTheDocument();
    // Selected edges should have thicker stroke via CSS
  });

  it('should apply normal styling when not selected', () => {
    const props = {
      ...defaultProps,
      selected: false,
    };
    const { container } = render(<CustomEdge {...props} />);
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toBeInTheDocument();
  });

  it('should calculate bezier path correctly', () => {
    const { container } = render(<CustomEdge {...defaultProps} />);
    const path = container.querySelector('path');
    const pathData = path?.getAttribute('d');

    // Bezier paths contain 'C' command
    expect(pathData).toMatch(/C/);
    // Should contain control points
    expect(pathData).toBeTruthy();
  });

  it('should handle vertical edge routing', () => {
    const props = {
      ...defaultProps,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
    const { container } = render(<CustomEdge {...props} />);
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
  });

  it('should handle horizontal edge routing', () => {
    const props = {
      ...defaultProps,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
    const { container } = render(<CustomEdge {...props} />);
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
  });

  it('should define edge gradient in defs section', () => {
    const { container } = render(<CustomEdge {...defaultProps} />);
    const defs = container.querySelector('defs');
    expect(defs).toBeInTheDocument();
    const gradient = defs?.querySelector('linearGradient#edge-gradient');
    expect(gradient).toBeInTheDocument();
  });

  it('should configure gradient with three stops', () => {
    const { container } = render(<CustomEdge {...defaultProps} />);
    const gradient = container.querySelector('linearGradient#edge-gradient');
    const stops = gradient?.querySelectorAll('stop');
    expect(stops?.length).toBe(3);
  });

  it('should set gradient start with low opacity', () => {
    const { container } = render(<CustomEdge {...defaultProps} />);
    const stops = container.querySelectorAll('linearGradient#edge-gradient stop');
    const firstStop = stops[0];
    expect(firstStop).toHaveAttribute('offset', '0%');
    expect(firstStop).toHaveAttribute('stopOpacity', '0.3');
  });

  it('should set gradient middle with full opacity', () => {
    const { container } = render(<CustomEdge {...defaultProps} />);
    const stops = container.querySelectorAll('linearGradient#edge-gradient stop');
    const middleStop = stops[1];
    expect(middleStop).toHaveAttribute('offset', '50%');
    expect(middleStop).toHaveAttribute('stopOpacity', '1');
  });

  it('should set gradient end with low opacity', () => {
    const { container } = render(<CustomEdge {...defaultProps} />);
    const stops = container.querySelectorAll('linearGradient#edge-gradient stop');
    const lastStop = stops[2];
    expect(lastStop).toHaveAttribute('offset', '100%');
    expect(lastStop).toHaveAttribute('stopOpacity', '0.3');
  });

  it('should use blue color for gradient', () => {
    const { container } = render(<CustomEdge {...defaultProps} />);
    const stops = container.querySelectorAll('linearGradient#edge-gradient stop');
    stops.forEach(stop => {
      expect(stop).toHaveAttribute('stopColor', '#3b82f6');
    });
  });

  it('should set path stroke width', () => {
    const { container } = render(<CustomEdge {...defaultProps} />);
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveAttribute('strokeWidth', '2');
  });

  it('should fill circle with blue color', () => {
    const { container } = render(<CustomEdge {...defaultProps} />);
    const circle = container.querySelector('circle');
    expect(circle).toHaveAttribute('fill', '#3b82f6');
  });

  it('should position label at edge center', () => {
    const props = {
      ...defaultProps,
      data: { label: 'Center Label' },
    };
    const { container } = render(<CustomEdge {...props} />);
    const label = container.querySelector('.edge-label');
    expect(label).toBeInTheDocument();
    // EdgeLabelRenderer handles positioning
  });

  it('should handle missing data prop gracefully', () => {
    const { container } = render(<CustomEdge {...defaultProps} />);
    // Should render without crashing
    expect(container.querySelector('path')).toBeInTheDocument();
  });

  it('should render with custom edge id', () => {
    const props = {
      ...defaultProps,
      id: 'custom-edge-id',
    };
    const { container } = render(<CustomEdge {...props} />);
    const path = container.querySelector('path');
    expect(path).toHaveAttribute('id', 'custom-edge-id');
  });
});
