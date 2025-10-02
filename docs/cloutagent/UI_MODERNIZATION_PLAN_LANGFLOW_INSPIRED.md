# CloutAgent UI Modernization Plan
## Inspired by Langflow Design System

**Date:** 2025-10-02
**Version:** 1.0
**Reference:** Langflow UI Analysis

---

## Executive Summary

This document outlines a comprehensive UI modernization plan for CloutAgent, inspired by the professional design system used in Langflow. The goal is to create a modern, intuitive, and visually consistent interface that matches industry-leading standards.

---

## 1. Design Philosophy

### Current State (CloutAgent)
- n8n-inspired coral accent (#FF6D5A)
- Glassmorphic dark theme
- Basic component hierarchy
- Limited navigation structure

### Target State (Langflow-Inspired)
- **Professional minimalism** - Clean, focused interface
- **White/light primary surfaces** - Better readability and modern feel
- **Strategic color usage** - Purposeful accent colors for actions
- **Component-based architecture** - Reusable, consistent UI elements
- **Three-panel layout** - Sidebar, Canvas, Properties

---

## 2. Layout & Structure

### 2.1 Application Shell

```
┌─────────────────────────────────────────────────────────┐
│  Header: Logo | Breadcrumbs | User Menu                │
├──────┬──────────────────────────────────────────┬───────┤
│      │                                          │       │
│ Side │          Main Canvas Area                │ Props │
│ bar  │                                          │ Panel │
│      │                                          │       │
│ Nav  │                                          │ (opt) │
│      │                                          │       │
└──────┴──────────────────────────────────────────┴───────┘
```

**Implementation:**
- **Left Sidebar:** 60-80px collapsed, 240-280px expanded
- **Main Canvas:** Flexible, minimum 800px
- **Right Panel:** 320-400px (collapsible)
- **Header:** Fixed 60-64px height

### 2.2 Navigation Patterns

**Primary Navigation (Left Sidebar)**
```tsx
- 📊 Projects (with project switcher)
- 🎨 Flows/Canvas
- 🔌 MCP Servers
- 📦 Components Library
- 🧪 Playground/Testing
- ⚙️ Settings
```

**Breadcrumb Navigation**
```tsx
Project Name / Flow Name / View Mode
```

---

## 3. Color System

### 3.1 Base Colors

```css
/* === PRIMARY BACKGROUNDS === */
--bg-primary: #FFFFFF;           /* Main surfaces */
--bg-secondary: #F9FAFB;         /* Secondary surfaces */
--bg-tertiary: #F3F4F6;          /* Tertiary surfaces */
--bg-canvas: #FAFAFA;            /* Canvas background */

/* === BORDERS === */
--border-primary: #E5E7EB;       /* Default borders */
--border-secondary: #D1D5DB;     /* Emphasized borders */
--border-hover: #9CA3AF;         /* Hover state borders */

/* === TEXT === */
--text-primary: #111827;         /* Primary text */
--text-secondary: #6B7280;       /* Secondary text */
--text-tertiary: #9CA3AF;        /* Tertiary/disabled text */
```

### 3.2 Accent Colors

```css
/* === PRIMARY ACCENT (Purple/Blue like Langflow) === */
--accent-primary: #7C3AED;       /* Primary actions */
--accent-primary-hover: #6D28D9; /* Hover state */
--accent-primary-active: #5B21B6;/* Active state */

/* === SECONDARY ACCENT === */
--accent-secondary: #3B82F6;     /* Secondary actions */
--accent-secondary-hover: #2563EB;

/* === SEMANTIC COLORS === */
--success: #10B981;              /* Success states */
--warning: #F59E0B;              /* Warnings */
--error: #EF4444;                /* Errors */
--info: #3B82F6;                 /* Info states */
```

### 3.3 Node Type Colors

```css
/* Specific colors for different node types */
--node-agent: #7C3AED;           /* Purple */
--node-subagent: #EC4899;        /* Pink */
--node-hook: #10B981;            /* Green */
--node-mcp: #F59E0B;             /* Orange */
--node-input: #3B82F6;           /* Blue */
--node-output: #8B5CF6;          /* Violet */
```

### 3.4 Dark Mode Colors

**Analyzed from Langflow Dark Theme**

```css
/* === DARK MODE BACKGROUNDS === */
[data-theme="dark"] {
  --bg-primary: #0A0A0A;           /* Main background - almost black */
  --bg-secondary: #18181B;         /* Sidebar, cards */
  --bg-tertiary: #27272A;          /* Canvas, elevated surfaces */
  --bg-canvas: #2A2A2A;            /* Canvas background */

  /* === DARK MODE BORDERS === */
  --border-primary: #3F3F46;       /* Default borders */
  --border-secondary: #52525B;     /* Emphasized borders */
  --border-hover: #71717A;         /* Hover state borders */

  /* === DARK MODE TEXT === */
  --text-primary: #FAFAFA;         /* Primary text - near white */
  --text-secondary: #A1A1AA;       /* Secondary text */
  --text-tertiary: #71717A;        /* Tertiary/disabled text */

  /* === DARK MODE ACCENTS (Same as light) === */
  --accent-primary: #7C3AED;       /* Primary actions - purple */
  --accent-primary-hover: #8B5CF6; /* Slightly lighter on hover */
  --accent-primary-active: #6D28D9;/* Darker on active */

  /* === DARK MODE SEMANTIC COLORS === */
  --success: #10B981;              /* Success states */
  --warning: #F59E0B;              /* Warnings */
  --error: #EF4444;                /* Errors */
  --info: #3B82F6;                 /* Info states */

  /* === DARK MODE COMPONENTS === */
  --input-bg: #18181B;             /* Input backgrounds */
  --input-border: #3F3F46;         /* Input borders */
  --card-bg: #18181B;              /* Card backgrounds */
  --node-bg: #0F0F0F;              /* Node card backgrounds */
  --button-primary-bg: #000000;    /* Black buttons */
  --button-primary-text: #FFFFFF;  /* White text on black */
}
```

**Key Dark Mode Characteristics:**
- Very dark, near-black backgrounds (#0A0A0A) for main surfaces
- Layered grays for depth (#18181B → #27272A → #2A2A2A)
- High contrast white text (#FAFAFA) on dark backgrounds
- Same purple accent (#7C3AED) works well in both themes
- Black buttons with white text for primary actions
- Subtle borders using zinc-700/600 colors

---

## 4. Typography System

### 4.1 Font Stack

```css
--font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont,
                       'Segoe UI', Roboto, sans-serif;
--font-family-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
```

### 4.2 Type Scale

```css
/* === HEADINGS === */
--font-size-h1: 2rem;            /* 32px - Page titles */
--font-size-h2: 1.5rem;          /* 24px - Section headings */
--font-size-h3: 1.25rem;         /* 20px - Subsection headings */
--font-size-h4: 1.125rem;        /* 18px - Card titles */

/* === BODY TEXT === */
--font-size-base: 0.875rem;      /* 14px - Default body (Langflow uses 14px) */
--font-size-sm: 0.8125rem;       /* 13px - Small text */
--font-size-xs: 0.75rem;         /* 12px - Captions, labels */

/* === UI ELEMENTS === */
--font-size-button: 0.875rem;    /* 14px - Buttons */
--font-size-input: 0.875rem;     /* 14px - Form inputs */
--font-size-badge: 0.75rem;      /* 12px - Badges, tags */
```

### 4.3 Font Weights

```css
--font-weight-normal: 400;       /* Regular text */
--font-weight-medium: 500;       /* Emphasized text */
--font-weight-semibold: 600;     /* Headings, buttons */
--font-weight-bold: 700;         /* Strong emphasis */
```

### 4.4 Line Heights

```css
--line-height-tight: 1.25;       /* Headings */
--line-height-normal: 1.5;       /* Body text */
--line-height-relaxed: 1.75;     /* Long-form content */
```

---

## 5. Component Design System

### 5.1 Buttons

**Primary Button (Main Actions)**
```css
.btn-primary {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover));
  color: white;
  padding: 0.625rem 1.25rem;      /* 10px 20px */
  border-radius: 0.5rem;          /* 8px */
  font-size: var(--font-size-button);
  font-weight: var(--font-weight-medium);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}
```

**Secondary Button**
```css
.btn-secondary {
  background: white;
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-size: var(--font-size-button);
  font-weight: var(--font-weight-medium);
  transition: all 0.2s;
}

.btn-secondary:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
```

**Icon Button**
```css
.btn-icon {
  width: 2.5rem;                  /* 40px */
  height: 2.5rem;
  border-radius: 0.5rem;
  background: white;
  border: 1px solid var(--border-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: var(--bg-secondary);
  border-color: var(--accent-primary);
}
```

### 5.2 Cards

**Standard Card**
```css
.card {
  background: white;
  border: 1px solid var(--border-primary);
  border-radius: 0.75rem;          /* 12px */
  padding: 1.5rem;                 /* 24px */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--border-hover);
}
```

**Node Card (Canvas)**
```css
.node-card {
  background: white;
  border: 2px solid var(--border-primary);
  border-radius: 0.75rem;
  padding: 1rem;
  min-width: 240px;
  max-width: 320px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
}

.node-card.selected {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.node-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
```

### 5.3 Inputs

**Text Input**
```css
.input {
  background: white;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;           /* 8px */
  padding: 0.625rem 0.875rem;      /* 10px 14px */
  font-size: var(--font-size-input);
  color: var(--text-primary);
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.input::placeholder {
  color: var(--text-tertiary);
}
```

**Select / Dropdown**
```css
.select {
  appearance: none;
  background: white url("data:image/svg+xml,...") no-repeat right 0.75rem center;
  background-size: 16px;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  padding: 0.625rem 2.5rem 0.625rem 0.875rem;
  font-size: var(--font-size-input);
  cursor: pointer;
  transition: all 0.2s;
}
```

### 5.4 Modals

**Modal Container**
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 1rem;             /* 16px */
  padding: 2rem;                   /* 32px */
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}
```

### 5.5 Sidebar Navigation

```css
.sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid var(--border-primary);
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s;
}

.sidebar-item:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.sidebar-item.active {
  background: linear-gradient(135deg,
    rgba(124, 58, 237, 0.1),
    rgba(124, 58, 237, 0.05));
  color: var(--accent-primary);
  font-weight: var(--font-weight-semibold);
}

.sidebar-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
```

---

## 6. Spacing System

### 6.1 Spacing Scale

```css
--spacing-xs: 0.25rem;           /* 4px */
--spacing-sm: 0.5rem;            /* 8px */
--spacing-md: 0.75rem;           /* 12px */
--spacing-lg: 1rem;              /* 16px */
--spacing-xl: 1.5rem;            /* 24px */
--spacing-2xl: 2rem;             /* 32px */
--spacing-3xl: 3rem;             /* 48px */
```

### 6.2 Component Spacing

```css
/* Card internal spacing */
.card-padding-sm: 1rem;          /* 16px */
.card-padding-md: 1.5rem;        /* 24px */
.card-padding-lg: 2rem;          /* 32px */

/* Element gaps */
.gap-items: 0.5rem;              /* 8px - between list items */
.gap-sections: 1.5rem;           /* 24px - between sections */
.gap-panels: 2rem;               /* 32px - between major panels */
```

---

## 7. Border Radius System

```css
--radius-sm: 0.375rem;           /* 6px - Small elements */
--radius-md: 0.5rem;             /* 8px - Buttons, inputs */
--radius-lg: 0.75rem;            /* 12px - Cards (MOST COMMON) */
--radius-xl: 1rem;               /* 16px - Modals, large panels */
--radius-2xl: 1.5rem;            /* 24px - Extra large surfaces */
--radius-full: 9999px;           /* Pills, circular elements */
```

---

## 8. Shadow System

```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
--shadow-xl: 0 20px 60px rgba(0, 0, 0, 0.15);

/* Interactive shadows */
--shadow-card-hover: 0 4px 16px rgba(0, 0, 0, 0.12);
--shadow-button-hover: 0 4px 12px rgba(124, 58, 237, 0.3);
--shadow-focus: 0 0 0 3px rgba(124, 58, 237, 0.1);
```

---

## 9. Icon System

### 9.1 Icon Library
**Primary:** Lucide React (already implemented)

### 9.2 Icon Sizes

```css
--icon-xs: 14px;                 /* Inline with small text */
--icon-sm: 16px;                 /* Default UI icons */
--icon-md: 20px;                 /* Navigation, cards */
--icon-lg: 24px;                 /* Node headers, large UI */
--icon-xl: 32px;                 /* Feature icons */
```

### 9.3 Icon Usage

```tsx
// Navigation item
<SidebarItem>
  <FileText className="w-5 h-5" />  {/* 20px */}
  <span>Projects</span>
</SidebarItem>

// Button
<Button>
  <Play className="w-4 h-4" />      {/* 16px */}
  <span>Run Flow</span>
</Button>

// Node header
<NodeHeader>
  <Bot className="w-6 h-6" />       {/* 24px */}
  <Title>AI Agent</Title>
</NodeHeader>
```

---

## 10. Animation & Transitions

### 10.1 Timing Functions

```css
--ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1);      /* Material */
--ease-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);    /* Entrance */
--ease-accelerate: cubic-bezier(0.4, 0.0, 1, 1);      /* Exit */
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);/* Bouncy */
```

### 10.2 Duration Scale

```css
--duration-instant: 100ms;       /* State changes */
--duration-fast: 150ms;          /* Hover effects */
--duration-normal: 200ms;        /* Default transitions */
--duration-slow: 300ms;          /* Complex animations */
--duration-slower: 500ms;        /* Page transitions */
```

### 10.3 Common Transitions

```css
/* Button hover */
.btn {
  transition: all var(--duration-fast) var(--ease-standard);
}

