# CloutAgent Design System Documentation

**Last Updated:** 2025-10-02
**Version:** 1.0
**Status:** Production-Ready

## Design Philosophy

CloutAgent follows a **professional, minimal design system** inspired by industry leaders like n8n and Apple. The core principles are:

1. **ONE Primary Accent** - Warm coral (#FF6D5A) for all primary actions
2. **Glassmorphism** - Backdrop blur effects with semi-transparent surfaces
3. **Consistent Typography** - SF Pro-inspired font system with precise sizes
4. **Professional Icons** - Lucide React SVG icons throughout
5. **Clear Hierarchy** - Visual importance through opacity and color, not decoration

---

## Color System

### Primary Accent (Coral)
Use **ONLY** for the most important action per screen.

```css
--accent-primary: #FF6D5A;
--accent-primary-hover: #E85D4A;
--accent-primary-active: #D54D3A;
```

**Examples:** Run Workflow, Create Project, Submit Form, Deploy

### Functional Colors
Use **ONLY** for specific semantic meanings, NOT decoration.

```css
--color-success: #10B981;   /* Connections, success states */
--color-warning: #F59E0B;   /* Warnings only */
--color-error: #EF4444;     /* Errors only */
--color-info: #3B82F6;      /* Info states only */
```

### Glass Surfaces

```css
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-bg-strong: rgba(255, 255, 255, 0.08);
--glass-border: rgba(255, 255, 255, 0.1);
--glass-hover: rgba(255, 255, 255, 0.08);
```

**Usage:**
```tsx
<div className="glass backdrop-blur-xl">
  {/* Glassmorphic surface */}
</div>
```

### Text Hierarchy
Use **opacity** for hierarchy, not color.

```css
--text-primary: rgba(255, 255, 255, 0.95);    /* Main content */
--text-secondary: rgba(255, 255, 255, 0.60);  /* Supporting text */
--text-tertiary: rgba(255, 255, 255, 0.40);   /* De-emphasized text */
--text-disabled: rgba(255, 255, 255, 0.25);   /* Disabled state */
```

### Backgrounds

```css
--bg-canvas: #0F0F0F;           /* Darker for better contrast */
--bg-panel: rgba(26, 26, 26, 0.95);
--bg-card: #1A1A1A;
--bg-hover: #2A2A2A;
```

---

## Button System

### 1. Primary Button (Coral) - Highest Visual Weight
**Use for:** The ONE most important action per screen.

```tsx
<button className="btn-primary-coral">
  Run Workflow
</button>
```

**Properties:**
- Background: Coral gradient with glow shadow
- Font: 13px (--font-size-sm), medium weight
- Radius: 14px (--radius-xl)
- Hover: Lifts with stronger glow

**Examples:** Run Workflow, Create Project, Submit, Deploy

---

### 2. Secondary Button (Glass) - Medium Visual Weight
**Use for:** Important but not primary actions.

```tsx
<button className="btn-glass">
  Save Changes
</button>
```

**Properties:**
- Background: Glassmorphic with backdrop blur
- Font: 13px (--font-size-sm), medium weight
- Radius: 14px (--radius-xl)
- Hover: Subtle lift with border glow

**Examples:** Save, Cancel, Settings, Export

---

### 3. Tertiary Button (Ghost) - Low Visual Weight
**Use for:** Less important, supplementary actions.

```tsx
<button className="btn-ghost">
  View Details
</button>
```

**Properties:**
- Background: Transparent
- Font: 13px (--font-size-sm), medium weight
- Color: Secondary text (60% opacity)
- Hover: Subtle background appears

**Examples:** View, History, Details, Learn More

---

### 4. Destructive Button - Requires Confirmation
**Use for:** Dangerous actions that need extra thought.

```tsx
<button className="btn-destructive">
  Delete Project
</button>
```

**Properties:**
- Background: Transparent
- Font: 13px (--font-size-sm), medium weight
- Color: Red with low opacity (60%)
- Hover: Red background appears

**Examples:** Delete, Clear, Remove, Reset

---

## Typography Scale

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display',
             'SF Pro Text', Inter, system-ui, sans-serif;
```

### Size Scale

```css
--font-size-xs: 0.6875rem;    /* 11px - Tiny labels, metadata */
--font-size-sm: 0.8125rem;    /* 13px - Small text, captions */
--font-size-base: 0.9375rem;  /* 15px - Body text, default */
--font-size-lg: 1.0625rem;    /* 17px - Emphasized body */
--font-size-xl: 1.25rem;      /* 20px - Subheadings */
--font-size-2xl: 1.5rem;      /* 24px - Section headings */
--font-size-3xl: 1.875rem;    /* 30px - Page titles */
--font-size-4xl: 2.25rem;     /* 36px - Large display */
```

### Usage Examples

```tsx
{/* Page Title */}
<h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-semibold)' }}>
  Project Dashboard
</h1>

{/* Section Heading */}
<h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-medium)' }}>
  Recent Workflows
</h2>

{/* Emphasized Text */}
<p style={{ fontSize: 'var(--font-size-lg)', letterSpacing: 'var(--letter-spacing-tight)' }}>
  Important notice
