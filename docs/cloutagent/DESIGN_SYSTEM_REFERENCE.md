# CloutAgent Design System Reference

## Quick Reference Guide

This document serves as a quick reference for developers implementing new features using the Apple-inspired design system.

---

## 🎨 Color Tokens

### CSS Variables (Use These in Custom CSS)
```css
/* Backgrounds */
--color-bg-primary: #0a0a0a
--color-bg-secondary: #141414
--color-bg-tertiary: #1a1a1a

/* Glass Surfaces */
--color-glass-bg: rgba(255, 255, 255, 0.05)
--color-glass-border: rgba(255, 255, 255, 0.1)
--color-glass-hover: rgba(255, 255, 255, 0.08)

/* Text */
--color-text-primary: rgba(255, 255, 255, 0.95)
--color-text-secondary: rgba(255, 255, 255, 0.6)
--color-text-tertiary: rgba(255, 255, 255, 0.4)

/* Accent */
--color-accent: #007AFF
--color-accent-hover: #0051D5
```

### Tailwind Classes (Use These in JSX)
```tsx
/* Apple Blue Palette */
<div className="bg-apple-blue-500">      // #007AFF
<div className="text-apple-blue">        // Same as 500
<div className="border-apple-blue-600">  // #0051D5

/* SF Gray Palette */
<div className="bg-sf-gray-950">  // #0A0A0A (darkest)
<div className="bg-sf-gray-900">  // #141414
<div className="bg-sf-gray-850">  // #1C1C1E (special variant)
<div className="bg-sf-gray-800">  // #2C2C2E
<div className="text-sf-gray-400"> // #86868B

/* Text Opacity Utilities */
<p className="text-white/95">  // Primary text
<p className="text-white/60">  // Secondary text
<p className="text-white/40">  // Tertiary text
```

---

## 📦 Component Classes

### Glass Effects
```tsx
/* Standard glass (20px blur) */
<div className="glass rounded-2xl p-6">

/* Strong glass (40px blur) */
<div className="glass-strong rounded-2xl p-6">

/* Glass card with hover effect */
<div className="card-glass">
  {/* Includes hover: translateY(-4px) scale(1.01) + shadow */}
</div>
```

### Buttons
```tsx
/* Primary Gradient Button */
<button className="btn-primary">
  Click Me
</button>

/* Glass Button */
<button className="btn-glass">
  Click Me
</button>

/* Full Implementation Examples */
<button className="btn-primary flex items-center gap-2 px-6 py-3">
  <Icon size={20} />
  <span>Action</span>
</button>

<button className="btn-glass text-white/90 hover:text-white font-medium">
  Secondary Action
</button>
```

### Elevation (Shadows)
```tsx
<div className="elevated-sm">    // Subtle lift
<div className="elevated-md">    // Standard cards
<div className="elevated-lg">    // Important panels
<div className="elevated-xl">    // Floating elements

/* Tailwind shadow utilities */
<div className="shadow-apple-sm">
<div className="shadow-apple-md">
<div className="shadow-apple-lg">
<div className="shadow-apple-xl">
<div className="shadow-apple-button">        // For blue buttons
<div className="shadow-apple-button-hover">  // On hover
```

---

## 🎭 Animation & Transitions

### Timing Functions
```tsx
/* Use these for smooth, iOS-like animations */
<div className="transition-all duration-200 ease-ios">
<div className="transition-transform duration-300 ease-spring">
<div className="transition-opacity ease-smooth">
```

### Pre-built Animations
```tsx
<div className="animate-float">       // Gentle floating motion
<div className="animate-pulse-soft">  // Subtle pulse
<div className="animate-shimmer">     // Shimmer effect
```

### Common Hover Patterns
```tsx
/* Lift on Hover */
<div className="transition-all duration-200 hover:-translate-y-1 hover:shadow-apple-md">

/* Scale on Hover */
<div className="transition-transform duration-200 hover:scale-105">

/* Icon Animation in Button */
<button className="group">
  <span className="transition-transform group-hover:scale-110">🚀</span>
  <span>Launch</span>
</button>

/* Arrow Slide Animation */
<button className="group">
  <span className="transition-transform group-hover:-translate-x-1">←</span>
  <span>Back</span>
</button>
```

---

## 📝 Typography

### Font Stack
```css
/* SF Pro-like stack (already applied to body) */
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', Inter, system-ui, sans-serif;

/* For code/monospace */
font-family: 'SF Mono', 'JetBrains Mono', Menlo, monospace;
```

### Typography Scale
```tsx
/* Headings */
<h1 className="text-4xl font-semibold tracking-tight text-white/95">
  Page Title
</h1>

<h2 className="text-3xl font-semibold text-white/90 tracking-tight">
  Section Header
</h2>

<h3 className="text-2xl font-semibold text-white/90 tracking-tight">
  Subsection
</h3>

<h4 className="text-xl font-semibold text-white/90 tracking-tight">
  Card Title
</h4>

/* Body Text */
<p className="text-base text-white/90">
  Primary body text
</p>

<p className="text-sm text-white/60">
  Secondary text or descriptions
</p>

<p className="text-xs text-white/50">
  Metadata, labels, timestamps
</p>

/* Monospace/Code */
<code className="font-mono text-xs tracking-tight">
  model-name
</code>
```