/* Card hover */
.card {
  transition: all var(--duration-normal) var(--ease-standard);
}

/* Modal entrance */
.modal-enter {
  animation: modal-fade-in var(--duration-slow) var(--ease-decelerate);
}
```

---

## 11. Component-Specific Design

### 11.1 Node Palette (Left Sidebar)

**Structure:**
```tsx
<Sidebar>
  <SearchBar />
  <CategoryTabs>
    - Components
    - MCP
    - Bundles
    - Sticky Notes
  </CategoryTabs>
  <ComponentList>
    {categories.map(cat => (
      <CategorySection>
        <CategoryHeader icon={} label={} />
        <ComponentItems />
      </CategorySection>
    ))}
  </ComponentList>
  <Footer>
    <Button>+ New Custom Component</Button>
  </Footer>
</Sidebar>
```

**Styling:**
- Width: 280px
- Background: White
- Border-right: 1px solid #E5E7EB
- Padding: 1.5rem 1rem

### 11.2 Canvas Area

**Background:**
```css
.canvas {
  background: #FAFAFA;
  position: relative;
  overflow: hidden;
}

/* Optional: Grid pattern */
.canvas::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, #E5E7EB 1px, transparent 1px),
    linear-gradient(to bottom, #E5E7EB 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.3;
}
```

**Controls:**
```tsx
<CanvasControls>
  <ZoomControl>
    <Button icon={ZoomIn} />
    <Percentage>100%</Percentage>
    <Button icon={ZoomOut} />
  </ZoomControl>
  <ViewControls>
    <Button icon={Lock} />
    <Button icon={Grid} />
  </ViewControls>
