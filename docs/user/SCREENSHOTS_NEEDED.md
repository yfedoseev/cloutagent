# Screenshots Needed for User Documentation

This document lists all screenshot placeholders in the user documentation that need to be created.

## Getting Started Guide

**File:** `getting-started.md`

1. **Successful Installation**
   - Context: Installation section
   - Shows: Terminal with dev servers running successfully
   - Highlights: Frontend and backend URLs, startup messages

2. **New Project Dialog**
   - Context: Your First Workflow > Step 1
   - Shows: Create project dialog with fields filled
   - Highlights: Name, description, create button

3. **Agent Node Configuration Panel**
   - Context: Your First Workflow > Step 2
   - Shows: Property panel with agent configuration
   - Highlights: Model selection, system prompt, temperature, max tokens

4. **Execution Panel with Streaming Output**
   - Context: Your First Workflow > Step 4
   - Shows: Workflow executing with real-time output
   - Highlights: Streaming text, progress indicator, token usage

5. **Execution Results**
   - Context: Your First Workflow > Step 5
   - Shows: Completed execution with all metrics
   - Highlights: Output, execution time, tokens used, cost, logs

## Visual Editor Guide

**File:** `guides/visual-editor.md`

6. **Full Editor Interface (Labeled)**
   - Context: Canvas Overview
   - Shows: Complete editor with all areas labeled
   - Highlights: Canvas, node palette, property panel, toolbar, mini-map

7. **Node Palette**
   - Context: Node Palette section
   - Shows: Full node palette with all node types
   - Highlights: Agent, Subagent, Hook, MCP, and utility nodes

8. **Property Panel - Agent Node**
   - Context: Property Panel section
   - Shows: Detailed agent configuration options
   - Highlights: All configurable properties and validation

9. **Toolbar with Tooltips**
   - Context: Toolbar section
   - Shows: Toolbar with tooltip showing on hover
   - Highlights: All toolbar actions with descriptions

10. **Quick-Add Menu**
    - Context: Adding Nodes > Method 2
    - Shows: Quick-add menu with search functionality
    - Highlights: Search box, filtered results, keyboard navigation

11. **Node Alignment Menu**
    - Context: Moving Nodes > Align and Distribute
    - Shows: Right-click context menu with alignment options
    - Highlights: All alignment and distribution options

12. **Connection Creation**
    - Context: Connecting Nodes > Method 1
    - Shows: User dragging connection from output to input port
    - Highlights: Connection line, ports, cursor

13. **Connection Context Menu**
    - Context: Editing Connections
    - Shows: Right-click menu on connection
    - Highlights: Delete, properties, reroute options

14. **Mini-Map Navigation**
    - Context: Canvas Navigation > Mini-map
    - Shows: Mini-map with viewport highlighted
    - Highlights: Current view rectangle, full workflow overview

15. **Keyboard Shortcuts Reference Overlay**
    - Context: Keyboard Shortcuts section
    - Shows: Overlay/modal showing all shortcuts
    - Highlights: Categorized shortcut list

16. **Auto-Layout Before/After**
    - Context: Advanced Features > Auto-layout
    - Shows: Side-by-side comparison
    - Highlights: Messy workflow → organized workflow

17. **Workflow with Comments**
    - Context: Advanced Features > Comments
    - Shows: Workflow with annotation comments
    - Highlights: Comment boxes, links to nodes

18. **Debug Mode Visualization**
    - Context: Tips and Tricks > Testing Workflows
    - Shows: Workflow executing in debug mode
    - Highlights: Data flowing through connections, node states

## Agent Configuration Guide

**File:** `guides/agent-configuration.md`

19. **Agent Configuration Panel - All Properties**
    - Context: Agent Basics section
    - Shows: Full property panel with all options visible
    - Highlights: Core and advanced properties

20. **Code Review Agent in Action**
    - Context: Example: Code Review Agent
    - Shows: Execution result with structured code review
    - Highlights: Review format, severity categories, suggestions

21. **Model Comparison Chart**
    - Context: Model Selection > Available Models
    - Shows: Table/chart comparing all three models
    - Highlights: Speed, cost, capabilities for each model

22. **Temperature Slider with Examples**
    - Context: Temperature section
    - Shows: Slider with output examples at different values
    - Highlights: 0.1, 0.5, 0.9 examples side-by-side

23. **Tool Selection Interface**
    - Context: Tool Configuration section
    - Shows: UI for enabling/disabling tools
    - Highlights: Available tools, checkboxes, descriptions

24. **A/B Test Comparison View**
    - Context: Testing Your Configuration
    - Shows: Side-by-side comparison of two configurations
    - Highlights: Metrics, outputs, cost comparison

## Testing Workflows Guide

**File:** `guides/testing-workflows.md`

25. **Dry Run Validation Results**
    - Context: Test Modes > Dry Run
    - Shows: Validation results panel
    - Highlights: Checkmarks, warnings, errors with details

26. **Test Mode Configuration Panel**
    - Context: Test Mode (Mock Execution)
    - Shows: Mock configuration interface
    - Highlights: Node selection, mock response editor

27. **Live Test Execution with Cost Tracking**
    - Context: Live Test Mode
    - Shows: Real execution with live cost updates
    - Highlights: Running total, token counts, cost per node

28. **Mock Data Configuration Interface**
    - Context: Mock Data Configuration
    - Shows: Editor for creating mock responses
    - Highlights: Response, tokens, duration fields

