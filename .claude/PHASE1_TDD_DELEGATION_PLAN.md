# Phase 1 TDD Agent Delegation Plan

## Overview
Execute Phase 1 critical design gap fixes using Test-Driven Development with parallel agent coordination.

**Date**: 2025-10-02
**Methodology**: TDD (Test → Code → Fix)
**Agents**: 3 specialized agents working in parallel
**Estimated Time**: 40-60 hours total (12-18 hours with 3 agents)

---

## Agent Assignments

### 🧪 Agent 1: software-engineer-test (Test Engineer)
**Role**: Write comprehensive tests BEFORE implementation
**Files**: All `.test.tsx` and `.test.ts` files
**Deliverables**:
1. Node component tests (AgentNode, SubagentNode, HookNode, MCPNode)
2. Canvas enhancement tests (FlowCanvas improvements)
3. Property panel tests (PropertyPanel overhaul)
4. Design system component tests (Tooltip, StatusBadge, etc.)

### 💻 Agent 2: frontend-engineer
**Role**: Implement components to pass tests
**Files**: Component implementations, stores, utilities
**Deliverables**:
1. Enhanced node components with status badges
2. Canvas visual improvements (grid, empty state)
3. Property panel redesign with slide-in UX
4. Integration with existing stores

### 🎨 Agent 3: ui-ux-designer
**Role**: Create design system components and style guidance
**Files**: Design system utilities, CSS, component library
**Deliverables**:
1. New utility components (Tooltip, StatusBadge, ToolbarButton)
2. CSS additions for animations and effects
3. Design tokens and theme extensions
4. Component usage documentation

---

## TDD Workflow

### Cycle 1: Enhanced Node Design (18-24 hours)

#### Step 1.1: Test Engineer - Write Node Tests (4-6 hours)
```bash
# Tasks:
- apps/frontend/src/components/nodes/AgentNode.test.tsx
  ✓ Test node renders with correct icon and name
  ✓ Test status badge displays correctly
  ✓ Test validation errors show on node
  ✓ Test connection handles are styled
  ✓ Test selection state with glow effect

- apps/frontend/src/components/nodes/SubagentNode.test.tsx
  ✓ Similar tests for subagent variant

- apps/frontend/src/components/nodes/HookNode.test.tsx
  ✓ Similar tests for hook variant

- apps/frontend/src/components/nodes/MCPNode.test.tsx
  ✓ Fix existing "undefined toolsEnabled" bug
  ✓ Test MCP-specific features
```

#### Step 1.2: UI/UX Designer - Create Design Components (6-8 hours)
```bash
# Tasks:
- apps/frontend/src/components/shared/StatusBadge.tsx
  ✓ Status badge component with icons
  ✓ Support for idle, running, success, error states
  ✓ Proper styling and animations

- apps/frontend/src/components/shared/ValidationBadge.tsx
  ✓ Enhanced validation badge with tooltips
  ✓ Error count display
  ✓ Pulse animation for errors

- apps/frontend/src/index.css
  ✓ Add node selection glow effect
  ✓ Add connection handle hover animations
  ✓ Add status badge transitions
```

#### Step 1.3: Frontend Engineer - Implement Enhanced Nodes (8-10 hours)
```bash
# Tasks:
- apps/frontend/src/components/nodes/AgentNode.tsx
  ✓ Implement new design with header/body structure
  ✓ Integrate StatusBadge component
  ✓ Add styled connection handles
  ✓ Fix "undefined" name bug
  ✓ Ensure all tests pass

- Repeat for SubagentNode, HookNode, MCPNode
- Update node type definitions if needed
- Test in browser with real workflow
```

---

### Cycle 2: Canvas Visual Improvements (10-14 hours)

#### Step 2.1: Test Engineer - Write Canvas Tests (3-4 hours)
```bash
# Tasks:
- apps/frontend/src/components/FlowCanvas.test.tsx
  ✓ Test grid background renders
  ✓ Test empty state shows when no nodes
  ✓ Test empty state hides when nodes added
  ✓ Test custom edge styling
  ✓ Test selection indicators
  ✓ Test mini-map styling
```