</CanvasControls>
```

### 11.3 Property Panel (Right Sidebar)

**Layout:**
- Width: 360px
- Collapsible
- Tabs for different property types
- Accordion sections

```tsx
<PropertyPanel>
  <PanelHeader>
    <Title>Node Properties</Title>
    <CloseButton />
  </PanelHeader>
  <PropertyTabs>
    <Tab>Properties</Tab>
    <Tab>Settings</Tab>
    <Tab>Advanced</Tab>
  </PropertyTabs>
  <PropertySections>
    <AccordionSection title="Basic">
      <PropertyField />
      <PropertyField />
    </AccordionSection>
    <AccordionSection title="Advanced">
      <PropertyField />
    </AccordionSection>
  </PropertySections>
</PropertyPanel>
```

### 11.4 Breadcrumb Navigation

```tsx
<Breadcrumbs>
  <BreadcrumbItem>
    <Link>Starter Project</Link>
  </BreadcrumbItem>
  <Separator>/</Separator>
  <BreadcrumbItem>
    <Dropdown>
      <CurrentFlow>Simple Agent</CurrentFlow>
      <FlowSwitcher />
    </Dropdown>
  </BreadcrumbItem>
</Breadcrumbs>
```

**Styling:**
```css
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.breadcrumb-link {
  color: var(--text-secondary);
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: var(--accent-primary);
}

