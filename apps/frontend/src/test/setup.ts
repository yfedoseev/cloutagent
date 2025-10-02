import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Setup mocks globally
(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock ResizeObserver
  (global as any).ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock IntersectionObserver
  (global as any).IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock DOMRect
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    bottom: 600,
    right: 800,
    x: 0,
    y: 0,
    toJSON: () => {},
  }));

  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock CSS custom properties from index.css
  // This ensures CSS variables are available in jsdom environment
  const style = document.createElement('style');
  style.textContent = `
    :root {
      /* PRIMARY ACCENT - Coral */
      --accent-primary: #FF6D5A;
      --accent-primary-hover: #E85D4A;
      --accent-primary-active: #D54D3A;

      /* FUNCTIONAL COLORS */
      --color-success: #10B981;
      --color-warning: #F59E0B;
      --color-error: #EF4444;
      --color-info: #3B82F6;

      /* GLASS SURFACES */
      --glass-bg: rgba(255, 255, 255, 0.05);
      --glass-bg-strong: rgba(255, 255, 255, 0.08);
      --glass-border: rgba(255, 255, 255, 0.1);
      --glass-hover: rgba(255, 255, 255, 0.08);

      /* TEXT HIERARCHY */
      --text-primary: rgba(255, 255, 255, 0.95);
      --text-secondary: rgba(255, 255, 255, 0.60);
      --text-tertiary: rgba(255, 255, 255, 0.40);
      --text-disabled: rgba(255, 255, 255, 0.25);

      /* BACKGROUNDS */
      --bg-canvas: #0F0F0F;
      --bg-panel: rgba(26, 26, 26, 0.95);
      --bg-card: #1A1A1A;
      --bg-hover: #2A2A2A;

      /* ANIMATION CURVES */
      --ease-ios: cubic-bezier(0.25, 0.1, 0.25, 1);
    }

    /* Button utility classes for testing */
    /* Note: CSS variables expanded for jsdom compatibility */
    .btn-primary-coral {
      border-radius: 12px;
      padding-left: 16px;
      padding-right: 16px;
      padding-top: 8px;
      padding-bottom: 8px;
      transition-property: all;
      transition-duration: 200ms;
      background: linear-gradient(135deg, #FF6D5A 0%, #E85D4A 100%);
      color: white;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(255, 109, 90, 0.25);
      transition-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
    }

    .btn-glass {
      border-radius: 12px;
      padding-left: 16px;
      padding-right: 16px;
      padding-top: 8px;
      padding-bottom: 8px;
      transition-property: all;
      transition-duration: 200ms;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.95);
      font-size: 13px;
      font-weight: 500;
      transition-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
    }

    .btn-ghost {
      border-radius: 12px;
      padding-left: 16px;
      padding-right: 16px;
      padding-top: 8px;
      padding-bottom: 8px;
      transition-property: all;
      transition-duration: 200ms;
      background: transparent;
      color: rgba(255, 255, 255, 0.60);
      font-size: 13px;
      font-weight: 500;
      border: 1px solid transparent;
      transition-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
    }

    .btn-destructive {
      border-radius: 12px;
      padding-left: 16px;
      padding-right: 16px;
      padding-top: 8px;
      padding-bottom: 8px;
      transition-property: all;
      transition-duration: 200ms;
      background: transparent;
      color: rgba(239, 68, 68, 0.6);
      font-size: 13px;
      font-weight: 500;
      border: 1px solid transparent;
      transition-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
    }
  `;
  document.head.appendChild(style);
})();

// Cleanup after each test
afterEach(() => {
  cleanup();
});
