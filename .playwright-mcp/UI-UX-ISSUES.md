# UI/UX Issues Discovery Report
**Date**: 2025-10-14
**Frontend**: http://localhost:3002
**Backend**: http://localhost:3001

## Testing Coverage
- [x] Responsive design (mobile, tablet, desktop)
- [x] Flow configuration UI
- [x] Input/output configuration mechanisms
- [x] Flow execution functionality
- [x] Navigation and user flows
- [x] Form validation and error handling
- [x] Loading states and feedback
- [x] Dark/Light mode switching

---

## Issues Found

### ISSUE #1: Mobile Layout - Text and Button Overlap
**Severity**: HIGH
**Screen Size**: Mobile (375x667)
**Location**: Home page
**Description**: On mobile view, the UI layout appears cramped. The structure shows all elements are present but may have spacing/sizing issues.
**Expected**: Proper mobile-responsive layout with adequate spacing and touch targets
**Screenshot**: `.playwright-mcp/mobile-home.png`
**Files to Check**:
- `apps/frontend/src/pages/HomePage.tsx`
- Mobile CSS/responsive design utilities

### ISSUE #2: Validation Errors on New Project Creation
**Severity**: CRITICAL
**Location**: Workflow canvas (immediately after creating project)
**Description**: New project created with validation errors:
- "Agent node must have a model configured"
- "Agent node must have a system prompt"
- Warning: "Consider adding subagents for parallel task execution"
**Expected**: Either create project with valid defaults OR guide user through configuration wizard
**Screenshot**: `.playwright-mcp/mobile-canvas.png`
**Files to Check**:
- `apps/frontend/src/components/nodes/AgentNode.tsx`
- Project creation logic
- Default node configuration

### ISSUE #3: Mobile Canvas UI - Controls Overlapping
**Severity**: HIGH
**Screen Size**: Mobile (375x667)
**Location**: Workflow canvas
**Description**: Multiple UI elements competing for limited mobile screen space:
- Left sidebar (Components panel)
- Canvas area
- Bottom-right controls (zoom, minimap)
- Bottom status bar
- Error panel at bottom
All elements are visible but likely overlapping or too small to use effectively
**Expected**: Mobile-optimized layout with collapsible panels, larger touch targets
**Screenshot**: `.playwright-mcp/mobile-canvas.png`
**Files to Check**:
- `apps/frontend/src/components/Canvas.tsx`
- `apps/frontend/src/components/Sidebar.tsx`
- Mobile responsive styles

### ISSUE #4: Real-time Validation Not Updating
**Severity**: MEDIUM
**Location**: Node configuration panel
**Description**: After filling in the "System Prompt" field, the error "Agent node must have a system prompt" still appears in the error panel. The validation state is not updating in real-time after user input.
**Expected**: Errors should clear immediately when validation criteria are met
**Screenshot**: Current state shows filled prompt but error persists
**Files to Check**:
- `apps/frontend/src/hooks/useNodeValidation.ts` or similar validation hooks
- Node property form change handlers
- Error display component

### ISSUE #5: Model Selection Validation Issue
**Severity**: MEDIUM
**Location**: Node configuration
**Description**: Initial error states "Agent node must have a model configured" but the dropdown shows "Claude Sonnet 4.5" is selected. Either the default is not being recognized by validation, or validation is not checking properly.
**Expected**: Default model selection should be valid or validation should recognize the selected model
**Files to Check**:
- Default node configuration
- Model validation logic
- `apps/frontend/src/components/nodes/AgentNode.tsx`

### ISSUE #6: No Visual Feedback for Node Addition
**Severity**: LOW
**Location**: Components sidebar
**Description**: Clicking a component in the sidebar adds it to the canvas, but there's no immediate visual feedback (animation, highlight, or notification) that the action succeeded.
**Expected**: Visual feedback like a brief animation, toast notification, or highlighted node when added
**Screenshot**: `.playwright-mcp/two-nodes-disconnected.png`
**Files to Check**:
- `apps/frontend/src/components/Sidebar.tsx`
- Node addition handlers

