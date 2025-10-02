# Design Refinement Implementation Plan

**Project**: CloutAgent UI Professional Refinement
**Duration**: 2 weeks (10 working days)
**Total Estimated Hours**: 60-72 hours
**Parallel Agents**: 4-6 agents running simultaneously
**Document Date**: 2025-10-02

---

## Overview

This plan implements fixes from `CRITICAL_DESIGN_GAP_ANALYSIS.md` by breaking work into atomic tasks that can be executed in parallel by specialized agents with minimal coordination overhead.

**Success Metrics**:
- Visual hierarchy clear: ONE primary action per screen
- Color palette: ONE accent color (warm coral #FF6D5A)
- All buttons use defined utility classes (no raw Tailwind colors)
- Professional appearance matching n8n/Apple/Anthropic standards

---

## Task Organization

### Phase Structure
- **Phase 1**: Critical Fixes (Days 1-3) - 20 hours
- **Phase 2**: High Priority (Days 4-6) - 24 hours
- **Phase 3**: Medium Priority (Days 7-10) - 18 hours

### Dependency Rules
- Tasks with same letter prefix (e.g., A1, A2, A3) can run in **PARALLEL**
- Tasks with sequential numbers (e.g., A1 → B1) run **SEQUENTIALLY**
- Each task includes complete context for autonomous execution

---

## Phase 1: Critical Fixes (Days 1-3)

### Task A1: Define Professional Color System
**ID**: `DESIGN-001`
**Priority**: 🔴 CRITICAL
**Agent**: `ui-ux-designer`
**Duration**: 2 hours
**Dependencies**: None (starts immediately)
**Can run parallel with**: A2, A3

**Objective**: Create professional color variables in CSS to replace oversaturated Tailwind colors

**Context**:
Current CloutAgent uses raw Tailwind colors (`bg-green-600`, `bg-blue-600`, etc.) which are oversaturated and unprofessional. Reference analysis shows:
- n8n uses ONE warm coral accent (#FF6D5A)
- Apple uses ONE system blue (#007AFF)
- Anthropic uses black/coral minimal palette

**Task Details**:
1. Open `/apps/frontend/src/index.css`
2. Update CSS variables in `:root` section (starting line 15)
3. Replace existing accent colors with professional palette
4. Define functional color usage (success, warning, error)

**Exact Implementation**:
```css
/* REPLACE lines 30-32 with professional palette */
:root {
  /* === PRIMARY ACCENT === */
  /* ONE color for all primary actions - warm coral like n8n */
  --accent-primary: #FF6D5A;
  --accent-primary-hover: #E85D4A;
  --accent-primary-active: #D54D3A;

  /* === FUNCTIONAL COLORS === */
  /* ONLY use for specific semantic meanings, NOT decoration */
  --color-success: #10B981;      /* Green - connections, success states only */
  --color-warning: #F59E0B;      /* Amber - warnings only */
  --color-error: #EF4444;        /* Red - errors only */
  --color-info: #3B82F6;         /* Blue - info states only */

  /* === GLASS SURFACES === */
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-bg-strong: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-hover: rgba(255, 255, 255, 0.08);

  /* === TEXT HIERARCHY === */
  /* Use opacity for hierarchy, not color */
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.60);
  --text-tertiary: rgba(255, 255, 255, 0.40);
  --text-disabled: rgba(255, 255, 255, 0.25);

  /* === BACKGROUNDS === */
  --bg-canvas: #0F0F0F;           /* Darker for better contrast */
  --bg-panel: rgba(26, 26, 26, 0.95);
  --bg-card: #1A1A1A;
  --bg-hover: #2A2A2A;
}
```

**Acceptance Criteria**:
- [x] `:root` section contains all color variables defined above
- [x] ONLY ONE primary accent color defined (coral #FF6D5A)
- [x] Functional colors (success, warning, error) clearly separated from UI accent
- [x] All color values use exact hex codes specified
- [x] Comments explain when each color should be used
- [x] File saved and valid CSS (no syntax errors)

**Output Files**:
- `/apps/frontend/src/index.css` (modified)

**Validation**:
```bash
# Run this to verify CSS is valid
pnpm --filter @cloutagent/frontend exec stylelint apps/frontend/src/index.css
```

---

### Task A2: Create Button Utility Classes
**ID**: `DESIGN-002`
**Priority**: 🔴 CRITICAL
**Agent**: `frontend-engineer`
**Duration**: 3 hours
**Dependencies**: None (can start immediately, uses existing CSS structure)
**Can run parallel with**: A1, A3

**Objective**: Define professional button utility classes for visual hierarchy

**Context**:
Currently buttons use raw Tailwind utilities inconsistently. Need 4 button variants:
1. **Primary** - Warm accent gradient (1 per screen max)
2. **Glass** - Glassmorphic secondary actions
3. **Ghost** - Minimal tertiary actions
4. **Destructive** - Subtle red for dangerous actions

Reference: n8n uses similar hierarchy with coral primary + glass secondary

**Task Details**:
1. Open `/apps/frontend/src/index.css`
2. Locate `@layer utilities` section (line 67)
3. Update `.btn-primary` class to use warm coral gradient
4. Ensure `.btn-glass` class exists and is correct
5. Add new `.btn-ghost` and `.btn-destructive` classes

**Exact Implementation**:
```css
/* ADD/UPDATE in @layer utilities section (after line 99) */

/* === BUTTON SYSTEM === */

/* Primary - Warm coral accent, highest visual weight */
/* Use for: Most important action per screen (Run Workflow, Create Project, Submit) */
.btn-primary-coral {
  @apply rounded-xl px-4 py-2 transition-all duration-200;
  background: linear-gradient(135deg, #FF6D5A 0%, #E85D4A 100%);
  color: white;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(255, 109, 90, 0.25);
  transition-timing-function: var(--ease-ios);
}

.btn-primary-coral:hover {
  background: linear-gradient(135deg, #E85D4A 0%, #D54D3A 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(255, 109, 90, 0.35);
}

.btn-primary-coral:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(255, 109, 90, 0.3);
}

.btn-primary-coral:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Secondary - Glassmorphic, medium visual weight */
/* Use for: Important but not primary actions (Save, Cancel, Settings) */
.btn-glass {
  @apply rounded-xl px-4 py-2 transition-all duration-200;
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  transition-timing-function: var(--ease-ios);
}

.btn-glass:hover {
  background: var(--glass-hover);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

.btn-glass:active {
  transform: translateY(0);
}

.btn-glass:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Tertiary - Minimal ghost, low visual weight */
/* Use for: Less important actions (View, History, Details) */
.btn-ghost {
  @apply rounded-xl px-4 py-2 transition-all duration-200;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  border: 1px solid transparent;
  transition-timing-function: var(--ease-ios);
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  border-color: rgba(255, 255, 255, 0.1);
}

.btn-ghost:active {
  background: rgba(255, 255, 255, 0.03);
}

.btn-ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Destructive - Subtle red, requires confirmation */
/* Use for: Dangerous actions (Delete, Clear, Remove) */
.btn-destructive {
  @apply rounded-xl px-4 py-2 transition-all duration-200;
  background: transparent;
  color: rgba(239, 68, 68, 0.6);
  font-size: 13px;
  font-weight: 500;
  border: 1px solid transparent;
  transition-timing-function: var(--ease-ios);
}

.btn-destructive:hover {
  background: rgba(239, 68, 68, 0.1);
  color: rgba(239, 68, 68, 0.9);
  border-color: rgba(239, 68, 68, 0.2);
}

.btn-destructive:active {
  background: rgba(239, 68, 68, 0.15);
}

.btn-destructive:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**DELETE/REPLACE**:
```css
/* REMOVE the existing .btn-primary class (lines 117-133) */
/* It uses blue gradient - replace with .btn-primary-coral above */
```

**Acceptance Criteria**:
- [x] Four button classes exist: `.btn-primary-coral`, `.btn-glass`, `.btn-ghost`, `.btn-destructive`
- [x] Primary uses warm coral gradient (#FF6D5A → #E85D4A)
- [x] Glass uses glassmorphic effects (backdrop-filter: blur)
- [x] Ghost is transparent with subtle hover
- [x] Destructive uses muted red (rgba(239, 68, 68, 0.6))
- [x] All buttons have consistent border-radius (rounded-xl = 12px)
- [x] All buttons have consistent font-size (13px) and font-weight (500)
- [x] Hover states include translateY(-1px) for elevation
- [x] Disabled states have 0.5 opacity
- [x] Comments explain when to use each variant

**Output Files**:
- `/apps/frontend/src/index.css` (modified)

**Validation**:
```bash
# Verify CSS compiles
pnpm --filter @cloutagent/frontend build
```

---

### Task A3: Create Button Usage Documentation
**ID**: `DESIGN-003`
**Priority**: 🔴 CRITICAL
**Agent**: `ui-ux-designer`
**Duration**: 1 hour
**Dependencies**: None
**Can run parallel with**: A1, A2

**Objective**: Document when to use each button variant to prevent misuse

**Context**:
Developers need clear guidelines on which button class to use in which scenario. This prevents reverting to old patterns (bright Tailwind colors).

**Task Details**:
1. Create new file: `/docs/cloutagent/BUTTON_USAGE_GUIDE.md`
2. Include visual hierarchy explanation
3. Provide code examples for each button type
4. Include "wrong" examples (what NOT to do)

**Exact Content**:
```markdown
# Button Usage Guide

## Visual Hierarchy Rules

**ONE primary button per screen maximum.** If you have 2+ primary actions, rethink your UX.

### Button Hierarchy (Most → Least Visual Weight)

1. **Primary** (`.btn-primary-coral`) - Warm coral gradient
2. **Secondary** (`.btn-glass`) - Glassmorphic
3. **Tertiary** (`.btn-ghost`) - Minimal transparent
4. **Destructive** (`.btn-destructive`) - Subtle red

---

## When to Use Each Variant

### Primary - `.btn-primary-coral`

**Use for**: THE most important action on the screen

**Examples**:
- ✅ "Run Workflow" (canvas toolbar)
- ✅ "Create New Project" (project list)
- ✅ "Save Changes" (when it's the primary action in a form)
- ✅ "Submit" (form submission)

**Max per screen**: 1 (ONE)

**Code**:
```tsx
<button className="btn-primary-coral">
  Run Workflow
</button>
```

---

### Secondary - `.btn-glass`

**Use for**: Important actions that support the primary action

**Examples**:
- ✅ "Save" (when "Run" is primary)
- ✅ "Cancel" (in modals)
- ✅ "Settings" (toolbar)
- ✅ "Export" (data actions)

**Code**:
```tsx
<button className="btn-glass">
  Save
</button>
```

---

### Tertiary - `.btn-ghost`

**Use for**: Less important actions, navigation, view-only

**Examples**:
- ✅ "History" (view past executions)
- ✅ "View Details" (non-critical info)
- ✅ "Close" (dismiss panels)
- ✅ "Learn More" (documentation links)

**Code**:
```tsx
<button className="btn-ghost">
  History
</button>
```

---

### Destructive - `.btn-destructive`

**Use for**: Dangerous actions that delete/clear data

**Important**: Always add confirmation dialog!

**Examples**:
- ✅ "Delete Project" (with confirmation)
- ✅ "Clear Canvas" (with confirmation)
- ✅ "Remove Node" (with confirmation)

**Code**:
```tsx
<button
  className="btn-destructive"
  onClick={() => {
    if (confirm('Are you sure?')) {
      handleDelete();
    }
  }}
>
  Clear Canvas
</button>
```

---

## ❌ What NOT to Do

### Wrong: Multiple Primary Buttons
```tsx
{/* ❌ WRONG - Too many primary actions */}
<button className="btn-primary-coral">Run</button>
<button className="btn-primary-coral">Save</button>
<button className="btn-primary-coral">Export</button>
```

### Wrong: Using Raw Tailwind Colors
```tsx
{/* ❌ WRONG - Never use raw Tailwind bg colors */}
<button className="bg-green-600 hover:bg-green-700">Run</button>
<button className="bg-blue-600">Save</button>
```

### Wrong: Destructive as Primary
```tsx
{/* ❌ WRONG - Destructive should be subtle, not prominent */}
<button className="btn-primary-coral" onClick={deleteAll}>
  Delete Everything
</button>

{/* ✅ CORRECT - Destructive is subtle by design */}
<button className="btn-destructive" onClick={() => {
  if (confirm('Delete everything?')) deleteAll();
}}>
  Delete Everything
</button>
```

---

## Quick Reference

| Action Type | Button Class | Max Per Screen | Confirmation? |
|-------------|--------------|----------------|---------------|
| Primary action | `.btn-primary-coral` | 1 | No |
| Secondary action | `.btn-glass` | 2-3 | No |
| Tertiary action | `.btn-ghost` | Unlimited | No |
| Destructive action | `.btn-destructive` | 1-2 | **YES** |

---

## Visual Examples

See `/docs/cloutagent/DESIGN_GUIDELINES_RESEARCH.md` for reference screenshots from n8n, Apple, and Anthropic showing proper button hierarchy.
```

**Acceptance Criteria**:
- [x] File created at `/docs/cloutagent/BUTTON_USAGE_GUIDE.md`
- [x] All 4 button variants documented with use cases
- [x] Code examples provided for each variant
- [x] "Wrong" examples included to prevent anti-patterns
- [x] Quick reference table included
- [x] Max per screen guidelines specified (1 primary max)

**Output Files**:
- `/docs/cloutagent/BUTTON_USAGE_GUIDE.md` (new)

---

### Task B1: Refactor FlowCanvas Buttons
**ID**: `DESIGN-004`
**Priority**: 🔴 CRITICAL
**Agent**: `frontend-engineer`
**Duration**: 2 hours
**Dependencies**: A2 (requires button classes to exist)
**Blocks**: B2, B3, B4 (other components should follow this pattern)

**Objective**: Replace FlowCanvas toolbar buttons with professional button classes

**Context**:
FlowCanvas.tsx currently uses bright Tailwind colors (bg-green-600, bg-blue-600, etc.) for all toolbar buttons. This is the most visible part of the app and sets the pattern for other components.

Current issues (from screenshot analysis):
- Green "Run Workflow" - too bright
- Blue "Save" - too bright
- Red "Clear Canvas" - looks alarming
- Purple "History" - unnecessary color

**Task Details**:
1. Open `/apps/frontend/src/components/FlowCanvas.tsx`
2. Locate Panel component at line 394 (top-right toolbar)
3. Replace button className props with new utility classes
4. Establish proper visual hierarchy: Primary > Secondary > Tertiary > Destructive
5. Remove emoji from buttons (keep for later icon task)

**Exact Implementation**:

**FIND** (lines 400-438):
```tsx
<button
  onClick={handleRunWorkflow}
  disabled={isExecuting || nodes.length === 0}
  className={`px-4 py-2 rounded text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
    testMode
      ? 'bg-blue-600 hover:bg-blue-700'
      : 'bg-green-600 hover:bg-green-700'
  }`}
>
  {isExecuting
    ? 'Starting...'
    : testMode
      ? '🧪 Test Run'
      : '▶️ Run Workflow'}
</button>
<button
  onClick={handleSave}
  disabled={isSaving}
  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isSaving ? 'Saving...' : 'Save'}
</button>
{lastSaved && (
  <span className="text-xs text-gray-400">
    Last saved: {lastSaved.toLocaleTimeString()}
  </span>
)}
<button
  onClick={handleClearCanvas}
  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm font-medium transition-colors"
>
  Clear Canvas
</button>
<button
  onClick={() => setShowHistory(true)}
  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm font-medium transition-colors"
>
  History
</button>
```

**REPLACE WITH**:
```tsx
{/* PRIMARY ACTION - Most important, warm coral */}
<button
  onClick={handleRunWorkflow}
  disabled={isExecuting || nodes.length === 0}
  className="btn-primary-coral disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isExecuting
    ? 'Starting...'
    : testMode
      ? 'Test Run'
      : 'Run Workflow'}
</button>

{/* SECONDARY ACTION - Glassmorphic */}
<button
  onClick={handleSave}
  disabled={isSaving}
  className="btn-glass disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isSaving ? 'Saving...' : 'Save'}
</button>

{/* Auto-save timestamp - keep as is */}
{lastSaved && (
  <span className="text-xs text-gray-400">
    Last saved: {lastSaved.toLocaleTimeString()}
  </span>
)}

{/* TERTIARY ACTION - Minimal ghost */}
<button
  onClick={() => setShowHistory(true)}
  className="btn-ghost"
>
  History
</button>

{/* DESTRUCTIVE ACTION - Subtle, requires confirmation */}
<button
  onClick={handleClearCanvas}
  className="btn-destructive"
>
  Clear Canvas
</button>
```

**Note**: Removed emojis (▶️, 🧪) temporarily. Task DESIGN-010 will add proper SVG icons.

**Acceptance Criteria**:
- [x] "Run Workflow" button uses `.btn-primary-coral`
- [x] "Save" button uses `.btn-glass`
- [x] "History" button uses `.btn-ghost`
- [x] "Clear Canvas" button uses `.btn-destructive`
- [x] Visual hierarchy correct: Primary (coral) stands out most
- [x] No raw Tailwind color classes (bg-green-600, etc.) remain
- [x] Disabled states work correctly (opacity-50)
- [x] Emojis removed from button text (temporary - icons added later)
- [x] Code compiles without errors
- [x] Buttons render correctly in browser

**Output Files**:
- `/apps/frontend/src/components/FlowCanvas.tsx` (modified, lines 394-439)

**Validation**:
```bash
# Check TypeScript compiles
pnpm --filter @cloutagent/frontend exec tsc --noEmit

# Visual test - run dev server and check toolbar
pnpm --filter @cloutagent/frontend dev
# Visit http://localhost:3002 and verify buttons look professional
```

**Visual Test Checklist**:
- [ ] Only ONE coral button visible (Run Workflow)
- [ ] Save button has glassmorphic effect (slightly transparent)
- [ ] History button is subtle (low visual weight)
- [ ] Clear Canvas has red text but NOT red background
- [ ] Hierarchy clear: eyes go to Run first

---

### Task B2: Refactor ExecutionControls Buttons
**ID**: `DESIGN-005`
**Priority**: 🔴 CRITICAL
**Agent**: `frontend-engineer`
**Duration**: 1.5 hours
**Dependencies**: B1 (follow FlowCanvas pattern)
**Can run parallel with**: B3, B4 (different files)

**Objective**: Apply button hierarchy to execution control buttons

**Context**:
ExecutionControls.tsx currently uses bright yellow/green/red buttons for Pause/Resume/Cancel. These should follow the same hierarchy:
- Resume/Retry → Primary (coral)
- Pause → Secondary (glass)
- Cancel → Destructive (subtle red)

**Task Details**:
1. Open `/apps/frontend/src/components/ExecutionControls.tsx`
2. Replace lines 100-147 button className props
3. Apply appropriate button classes based on action importance

**Exact Implementation**:

**FIND** (lines 100-147):
```tsx
<button
  onClick={handlePause}
  disabled={loading !== null}
  className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
>
  {loading === 'pause' ? <>Pausing...</> : <>Pause</>}
</button>

<button
  onClick={handleCancel}
  disabled={loading !== null}
  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
>
  {loading === 'cancel' ? <>Cancelling...</> : <>Cancel</>}
</button>

{/* Paused state */}
<button
  onClick={handleResume}
  disabled={loading !== null}
  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
>
  {loading === 'resume' ? <>Resuming...</> : <>Resume</>}
</button>

{/* Failed state */}
<button
  onClick={handleRetry}
  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
>
  Retry
</button>
```

**REPLACE WITH**:
```tsx
{/* Running state controls */}
{status === 'running' && (
  <>
    {/* SECONDARY - Pause is important but not primary */}
    <button
      onClick={handlePause}
      disabled={loading !== null}
      className="btn-glass text-sm disabled:opacity-50 flex items-center gap-1.5"
    >
      {loading === 'pause' ? 'Pausing...' : 'Pause'}
    </button>

    {/* DESTRUCTIVE - Cancellation is dangerous */}
    <button
      onClick={handleCancel}
      disabled={loading !== null}
      className="btn-destructive text-sm disabled:opacity-50 flex items-center gap-1.5"
    >
      {loading === 'cancel' ? 'Cancelling...' : 'Cancel'}
    </button>
  </>
)}

{/* Paused state controls */}
{status === 'paused' && (
  <>
    {/* PRIMARY - Resume is most important action when paused */}
    <button
      onClick={handleResume}
      disabled={loading !== null}
      className="btn-primary-coral text-sm disabled:opacity-50 flex items-center gap-1.5"
    >
      {loading === 'resume' ? 'Resuming...' : 'Resume'}
    </button>

    {/* DESTRUCTIVE - Cancel option still available */}
    <button
      onClick={handleCancel}
      disabled={loading !== null}
      className="btn-destructive text-sm disabled:opacity-50 flex items-center gap-1.5"
    >
      {loading === 'cancel' ? 'Cancelling...' : 'Cancel'}
    </button>
  </>
)}

{/* Failed state controls */}
{status === 'failed' && (
  <button
    onClick={handleRetry}
    className="btn-primary-coral text-sm flex items-center gap-1.5"
  >
    Retry
  </button>
)}
```

**Reasoning**:
- **Resume/Retry** = Primary (user wants to continue, so make it easy)
- **Pause** = Secondary (useful but not urgent)
- **Cancel** = Destructive (stops work, potential data loss)

**Acceptance Criteria**:
- [x] Resume/Retry buttons use `.btn-primary-coral`
- [x] Pause button uses `.btn-glass`
- [x] Cancel button uses `.btn-destructive`
- [x] No bright yellow, green, blue, or red backgrounds
- [x] Loading states work correctly
- [x] Disabled states work correctly
- [x] `flex items-center gap-1.5` preserved for layout
- [x] Code compiles without errors

**Output Files**:
- `/apps/frontend/src/components/ExecutionControls.tsx` (modified, lines 95-147)

**Validation**:
```bash
pnpm --filter @cloutagent/frontend exec tsc --noEmit
```

---

### Task B3: Refactor ProjectList Buttons
**ID**: `DESIGN-006`
**Priority**: 🔴 CRITICAL
**Agent**: `frontend-engineer`
**Duration**: 1 hour
**Dependencies**: B1 (follow FlowCanvas pattern)
**Can run parallel with**: B2, B4

**Objective**: Apply button hierarchy to project list page

**Context**:
ProjectList component likely has "Create New Project" button which should be primary action.

**Task Details**:
1. Open `/apps/frontend/src/components/ProjectList.tsx`
2. Find all `<button>` elements
3. Apply appropriate button classes

**Search Pattern**:
```bash
# Find all buttons in ProjectList
grep -n "className.*bg-" apps/frontend/src/components/ProjectList.tsx
```

**General Rule for ProjectList**:
- "Create New Project" → `.btn-primary-coral` (main action)
- "Open" / "View" → `.btn-glass` (secondary)
- "Delete" → `.btn-destructive` (dangerous)

**Acceptance Criteria**:
- [x] "Create New Project" uses `.btn-primary-coral`
- [x] Any secondary actions use `.btn-glass`
- [x] Any delete actions use `.btn-destructive`
- [x] No raw Tailwind bg color classes remain
- [x] Visual hierarchy clear

**Output Files**:
- `/apps/frontend/src/components/ProjectList.tsx` (modified)

**Validation**:
```bash
pnpm --filter @cloutagent/frontend exec tsc --noEmit
```

---

### Task B4: Refactor Remaining Component Buttons
**ID**: `DESIGN-007`
**Priority**: 🔴 CRITICAL
**Agent**: `frontend-engineer`
**Duration**: 2 hours
**Dependencies**: B1, B2, B3 (follow established patterns)
**Can run parallel with**: None (should be last button refactor)

**Objective**: Find and fix ALL remaining button color issues across entire codebase

**Context**:
After fixing main components, need to catch any remaining buttons in other files.

**Task Details**:
1. Search entire codebase for raw Tailwind bg color usage in buttons
2. Replace with appropriate button classes
3. Document any edge cases

**Search Commands**:
```bash
# Find all potential button color issues
cd /home/yfedoseev/projects/cloutagent/apps/frontend

# Search for bg-green, bg-blue, bg-red, bg-purple in TSX files
grep -rn "className.*bg-green-[0-9]" src/components/
grep -rn "className.*bg-blue-[0-9]" src/components/
grep -rn "className.*bg-red-[0-9]" src/components/
grep -rn "className.*bg-purple-[0-9]" src/components/
grep -rn "className.*bg-yellow-[0-9]" src/components/

# Focus on button elements
grep -rn "<button.*bg-" src/components/
```

**Files to Check**:
- `ValidationPanel.tsx`
- `VariablesPanel.tsx`
- `CreateVariableModal.tsx`
- `ExecutionMonitor.tsx`
- `ExecutionHistoryPanel.tsx`
- `TestModeToggle.tsx`
- `TestModeExecution.tsx`
- `DryRunEstimate.tsx`
- Any modal/dialog components

**Replacement Rules**:
1. **Primary actions** (Submit, Create, Confirm) → `.btn-primary-coral`
2. **Secondary actions** (Cancel, Close, View) → `.btn-glass`
3. **Tertiary actions** (Details, Info, Learn More) → `.btn-ghost`
4. **Destructive actions** (Delete, Remove, Clear) → `.btn-destructive`

**Acceptance Criteria**:
- [x] All button elements use one of 4 button classes
- [x] Zero matches for `grep -r "bg-green-[0-9]" src/components/*.tsx`
- [x] Zero matches for `grep -r "bg-blue-[0-9]" src/components/*.tsx`
- [x] Zero matches for `grep -r "bg-red-[0-9]" src/components/*.tsx`
- [x] Zero matches for `grep -r "bg-purple-[0-9]" src/components/*.tsx`
- [x] All components compile without errors
- [x] Visual test confirms no bright buttons remain

**Output Files**:
- Multiple component files (list all modified files in completion report)

**Validation**:
```bash
# Verify no raw bg colors remain in buttons
cd apps/frontend
grep -r "className.*bg-green-[0-9]" src/components/ | grep button
grep -r "className.*bg-blue-[0-9]" src/components/ | grep button
grep -r "className.*bg-red-[0-9]" src/components/ | grep button
grep -r "className.*bg-purple-[0-9]" src/components/ | grep button

# Should return zero results
```

---

### Phase 1 Completion Gate

**Before proceeding to Phase 2**:
- [ ] All Phase 1 tasks (A1-A3, B1-B4) completed
- [ ] Visual test: Only ONE coral button per screen
- [ ] Grep test: No raw Tailwind bg colors in buttons
- [ ] Build succeeds: `pnpm build` passes
- [ ] Dev server runs without errors

**Phase 1 Deliverable**: Professional button hierarchy throughout app

---

## Phase 2: High Priority Fixes (Days 4-6)

### Task C1: Install Icon Library
**ID**: `DESIGN-010`
**Priority**: 🟡 HIGH
**Agent**: `frontend-engineer`
**Duration**: 30 minutes
**Dependencies**: None (can start immediately)
**Blocks**: C2, C3 (icons needed for replacement)

**Objective**: Install Lucide React for professional SVG icons

**Context**:
Current app uses emojis in buttons (🚀, 📦, ▶️, 🧪) which:
- Render inconsistently across platforms
- Can't be customized (color, size)
- Look unprofessional

Lucide React provides:
- 1000+ SVG icons
- Customizable size/color
- Consistent rendering
- Tree-shakeable (only imports used icons)

**Task Details**:
1. Install package
2. Verify installation
3. Create icon exports file for common usage

**Implementation**:
```bash
# Install Lucide React
cd /home/yfedoseev/projects/cloutagent
pnpm --filter @cloutagent/frontend add lucide-react

# Verify installation
pnpm --filter @cloutagent/frontend list lucide-react
```

**Create icon exports** (optional, for convenience):
```tsx
// apps/frontend/src/lib/icons.ts
export {
  Play,           // Run/Play actions
  Save,           // Save actions
  History,        // History/Time
  Trash2,         // Delete/Clear
  Settings,       // Settings/Config
  Plus,           // Add/Create
  X,              // Close/Dismiss
  ChevronDown,    // Dropdown
  ChevronUp,      // Collapse
  Check,          // Success/Confirm
  AlertTriangle,  // Warning
  AlertCircle,    // Error/Info
  Pause,          // Pause
  RotateCw,       // Retry/Refresh
  Zap,            // Quick action
  Package,        // Variables/Tools
  Rocket,         // Launch/Deploy
} from 'lucide-react';
```

**Acceptance Criteria**:
- [x] `lucide-react` installed in package.json
- [x] Package appears in `pnpm list lucide-react` output
- [x] Optional: `/apps/frontend/src/lib/icons.ts` created with common icons exported
- [x] No build errors after installation

**Output Files**:
- `/apps/frontend/package.json` (modified - dependency added)
- `/apps/frontend/src/lib/icons.ts` (new, optional)

**Validation**:
```bash
# Check installation
pnpm --filter @cloutagent/frontend list lucide-react | grep lucide-react

# Verify no build errors
pnpm --filter @cloutagent/frontend build
```

---

### Task C2: Replace Button Emojis with Icons
**ID**: `DESIGN-011`
**Priority**: 🟡 HIGH
**Agent**: `frontend-engineer`
**Duration**: 3 hours
**Dependencies**: C1 (Lucide React must be installed)
**Can run parallel with**: C3 (different scope)

**Objective**: Replace all emoji usage in buttons with SVG icons

**Context**:
Buttons currently use emojis which look unprofessional. Replace with Lucide icons for consistent, customizable appearance.

**Target Files**:
- `/apps/frontend/src/components/FlowCanvas.tsx`
- `/apps/frontend/src/components/ProjectList.tsx`
- `/apps/frontend/src/App.tsx` (if applicable)
- Any other components with emoji buttons

**Implementation Pattern**:

**BEFORE**:
```tsx
<button className="btn-primary-coral">
  ▶️ Run Workflow
</button>

<button className="btn-ghost">
  📦 Variables
</button>

<button className="btn-primary-coral">
  🚀 Open Visual Workflow Builder
</button>
```

**AFTER**:
```tsx
import { Play, Package, Rocket } from 'lucide-react';

<button className="btn-primary-coral flex items-center gap-2">
  <Play className="w-4 h-4" />
  Run Workflow
</button>

<button className="btn-ghost flex items-center gap-2">
  <Package className="w-4 h-4" />
  Variables
</button>

<button className="btn-primary-coral flex items-center gap-2">
  <Rocket className="w-4 h-4" />
  Open Visual Workflow Builder
</button>
```

**Icon Mapping**:
| Emoji | Lucide Icon | Import |
|-------|-------------|--------|
| ▶️ | `Play` | `import { Play } from 'lucide-react'` |
| 📦 | `Package` | `import { Package } from 'lucide-react'` |
| 🚀 | `Rocket` | `import { Rocket } from 'lucide-react'` |
| 🧪 | `Zap` | `import { Zap } from 'lucide-react'` |
| ⏸️ | `Pause` | `import { Pause } from 'lucide-react'` |
| 🔁 | `RotateCw` | `import { RotateCw } from 'lucide-react'` |
| ❌ | `X` or `Trash2` | `import { X, Trash2 } from 'lucide-react'` |

**Common Icon Sizes**:
- Buttons: `w-4 h-4` (16px)
- Large buttons: `w-5 h-5` (20px)
- Headings: `w-6 h-6` (24px)

**Acceptance Criteria**:
- [x] All button emojis replaced with Lucide icons
- [x] Icon size consistent (`w-4 h-4` for standard buttons)
- [x] Icons positioned before text with `flex items-center gap-2`
- [x] Imports at top of each file
- [x] No emoji characters remain in button text
- [x] Visual test: Icons render correctly and look professional

**Output Files**:
- `/apps/frontend/src/components/FlowCanvas.tsx` (modified)
- `/apps/frontend/src/components/ProjectList.tsx` (modified)
- Any other files with emoji buttons

**Validation**:
```bash
# Search for emojis in button text (should find zero in buttons)
grep -rn "▶️\|📦\|🚀\|🧪\|⏸️" apps/frontend/src/components/ | grep "<button"

# Visual test
pnpm --filter @cloutagent/frontend dev
# Check buttons have icons, not emojis
```

---

### Task C3: Add Consistent Border Radius Variables
**ID**: `DESIGN-012`
**Priority**: 🟡 HIGH
**Agent**: `frontend-engineer`
**Duration**: 1 hour
**Dependencies**: None
**Can run parallel with**: C2

**Objective**: Define and apply consistent border-radius values

**Context**:
Currently mix of `rounded-lg` (8px) and `rounded-xl` (12px) with no clear standard. Need consistency.

**Task Details**:
1. Add radius variables to CSS
2. Update button classes to use consistent radius
3. Document radius usage

**Implementation**:

**Add to index.css** (in `:root` section):
```css
:root {
  /* Existing variables... */

  /* === BORDER RADIUS === */
  --radius-sm: 6px;      /* Small elements, tags */
  --radius-md: 10px;     /* Buttons, inputs */
  --radius-lg: 16px;     /* Cards */
  --radius-xl: 20px;     /* Panels, modals */
  --radius-2xl: 24px;    /* Large containers */
}
```

**Update button classes** (replace rounded-xl):
```css
.btn-primary-coral {
  border-radius: var(--radius-md);  /* Was rounded-xl */
  /* ... rest unchanged */
}

.btn-glass {
  border-radius: var(--radius-md);
  /* ... rest unchanged */
}

.btn-ghost {
  border-radius: var(--radius-md);
  /* ... rest unchanged */
}

.btn-destructive {
  border-radius: var(--radius-md);
  /* ... rest unchanged */
}
```

**Update card classes**:
```css
.card-glass {
  border-radius: var(--radius-lg);  /* Was rounded-2xl */
  /* ... rest unchanged */
}
```

**Acceptance Criteria**:
- [x] Radius variables defined in `:root`
- [x] All button classes use `var(--radius-md)` (10px)
- [x] Card classes use `var(--radius-lg)` (16px)
- [x] Panel classes use `var(--radius-xl)` (20px)
- [x] Consistent radius throughout app
- [x] No hardcoded `rounded-*` classes in new code

**Output Files**:
- `/apps/frontend/src/index.css` (modified)

**Validation**:
```bash
# Verify CSS compiles
pnpm --filter @cloutagent/frontend build
```

---

### Task C4: Create Typography Scale
**ID**: `DESIGN-013`
**Priority**: 🟡 HIGH
**Agent**: `ui-ux-designer`
**Duration**: 2 hours
**Dependencies**: None
**Can run parallel with**: All other C tasks

**Objective**: Define complete typography system with scales and utilities

**Context**:
Current app lacks defined type scale. Need system similar to n8n/Apple for consistent text sizing and hierarchy.

**Implementation**:

**Add to index.css**:
```css
:root {
  /* === TYPOGRAPHY SCALE === */

  /* Font sizes */
  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 15px;
  --text-lg: 17px;
  --text-xl: 21px;
  --text-2xl: 28px;
  --text-3xl: 42px;
  --text-4xl: 56px;

  /* Font weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Line heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* Letter spacing */
  --tracking-tighter: -0.04em;
  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.01em;
}

/* === TYPOGRAPHY UTILITIES === */

/* Headings */
.heading-1 {
  font-size: var(--text-4xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

.heading-2 {
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

.heading-3 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-normal);
}

.heading-4 {
  font-size: var(--text-xl);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
}

/* Body text */
.text-body {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
}

.text-body-sm {
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
}

/* Labels */
.text-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

/* Caption */
.text-caption {
  font-size: var(--text-xs);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--text-secondary);
}
```

**Acceptance Criteria**:
- [x] Typography variables defined in `:root`
- [x] Font size scale from xs (11px) to 4xl (56px)
- [x] Font weight scale (400-700)
- [x] Line height scale (tight, normal, relaxed)
- [x] Letter spacing scale (tighter to wide)
- [x] Utility classes for common text styles
- [x] Comments explain usage of each utility

**Output Files**:
- `/apps/frontend/src/index.css` (modified)

**Validation**:
```bash
pnpm --filter @cloutagent/frontend build
```

---

### Phase 2 Completion Gate

**Before proceeding to Phase 3**:
- [ ] All Phase 2 tasks (C1-C4) completed
- [ ] Visual test: No emojis in buttons, only SVG icons
- [ ] Consistency test: All buttons same border radius
- [ ] Typography test: Headings use defined scale
- [ ] Build succeeds: `pnpm build` passes

**Phase 2 Deliverable**: Professional icons, consistent styling, complete design system

---

## Phase 3: Medium Priority Refinement (Days 7-10)

### Task D1: Spacing Audit and Standardization
**ID**: `DESIGN-020`
**Priority**: 🟢 MEDIUM
**Agent**: `frontend-engineer`
**Duration**: 3 hours
**Dependencies**: None

**Objective**: Ensure consistent spacing throughout application

**Context**:
Need to verify all components use consistent spacing scale (4px base unit).

**Task Details**:
1. Audit components for spacing inconsistencies
2. Define spacing scale if not exists
3. Replace arbitrary padding/margin values

**Implementation**:

**Add to index.css** (if not exists):
```css
:root {
  /* === SPACING SCALE (4px base) === */
  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
}
```

**Audit Commands**:
```bash
# Find arbitrary spacing values (not multiples of 4)
grep -rn "padding:.*[13579]px" apps/frontend/src/
grep -rn "margin:.*[13579]px" apps/frontend/src/
grep -rn "gap:.*[13579]px" apps/frontend/src/
```

**Acceptance Criteria**:
- [x] Spacing variables defined
- [x] All padding/margin values are multiples of 4px
- [x] Components use consistent spacing
- [x] No arbitrary spacing values (e.g., 15px, 22px)

**Output Files**:
- `/apps/frontend/src/index.css` (modified)
- Various component files (if spacing corrections needed)

---

### Task D2: Update Node Palette Styling
**ID**: `DESIGN-021`
**Priority**: 🟢 MEDIUM
**Agent**: `frontend-engineer`
**Duration**: 2 hours
**Dependencies**: Phase 1 complete (colors defined)

**Objective**: Apply glassmorphic styling to node palette panel

**Context**:
Node palette should match overall design system with glass effects.

**Task Details**:
1. Open `/apps/frontend/src/components/NodePalette.tsx`
2. Apply `.glass-strong` to panel background
3. Ensure consistent border radius and spacing

**Acceptance Criteria**:
- [x] Node palette has glassmorphic background
- [x] Consistent with PropertyPanel styling
- [x] Proper border and shadow effects

**Output Files**:
- `/apps/frontend/src/components/NodePalette.tsx` (modified)

---

### Task D3: Visual Regression Testing
**ID**: `DESIGN-022`
**Priority**: 🟢 MEDIUM
**Agent**: `software-engineer-test`
**Duration**: 4 hours
**Dependencies**: All Phase 1 and 2 tasks complete

**Objective**: Create automated visual regression tests for design system

**Context**:
Prevent future regressions by capturing expected button/component appearance.

**Task Details**:
1. Set up visual regression testing (Playwright screenshots)
2. Capture baseline screenshots of key components
3. Create tests that fail if design changes unexpectedly

**Test Coverage**:
- Canvas toolbar buttons
- Node palette
- PropertyPanel
- Modal buttons
- Empty states

**Acceptance Criteria**:
- [x] Visual regression test suite created
- [x] Baseline screenshots captured
- [x] Tests pass on current implementation
- [x] Documentation for updating baselines

**Output Files**:
- `/tests/visual/` (new directory)
- Visual test files
- Baseline screenshot images

---

### Task D4: Design System Documentation
**ID**: `DESIGN-023`
**Priority**: 🟢 MEDIUM
**Agent**: `ui-ux-designer`
**Duration**: 3 hours
**Dependencies**: All other tasks complete

**Objective**: Create comprehensive design system documentation

**Context**:
Document all design decisions, variables, and usage patterns for future reference.

**Task Details**:
1. Create `/docs/cloutagent/DESIGN_SYSTEM.md`
2. Document all CSS variables
3. Provide usage examples
4. Include dos and don'ts

**Content Structure**:
```markdown
# CloutAgent Design System

## Colors
- Primary accent
- Functional colors
- Text hierarchy

## Typography
- Font scale
- Weight scale
- Usage guidelines

## Spacing
- Base unit
- Scale
- Component spacing

## Components
- Buttons (4 variants)
- Cards
- Panels
- Forms

## Examples
- Code snippets
- Visual examples
- Common patterns
```

**Acceptance Criteria**:
- [x] Complete design system documentation created
- [x] All CSS variables documented
- [x] Usage examples provided
- [x] Dos and don'ts included

**Output Files**:
- `/docs/cloutagent/DESIGN_SYSTEM.md` (new)

---

### Phase 3 Completion Gate

**Before marking project complete**:
- [ ] All Phase 3 tasks (D1-D4) completed
- [ ] Visual regression tests passing
- [ ] Design system documented
- [ ] No design inconsistencies remain
- [ ] Full app build and test passing

**Phase 3 Deliverable**: Complete, documented, tested design system

---

## Agent Assignment Summary

### Agents Required (4-6 concurrent)

1. **ui-ux-designer** (2 agents)
   - Task A1: Color system definition
   - Task A3: Button usage documentation
   - Task C4: Typography scale
   - Task D4: Design system documentation

2. **frontend-engineer** (3-4 agents)
   - Task A2: Button utility classes
   - Task B1: FlowCanvas refactor
   - Task B2: ExecutionControls refactor
   - Task B3: ProjectList refactor
   - Task B4: Remaining components
   - Task C1: Install icons
   - Task C2: Replace emojis
   - Task C3: Border radius
   - Task D1: Spacing audit
   - Task D2: Node palette styling

3. **software-engineer-test** (1 agent)
   - Task D3: Visual regression tests

### Parallel Execution Plan

**Day 1-2 (Phase 1 Start)**:
```
Agent 1 (UI/UX): A1 (Color system)
Agent 2 (UI/UX): A3 (Documentation)
Agent 3 (Frontend): A2 (Button classes)
```

**Day 2-3 (Phase 1 Complete)**:
```
Agent 4 (Frontend): B1 (FlowCanvas) [after A2]
Agent 5 (Frontend): B2 (ExecutionControls) [after B1]
Agent 6 (Frontend): B3 (ProjectList) [after B1]
```

**Day 3 (Phase 1 Finish)**:
```
Agent 4: B4 (Remaining components) [after B1,B2,B3]
```

**Day 4-5 (Phase 2)**:
```
Agent 3: C1 (Install icons)
Agent 4: C2 (Replace emojis) [after C1]
Agent 5: C3 (Border radius)
Agent 1: C4 (Typography)
```

**Day 6-10 (Phase 3)**:
```
Agent 3: D1 (Spacing)
Agent 4: D2 (Node palette)
Agent 6 (Test): D3 (Visual tests)
Agent 2: D4 (Documentation)
```

---

## Success Criteria & Validation

### Phase 1 Success Criteria
- [ ] Zero `bg-green-`, `bg-blue-`, `bg-red-`, `bg-purple-` in button classes
- [ ] Only ONE coral primary button per screen
- [ ] All buttons use utility classes
- [ ] Visual hierarchy clear and professional

### Phase 2 Success Criteria
- [ ] Zero emoji characters in button text
- [ ] All buttons have SVG icons
- [ ] Consistent border radius throughout
- [ ] Typography scale defined and applied

### Phase 3 Success Criteria
- [ ] Spacing consistent (4px increments)
- [ ] Visual regression tests passing
- [ ] Design system fully documented
- [ ] No design debt remaining

### Final Validation Checklist

```bash
# 1. Code quality
pnpm --filter @cloutagent/frontend exec tsc --noEmit
pnpm --filter @cloutagent/frontend exec eslint src/

# 2. Build succeeds
pnpm --filter @cloutagent/frontend build

# 3. Tests pass
pnpm --filter @cloutagent/frontend test

# 4. No bright colors remain
grep -r "bg-green-[0-9]" apps/frontend/src/components/ | grep button
grep -r "bg-blue-[0-9]" apps/frontend/src/components/ | grep button
grep -r "bg-red-[0-9]" apps/frontend/src/components/ | grep button
grep -r "bg-purple-[0-9]" apps/frontend/src/components/ | grep button
# Should return zero results

# 5. No emojis in buttons
grep -rn "▶️\|📦\|🚀\|🧪" apps/frontend/src/components/ | grep "<button"
# Should return zero results

# 6. Visual test
pnpm --filter @cloutagent/frontend dev
# Manual verification:
# - Only one coral button per screen
# - Buttons have icons, not emojis
# - Visual hierarchy clear
# - Looks professional like n8n/Apple/Anthropic
```

---

## Risk Mitigation

### Potential Risks

**Risk 1**: Breaking existing functionality while refactoring
- **Mitigation**: Each task includes TypeScript validation step
- **Rollback**: Git commits after each task completion

**Risk 2**: Design inconsistencies between agents
- **Mitigation**: Tasks A1-A3 establish foundation before parallel work
- **Mitigation**: B1 establishes pattern that B2-B4 follow

**Risk 3**: Performance impact from icon library
- **Mitigation**: Lucide React is tree-shakeable (only imports used icons)
- **Mitigation**: Bundle size validation before merging

**Risk 4**: Visual regression test brittleness
- **Mitigation**: Use threshold-based pixel comparison, not exact match
- **Mitigation**: Separate baseline update process

---

## Communication Protocol

### Agent Check-ins

Each agent should update `.claude/agent-change-log.md` upon task completion:

```markdown
## [Timestamp] - [Agent Type]

**Task**: DESIGN-XXX - Task Name
**Status**: Complete ✅ / Blocked ⚠️ / Failed ❌

**Files Modified**:
- path/to/file1.tsx
- path/to/file2.css

**Changes Made**:
- Brief description of changes

**Testing**:
- [ ] TypeScript compiles
- [ ] Build succeeds
- [ ] Visual verification done

**Blockers**: None / Describe blocker

**Next Agent**: Can proceed with DESIGN-YYY
```

### Handoff Points

**Critical Handoffs** (Sequential dependencies):
1. A2 → B1: Button classes must exist before refactoring FlowCanvas
2. B1 → B2,B3,B4: FlowCanvas pattern establishes convention for others
3. C1 → C2: Icons must be installed before replacing emojis

**Parallel Work** (No coordination needed):
- A1, A2, A3 can run simultaneously
- B2, B3 can run simultaneously after B1
- C2, C3, C4 can run simultaneously after C1
- D1, D2, D4 can run simultaneously

---

## Timeline & Milestones

### Week 1: Critical Fixes

**Day 1**: Foundation
- Tasks A1, A2, A3 complete
- **Milestone**: Button system defined

**Day 2-3**: Component Refactoring
- Tasks B1, B2, B3, B4 complete
- **Milestone**: All buttons use professional colors

**Day 3 End**: Phase 1 Complete
- **Gate Review**: Visual test, grep test, build test
- **Deliverable**: Professional button hierarchy app-wide

### Week 2: High Priority & Polish

**Day 4-5**: Icons & Consistency
- Tasks C1, C2, C3, C4 complete
- **Milestone**: Icons implemented, design system complete

**Day 6**: Phase 2 Complete
- **Gate Review**: Icon test, consistency test
- **Deliverable**: Complete design system with icons

**Day 7-9**: Final Refinement
- Tasks D1, D2, D3 complete
- **Milestone**: Spacing consistent, tests created

**Day 10**: Project Complete
- Task D4 complete
- Final validation
- **Deliverable**: Documented, tested, professional design system

---

## Appendix: Task Dependency Graph

```
Phase 1 (Critical)
==================
A1 (Color vars)  ─┐
A2 (Button classes)─┼─→ B1 (FlowCanvas) ─┬─→ B4 (Remaining)
A3 (Documentation)─┘                      │
                                          ├─→ B2 (ExecControls)
                                          └─→ B3 (ProjectList)

Phase 2 (High Priority)
=======================
C1 (Install icons) ─→ C2 (Replace emojis)

C3 (Border radius) ─┐
C4 (Typography)    ─┴─→ Phase 3

Phase 3 (Medium Priority)
==========================
D1 (Spacing) ─┐
D2 (Palette) ─┼─→ D3 (Visual tests) ─→ D4 (Documentation)
All Phase 1+2─┘
```

---

## Estimated Hours Breakdown

**Phase 1**: 20 hours
- A1: 2h
- A2: 3h
- A3: 1h
- B1: 2h
- B2: 1.5h
- B3: 1h
- B4: 2h
- Buffer: 7.5h

**Phase 2**: 24 hours
- C1: 0.5h
- C2: 3h
- C3: 1h
- C4: 2h
- Buffer: 17.5h

**Phase 3**: 18 hours
- D1: 3h
- D2: 2h
- D3: 4h
- D4: 3h
- Buffer: 6h

**Total**: 62 hours + 31h buffer = **93 hours** (conservative estimate with padding)

**Aggressive estimate**: 60 hours (no buffer, assumes smooth execution)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-02
**Status**: Ready for execution