</p>

{/* Body Text */}
<p style={{ fontSize: 'var(--font-size-base)' }}>
  Regular paragraph content
</p>

{/* Small Text */}
<span style={{ fontSize: 'var(--font-size-sm)' }}>
  Caption or label
</span>

{/* Tiny Metadata */}
<span style={{ fontSize: 'var(--font-size-xs)' }}>
  Last updated 2 hours ago
</span>
```

### Font Weights

```css
--font-weight-regular: 400;   /* Body text */
--font-weight-medium: 500;    /* Emphasized text, buttons */
--font-weight-semibold: 600;  /* Headings */
--font-weight-bold: 700;      /* Strong emphasis */
```

### Line Heights

```css
--line-height-tight: 1.25;    /* Headings */
--line-height-normal: 1.5;    /* Body text */
--line-height-relaxed: 1.75;  /* Long-form content */
```

### Letter Spacing

```css
--letter-spacing-tight: -0.01em;   /* Headings, emphasized */
--letter-spacing-normal: 0;        /* Body text */
--letter-spacing-wide: 0.025em;    /* All caps, labels */
```

---

## Border Radius

```css
--radius-sm: 0.375rem;    /* 6px - Small elements, badges */
--radius-md: 0.5rem;      /* 8px - Default, inputs, small cards */
--radius-lg: 0.75rem;     /* 12px - Cards, panels (MOST COMMON) */
--radius-xl: 0.875rem;    /* 14px - Buttons, larger cards */
--radius-2xl: 1rem;       /* 16px - Large panels, modals */
--radius-3xl: 1.5rem;     /* 24px - Extra large surfaces */
--radius-full: 9999px;    /* Circular elements, pills */
```

### Usage Guidelines

```tsx
{/* Buttons - Use xl */}
<button style={{ borderRadius: 'var(--radius-xl)' }}>Click me</button>

{/* Cards & Panels - Use lg */}
<div style={{ borderRadius: 'var(--radius-lg)' }}>Card content</div>

{/* Large Modals - Use 2xl */}
<div style={{ borderRadius: 'var(--radius-2xl)' }}>Modal content</div>

{/* Status Badges - Use sm */}
<span style={{ borderRadius: 'var(--radius-sm)' }}>Active</span>

{/* Avatar/Circular - Use full */}
<div style={{ borderRadius: 'var(--radius-full)' }}>JS</div>
```

---

## Icon System

### Lucide React Icons
All icons use **Lucide React** - professional, consistent SVG icons.

### Installation
```bash
pnpm add lucide-react
```

### Common Icons Reference

```tsx
import {
  Bot,          // Agent/AI
  Users,        // Subagents/Teams
  Webhook,      // Hooks/Events
  Plug,         // MCP/Integrations
  Palette,      // Frontend/Design
  Settings,     // Backend/Configuration
  Database,     // Data/Storage
  CheckCircle2, // Success
  XCircle,      // Error
  AlertTriangle,// Warning
  Clock,        // Time/Duration
  Play,         // Execute/Run
  Loader2,      // Loading (with animate-spin)
} from 'lucide-react';
```

### Usage Patterns

```tsx
{/* With Text */}
<button className="btn-primary-coral inline-flex items-center gap-2">
  <Play className="w-4 h-4" />
  <span>Run Workflow</span>
</button>

{/* Status Indicator */}
<div className="flex items-center gap-2">
  <CheckCircle2 className="w-5 h-5 text-green-400" />
  <span>Completed</span>
</div>

{/* Loading State */}
<Loader2 className="w-5 h-5 animate-spin" />

{/* With aria-label for accessibility */}
<Bot className="w-6 h-6" aria-label="AI Agent icon" />
```

### Icon Sizes
- `w-3 h-3` (12px) - Inline with small text
- `w-4 h-4` (16px) - Buttons, inline with normal text
- `w-5 h-5` (20px) - Status indicators, emphasized icons
- `w-6 h-6` (24px) - Node headers, large UI elements

---

## Spacing System

CloutAgent uses **Tailwind's default spacing scale** with consistent patterns.

### Common Patterns

**Gaps (between elements):**
- `gap-1` (4px) - Tight spacing (icons + text)
- `gap-2` (8px) - Default spacing (most common)
- `gap-3` (12px) - Medium spacing
- `gap-4` (16px) - Larger spacing (sections)

**Padding:**
- `p-2` (8px) - Compact components
- `p-3` (12px) - Default cards
- `p-4` (16px) - Standard panels (most common)
- `p-6` (24px) - Large panels, modals

**Margins:**
- `mb-1` (4px) - Tight vertical spacing
- `mb-2` (8px) - Default vertical spacing
- `mb-4` (16px) - Section spacing
- `mb-6` (24px) - Large section spacing

### Usage Example

```tsx
{/* Panel with standard spacing */}
<div className="glass p-4 rounded-lg">
  <div className="mb-4">
    <h3 className="mb-2">Section Title</h3>
    <p className="text-gray-400">Description text</p>
  </div>

  <div className="space-y-2">
    {/* Vertical stack with consistent 8px gaps */}
    <div>Item 1</div>
    <div>Item 2</div>
  </div>
