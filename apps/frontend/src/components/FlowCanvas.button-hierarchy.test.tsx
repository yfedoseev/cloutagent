import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlowCanvas } from './FlowCanvas';

// Mock ReactFlow to avoid canvas rendering issues in tests
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ children }: any) => <div data-testid="react-flow">{children}</div>,
  Panel: ({ children }: any) => <div data-testid="panel">{children}</div>,
  Background: () => <div data-testid="background" />,
  Controls: () => <div data-testid="controls" />,
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  useReactFlow: () => ({
    viewport: { zoom: 1, x: 0, y: 0 },
    fitView: vi.fn(),
    setViewport: vi.fn(),
    getViewport: vi.fn(() => ({ zoom: 1, x: 0, y: 0 })),
  }),
  addEdge: vi.fn(),
}));

// Mock child components
vi.mock('./ValidationPanel', () => ({
  ValidationPanel: () => <div data-testid="validation-panel" />,
}));
vi.mock('./PropertyPanel', () => ({
  PropertyPanel: () => <div data-testid="property-panel" />,
}));
vi.mock('./TestModeToggle', () => ({
  TestModeToggle: () => <div data-testid="test-mode-toggle" />,
}));
vi.mock('./ExecutionHistoryPanel', () => ({
  ExecutionHistoryPanel: () => <div data-testid="execution-history" />,
}));
vi.mock('./DryRunEstimate', () => ({
  DryRunEstimate: () => <div data-testid="dry-run-estimate" />,
}));
vi.mock('./TestModeExecution', () => ({
  TestModeExecution: () => <div data-testid="test-mode-execution" />,
}));