.breadcrumb-current {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}
```

---

## 12. Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Tasks:**
- [ ] Install Inter font family
- [ ] Update CSS variable system with new color palette
- [ ] Create base component library
- [ ] Implement new button system
- [ ] Update input components

**Deliverables:**
- Updated `index.css` with complete variable system
- Base component library in `/components/ui/`
- Storybook documentation (optional)

### Phase 2: Layout Restructuring (Week 2-3)
**Tasks:**
- [ ] Implement three-panel layout
- [ ] Create collapsible sidebar component
- [ ] Build breadcrumb navigation
- [ ] Add header with user menu
- [ ] Responsive breakpoints

**Deliverables:**
- New `AppShell.tsx` layout component
- Sidebar navigation component
- Breadcrumb component
- Responsive layout system

### Phase 3: Component Migration (Week 3-4)
**Tasks:**
- [ ] Migrate NodePalette to new design
- [ ] Update FlowCanvas styling
- [ ] Rebuild PropertyPanel
- [ ] Update all card components
- [ ] Migrate modals to new design

**Deliverables:**
- All major components updated
- Consistent visual language
- Updated component documentation

### Phase 4: Node System Redesign (Week 4-5)
**Tasks:**
- [ ] Redesign node card components
- [ ] Update connection line styling
- [ ] Add node type color coding
- [ ] Implement expand/collapse states
- [ ] Add node action menus

**Deliverables:**
- New node component system
- Updated node types (Agent, Subagent, Hook, MCP)
- Node interaction patterns

### Phase 5: Polish & Refinement (Week 5-6)
**Tasks:**
- [ ] Add micro-interactions
- [ ] Implement loading states
- [ ] Add empty states
- [ ] Create error states
- [ ] Accessibility audit
- [ ] Performance optimization

**Deliverables:**
- Polished user experience
- WCAG AA compliant
- Smooth animations
- Optimized performance

### Phase 6: Testing & Documentation (Week 6-7)
**Tasks:**
- [ ] Visual regression testing
- [ ] User acceptance testing
- [ ] Create design system documentation
- [ ] Update developer guides
- [ ] Create component usage examples

**Deliverables:**
- Test coverage reports
- Design system documentation site
- Developer guidelines
- Migration guide

---

## 13. Quick Wins (Immediate Changes)

These changes can be implemented immediately for quick visual improvement:

### 13.1 Color Palette Swap
```css
/* Replace in index.css */
/* OLD coral-based */
--accent-primary: #FF6D5A;