</div>
```

---

## Animation & Transitions

### Easing Functions

```css
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);  /* Bouncy */
--ease-ios: cubic-bezier(0.25, 0.1, 0.25, 1);           /* Smooth */
--ease-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);          /* Material */
```

### Common Animations

**Button Hover:**
```tsx
<button className="transition-all duration-200 hover:scale-[1.02]"
        style={{ transitionTimingFunction: 'var(--ease-ios)' }}>
  Hover me
</button>
```

**Card Hover:**
```tsx
<div className="transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1"
     style={{ transitionTimingFunction: 'var(--ease-ios)' }}>
  Card content
</div>
```

**Loading Spinner:**
```tsx
<Loader2 className="w-5 h-5 animate-spin" />
```

**Pulse (Running Status):**
```tsx
<div className="animate-pulse">Processing...</div>
```

---

## Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.12);
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.18), 0 8px 32px rgba(0, 0, 0, 0.15);
--shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.24), 0 16px 48px rgba(0, 0, 0, 0.16);
```

**Usage:**
```tsx
<div className="elevated-md">Subtle elevation</div>
<div className="elevated-xl">Strong elevation</div>
```

---

## Component Guidelines

### Node Cards

```tsx
<div className="px-4 py-3 rounded-lg border-2 border-gray-700
                bg-gradient-to-br from-blue-900 to-blue-800
                hover:shadow-xl transition-all duration-200">
  <div className="flex items-center gap-2 mb-2">
    <Bot className="w-6 h-6 text-blue-300" />
    <div>
      <div className="font-semibold text-white text-sm">Node Name</div>
      <div className="text-xs text-blue-200">Agent Type</div>
    </div>
  </div>
  {/* Content */}
</div>
```

### Status Badges

```tsx
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                bg-green-900/30 border border-green-700">
  <CheckCircle2 className="w-4 h-4 text-green-400" />
  <span className="text-sm text-green-300">Completed</span>
</div>
```

### Form Inputs

```tsx
<input
  type="text"
  className="w-full px-3 py-2 bg-gray-900 border border-gray-700
             rounded-lg text-white focus:border-blue-500 focus:ring-1
             focus:ring-blue-500 transition-colors"
  style={{ fontSize: 'var(--font-size-sm)' }}
/>
```

---

## Accessibility

### Icon Labels
Always provide `aria-label` for standalone icons:

```tsx
<Bot className="w-6 h-6" aria-label="AI Agent icon" />
```

### Focus States
Use `.focus-ring` utility or custom focus styles:

```tsx
<button className="btn-primary-coral focus:ring-2 focus:ring-blue-500/50">
  Click me
</button>
```

### Color Contrast
All text meets WCAG AA standards:
- Primary text: 95% opacity on dark background
- Secondary text: 60% opacity minimum
- Disabled text: 25% opacity (not for critical info)

---

## Migration Guide

### Replacing Hardcoded Values

**Before:**
```tsx
<h1 className="text-2xl font-semibold">Title</h1>
<button className="rounded-xl px-4 py-2">Click</button>
<div className="rounded-lg p-4">Card</div>
```

**After:**
```tsx
<h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)' }}>
  Title
</h1>
<button className="btn-primary-coral">Click</button>
<div className="glass p-4" style={{ borderRadius: 'var(--radius-lg)' }}>Card</div>
```

### Replacing Emojis

**Before:**
```tsx
const icon = '🤖';
<span>{icon} Agent</span>
```

**After:**
```tsx
import { Bot } from 'lucide-react';
<div className="inline-flex items-center gap-2">
  <Bot className="w-5 h-5" />
  <span>Agent</span>
</div>
```

---

## Quick Reference

### Most Common Patterns

```tsx
// Primary Action Button
<button className="btn-primary-coral inline-flex items-center gap-2">
  <Play className="w-4 h-4" />
  <span>Run Workflow</span>
</button>

// Glass Panel
<div className="glass p-4 backdrop-blur-xl" style={{ borderRadius: 'var(--radius-lg)' }}>
  Content
</div>

// Section Heading
<h2 style={{
  fontSize: 'var(--font-size-2xl)',
  fontWeight: 'var(--font-weight-semibold)',
  letterSpacing: 'var(--letter-spacing-tight)'
}}>
  Section Title
</h2>

// Status Indicator
<div className="flex items-center gap-2">
  <CheckCircle2 className="w-5 h-5 text-green-400" />
  <span style={{ fontSize: 'var(--font-size-sm)' }}>Completed</span>
</div>
```

---

## Resources

- **Lucide Icons:** https://lucide.dev/icons
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Design Variables:** `/apps/frontend/src/index.css`
- **Button System:** Lines 165-290 in `index.css`

---

## Support

For questions or design system updates, see:
- **GitHub Issues:** Report design inconsistencies
- **Component Examples:** Reference existing components in `/apps/frontend/src/components/`
- **Update Process:** All changes to design tokens must update this documentation