#### Step 2.2: UI/UX Designer - Create Canvas Components (3-4 hours)
```bash
# Tasks:
- apps/frontend/src/components/canvas/CanvasEmptyState.tsx
  ✓ Empty state component with instructions
  ✓ Glassmorphic design
  ✓ Icons and helpful tips

- apps/frontend/src/components/canvas/CustomEdge.tsx
  ✓ Animated edge with flow indicator
  ✓ Gradient styling
  ✓ Edge labels support

- apps/frontend/src/index.css
  ✓ Grid background pattern
  ✓ Edge animations
  ✓ Selection glow effects
```

#### Step 2.3: Frontend Engineer - Implement Canvas Improvements (4-6 hours)
```bash
# Tasks:
- apps/frontend/src/components/FlowCanvas.tsx
  ✓ Add CanvasEmptyState component
  ✓ Configure grid background
  ✓ Integrate CustomEdge component
  ✓ Update ReactFlow configuration
  ✓ Ensure all tests pass
  ✓ Verify visual appearance
```

---

### Cycle 3: Property Panel Overhaul (12-16 hours)

#### Step 3.1: Test Engineer - Write Panel Tests (4-5 hours)
```bash
# Tasks:
- apps/frontend/src/components/PropertyPanel.test.tsx
  ✓ Test panel slides in when node selected
  ✓ Test empty state when nothing selected
  ✓ Test property groups are collapsible
  ✓ Test inline validation displays
  ✓ Test quick actions (duplicate, delete)
  ✓ Test auto-save indicator
  ✓ Test panel closes on deselect
```

#### Step 3.2: UI/UX Designer - Create Panel Components (4-5 hours)
```bash
# Tasks:
- apps/frontend/src/components/shared/PropertyGroup.tsx
  ✓ Collapsible property group component
  ✓ Smooth expand/collapse animation
  ✓ Proper spacing and styling

- apps/frontend/src/components/shared/FormComponents.tsx
  ✓ TextField with inline validation
  ✓ SelectField with error states
  ✓ TextareaField for longer content
  ✓ Consistent styling across all fields

- apps/frontend/src/components/shared/Tooltip.tsx
  ✓ Tooltip component for help text
  ✓ Multiple placement options
  ✓ Accessible with keyboard navigation
```

#### Step 3.3: Frontend Engineer - Implement Panel Redesign (4-6 hours)
```bash
# Tasks:
- apps/frontend/src/components/PropertyPanel.tsx
  ✓ Redesign as slide-in right panel
  ✓ Add panel header with node info
  ✓ Implement empty state
  ✓ Add property groups
  ✓ Integrate inline validation
  ✓ Add quick action buttons
  ✓ Add auto-save indicator
  ✓ Update stores for panel state
  ✓ Ensure all tests pass
```

---

## Agent Coordination Protocol

### Communication Files
- **`.claude/agents-chat.md`** - Inter-agent communication
- **`.claude/agent-change-log.md`** - Track all changes

### Communication Templates

#### Test Engineer Posts:
```markdown
## [Timestamp] - Test Engineer (software-engineer-test)
**Cycle**: 1 - Enhanced Node Design
**Status**: Tests written ✓
**Files**:
- AgentNode.test.tsx (15 tests)
- SubagentNode.test.tsx (15 tests)
- HookNode.test.tsx (12 tests)
- MCPNode.test.tsx (14 tests - includes bug fix)

**Test Coverage**:
- Node rendering: 16 tests
- Status badges: 12 tests
- Validation display: 8 tests
- Connection handles: 8 tests
- Selection states: 12 tests

**Blockers**: None
**Next**: Waiting for frontend-engineer to implement
```

#### Frontend Engineer Posts:
```markdown
## [Timestamp] - Frontend Engineer
**Cycle**: 1 - Enhanced Node Design
**Status**: 40% complete
**Files Modified**:
- AgentNode.tsx (complete ✓)
- SubagentNode.tsx (in progress)

**Tests Passing**: 30/56 (53%)
**Blockers**: Need StatusBadge component from ui-ux-designer
**Next**: Complete remaining nodes, integrate StatusBadge when ready
```

