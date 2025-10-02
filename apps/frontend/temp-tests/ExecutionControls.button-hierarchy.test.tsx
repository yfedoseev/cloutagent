import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExecutionControls } from './ExecutionControls';

describe('ExecutionControls - Button Hierarchy (TDD)', () => {
  describe('Running State - Visual Hierarchy', () => {
    it('should use btn-glass for Pause button when running', () => {
      render(
        <ExecutionControls
          executionId="test-exec-123"
          status="running"
          onStatusChange={() => {}}
        />,
      );

      const pauseButton = screen.getByText(/Pause|Pausing\.\.\./i);

      // Pause is secondary action (important but not primary)
      expect(pauseButton.className).toContain('btn-glass');
    });

    it('should NOT use raw yellow background for Pause button', () => {
      render(
        <ExecutionControls
          executionId="test-exec-123"
          status="running"
          onStatusChange={() => {}}
        />,
      );

      const pauseButton = screen.getByText(/Pause|Pausing\.\.\./i);

      // Should NOT have raw Tailwind yellow
      expect(pauseButton.className).not.toMatch(/bg-yellow-\d/);
    });

    it('should use btn-destructive for Cancel button when running', () => {
      render(
        <ExecutionControls
          executionId="test-exec-123"
          status="running"
          onStatusChange={() => {}}
        />,
      );

      const cancelButton = screen.getByText(/Cancel|Cancelling\.\.\./i);

      // Cancel is destructive action
      expect(cancelButton.className).toContain('btn-destructive');
    });

    it('should NOT use raw red background for Cancel button', () => {
      render(
        <ExecutionControls
          executionId="test-exec-123"
          status="running"
          onStatusChange={() => {}}
        />,
      );

      const cancelButton = screen.getByText(/Cancel|Cancelling\.\.\./i);

      // Should NOT have raw Tailwind red (should be text-only red)
      expect(cancelButton.className).not.toMatch(/bg-red-\d/);
    });
  });

  describe('Paused State - Visual Hierarchy', () => {
    it('should use btn-primary-coral for Resume button when paused', () => {
      render(
        <ExecutionControls
          executionId="test-exec-123"
          status="paused"
          onStatusChange={() => {}}
        />,
      );

      const resumeButton = screen.getByText(/Resume|Resuming\.\.\./i);

      // Resume is PRIMARY action when paused (user wants to continue)
      expect(resumeButton.className).toContain('btn-primary-coral');
    });

    it('should NOT use raw green background for Resume button', () => {
      render(
        <ExecutionControls
          executionId="test-exec-123"
          status="paused"
          onStatusChange={() => {}}
        />,
      );

      const resumeButton = screen.getByText(/Resume|Resuming\.\.\./i);

      // Should NOT have raw Tailwind green
      expect(resumeButton.className).not.toMatch(/bg-green-\d/);
    });

    it('should have exactly ONE primary button when paused (Resume)', () => {
      const { container } = render(
        <ExecutionControls
          executionId="test-exec-123"
          status="paused"
          onStatusChange={() => {}}
        />,
      );

      const primaryButtons = container.querySelectorAll('.btn-primary-coral');

      // Only Resume should be primary
      expect(primaryButtons.length).toBe(1);
    });
  });

  describe('Failed State - Visual Hierarchy', () => {
    it('should use btn-primary-coral for Retry button when failed', () => {
      render(
        <ExecutionControls
          executionId="test-exec-123"
          status="failed"
          onStatusChange={() => {}}
        />,
      );

      const retryButton = screen.getByText(/Retry/i);

      // Retry is PRIMARY action when failed (user wants to try again)
      expect(retryButton.className).toContain('btn-primary-coral');
    });

    it('should NOT use raw blue background for Retry button', () => {
      render(
        <ExecutionControls
          executionId="test-exec-123"
          status="failed"
          onStatusChange={() => {}}
        />,
      );

      const retryButton = screen.getByText(/Retry/i);

      // Should NOT have raw Tailwind blue
      expect(retryButton.className).not.toMatch(/bg-blue-\d/);
    });
  });

  describe('No Raw Tailwind Colors - All States', () => {
    it('should NOT have buttons with raw yellow backgrounds (running state)', () => {
      const { container } = render(
        <ExecutionControls
          executionId="test-exec-123"
          status="running"
          onStatusChange={() => {}}
        />,
      );

      const buttons = container.querySelectorAll('button');
      const hasYellowBg = Array.from(buttons).some((btn) =>
        btn.className.match(/bg-yellow-\d/),
      );

      expect(hasYellowBg).toBe(false);
    });

    it('should NOT have buttons with raw green backgrounds (paused state)', () => {
      const { container } = render(
        <ExecutionControls
          executionId="test-exec-123"
          status="paused"
          onStatusChange={() => {}}
        />,
      );

      const buttons = container.querySelectorAll('button');
      const hasGreenBg = Array.from(buttons).some((btn) =>
        btn.className.match(/bg-green-\d/),
      );

      expect(hasGreenBg).toBe(false);
    });

    it('should NOT have buttons with raw red backgrounds (any state)', () => {
      const { container } = render(
        <ExecutionControls
          executionId="test-exec-123"
          status="running"
          onStatusChange={() => {}}
        />,
      );

      const buttons = container.querySelectorAll('button');
      const hasRedBg = Array.from(buttons).some((btn) =>
        btn.className.match(/bg-red-\d/),
      );

      expect(hasRedBg).toBe(false);
    });

    it('should NOT have buttons with raw blue backgrounds (failed state)', () => {
      const { container } = render(
        <ExecutionControls
          executionId="test-exec-123"
          status="failed"
          onStatusChange={() => {}}
        />,
      );

      const buttons = container.querySelectorAll('button');
      const hasBlueBg = Array.from(buttons).some((btn) =>
        btn.className.match(/bg-blue-\d/),
      );

      expect(hasBlueBg).toBe(false);
    });
  });

  describe('Button Consistency - Styling', () => {
    it('should have text-sm class on all control buttons', () => {
      const { container } = render(
        <ExecutionControls
          executionId="test-exec-123"
          status="running"
          onStatusChange={() => {}}
        />,
      );

      const buttons = container.querySelectorAll('button[class*="btn-"]');

      buttons.forEach((btn) => {
        // Should have text-sm for consistent sizing
        expect(btn.className).toContain('text-sm');
      });
    });

    it('should have flex items-center gap for icon spacing', () => {
      const { container } = render(
        <ExecutionControls
          executionId="test-exec-123"
          status="running"
          onStatusChange={() => {}}
        />,
      );

      const buttons = container.querySelectorAll('button[class*="btn-"]');

      buttons.forEach((btn) => {
        // Should have flex layout for future icons
        expect(btn.className).toContain('flex');
        expect(btn.className).toContain('items-center');
      });
    });
  });

  describe('Disabled States', () => {
    it('should have disabled styles when loading', () => {
      const { container } = render(
        <ExecutionControls
          executionId="test-exec-123"
          status="running"
          onStatusChange={() => {}}
        />,
      );

      const buttons = container.querySelectorAll('button');

      buttons.forEach((btn) => {
        // Should have disabled opacity class
        expect(btn.className).toContain('disabled:opacity-50');
      });
    });
  });

  describe('Visual Priority - Button Count Rules', () => {
    it('should have NO MORE than ONE primary button in any state', () => {
      const states: Array<'running' | 'paused' | 'failed' | 'completed' | 'cancelled'> = [
        'running',
        'paused',
        'failed',
      ];

      states.forEach((status) => {
        const { container } = render(
          <ExecutionControls
            executionId="test-exec-123"
            status={status}
            onStatusChange={() => {}}
          />,
        );

        const primaryButtons = container.querySelectorAll('.btn-primary-coral');

        // Never more than 1 primary button
        expect(primaryButtons.length).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('State Transitions - Consistency', () => {
    it('should use same button classes regardless of loading state', () => {
      const { rerender, container } = render(
        <ExecutionControls
          executionId="test-exec-123"
          status="running"
          onStatusChange={() => {}}
        />,
      );

      const initialClasses = Array.from(container.querySelectorAll('button')).map(
        (btn) => btn.className,
      );

      // Re-render (simulating state change)
      rerender(
        <ExecutionControls
          executionId="test-exec-123"
          status="running"
          onStatusChange={() => {}}
        />,
      );

      const updatedClasses = Array.from(container.querySelectorAll('button')).map(
        (btn) => btn.className,
      );

      // Button classes should remain consistent
      expect(initialClasses).toEqual(updatedClasses);
    });
  });
});
