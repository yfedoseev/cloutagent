# UI/UX Issues - CloutAgent Workflow Builder

**Testing Date:** 2025-10-14
**Browser:** Chromium (Playwright)
**Screen Size:** Default (1280x720)

## Critical Issues

### 1. ✅ FIXED - APPLICATION CRASH - Property Panel Cannot Open
**Severity:** CRITICAL - BLOCKS ALL FUNCTIONALITY
**Location:** AgentProperties component
**Issue:** Application completely crashed when clicking on any agent node to open the property panel.

**Status:** FIXED ✅
**Fix Applied:** Changed `usePropertyForm.ts` to use inline config extraction instead of calling `useNodeConfig` hook inside `useEffect`

---

### 2. Toolbar Layout - Controls Overlapping
**Severity:** HIGH
**Location:** Top navigation bar
**Issue:** The workflow controls (Run Workflow, Save, Reset View, History, Clear Canvas) are positioned in the center of the navbar, but this creates overlap/collision issues with the project name on the right and back button on the left.

**Current State:**
- Controls rendered via portal to `#workflow-toolbar` div
- Centered positioning causes layout issues
- No responsive behavior defined

**Expected:** Controls should have proper spacing and responsive layout that doesn't overlap with other navbar elements

---

### 2. Node Has Configuration Errors on Load
**Severity:** HIGH
**Location:** Default agent node on canvas
**Issue:** The pre-loaded agent node shows 2 errors and 1 warning:
- "Agent node must have a model configured"
- "Agent node must have a system prompt"
- "Consider adding subagents for parallel task execution"

**Current State:**
- Node shows "Claude Agent" with "Sonnet 4.5" but validation says model not configured
- System prompt is empty

**Expected:** Default node should either:
1. Have valid defaults that pass validation, OR
2. Not show validation errors until user attempts to run

---

## High Priority Issues

### 3. Validation Panel Always Visible
**Severity:** MEDIUM
**Location:** Right panel
**Issue:** The validation panel with errors/warnings is always visible and takes up significant screen space, even for minor issues.

**Expected:**
- Panel should be collapsible
- Could be minimized to just an icon/badge showing count
- Should not block workflow building for non-critical warnings

---

### 4. Missing Theme Toggle Visibility
**Severity:** MEDIUM
**Location:** Top navigation bar
**Issue:** The theme toggle button shows "Switch to dark mode" but the icon/visual state is not clear in light mode.

**Expected:** Better visual indicator of current theme and toggle state

---

## Medium Priority Issues

### 5. No Visual Feedback for Drag and Drop
**Severity:** MEDIUM
**Location:** Node Palette
**Issue:** Instructions say "Drag to canvas or click to add" but there's no visual feedback when starting to drag a component.

**Expected:**
- Cursor should change when hovering over draggable items
- Visual feedback during drag operation
- Drop zone indicators on canvas

---

### 6. Canvas Empty State After Adding Node
**Severity:** LOW
**Location:** Canvas
**Issue:** After the default node is added, there's no guidance on next steps or how to connect nodes.

**Expected:** Show contextual help or tooltips for first-time users

---

## Testing Notes

### Observations from Initial Load:
1. ✅ Light mode renders correctly
2. ✅ Default agent node appears on canvas
3. ✅ Node Palette is visible and organized
4. ✅ Test Mode toggle is visible
5. ✅ Workflow estimate shows in bottom-left
6. ⚠️ Validation errors appear immediately
7. ⚠️ No clear workflow to resolve validation errors

---

---

### 7. Property Panel - Model Already Selected But Shows Error
**Severity:** HIGH
**Location:** Agent property panel validation
**Issue:** The node shows "Sonnet 4.5" on canvas and "Claude Sonnet 4.5" is selected in the dropdown, but validation still says "Agent node must have a model configured"

**Current State:**
- Model dropdown shows "Claude Sonnet 4.5" selected
- Node displays "Sonnet 4.5"
- Validation panel shows error: "Agent node must have a model configured"

**Expected:** If model is selected, validation should pass

---

### 8. Property Panel - Wide Panel Reduces Canvas Space
**Severity:** MEDIUM
**Location:** Right-side property panel
**Issue:** The property panel is very wide (~400-500px), reducing usable canvas space significantly.