#### UI/UX Designer Posts:
```markdown
## [Timestamp] - UI/UX Designer
**Cycle**: 1 - Enhanced Node Design
**Status**: Components ready ✓
**Files Created**:
- StatusBadge.tsx (complete)
- ValidationBadge.tsx (complete)
- index.css (node styles added)

**Output**: Components tested in Storybook, ready for integration
**Next**: Moving to Cycle 2 - Canvas components
```

---

## Dependency Management

### Parallel Work Streams

**Stream 1: Node Design**
```
Test Engineer (Cycle 1.1) ─┐
                           ├─→ Frontend Engineer (Cycle 1.3)
UI/UX Designer (Cycle 1.2) ─┘
```

**Stream 2: Canvas Improvements**
```
Test Engineer (Cycle 2.1) ─┐
                           ├─→ Frontend Engineer (Cycle 2.3)
UI/UX Designer (Cycle 2.2) ─┘
```

**Stream 3: Property Panel**
```
Test Engineer (Cycle 3.1) ─┐
                           ├─→ Frontend Engineer (Cycle 3.3)
UI/UX Designer (Cycle 3.2) ─┘
```

### Handoff Points

1. **Test → Implementation**: Frontend engineer starts when test suite ready
2. **Design → Implementation**: Frontend engineer integrates components as available
3. **Implementation → Validation**: All tests must pass before completion

---

## Success Criteria

### Per Cycle

- ✓ All tests pass (100% pass rate)
- ✓ Visual inspection confirms design matches spec
- ✓ No TypeScript errors
- ✓ No console warnings
- ✓ Accessibility tests pass
- ✓ Changes documented in agent-change-log.md

### Overall Phase 1

- ✓ All node types enhanced with status badges
- ✓ Canvas has grid background and empty state
- ✓ Property panel redesigned with slide-in UX
- ✓ All new components documented
- ✓ Integration tests pass
- ✓ User testing shows improvement in UX metrics

---

## Rollout Strategy

### Step 1: Launch Agents (Parallel)
```bash
# Launch all 3 agents simultaneously
Task 1: software-engineer-test (Cycle 1.1 - Node tests)
Task 2: ui-ux-designer (Cycle 1.2 - Design components)
Task 3: frontend-engineer (Waits for 1 & 2, then implements)
```

### Step 2: Monitor Progress
- Check `.claude/agents-chat.md` every 30 minutes
- Address blockers immediately
- Facilitate handoffs between agents

### Step 3: Integration & Testing
- Run full test suite after each cycle
- Visual inspection in browser
- Fix any integration issues
- Update documentation

### Step 4: Iterate
- Repeat for Cycles 2 and 3
- Continuous integration of components
- Regular progress updates

---

## Risk Mitigation

### Potential Issues

1. **Agent conflicts on same files**
   - Solution: Clear file ownership, use feature branches if needed

2. **Test-implementation mismatch**
   - Solution: Test engineer reviews implementation, updates tests if needed

3. **Design component delays**
   - Solution: Frontend engineer can stub components, integrate later

4. **Integration failures**
   - Solution: Dedicated integration testing phase, fix immediately

---

## Timeline Estimate

### With 3 Agents (Parallel)

- **Cycle 1**: 8-10 hours
- **Cycle 2**: 4-6 hours
- **Cycle 3**: 6-8 hours
- **Integration & Fixes**: 4-6 hours
- **Total**: 22-30 hours (vs 40-60 hours single-developer)

### Daily Schedule

**Day 1**: Cycle 1 (Node Design)
**Day 2**: Cycle 2 (Canvas) + Start Cycle 3
**Day 3**: Complete Cycle 3 (Property Panel)
**Day 4**: Integration testing and fixes

---

## Next Steps

1. ✓ Create delegation plan (this document)
2. Launch 3 agents with specific tasks
3. Monitor `.claude/agents-chat.md` for progress
4. Coordinate handoffs and resolve blockers
5. Run integration tests after each cycle
6. Document all changes
7. User testing and iteration

**Ready to launch agents!** 🚀