### Letter Spacing
```tsx
<h1 className="tracking-tighter">  // -0.04em
<h2 className="tracking-tight">    // -0.02em
<p className="tracking-normal">    // 0em (default)
```

---

## 🎯 Layout Patterns

### Container
```tsx
<div className="max-w-7xl mx-auto px-8">
  {/* Content */}
</div>
```

### Grid Layouts
```tsx
/* Responsive Grid */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <div key={item.id} className="card-glass">
      {/* Card content */}
    </div>
  ))}
</div>
```

### Flex Patterns
```tsx
/* Header with Actions */
<div className="flex items-center justify-between mb-10">
  <h1 className="text-4xl font-semibold tracking-tight text-white/95">
    Title
  </h1>
  <button className="btn-primary">
    Action
  </button>
</div>

/* Icon with Text */
<div className="flex items-center gap-2 text-white/50">
  <Icon size={14} className="flex-shrink-0" />
  <span className="text-xs">Label</span>
</div>
```

---

## 🎪 Common Components

### Glassmorphic Card
```tsx
<div className="card-glass cursor-pointer group focus-ring">
  <div className="flex items-start justify-between mb-4">
    <h3 className="text-xl font-semibold text-white/90 group-hover:text-apple-blue transition-colors tracking-tight">
      Card Title
    </h3>
    <div className="glass rounded-lg p-2 group-hover:bg-apple-blue/20 transition-colors">
      <Icon size={18} className="text-white/40 group-hover:text-apple-blue transition-colors" />
    </div>
  </div>

  <p className="text-white/60 text-sm mb-5 leading-relaxed">
    Description text goes here...
  </p>

  <div className="pt-5 border-t border-white/10">
    <div className="flex items-center justify-between text-xs font-medium text-white/50">
      <span>Info 1</span>
      <span>Info 2</span>
      <span>Info 3</span>
    </div>
  </div>
</div>
```

### Navigation Bar
```tsx
<div className="glass-strong sticky top-0 z-50 px-6 py-3 border-b border-white/10">
  <div className="flex items-center justify-between">
    <button className="btn-glass flex items-center gap-2 group">
      <span className="transition-transform group-hover:-translate-x-1">←</span>
      <span>Back</span>
    </button>

    <div className="flex items-center gap-3">
      <button className="btn-primary">
        Primary Action
      </button>

      <div className="glass rounded-xl px-4 py-2">
        <div className="text-white/90 font-semibold text-sm tracking-tight">
          Status Info
        </div>
      </div>
    </div>
  </div>
</div>
```

### Empty State
```tsx
<div className="text-center py-20">
  <div className="glass-strong inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-6 animate-float">
    <Icon size={48} className="text-white/40" />
  </div>

  <h2 className="text-3xl font-semibold text-white/90 mb-3 tracking-tight">
    No Items Found
  </h2>

  <p className="text-white/50 mb-8 text-lg max-w-md mx-auto">
    Description of what to do next
  </p>

  <button className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-lg">
    <Icon size={24} />
    <span>Create New</span>
  </button>
</div>
```

### Error State
```tsx
<div className="glass-strong rounded-2xl p-8 text-center max-w-2xl mx-auto border border-red-500/20">
  <div className="text-red-400 text-2xl font-semibold mb-3 tracking-tight">
    Error Title
  </div>

  <div className="text-red-300/80 mb-6 text-sm">
    {errorMessage}
  </div>

  <button
    onClick={retry}
    className="inline-flex items-center gap-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl font-medium transition-all duration-200 hover:-translate-y-0.5 border border-red-500/30 hover:border-red-500/50"
  >
    <RefreshCw size={16} />
    <span>Retry</span>
  </button>
</div>
```

### Loading Skeleton
```tsx
<div className="glass rounded-2xl p-6 animate-pulse-soft">
  <div className="h-6 bg-white/10 rounded-lg w-3/4 mb-4"></div>
  <div className="h-4 bg-white/5 rounded-lg w-full mb-2"></div>
  <div className="h-4 bg-white/5 rounded-lg w-2/3"></div>
</div>
```

---

## 🔍 Focus States

### Accessible Focus Ring
```tsx
/* Pre-built class */
<button className="focus-ring">
  Button
</button>

/* Manual implementation */
<div className="focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-transparent">
  Content
</div>
```

---

## 🌈 Gradient Utilities

### Background Gradients
```tsx
<div className="bg-gradient-apple">      // Blue gradient
<div className="bg-gradient-glass">      // Subtle white gradient
<div className="bg-gradient-radial">     // Radial blue overlay

/* Custom gradients */
<div className="bg-gradient-to-b from-slate-950 to-zinc-900">
<div className="bg-gradient-to-r from-apple-blue-600 to-apple-blue-700">
```

### Text Gradients
```tsx
<h1 className="text-gradient-blue">
  Gradient Text
</h1>

/* Custom implementation */
<h1 className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
  Custom Gradient
</h1>
```