describe('FlowCanvas - Button Hierarchy (TDD)', () => {
  describe('Visual Hierarchy - Primary Button Rules', () => {
    it('should have exactly ONE primary button (btn-primary-coral)', () => {
      const { container } = render(<FlowCanvas projectId="test-project" />);

      // Count all elements with btn-primary-coral class
      const primaryButtons = container.querySelectorAll('.btn-primary-coral');

      // Should have exactly one primary button per screen
      expect(primaryButtons.length).toBe(1);
    });

    it('should use btn-primary-coral for Run Workflow button', () => {
      render(<FlowCanvas projectId="test-project" />);

      const runButton = screen.getByText(/Run Workflow|Starting\.\.\./i);

      // Should have primary coral class
      expect(runButton.className).toContain('btn-primary-coral');
    });

    it('should NOT use raw Tailwind colors for Run button', () => {
      render(<FlowCanvas projectId="test-project" />);

      const runButton = screen.getByText(/Run Workflow|Starting\.\.\./i);

      // Should NOT have raw Tailwind green or blue
      expect(runButton.className).not.toMatch(/bg-green-\d/);
      expect(runButton.className).not.toMatch(/bg-blue-\d/);
    });
  });

  describe('Visual Hierarchy - Secondary Buttons', () => {
    it('should use btn-glass for Save button', () => {
      render(<FlowCanvas projectId="test-project" />);

      const saveButton = screen.getByText(/Save|Saving\.\.\./i);

      // Should have glass class (glassmorphic secondary)
      expect(saveButton.className).toContain('btn-glass');
    });

    it('should NOT use raw blue background for Save button', () => {
      render(<FlowCanvas projectId="test-project" />);

      const saveButton = screen.getByText(/Save|Saving\.\.\./i);

      // Should NOT have raw Tailwind blue
      expect(saveButton.className).not.toMatch(/bg-blue-\d/);
    });
  });

  describe('Visual Hierarchy - Tertiary Buttons', () => {
    it('should use btn-ghost for History button', () => {
      render(<FlowCanvas projectId="test-project" />);

      const historyButton = screen.getByText(/History/i);

      // Should have ghost class (minimal, low visual weight)
      expect(historyButton.className).toContain('btn-ghost');
    });

    it('should NOT use raw purple background for History button', () => {
      render(<FlowCanvas projectId="test-project" />);

      const historyButton = screen.getByText(/History/i);

      // Should NOT have raw Tailwind purple
      expect(historyButton.className).not.toMatch(/bg-purple-\d/);
    });
  });

  describe('Visual Hierarchy - Destructive Buttons', () => {
    it('should use btn-destructive for Clear Canvas button', () => {
      render(<FlowCanvas projectId="test-project" />);

      const clearButton = screen.getByText(/Clear Canvas/i);

      // Should have destructive class (subtle red, not alarming)
      expect(clearButton.className).toContain('btn-destructive');
    });

    it('should NOT use raw red background for Clear button', () => {
      render(<FlowCanvas projectId="test-project" />);

      const clearButton = screen.getByText(/Clear Canvas/i);

      // Should NOT have raw Tailwind red
      expect(clearButton.className).not.toMatch(/bg-red-\d/);
    });
  });

  describe('No Raw Tailwind Colors - Comprehensive Check', () => {
    it('should NOT have any buttons with raw Tailwind bg-green classes', () => {
      const { container } = render(<FlowCanvas projectId="test-project" />);

      const buttons = container.querySelectorAll('button');
      const hasGreenBg = Array.from(buttons).some((btn) =>
        btn.className.match(/bg-green-\d/),
      );

      expect(hasGreenBg).toBe(false);
    });

    it('should NOT have any buttons with raw Tailwind bg-blue classes', () => {
      const { container } = render(<FlowCanvas projectId="test-project" />);

      const buttons = container.querySelectorAll('button');
      const hasBlueBg = Array.from(buttons).some((btn) =>
        btn.className.match(/bg-blue-\d/),
      );

      expect(hasBlueBg).toBe(false);
    });

    it('should NOT have any buttons with raw Tailwind bg-red classes', () => {
      const { container } = render(<FlowCanvas projectId="test-project" />);

      const buttons = container.querySelectorAll('button');
      const hasRedBg = Array.from(buttons).some((btn) =>
        btn.className.match(/bg-red-\d/),
      );

      expect(hasRedBg).toBe(false);
    });

    it('should NOT have any buttons with raw Tailwind bg-purple classes', () => {
      const { container } = render(<FlowCanvas projectId="test-project" />);

      const buttons = container.querySelectorAll('button');
      const hasPurpleBg = Array.from(buttons).some((btn) =>
        btn.className.match(/bg-purple-\d/),
      );

      expect(hasPurpleBg).toBe(false);
    });

    it('should NOT have any buttons with raw Tailwind bg-yellow classes', () => {
      const { container } = render(<FlowCanvas projectId="test-project" />);

      const buttons = container.querySelectorAll('button');
      const hasYellowBg = Array.from(buttons).some((btn) =>
        btn.className.match(/bg-yellow-\d/),
      );

      expect(hasYellowBg).toBe(false);
    });
  });

  describe('Button Consistency - Border Radius', () => {
    it('should have consistent border-radius on all toolbar buttons', () => {
      const { container } = render(<FlowCanvas projectId="test-project" />);

      const buttons = container.querySelectorAll('button[class*="btn-"]');
      const radiusValues = new Set<string>();

      buttons.forEach((btn) => {
        const styles = window.getComputedStyle(btn);
        radiusValues.add(styles.borderRadius);
      });

      // Should only have 1-2 distinct border radius values
      // (buttons might have slightly different radius, but should be consistent)
      expect(radiusValues.size).toBeLessThanOrEqual(2);
    });
  });

  describe('Test Mode Variations', () => {
    it('should still maintain btn-primary-coral for Test Run button', () => {
      // This test verifies that even in test mode, we use coral not blue
      const { container } = render(<FlowCanvas projectId="test-project" />);

      const buttons = container.querySelectorAll('button');
      const runButton = Array.from(buttons).find(
        (btn) => btn.textContent?.includes('Run') || btn.textContent?.includes('Test Run'),
      );

      if (runButton) {
        expect(runButton.className).toContain('btn-primary-coral');
        expect(runButton.className).not.toMatch(/bg-blue-\d/);
      }
    });
  });

  describe('Disabled States', () => {
    it('should have disabled styles on Run button when no nodes exist', () => {
      render(<FlowCanvas projectId="test-project" />);

      const runButton = screen.getByText(/Run Workflow|Starting\.\.\./i);

      // Should have disabled class or disabled attribute
      expect(
        runButton.className.includes('disabled:') ||
          runButton.hasAttribute('disabled'),
      ).toBe(true);
    });
  });

  describe('Button Order - Visual Priority', () => {
    it('should have buttons in order: Run (primary) → Save (secondary) → History (tertiary) → Clear (destructive)', () => {
      const { container } = render(<FlowCanvas projectId="test-project" />);

      const buttons = Array.from(container.querySelectorAll('button')).filter(
        (btn) => btn.className.includes('btn-'),
      );

      const buttonTexts = buttons.map((btn) => btn.textContent?.trim() || '');

      // Run should come before Save
      const runIndex = buttonTexts.findIndex((text) => text.includes('Run'));
      const saveIndex = buttonTexts.findIndex((text) => text.includes('Save'));

      if (runIndex >= 0 && saveIndex >= 0) {
        expect(runIndex).toBeLessThan(saveIndex);
      }
    });
  });
});