**Observations:**
- Panel contains: header, duplicate/delete buttons, 5 sections (Basic Info, System Prompt, Advanced, Tools, Cost estimate)
- Panel is not resizable
- No collapse/expand functionality
- Takes up ~30-40% of screen width

**Expected:**
- Panel should be resizable
- Should have collapse/minimize button
- Could use tabs or accordion to reduce vertical space

---

### 9. No Visual Connection Between Validation and Property Panel
**Severity:** MEDIUM
**Location:** Validation panel + Property panel
**Issue:** When viewing a validation error, it's not clear which field needs to be fixed in the property panel.

**Expected:**
- Clicking "View node" in validation error should highlight the problematic field
- Could scroll to and flash the relevant section
- Field with error could have red border or icon

---

### 10. System Prompt Validation Inconsistent
**Severity:** MEDIUM
**Location:** Agent configuration
**Issue:** Validation requires system prompt but many use cases don't need one (agents can work with just model and tools).

**Expected:**
- System prompt should be optional, not required
- Or provide better default system prompts
- Warning instead of error for missing system prompt

---

## Property Panel UI/UX Observations

### Positive Elements:
1. ✅ Clean, organized layout with clear sections
2. ✅ Good use of headings and descriptions
3. ✅ Helpful tooltips/hints below fields
4. ✅ Auto-save indicator visible
5. ✅ Cost estimate shown at bottom

### Issues Identified:
1. ⚠️ Too wide, reduces canvas space
2. ⚠️ Not resizable
3. ⚠️ No minimize/collapse button
4. ⚠️ Long scroll for all fields
5. ⚠️ No keyboard shortcuts visible
6. ⚠️ Duplicate/Delete buttons could be in overflow menu

---

---

## Responsive Design Issues

### 11. 🔴 Mobile (375px) - Completely Broken Layout
**Severity:** CRITICAL
**Device:** iPhone SE / Small mobile (375x667)
**Issue:** Application is completely unusable on mobile devices

**Problems Identified:**
1. **Property Panel Fullscreen**: Takes entire screen, no way to see canvas
2. **Toolbar Overflow**: All buttons stack and overlap in navbar
3. **Node Palette**: Left sidebar also takes full width
4. **Canvas Not Visible**: With sidebars open, canvas is completely hidden
5. **No Mobile Navigation**: No hamburger menu or mobile-optimized layout
6. **Controls Too Small**: Buttons and text too small to tap easily
7. **Validation Panel**: Takes up bottom of screen, blocking content

**Impact:** Application cannot be used on mobile devices at all

**Expected:**
- Responsive layout with collapsible sidebars
- Mobile-optimized navigation (hamburger menu)
- Full-screen property panel on mobile with back button
- Touch-friendly button sizes (min 44x44px)
- Bottom sheet or drawer pattern for properties
- Hide validation panel by default on mobile

---

### 12. 🔴 API Rate Limiting Error - Dry Run Endpoint
**Severity:** HIGH
**Location:** Backend API `/api/dry-run`
**Issue:** Massive number of 429 errors from dry-run endpoint

**Error Pattern:**
```
Failed to load resource: the server responded with a status of 429 (Too Many Requests)
Dry run failed: SyntaxError: Unexpected token 'T', "Too many r"... is not valid JSON
```

**Observed Behavior:**
- 60+ consecutive 429 errors in ~2 seconds
- Happens when property panel closes or node updates
- Frontend making excessive API calls
- No exponential backoff or rate limit handling

**Root Causes:**
1. Auto-save triggering on every keystroke (debounce not working?)
2. Validation running on every render
3. No request deduplication
4. Backend has rate limit but frontend doesn't respect it

**Fix Required:**
- Implement proper request debouncing (500-1000ms)
- Add request deduplication/cancellation
- Implement exponential backoff
- Show user-friendly rate limit message
- Consider reducing validation frequency

---

### 13. ✅ Model Validation Fixed
**Status:** RESOLVED
**Note:** The "Agent node must have a model configured" error is now resolved after closing and reopening the panel. Model validation is working correctly.

---

## Next: Test Responsive Design

Will test tablet and larger desktop sizes to identify responsive design issues.
