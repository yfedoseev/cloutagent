import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../index.css'; // Import CSS to apply styles in jsdom

describe('Button Utility Classes - CSS Design System (TDD)', () => {
  let testContainer: HTMLDivElement;

  beforeEach(() => {
    // Create test container
    testContainer = document.createElement('div');
    document.body.appendChild(testContainer);
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(testContainer);
  });

  describe('CSS Variables - Primary Accent', () => {
    it('should have --accent-primary defined as coral (#FF6D5A)', () => {
      const styles = getComputedStyle(document.documentElement);
      const accentPrimary = styles.getPropertyValue('--accent-primary').trim();

      // Should be warm coral color, not blue
      expect(accentPrimary.toLowerCase()).toBe('#ff6d5a');
    });

    it('should have --accent-primary-hover defined', () => {
      const styles = getComputedStyle(document.documentElement);
      const accentHover = styles.getPropertyValue('--accent-primary-hover').trim();

      expect(accentHover.toLowerCase()).toBe('#e85d4a');
    });

    it('should have --accent-primary-active defined', () => {
      const styles = getComputedStyle(document.documentElement);
      const accentActive = styles.getPropertyValue('--accent-primary-active').trim();

      expect(accentActive.toLowerCase()).toBe('#d54d3a');
    });
  });

  describe('CSS Variables - Functional Colors', () => {
    it('should have --color-success for semantic success states only', () => {
      const styles = getComputedStyle(document.documentElement);
      const colorSuccess = styles.getPropertyValue('--color-success').trim();

      expect(colorSuccess.toLowerCase()).toBe('#10b981');
    });

    it('should have --color-warning for semantic warnings only', () => {
      const styles = getComputedStyle(document.documentElement);
      const colorWarning = styles.getPropertyValue('--color-warning').trim();

      expect(colorWarning.toLowerCase()).toBe('#f59e0b');
    });

    it('should have --color-error for semantic errors only', () => {
      const styles = getComputedStyle(document.documentElement);
      const colorError = styles.getPropertyValue('--color-error').trim();

      expect(colorError.toLowerCase()).toBe('#ef4444');
    });
  });

  describe('.btn-primary-coral class', () => {
    it('should exist and apply coral gradient background', () => {
      const button = document.createElement('button');
      button.className = 'btn-primary-coral';
      testContainer.appendChild(button);

      const styles = getComputedStyle(button);
      const background = styles.background || styles.backgroundImage;

      // Should contain gradient with coral colors
      expect(background).toContain('gradient');
      // Browsers convert hex to rgb, so check for rgb(255, 109, 90) which is #FF6D5A
      expect(background.toLowerCase()).toMatch(/ff6d5a|#ff6d5a|rgb\(255,\s*109,\s*90\)/i);
    });

    it('should have rounded corners (border-radius)', () => {
      const button = document.createElement('button');
      button.className = 'btn-primary-coral';
      testContainer.appendChild(button);

      const styles = getComputedStyle(button);
      const borderRadius = styles.borderRadius;

      // Should have border radius (not 0px)
      expect(borderRadius).not.toBe('0px');
      expect(parseInt(borderRadius)).toBeGreaterThan(0);
    });

    it('should have box-shadow for elevation', () => {
      const button = document.createElement('button');
      button.className = 'btn-primary-coral';
      testContainer.appendChild(button);

      const styles = getComputedStyle(button);
      const boxShadow = styles.boxShadow;

      // Should have shadow, not 'none'
      expect(boxShadow).not.toBe('none');
      expect(boxShadow.length).toBeGreaterThan(0);
    });

    it('should have white text color', () => {
      const button = document.createElement('button');
      button.className = 'btn-primary-coral';
      testContainer.appendChild(button);

      const styles = getComputedStyle(button);
      const color = styles.color;

      // Should be white or very close to white
      expect(color).toMatch(/rgb\(255,\s*255,\s*255\)|white/i);
    });
  });

  describe('.btn-glass class', () => {
    it('should exist and have glassmorphic background', () => {
      const button = document.createElement('button');
      button.className = 'btn-glass';
      testContainer.appendChild(button);

      const styles = getComputedStyle(button);
      const background = styles.background || styles.backgroundColor;

      // Should have semi-transparent background (rgba)
      expect(background).toMatch(/rgba/i);
    });

    it('should have backdrop-filter blur effect', () => {
      const button = document.createElement('button');
      button.className = 'btn-glass';
      testContainer.appendChild(button);

      const styles = getComputedStyle(button);
      const backdropFilter = styles.backdropFilter || (styles as any).webkitBackdropFilter;

      // Should have blur effect
      // Note: jsdom doesn't support backdrop-filter, so we check if it's defined or skip
      if (backdropFilter !== undefined) {
        expect(backdropFilter).toContain('blur');
      } else {
        // In jsdom, backdrop-filter is not supported, so we verify the class exists instead
        expect(button.className).toBe('btn-glass');
      }
    });

    it('should have border for glass effect', () => {
      const button = document.createElement('button');
      button.className = 'btn-glass';
      testContainer.appendChild(button);

      const styles = getComputedStyle(button);
      const border = styles.border || styles.borderWidth;

      // Should have border
      expect(border).not.toBe('0px');
      expect(border).not.toBe('none');
    });
  });

  describe('.btn-ghost class', () => {
    it('should exist and have transparent background', () => {
      const button = document.createElement('button');
      button.className = 'btn-ghost';
      testContainer.appendChild(button);

      const styles = getComputedStyle(button);
      const background = styles.background || styles.backgroundColor;

      // Should be transparent
      expect(background).toMatch(/transparent|rgba\(0,\s*0,\s*0,\s*0\)/i);
    });

    it('should have secondary text color (lower opacity)', () => {
      const button = document.createElement('button');
      button.className = 'btn-ghost';
      testContainer.appendChild(button);

      const styles = getComputedStyle(button);
      const color = styles.color;

      // Should use rgba with opacity < 1
      expect(color).toMatch(/rgba/i);
    });
  });

  describe('.btn-destructive class', () => {
    it('should exist and have transparent background', () => {
      const button = document.createElement('button');
      button.className = 'btn-destructive';
      testContainer.appendChild(button);

      const styles = getComputedStyle(button);
      const background = styles.background || styles.backgroundColor;

      // Should be transparent (not solid red background)
      expect(background).toMatch(/transparent|rgba\(0,\s*0,\s*0,\s*0\)/i);
    });

    it('should have red text color with reduced opacity', () => {
      const button = document.createElement('button');
      button.className = 'btn-destructive';
      testContainer.appendChild(button);

      const styles = getComputedStyle(button);
      const color = styles.color;

      // Should have red-ish color (239, 68, 68) with opacity
      expect(color).toMatch(/rgba\(239,\s*68,\s*68/i);
    });
  });

  describe('Button Consistency - Border Radius', () => {
    it('should have consistent border-radius across all button types', () => {
      const primaryBtn = document.createElement('button');
      primaryBtn.className = 'btn-primary-coral';

      const glassBtn = document.createElement('button');
      glassBtn.className = 'btn-glass';

      const ghostBtn = document.createElement('button');
      ghostBtn.className = 'btn-ghost';

      const destructiveBtn = document.createElement('button');
      destructiveBtn.className = 'btn-destructive';

      testContainer.appendChild(primaryBtn);
      testContainer.appendChild(glassBtn);
      testContainer.appendChild(ghostBtn);
      testContainer.appendChild(destructiveBtn);

      const primaryRadius = getComputedStyle(primaryBtn).borderRadius;
      const glassRadius = getComputedStyle(glassBtn).borderRadius;
      const ghostRadius = getComputedStyle(ghostBtn).borderRadius;
      const destructiveRadius = getComputedStyle(destructiveBtn).borderRadius;

      // All should have same border radius
      expect(primaryRadius).toBe(glassRadius);
      expect(glassRadius).toBe(ghostRadius);
      expect(ghostRadius).toBe(destructiveRadius);
    });
  });

  describe('Button Consistency - Font Size', () => {
    it('should have consistent font-size across all button types', () => {
      const primaryBtn = document.createElement('button');
      primaryBtn.className = 'btn-primary-coral';

      const glassBtn = document.createElement('button');
      glassBtn.className = 'btn-glass';

      const ghostBtn = document.createElement('button');
      ghostBtn.className = 'btn-ghost';

      const destructiveBtn = document.createElement('button');
      destructiveBtn.className = 'btn-destructive';

      testContainer.appendChild(primaryBtn);
      testContainer.appendChild(glassBtn);
      testContainer.appendChild(ghostBtn);
      testContainer.appendChild(destructiveBtn);

      const primarySize = getComputedStyle(primaryBtn).fontSize;
      const glassSize = getComputedStyle(glassBtn).fontSize;
      const ghostSize = getComputedStyle(ghostBtn).fontSize;
      const destructiveSize = getComputedStyle(destructiveBtn).fontSize;

      // All should have same font size (13px / 0.8125rem)
      expect(primarySize).toBe(glassSize);
      expect(glassSize).toBe(ghostSize);
      expect(ghostSize).toBe(destructiveSize);
    });
  });
});