29. **Validation Rules Configuration**
    - Context: Validation and Assertions
    - Shows: UI for setting up validation rules
    - Highlights: Rule types, conditions, expected values

30. **Test Suite Execution Results**
    - Context: Test Suites section
    - Shows: Results dashboard for test suite
    - Highlights: Pass/fail status, metrics, details

31. **Test Execution Log Viewer**
    - Context: Test Debugging > Execution Logs
    - Shows: Detailed log view with timestamps
    - Highlights: Filterable logs, error highlighting

32. **Step-by-Step Debugger Interface**
    - Context: Step-by-Step Execution
    - Shows: Workflow paused at breakpoint
    - Highlights: Current node, data inspection, controls

33. **Coverage Report Visualization**
    - Context: Test Coverage
    - Shows: Visual coverage report
    - Highlights: Percentages, uncovered areas, metrics

## Workflow Design Best Practices

**File:** `best-practices/workflow-design.md`

34. **Sequential Processing Flow Diagram**
    - Context: Sequential Processing Pattern
    - Shows: Visual representation of sequential workflow
    - Highlights: Arrows showing flow direction

35. **Parallel Processing Flow Diagram**
    - Context: Parallel Processing Pattern
    - Shows: Workflow with parallel branches
    - Highlights: Split, parallel execution, merge

36. **Conditional Branching Flow Diagram**
    - Context: Conditional Branching Pattern
    - Shows: Decision node with multiple paths
    - Highlights: Condition, branches, merge point

37. **Subagent Delegation Flow Diagram**
    - Context: Subagent Delegation Pattern
    - Shows: Main agent coordinating subagents
    - Highlights: Delegation, specialized agents, integration

38. **Performance Monitoring Dashboard**
    - Context: Performance Best Practices
    - Shows: Real-time performance metrics
    - Highlights: Execution time, bottlenecks, token usage

## Common Errors Guide

**File:** `troubleshooting/common-errors.md`

39. **Anthropic Console API Keys Page**
    - Context: Authentication Errors
    - Shows: API keys section in Anthropic Console
    - Highlights: Active keys, create new key button

40. **Rate Limit Error with Retry-After Header**
    - Context: Rate Limit Exceeded error
    - Shows: Error message with retry information
    - Highlights: Status code, retry-after value, error details

41. **Connection Type Mismatch Error**
    - Context: Node Connection Invalid
    - Shows: Error indicator on invalid connection
    - Highlights: Type mismatch message, expected vs received

42. **Anthropic Billing Dashboard**
    - Context: Insufficient Credits error
    - Shows: Billing section showing balance
    - Highlights: Current balance, usage, add credits button

43. **Variable Creation Dialog**
    - Context: Missing Required Variable
    - Shows: UI for creating new variable
    - Highlights: Name, type, value fields

44. **MCP Connection Settings**
    - Context: MCP Server Connection Failed
    - Shows: MCP configuration panel
    - Highlights: Server URL, connection status, tools list

45. **Execution Timeline Showing Bottleneck**
    - Context: Performance Issues
    - Shows: Timeline with slow node highlighted
    - Highlights: Duration bars, bottleneck identification

46. **Support Ticket Form**
    - Context: Getting Help
    - Shows: Support request form
    - Highlights: Required fields, attachment option

## Screenshot Specifications

### Technical Requirements

**Resolution:** 1920x1080 or higher
**Format:** PNG with transparency where appropriate
**File Size:** Optimize to <500KB per image
**Color Space:** sRGB

### Style Guidelines

**UI State:**
- Use light mode (or provide dark mode variant)
- Clean, uncluttered interface
- Real data, not Lorem Ipsum
- Professional example content

**Annotations:**
- Red circles/arrows for highlights
- Clear labels with good contrast
- Numbered callouts when showing steps
- Minimal but effective highlighting

**Context:**
- Show enough UI for orientation
- Crop to relevant area
- Include window chrome if helpful
- Consistent zoom level across related screenshots

### Content Guidelines

**Example Data:**
- Use realistic but safe example code
- Professional naming (no "foo", "bar")
- Clear, educational examples
- Avoid sensitive information

**User Information:**
- Use placeholder names (e.g., "demo@example.com")
- Generic project names
- No real API keys or secrets
- Sanitized URLs

## Screenshot Organization

**Directory Structure:**
```
docs/user/images/
├── getting-started/
│   ├── 01-successful-installation.png
│   ├── 02-new-project-dialog.png
│   └── ...
├── guides/
│   ├── visual-editor/
│   │   ├── 06-full-editor-interface.png
│   │   └── ...
│   ├── agent-configuration/
│   │   ├── 19-agent-config-panel.png
│   │   └── ...
│   └── testing-workflows/
│       ├── 25-dry-run-results.png
│       └── ...
├── best-practices/
│   └── workflow-design/
│       ├── 34-sequential-flow.png
│       └── ...
└── troubleshooting/
    └── common-errors/
        ├── 39-anthropic-console.png
        └── ...
```

## Next Steps

1. **UI Development**: Build UI components shown in screenshots
2. **Screenshot Creation**: Capture high-quality screenshots
3. **Documentation Update**: Replace placeholders with actual images
4. **Review**: Verify all screenshots are clear and helpful

## Notes

- Some screenshots may need multiple variants (light/dark mode)
- Diagrams can be created programmatically (Mermaid, etc.) instead of screenshots
- Consider adding short video clips for complex interactions
- Update this list as documentation evolves

---

**Total Screenshots Needed:** 46 unique screenshots

**Estimated Time:** 1-2 days for capture and editing (after UI is built)