/* NEW purple-based (Langflow-style) */
--accent-primary: #7C3AED;
```

### 13.2 Background Update
```css
/* Replace dark backgrounds with light */
/* OLD */
--bg-canvas: #0F0F0F;

/* NEW */
--bg-canvas: #FAFAFA;
--bg-primary: #FFFFFF;
```

### 13.3 Font Size Adjustment
```css
/* Reduce base font size to match Langflow */
/* OLD */
--font-size-base: 0.9375rem;  /* 15px */

/* NEW */
--font-size-base: 0.875rem;   /* 14px */
```

### 13.4 Border Radius Consistency
```css
/* Standardize to 8px/12px */
.card { border-radius: 0.75rem; }      /* 12px */
.button { border-radius: 0.5rem; }     /* 8px */
.input { border-radius: 0.5rem; }      /* 8px */
```

---

## 14. Component Checklist

### Essential Components to Build/Update

**Layout Components:**
- [ ] AppShell (three-panel layout)
- [ ] Sidebar (collapsible navigation)
- [ ] Header (breadcrumbs + actions)
- [ ] Panel (right sidebar)

**UI Components:**
- [ ] Button (primary, secondary, icon, ghost)
- [ ] Input (text, number, select, textarea)
- [ ] Card (default, node, modal)
- [ ] Modal (dialog, sheet, drawer)
- [ ] Badge (status, count, tag)
- [ ] Tooltip (hover info)
- [ ] Dropdown (menu, select)
- [ ] Tabs (navigation, content switching)
- [ ] Accordion (expandable sections)

**Node Components:**
- [ ] NodeCard (base component)
- [ ] AgentNode
- [ ] SubagentNode
- [ ] HookNode
- [ ] MCPNode
- [ ] InputNode
- [ ] OutputNode

**Canvas Components:**
- [ ] CanvasGrid (background pattern)
- [ ] ConnectionLine (node connections)
- [ ] ZoomControls (zoom in/out)
- [ ] MiniMap (overview)

---

## 15. Design Tokens Reference

Complete reference file structure:

```
src/
├── styles/
│   ├── tokens/
│   │   ├── colors.css
│   │   ├── typography.css
│   │   ├── spacing.css
│   │   ├── shadows.css
│   │   └── animations.css
│   └── index.css (imports all tokens)
├── components/
│   └── ui/
│       ├── Button/
│       ├── Card/
│       ├── Input/
│       ├── Modal/
│       └── index.ts
```

---

## 16. Accessibility Guidelines

### Color Contrast
- Text on white: Minimum 4.5:1 ratio (WCAG AA)
- Large text: Minimum 3:1 ratio
- Interactive elements: Clear focus states

### Keyboard Navigation
- All interactive elements keyboard accessible
- Visible focus indicators
- Logical tab order
- Escape key closes modals

### Screen Readers
- Semantic HTML elements
- ARIA labels for icons
- Alt text for images
- Live region announcements

---

## 17. Performance Considerations

### Optimization Strategies
1. **Component Lazy Loading**
   - Load node components on demand
   - Lazy load modals and panels

2. **Virtual Scrolling**
   - For long lists in sidebar
   - For large canvases

3. **Memoization**
   - Memo expensive components
   - useMemo for calculations
   - useCallback for handlers

4. **CSS Optimization**
   - Use CSS variables for theming
   - Minimize re-paints
   - Use transform for animations

---

## 18. Browser Support

**Target Browsers:**
- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions

**Required Features:**
- CSS Grid & Flexbox
- CSS Custom Properties
- ES2020+ JavaScript
- SVG support

---

## 19. Migration Strategy

### For Existing Users

1. **Feature Flag System**
   - `ENABLE_NEW_UI=true/false`
   - Allow gradual rollout
   - A/B testing capability

2. **Theme Toggle**
   - Allow users to switch between old/new
   - Collect feedback
   - Gradual migration

3. **Documentation**
   - Migration guide for developers
   - User guide for new UI
   - Video tutorials

---

## 20. Success Metrics

### User Experience
- [ ] Time to complete task: -30%
- [ ] User satisfaction: >4.5/5
- [ ] Support tickets: -40%

### Technical
- [ ] Lighthouse score: >90
- [ ] Component reusability: >80%
- [ ] Accessibility: WCAG AA compliant

### Business
- [ ] User engagement: +25%
- [ ] Feature adoption: +35%
- [ ] User retention: +20%

---

## 21. Resources & References

### Design Inspiration
- Langflow: https://langflow.org
- Linear: https://linear.app
- Vercel: https://vercel.com

### Component Libraries
- Radix UI: https://radix-ui.com
- shadcn/ui: https://ui.shadcn.com
- Headless UI: https://headlessui.com

### Design Tools
- Figma: For mockups and prototypes
- Storybook: For component documentation
- Chromatic: For visual testing

---

## 22. Next Steps

### Immediate Actions
1. Review and approve this plan
2. Set up Figma workspace for mockups
3. Create feature branch for UI modernization
4. Begin Phase 1 implementation

### Team Alignment
1. Design review meeting
2. Development kickoff
3. Weekly progress reviews
4. User feedback sessions

---

## Appendix A: Color Palette Comparison

| Element | Current (CloutAgent) | New (Langflow-Inspired) |
|---------|---------------------|------------------------|
| Primary BG | Dark (#0F0F0F) | White (#FFFFFF) |
| Accent | Coral (#FF6D5A) | Purple (#7C3AED) |
| Text | White (95% opacity) | Dark (#111827) |
| Borders | White (10% opacity) | Gray (#E5E7EB) |

---

## Appendix B: Typography Comparison

| Element | Current | New |
|---------|---------|-----|
| Font | SF Pro-like | Inter |
| Base Size | 15px | 14px |
| Headings | Bold weight | Semibold weight |
| Line Height | 1.5 | 1.5 (same) |

---

## Contact & Support

For questions or feedback on this modernization plan:
- GitHub Issues: Report design inconsistencies
- Design Review: Schedule with team
- Implementation Support: Check developer docs

---

**End of Document**