---

## 📐 Spacing Scale

### Consistent Spacing
```tsx
/* Use these values for consistency */
gap-2   // 0.5rem (8px)
gap-3   // 0.75rem (12px)
gap-4   // 1rem (16px)
gap-6   // 1.5rem (24px)
gap-8   // 2rem (32px)

/* Component spacing */
mb-3    // 0.75rem (12px) - tight
mb-4    // 1rem (16px) - default
mb-5    // 1.25rem (20px) - relaxed
mb-6    // 1.5rem (24px) - sections
mb-8    // 2rem (32px) - major sections
mb-10   // 2.5rem (40px) - page sections

/* Padding */
p-4     // 1rem (16px) - tight
p-6     // 1.5rem (24px) - standard
p-8     // 2rem (32px) - generous
```

---

## 🎬 Border Radius Scale

```tsx
rounded-lg    // 0.5rem (8px) - small elements
rounded-xl    // 0.75rem (12px) - buttons, badges
rounded-2xl   // 1rem (16px) - cards
rounded-3xl   // 1.5rem (24px) - large containers
```

---

## 📱 Responsive Design

### Breakpoints
```tsx
/* Mobile First Approach */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  // 1 column mobile, 2 tablet, 3 desktop
</div>

<div className="text-2xl md:text-3xl lg:text-4xl">
  // Responsive text
</div>

<div className="px-4 md:px-6 lg:px-8">
  // Responsive padding
</div>
```

### Touch Targets
```tsx
/* Ensure minimum 44x44px for mobile */
<button className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center">
  <Icon size={20} />
</button>
```

---

## 🛠 Utility Combinations

### Interactive Card (Complete)
```tsx
<div className="card-glass cursor-pointer group focus-ring">
  {/* Full glassmorphic card with all interactions */}
</div>
```

### Premium Button (Complete)
```tsx
<button className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-base font-semibold shadow-apple-button hover:shadow-apple-button-hover transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0">
  <Icon size={20} />
  <span>Click Me</span>
</button>
```

### Sticky Header (Complete)
```tsx
<header className="glass-strong sticky top-0 z-50 px-6 py-4 border-b border-white/10">
  {/* Navigation content */}
</header>
```

---

## 🎨 Design Principles

### Visual Hierarchy
1. **Size**: Larger = More important
2. **Weight**: Bolder = More emphasis
3. **Opacity**: Higher = More prominent (95% → 60% → 40%)
4. **Elevation**: Higher shadow = More important
5. **Color**: Accent color = Primary action

### Consistency Guidelines
- Always use `tracking-tight` on headings
- Use `font-semibold` for titles, `font-medium` for emphasis
- Maintain 60% opacity for secondary text
- Keep gaps consistent (2, 3, 4, 6, 8 scale)
- Always include focus states on interactive elements
- Use `group` for coordinated hover effects

### Accessibility Checklist
- [ ] Focus visible on all interactive elements
- [ ] Minimum 4.5:1 contrast ratio for text
- [ ] Touch targets minimum 44x44px
- [ ] Semantic HTML (buttons, headings, etc.)
- [ ] ARIA labels where needed
- [ ] Keyboard navigation support

---

## 🚀 Quick Start Template

```tsx
import { useState } from 'react';
import { Plus, Icon } from 'lucide-react';

export function MyComponent() {
  const [items, setItems] = useState([]);

  return (
    <div className="min-h-screen text-white p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-semibold tracking-tight text-white/95">
            Page Title
          </h1>
          <button className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            <span>Create New</span>
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="card-glass cursor-pointer group">
              {/* Card content */}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
```

---

## 📚 Resources

### Files to Reference
- `/apps/frontend/src/index.css` - All custom utilities and design tokens
- `/apps/frontend/tailwind.config.js` - Theme extensions and colors
- `/apps/frontend/src/components/ProjectList.tsx` - Complete implementation example

### Design Tokens Location
```
CSS Variables: apps/frontend/src/index.css (lines 15-43)
Utility Classes: apps/frontend/src/index.css (lines 67-203)
Tailwind Theme: apps/frontend/tailwind.config.js (lines 6-117)
```

---

## 🔧 Troubleshooting

### Blur Not Working?
- Check browser support (Chrome 92+, Safari 15.4+)
- Ensure `-webkit-backdrop-filter` is included
- Verify element has `overflow: visible` ancestor

### Animations Janky?
- Use only `transform` and `opacity` for animations
- Add `will-change` for frequently animated elements
- Check if `transition-all` is causing performance issues

### Focus Ring Not Visible?
- Ensure `focus-ring` class is applied
- Check for `outline: none` overrides
- Verify `focus-visible` polyfill if needed

### Colors Look Washed Out?
- Increase blur saturation: `saturate(180%)` or `saturate(200%)`
- Adjust background opacity (5-8% range)
- Use stronger glass variant (`glass-strong`)

---

**Last Updated**: 2025-10-01
**Version**: 1.0
**Maintainer**: CloutAgent Design Team
