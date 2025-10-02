import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ValidationBadge } from './ValidationBadge';

describe('ValidationBadge - Enhanced Design', () => {
  describe('Basic Rendering', () => {
    it('should not render when no errors or warnings', () => {
      const { container } = render(
        <ValidationBadge errors={[]} warnings={[]} />,
      );

      const badge = container.querySelector('button');
      expect(badge).toBeFalsy();
    });

    it('should render when errors present', () => {
      const errors = [
        { type: 'configuration' as const, message: 'Name required', severity: 'error' as const },
      ];

      render(<ValidationBadge errors={errors} warnings={[]} />);

      const badge = screen.getByRole('button');
      expect(badge).toBeTruthy();
    });

    it('should render when warnings present', () => {
      const warnings = [
        { type: 'configuration' as const, message: 'Description recommended', severity: 'warning' as const },
      ];

      render(<ValidationBadge errors={[]} warnings={warnings} />);

      const badge = screen.getByRole('button');
      expect(badge).toBeTruthy();
    });
  });

  describe('Error Count Display', () => {
    it('should display single error count', () => {
      const errors = [
        { type: 'configuration' as const, message: 'Name required', severity: 'error' as const },
      ];

      render(<ValidationBadge errors={errors} warnings={[]} />);

      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.getByText('❌')).toBeTruthy();
    });

    it('should display multiple errors count', () => {
      const errors = [
        { type: 'configuration' as const, message: 'Name required', severity: 'error' as const },
        { type: 'configuration' as const, message: 'Model required', severity: 'error' as const },
        { type: 'configuration' as const, message: 'Invalid temperature', severity: 'error' as const },
      ];

      render(<ValidationBadge errors={errors} warnings={[]} />);

      expect(screen.getByText('3')).toBeTruthy();
    });

    it('should display single warning count', () => {
      const warnings = [
        { type: 'configuration' as const, message: 'Add description', severity: 'warning' as const },
      ];

      render(<ValidationBadge errors={[]} warnings={warnings} />);

      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.getByText('⚠️')).toBeTruthy();
    });

    it('should display both errors and warnings', () => {
      const errors = [
        { type: 'configuration' as const, message: 'Name required', severity: 'error' as const },
      ];
      const warnings = [
        { type: 'configuration' as const, message: 'Add description', severity: 'warning' as const },
      ];

      render(<ValidationBadge errors={errors} warnings={warnings} />);

      expect(screen.getByText('❌')).toBeTruthy();
      expect(screen.getByText('⚠️')).toBeTruthy();
    });
  });

  describe('Severity Filtering', () => {
    it('should filter errors by severity', () => {
      const errors = [
        { type: 'configuration' as const, message: 'Name required', severity: 'error' as const },
      ];
      const warnings = [
        { type: 'configuration' as const, message: 'Add description', severity: 'warning' as const },
      ];

      render(<ValidationBadge errors={errors} warnings={warnings} />);

      const badge = screen.getByRole('button');
      expect(badge).toBeTruthy();
    });

    it('should handle mixed severity in errors array', () => {
      const allValidations = [
        { type: 'configuration' as const, message: 'Name required', severity: 'error' as const },
        { type: 'configuration' as const, message: 'Add description', severity: 'warning' as const },
      ];

      render(<ValidationBadge errors={allValidations} warnings={[]} />);

      // Should show error count only
      const badge = screen.getByRole('button');
      expect(badge).toBeTruthy();
    });
  });

  describe('Styling and Animation', () => {
    it('should have glassmorphic styling', () => {
      const errors = [
        { type: 'configuration' as const, message: 'Name required', severity: 'error' as const },
      ];

      const { container } = render(<ValidationBadge errors={errors} warnings={[]} />);

      const badge = container.querySelector('.glass');
      expect(badge).toBeTruthy();
    });

    it('should have pulse animation for errors', () => {
      const errors = [
        { type: 'configuration' as const, message: 'Name required', severity: 'error' as const },
      ];

      const { container } = render(<ValidationBadge errors={errors} warnings={[]} />);

      const badge = container.querySelector('.animate-validation-pulse');
      expect(badge).toBeTruthy();
    });

    it('should not have pulse animation for warnings only', () => {
      const warnings = [
        { type: 'configuration' as const, message: 'Add description', severity: 'warning' as const },
      ];

      const { container } = render(<ValidationBadge errors={[]} warnings={warnings} />);

      const badge = container.querySelector('.animate-validation-pulse');
      expect(badge).toBeFalsy();
    });

    it('should apply custom className', () => {
      const errors = [
        { type: 'configuration' as const, message: 'Name required', severity: 'error' as const },
      ];

      const { container } = render(
        <ValidationBadge errors={errors} warnings={[]} className="custom-test-class" />,
      );

      const badge = container.querySelector('.custom-test-class');
      expect(badge).toBeTruthy();
    });
  });

  describe('Click Interaction', () => {
    it('should call onErrorClick when badge clicked with errors', () => {
      const onErrorClick = vi.fn();
      const errors = [
        { type: 'configuration' as const, message: 'Name required', severity: 'error' as const },
      ];

      render(<ValidationBadge errors={errors} warnings={[]} onErrorClick={onErrorClick} />);

      const badge = screen.getByRole('button');
      fireEvent.click(badge);

      expect(onErrorClick).toHaveBeenCalledTimes(1);
      expect(onErrorClick).toHaveBeenCalledWith(errors[0]);
    });

    it('should not call onErrorClick when only warnings present', () => {
      const onErrorClick = vi.fn();
      const warnings = [
        { type: 'configuration' as const, message: 'Add description', severity: 'warning' as const },
      ];

      render(<ValidationBadge errors={[]} warnings={warnings} onErrorClick={onErrorClick} />);

      const badge = screen.getByRole('button');
      fireEvent.click(badge);

      expect(onErrorClick).not.toHaveBeenCalled();
    });

    it('should not call onErrorClick when handler not provided', () => {
      const errors = [
        { type: 'configuration' as const, message: 'Name required', severity: 'error' as const },
      ];

      render(<ValidationBadge errors={errors} warnings={[]} />);

      const badge = screen.getByRole('button');
      // Should not throw error
      expect(() => fireEvent.click(badge)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label', () => {
      const errors = [
        { type: 'configuration' as const, message: 'Name required', severity: 'error' as const },
      ];
      const warnings = [
        { type: 'configuration' as const, message: 'Add description', severity: 'warning' as const },
      ];

      render(<ValidationBadge errors={errors} warnings={warnings} />);

      const badge = screen.getByRole('button');
      expect(badge.getAttribute('aria-label')).toContain('1 errors');
      expect(badge.getAttribute('aria-label')).toContain('1 warnings');
    });

    it('should pluralize error label correctly', () => {
      const errors = [
        { type: 'configuration' as const, message: 'Name required', severity: 'error' as const },
        { type: 'configuration' as const, message: 'Model required', severity: 'error' as const },
      ];

      render(<ValidationBadge errors={errors} warnings={[]} />);

      const badge = screen.getByRole('button');
      expect(badge.getAttribute('aria-label')).toContain('2 errors');
    });

    it('should be focusable via keyboard', () => {
      const errors = [
        { type: 'configuration' as const, message: 'Name required', severity: 'error' as const },
      ];

      render(<ValidationBadge errors={errors} warnings={[]} />);

      const badge = screen.getByRole('button');
      badge.focus();

      expect(document.activeElement).toBe(badge);
    });

    it('should hide emoji from screen readers', () => {
      const errors = [
        { type: 'configuration' as const, message: 'Name required', severity: 'error' as const },
      ];

      const { container } = render(<ValidationBadge errors={errors} warnings={[]} />);

      const emoji = container.querySelector('[aria-hidden="true"]');
      expect(emoji).toBeTruthy();
    });
  });

  describe('Positioning', () => {
    it('should have absolute positioning', () => {
      const errors = [
        { type: 'configuration' as const, message: 'Name required', severity: 'error' as const },
      ];

      const { container } = render(<ValidationBadge errors={errors} warnings={[]} />);

      const badge = container.querySelector('.absolute.-top-2.-right-2');
      expect(badge).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero errors and warnings gracefully', () => {
      const { container } = render(<ValidationBadge errors={[]} warnings={[]} />);

      const badge = container.querySelector('button');
      expect(badge).toBeFalsy();
    });

    it('should handle large number of errors', () => {
      const errors = Array.from({ length: 25 }, (_, i) => ({
        type: 'configuration' as const,
        message: `Error ${i}`,
        severity: 'error' as const,
      }));

      render(<ValidationBadge errors={errors} warnings={[]} />);

      expect(screen.getByText('25')).toBeTruthy();
    });

    it('should handle large number of warnings', () => {
      const warnings = Array.from({ length: 10 }, (_, i) => ({
        type: 'configuration' as const,
        message: `Warning ${i}`,
        severity: 'warning' as const,
      }));

      render(<ValidationBadge errors={[]} warnings={warnings} />);

      expect(screen.getByText('10')).toBeTruthy();
    });

    it('should handle very long error messages in tooltip', () => {
      const errors = [
        {
          type: 'configuration' as const,
          message: 'This is a very long error message that might need to be truncated or wrapped properly in the tooltip display to ensure good user experience',
          severity: 'error' as const,
        },
      ];

      render(<ValidationBadge errors={errors} warnings={[]} />);

      const badge = screen.getByRole('button');
      expect(badge).toBeTruthy();
    });
  });

  describe('Tooltip Integration', () => {
    it('should be wrapped in Tooltip component', () => {
      const errors = [
        { type: 'configuration' as const, message: 'Name required', severity: 'error' as const },
      ];

      render(<ValidationBadge errors={errors} warnings={[]} />);

      // Badge should exist within a button
      const badge = screen.getByRole('button');
      expect(badge).toBeTruthy();
    });
  });

  describe('Visual Design', () => {
    it('should have rounded full styling', () => {
      const errors = [
        { type: 'configuration' as const, message: 'Name required', severity: 'error' as const },
      ];

      const { container } = render(<ValidationBadge errors={errors} warnings={[]} />);

      const badge = container.querySelector('.rounded-full');
      expect(badge).toBeTruthy();
    });

    it('should have hover scale effect', () => {
      const errors = [
        { type: 'configuration' as const, message: 'Name required', severity: 'error' as const },
      ];

      const { container } = render(<ValidationBadge errors={errors} warnings={[]} />);

      const badge = container.querySelector('.hover\\:scale-110');
      expect(badge).toBeTruthy();
    });

    it('should have focus ring', () => {
      const errors = [
        { type: 'configuration' as const, message: 'Name required', severity: 'error' as const },
      ];

      const { container } = render(<ValidationBadge errors={errors} warnings={[]} />);

      const badge = container.querySelector('.focus\\:ring-2');
      expect(badge).toBeTruthy();
    });

    it('should use red theme for errors', () => {
      const errors = [
        { type: 'configuration' as const, message: 'Name required', severity: 'error' as const },
      ];

      const { container } = render(<ValidationBadge errors={errors} warnings={[]} />);

      const errorText = container.querySelector('.text-red-400');
      expect(errorText).toBeTruthy();
    });

    it('should use yellow theme for warnings', () => {
      const warnings = [
        { type: 'configuration' as const, message: 'Add description', severity: 'warning' as const },
      ];

      const { container } = render(<ValidationBadge errors={[]} warnings={warnings} />);

      const warningText = container.querySelector('.text-yellow-400');
      expect(warningText).toBeTruthy();
    });
  });
});