### ISSUE #7: Nodes Added Without Connections
**Severity**: MEDIUM
**Location**: Canvas workflow builder
**Description**: When adding new nodes via sidebar, they are placed on canvas but not automatically connected. This creates immediate validation errors about disconnected nodes. For common patterns (like Agent → Subagent), auto-connection would improve UX.
**Expected**: Either auto-connect new nodes to selected node OR provide connection hints/wizard
**Screenshot**: `.playwright-mcp/two-nodes-disconnected.png`
**Files to Check**:
- Node addition logic
- Auto-layout/auto-connection utilities

### ISSUE #8: CRITICAL - Workflow Execution Fails with Circular JSON Error
**Severity**: CRITICAL
**Location**: Workflow execution
**Description**: Clicking "Run Workflow" fails with error:
```
Failed to start execution: TypeError: Converting circular structure to JSON
```
This is a blocking issue preventing any workflow execution. The workflow data structure contains circular references that cannot be serialized.
**Expected**: Workflow should execute successfully or validation should prevent execution with incomplete configuration
**Console Error**: "Failed to start execution: TypeError: Converting circular structure to JSON"
**Files to Check**:
- `apps/frontend/src/services/workflowService.ts` or execution service
- Workflow serialization logic
- `apps/backend/src/routes/executions.ts`
- Data transformation before API call

### ISSUE #9: Validation Does Not Block Execution
**Severity**: HIGH
**Location**: Workflow execution
**Description**: Despite having 2 validation errors visible ("Subagent node must have a type configured", "Subagent node must have a prompt"), the "Run Workflow" button remains enabled and clickable. This allows users to attempt execution with invalid configuration.
**Expected**: "Run Workflow" button should be disabled when validation errors exist, with tooltip explaining why
**Files to Check**:
- Run button enable/disable logic
- Validation state management
- Button component

---

## Summary Statistics

**Total Issues Found**: 9
- **CRITICAL**: 1 (Workflow execution fails with circular JSON)
- **HIGH**: 3 (Mobile layout, validation blocking, canvas controls)
- **MEDIUM**: 4 (Validation updates, model selection, auto-connection, visual feedback)
- **LOW**: 1 (Visual feedback for node addition)

## Priority Fixes

### Must Fix (Blocking)
1. **ISSUE #8**: Circular JSON error preventing workflow execution
2. **ISSUE #9**: Validation not blocking execution

### Should Fix (User Experience)
3. **ISSUE #2**: Default project creation with validation errors
4. **ISSUE #4**: Real-time validation not updating
5. **ISSUE #3**: Mobile canvas UI overlapping

### Nice to Have (Enhancements)
6. **ISSUE #7**: Auto-connect nodes on addition
7. **ISSUE #6**: Visual feedback for node addition
8. **ISSUE #1**: Mobile home page layout
9. **ISSUE #5**: Model selection validation

## Test Results

✅ **Working Well**:
- Dark/Light mode switching
- Node configuration panel UI
- Variables panel
- Node connection via drag-and-drop
- Validation error display
- Cost estimation display
- Canvas zoom/pan controls
- Component sidebar

❌ **Critical Failures**:
- Workflow execution (circular JSON error)
- Pre-execution validation blocking

⚠️ **Needs Improvement**:
- Mobile responsive design
- Real-time validation updates
- Initial project state
- Connection workflow

## Screenshots Reference
- `desktop-home.png` - Desktop home page
- `mobile-home.png` - Mobile home page (375x667)
- `mobile-canvas.png` - Mobile canvas view
- `tablet-canvas.png` - Tablet canvas view (768x1024)
- `tablet-dark-mode.png` - Tablet dark mode
- `desktop-canvas.png` - Desktop canvas view (1920x1080)
- `node-config-panel.png` - Node configuration panel
- `two-nodes-disconnected.png` - Disconnected nodes
- `nodes-connected.png` - Connected nodes
- `variables-panel.png` - Variables panel
- `dark-mode.png` - Dark mode theme

