import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * ThemeToggle Component
 *
 * A Langflow-inspired theme toggle button that switches between light and dark modes.
 * Features smooth transitions, icon swapping, and accessible controls.
 *
 * Design specifications:
 * - 40px square button with rounded corners (rounded-lg)
 * - Glassmorphic background with hover effects
 * - Lucide React icons (Sun/Moon) that swap based on theme
 * - Smooth transitions using CSS custom properties
 * - Accessible with proper ARIA labels
 * - Matches Langflow's icon button style
 *
 * @returns A themed toggle button component
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
        group relative
        w-10 h-10
        flex items-center justify-center
        rounded-lg
        transition-all duration-200
        bg-white/5 hover:bg-white/10
        border border-white/10 hover:border-white/20
        backdrop-blur-sm
        focus:outline-none focus:ring-2 focus:ring-accent-primary/50
      "
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      type="button"
    >
      {/* Icon with smooth transition */}
      <div className="relative w-5 h-5">
        {/* Sun icon (light mode) */}
        <Sun
          className={`
            absolute inset-0 w-5 h-5
            transition-all duration-300
            ${
              theme === 'light'
                ? 'opacity-100 rotate-0 scale-100'
                : 'opacity-0 rotate-90 scale-0'
            }
          `}
          style={{
            color: 'var(--text-secondary)',
          }}
        />

        {/* Moon icon (dark mode) */}
        <Moon
          className={`
            absolute inset-0 w-5 h-5
            transition-all duration-300
            ${
              theme === 'dark'
                ? 'opacity-100 rotate-0 scale-100'
                : 'opacity-0 -rotate-90 scale-0'
            }
          `}
          style={{
            color: 'var(--text-secondary)',
          }}
        />
      </div>

      {/* Hover effect overlay */}
      <div
        className="
          absolute inset-0 rounded-lg
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
          pointer-events-none
        "
        style={{
          background:
            'radial-gradient(circle at center, rgba(124, 58, 237, 0.1) 0%, transparent 70%)',
        }}
      />
    </button>
  );
}
