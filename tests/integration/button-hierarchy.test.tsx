import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { App } from '../../apps/frontend/src/App';

/**
 * Global Integration Tests - Button Hierarchy
 *
 * These tests verify button hierarchy rules across the ENTIRE application,
 * not just individual components.
 *
 * TDD Approach: These tests will FAIL initially, then PASS after refactoring.
 */

describe('Button Hierarchy - Global Integration (TDD)', () => {
  describe('Primary Button Rule - Application Wide', () => {
    it('should NEVER have more than ONE primary button visible at a time', () => {
      const { container } = render(<App />);

      // Find ALL primary buttons in the entire app
      const primaryButtons = container.querySelectorAll('.btn-primary-coral');

      // Filter to only visible buttons (not hidden by display:none or visibility:hidden)
      const visiblePrimary = Array.from(primaryButtons).filter((btn) => {
        const styles = window.getComputedStyle(btn);
        return (
          styles.display !== 'none' &&
          styles.visibility !== 'hidden' &&
          styles.opacity !== '0'
        );
      });

      // Should have AT MOST 1 primary button visible
      expect(visiblePrimary.length).toBeLessThanOrEqual(1);
    });

    it('should have at least ONE primary button on main screens', () => {
      const { container } = render(<App />);

      const primaryButtons = container.querySelectorAll('.btn-primary-coral');
      const visiblePrimary = Array.from(primaryButtons).filter((btn) => {
        const styles = window.getComputedStyle(btn);
        return styles.display !== 'none' && styles.visibility !== 'hidden';
      });

      // Should have exactly 1 primary button on main screen
      expect(visiblePrimary.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('No Raw Tailwind Colors - Application Wide', () => {
    it('should NOT have ANY buttons with bg-green-* classes', () => {
      const { container } = render(<App />);

      const allButtons = container.querySelectorAll('button');
      const hasGreen = Array.from(allButtons).some((btn) =>
        btn.className.match(/bg-green-\d/)
      );

      expect(hasGreen).toBe(false);
    });

    it('should NOT have ANY buttons with bg-blue-* classes', () => {
      const { container } = render(<App />);

      const allButtons = container.querySelectorAll('button');
      const hasBlue = Array.from(allButtons).some((btn) =>
        btn.className.match(/bg-blue-\d/)
      );

      expect(hasBlue).toBe(false);
    });

    it('should NOT have ANY buttons with bg-red-* classes (solid red backgrounds)', () => {
      const { container } = render(<App />);

      const allButtons = container.querySelectorAll('button');
      const hasRed = Array.from(allButtons).some((btn) =>
        btn.className.match(/bg-red-\d/)
      );

      expect(hasRed).toBe(false);
    });

    it('should NOT have ANY buttons with bg-purple-* classes', () => {
      const { container } = render(<App />);

      const allButtons = container.querySelectorAll('button');
      const hasPurple = Array.from(allButtons).some((btn) =>
        btn.className.match(/bg-purple-\d/)
      );

      expect(hasPurple).toBe(false);
    });

    it('should NOT have ANY buttons with bg-yellow-* classes', () => {
      const { container } = render(<App />);

      const allButtons = container.querySelectorAll('button');
      const hasYellow = Array.from(allButtons).some((btn) =>
        btn.className.match(/bg-yellow-\d/)
      );

      expect(hasYellow).toBe(false);
    });
  });

  describe('Button Class Usage - Application Wide', () => {
    it('should have ALL buttons using defined utility classes', () => {
      const { container } = render(<App />);

      const allButtons = container.querySelectorAll('button');
      const validClasses = [
        'btn-primary-coral',
        'btn-glass',
        'btn-ghost',
        'btn-destructive',
      ];

      // Every button should have at least one valid button class
      // (excluding React Flow internal buttons and other framework buttons)
      const customButtons = Array.from(allButtons).filter((btn) => {
        // Filter out React Flow's internal buttons
        const isReactFlowButton =
          btn.closest('.react-flow__controls') !== null ||
          btn.classList.contains('react-flow__panel');
        return !isReactFlowButton;
      });

      const allHaveValidClass = customButtons.every((btn) => {
        return validClasses.some((validClass) => btn.className.includes(validClass));
      });

      expect(allHaveValidClass).toBe(true);
    });
  });

  describe('Border Radius Consistency - Application Wide', () => {
    it('should have consistent border-radius across all custom buttons', () => {
      const { container } = render(<App />);

      const customButtons = Array.from(
        container.querySelectorAll('button[class*="btn-"]')
      ).filter((btn) => {
        // Exclude React Flow buttons
        return btn.closest('.react-flow__controls') === null;
      });

      const radiusValues = new Set<string>();

      customButtons.forEach((btn) => {
        const styles = window.getComputedStyle(btn);
        if (styles.borderRadius && styles.borderRadius !== '0px') {
          radiusValues.add(styles.borderRadius);
        }
      });

      // Should have at most 2 different radius values (buttons and possibly cards)
      expect(radiusValues.size).toBeLessThanOrEqual(2);
    });
  });

  describe('Font Size Consistency - Application Wide', () => {
    it('should have consistent font-size across button types', () => {
      const { container } = render(<App />);

      const buttonsByType: Record<string, HTMLElement[]> = {
        primary: [],
        glass: [],
        ghost: [],
        destructive: [],
      };

      // Collect buttons by type
      container.querySelectorAll('button').forEach((btn) => {
        if (btn.className.includes('btn-primary-coral')) {
          buttonsByType.primary.push(btn as HTMLElement);
        } else if (btn.className.includes('btn-glass')) {
          buttonsByType.glass.push(btn as HTMLElement);
        } else if (btn.className.includes('btn-ghost')) {
          buttonsByType.ghost.push(btn as HTMLElement);
        } else if (btn.className.includes('btn-destructive')) {
          buttonsByType.destructive.push(btn as HTMLElement);
        }
      });

      // Check that all types have consistent font size
      const fontSizes = new Set<string>();

      Object.values(buttonsByType).forEach((buttons) => {
        buttons.forEach((btn) => {
          const styles = window.getComputedStyle(btn);
          fontSizes.add(styles.fontSize);
        });
      });

      // All button types should use same font size (13px)
      expect(fontSizes.size).toBeLessThanOrEqual(2); // Allow for small variations
    });
  });

  describe('Professional Appearance Standards', () => {
    it('should use glassmorphic effects for secondary buttons', () => {
      const { container } = render(<App />);

      const glassButtons = container.querySelectorAll('.btn-glass');

      // Should have at least some glass buttons
      expect(glassButtons.length).toBeGreaterThan(0);

      // Check that glass buttons have backdrop-filter
      glassButtons.forEach((btn) => {
        const styles = window.getComputedStyle(btn);
        const backdropFilter =
          styles.backdropFilter || (styles as any).webkitBackdropFilter;

        // Should have blur effect
        expect(backdropFilter).toContain('blur');
      });
    });

    it('should use transparent backgrounds for destructive buttons', () => {
      const { container } = render(<App />);

      const destructiveButtons = container.querySelectorAll('.btn-destructive');

      // Check that destructive buttons DON'T have solid red backgrounds
      destructiveButtons.forEach((btn) => {
        const styles = window.getComputedStyle(btn);
        const background = styles.background || styles.backgroundColor;

        // Should be transparent or have very low opacity
        expect(background).toMatch(/transparent|rgba.*,\s*0\)|rgba.*,\s*0\.\d+\)/i);
      });
    });
  });

  describe('Visual Hierarchy Score', () => {
    it('should have clear visual hierarchy: primary > secondary > tertiary > destructive', () => {
      const { container } = render(<App />);

      const buttonTypes = {
        primary: container.querySelectorAll('.btn-primary-coral'),
        glass: container.querySelectorAll('.btn-glass'),
        ghost: container.querySelectorAll('.btn-ghost'),
        destructive: container.querySelectorAll('.btn-destructive'),
      };

      // Primary should exist
      expect(buttonTypes.primary.length).toBeGreaterThan(0);

      // Should have more secondary/tertiary buttons than primary
      const secondaryTertiaryCount =
        buttonTypes.glass.length +
        buttonTypes.ghost.length +
        buttonTypes.destructive.length;

      expect(secondaryTertiaryCount).toBeGreaterThanOrEqual(buttonTypes.primary.length);
    });
  });

  describe('Accessibility - Visual Clarity', () => {
    it('should have sufficient contrast for primary buttons', () => {
      const { container } = render(<App />);

      const primaryButtons = container.querySelectorAll('.btn-primary-coral');

      primaryButtons.forEach((btn) => {
        const styles = window.getComputedStyle(btn);
        const color = styles.color;

        // Primary buttons should have white or near-white text
        expect(color).toMatch(/rgb\(255,\s*255,\s*255\)|white/i);
      });
    });

    it('should have clear disabled states', () => {
      const { container } = render(<App />);

      const disabledButtons = container.querySelectorAll('button:disabled');

      disabledButtons.forEach((btn) => {
        // Should have opacity or cursor styling for disabled state
        expect(
          btn.className.includes('disabled:') || btn.className.includes('opacity')
        ).toBe(true);
      });
    });
  });

  describe('No Emoji Buttons - Professional Icons', () => {
    it('should NOT have emoji characters in button text', () => {
      const { container } = render(<App />);

      const buttons = container.querySelectorAll('button');
      const emojiPattern = /[\u{1F300}-\u{1F9FF}]|▶️|📦|🚀|🧪|⏸️|🔁/u;

      const hasEmojis = Array.from(buttons).some((btn) => {
        const text = btn.textContent || '';
        return emojiPattern.test(text);
      });

      // After implementation, should have NO emojis in buttons
      expect(hasEmojis).toBe(false);
    });
  });

  describe('Performance - CSS Optimization', () => {
    it('should use CSS variables for consistent theming', () => {
      const styles = getComputedStyle(document.documentElement);

      // Check that design system variables are defined
      expect(styles.getPropertyValue('--accent-primary').trim()).toBeTruthy();
      expect(styles.getPropertyValue('--glass-bg').trim()).toBeTruthy();
      expect(styles.getPropertyValue('--text-secondary').trim()).toBeTruthy();
    });
  });
});
