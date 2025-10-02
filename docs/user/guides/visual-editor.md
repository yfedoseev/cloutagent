# Visual Editor Guide

The CloutAgent Visual Editor is your workspace for designing, building, and testing AI agent workflows. This guide covers everything you need to know to work efficiently with the visual canvas.

## Canvas Overview

The Visual Editor consists of several key areas that work together to provide a comprehensive workflow building experience.

[Screenshot: Full editor interface with labeled areas]

### Main Canvas

The main canvas is your workflow workspace where nodes are placed and connected:

- **Infinite Canvas**: Pan and zoom to work with workflows of any size
- **Grid System**: Optional grid for precise node alignment
- **Auto-layout**: Automatically arrange nodes for clarity
- **Mini-map**: Navigate large workflows with bird's-eye view

**Canvas Controls:**
- **Zoom**: Scroll wheel, pinch gesture, or zoom controls in toolbar
- **Pan**: Click and drag background, or hold spacebar and drag
- **Fit to View**: Double-click background to fit entire workflow
- **Reset Zoom**: Click 100% in toolbar to reset to default zoom

### Node Palette

The Node Palette on the left side contains all available node types:

**Core Nodes:**
- **Agent**: Main AI agent powered by Claude
- **Subagent**: Specialized agents for specific tasks
- **Hook**: Lifecycle event handlers
- **MCP**: External tool integrations

**Utility Nodes:**
- **Variable**: Store and retrieve data
- **Condition**: Conditional branching logic
- **Loop**: Iterate over data sets
- **Transform**: Data transformation functions

**Adding Nodes:**
1. **Drag and Drop**: Drag node from palette to canvas
2. **Double-click Canvas**: Opens quick-add menu
3. **Keyboard Shortcut**: Press `A` to open add node dialog

[Screenshot: Node palette with all node types]

### Property Panel

The Property Panel on the right displays configuration options for the selected node:

**Common Properties:**
- **Name**: Human-readable node identifier
- **Description**: Optional documentation for the node
- **Input/Output**: Data flow configuration
- **Validation**: Input validation rules

**Node-Specific Properties:**
- Agent nodes show model, system prompt, temperature, max tokens
- Subagent nodes show agent type and specialized configuration
- Hook nodes show trigger type and action configuration
- MCP nodes show server connection and tool selection

**Property Panel Features:**
- **Real-time Validation**: Immediate feedback on invalid configurations
- **Templates**: Load pre-configured templates
- **Documentation Links**: Context-sensitive help for each property
- **Version History**: Track changes to node configuration

[Screenshot: Property panel with Agent node configuration]

### Toolbar

The top toolbar provides quick access to common actions:

**Project Actions:**
- **Save** (Cmd/Ctrl + S): Save workflow changes
- **Undo** (Cmd/Ctrl + Z): Undo last action
- **Redo** (Cmd/Ctrl + Shift + Z): Redo undone action
- **Export**: Export workflow as JSON
- **Import**: Import workflow from JSON

**Execution Actions:**
- **Run** (Cmd/Ctrl + R): Execute workflow
- **Test Mode**: Run with mock data
- **Dry Run**: Validate without execution
- **Stop**: Cancel running execution

**View Actions:**
- **Zoom In/Out**: Adjust canvas zoom level
- **Fit to View**: Center and fit workflow
- **Grid Toggle**: Show/hide alignment grid
- **Mini-map**: Toggle mini-map visibility

**Collaboration Actions:**
- **Share**: Generate shareable workflow link
- **Comments**: Add annotations and notes
- **Version History**: View and restore previous versions

[Screenshot: Toolbar with tooltips showing]

## Working with Nodes

Master these techniques for efficient node manipulation:

### Adding Nodes

**Method 1: Drag and Drop**
1. Find the desired node in the palette
2. Click and hold on the node
3. Drag onto the canvas
4. Release to place the node

**Method 2: Double-click Canvas**
1. Double-click on empty canvas space
2. Quick-add menu appears
3. Type to search for node type
4. Press Enter to add node at cursor

**Method 3: Keyboard Shortcut**
1. Press `A` key
2. Node selection dialog opens
3. Use arrow keys to navigate
4. Press Enter to add selected node

[Screenshot: Quick-add menu with search]

### Selecting Nodes

**Single Selection:**
- Click on any node to select it
- Selected node highlights with colored border
- Property panel updates to show node configuration

**Multiple Selection:**
- Click and drag on canvas to create selection box
- All nodes within box are selected
- Hold Shift and click to add nodes to selection
- Hold Cmd/Ctrl and click to toggle node selection

**Selection Shortcuts:**
- `Cmd/Ctrl + A`: Select all nodes
- `Escape`: Clear selection
- `Tab`: Cycle through nodes

### Moving Nodes

**Drag to Move:**
1. Click on a node
2. Drag to new position
3. Release to place

**Precise Movement:**
- Arrow keys: Move selected node by grid unit
- Shift + Arrow: Move by larger increment
- Hold Shift while dragging: Constrain to horizontal/vertical

**Align and Distribute:**
- Right-click selected nodes
- Choose alignment option:
  - Align Left/Right/Top/Bottom
  - Distribute Horizontally/Vertically
  - Space Evenly

[Screenshot: Node alignment menu]

### Configuring Nodes

**Quick Configuration:**
1. Double-click node to open property panel
2. Modify properties in the panel
3. Changes save automatically

**Inline Editing:**
- Click node name to rename inline
- Press Enter to save
- Press Escape to cancel

**Copy Configuration:**
1. Right-click configured node
2. Select "Copy Configuration"
3. Right-click target node
4. Select "Paste Configuration"

### Deleting Nodes

**Delete Selected Nodes:**
- Press `Delete` or `Backspace`
- Confirmation dialog appears for safety
- Connected edges are also removed

**Bulk Delete:**
1. Select multiple nodes
2. Press Delete once to remove all
3. Undo with Cmd/Ctrl + Z if needed

## Connecting Nodes

Connections define the flow of data and execution through your workflow.

### Creating Connections

**Method 1: Drag from Port**
1. Hover over node output port (right side)
2. Click and drag from port
3. Connection line follows cursor
4. Drag to input port (left side) of target node
5. Release to create connection

**Method 2: Connection Mode**
1. Select two nodes
2. Press `C` to create connection
3. Connection created automatically between selected nodes

[Screenshot: Creating connection with drag]

### Connection Types

CloutAgent uses visual cues to indicate connection types:

**Data Connections (Blue):**
- Transfer data between nodes
- Solid line indicates active data flow
- Dashed line indicates optional data

**Execution Connections (Green):**
- Define execution order
- Arrows show direction of execution flow

**Event Connections (Orange):**
- Trigger based on events
- Used with hooks and conditional nodes

### Editing Connections

**Reroute Connection:**
1. Click on connection line
2. Drag endpoint to different port
3. Release to reconnect

**Delete Connection:**
- Right-click connection
- Select "Delete Connection"
- Or select connection and press Delete

**Connection Properties:**
- Click connection to view properties
- Configure conditions or transformations
- Set validation rules

[Screenshot: Connection context menu]

### Connection Best Practices

**Avoid Crossing Lines:**
- Organize nodes to minimize connection crossings
- Use auto-layout feature for optimization
- Group related nodes together

**Clear Data Flow:**
- Arrange nodes left-to-right for execution flow
- Top-to-bottom for hierarchical structures
- Use node naming to clarify relationships

**Connection Validation:**
- Red connection indicates type mismatch
- Yellow connection shows warning
- Hover for detailed error message

## Canvas Navigation

Efficiently navigate large workflows with these techniques:

### Zooming

**Mouse/Trackpad:**
- Scroll wheel: Zoom in/out centered on cursor
- Pinch gesture: Zoom with two fingers
- Zoom controls: Click +/- buttons in toolbar

**Keyboard Shortcuts:**
- `Cmd/Ctrl + =`: Zoom in
- `Cmd/Ctrl + -`: Zoom out
- `Cmd/Ctrl + 0`: Reset to 100%
- `Cmd/Ctrl + 1`: Fit entire workflow to view

### Panning

**Mouse/Trackpad:**
- Click and drag canvas background
- Hold spacebar and drag anywhere
- Two-finger scroll on trackpad

**Keyboard Navigation:**
- Arrow keys: Pan canvas in direction
- Hold Shift + Arrow: Pan by larger increment

### Mini-map

The mini-map provides bird's-eye view of large workflows:

**Features:**
- Shows entire workflow at reduced scale
- Current viewport highlighted as rectangle
- Click to jump to area
- Drag viewport rectangle to pan

**Toggle Mini-map:**
- Click mini-map icon in toolbar
- Or press `M` key

[Screenshot: Mini-map navigation]

### Search and Focus

**Find Nodes:**
1. Press `Cmd/Ctrl + F`
2. Type node name in search box
3. Matching nodes highlight
4. Press Enter to focus on first match
5. Press Enter again to cycle through matches

**Focus on Node:**
- Double-click node to center it
- Right-click > "Focus on Node"
- Canvas pans and zooms to selected node

## Keyboard Shortcuts

Master these shortcuts for maximum efficiency:

### General Actions
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | New project |
| `Cmd/Ctrl + O` | Open project |
| `Cmd/Ctrl + S` | Save workflow |
| `Cmd/Ctrl + Shift + S` | Save as new version |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |
| `Cmd/Ctrl + F` | Search nodes |

### Node Operations
| Shortcut | Action |
|----------|--------|
| `A` | Add node dialog |
| `Delete/Backspace` | Delete selected |
| `Cmd/Ctrl + D` | Duplicate selected |
| `Cmd/Ctrl + C` | Copy nodes |
| `Cmd/Ctrl + V` | Paste nodes |
| `Cmd/Ctrl + X` | Cut nodes |
| `Cmd/Ctrl + A` | Select all nodes |
| `Escape` | Clear selection |

### Canvas Navigation
| Shortcut | Action |
|----------|--------|
| `Spacebar + Drag` | Pan canvas |
| `Cmd/Ctrl + =` | Zoom in |
| `Cmd/Ctrl + -` | Zoom out |
| `Cmd/Ctrl + 0` | Reset zoom |
| `Cmd/Ctrl + 1` | Fit to view |
| `M` | Toggle mini-map |
| `G` | Toggle grid |

### Execution
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + R` | Run workflow |
| `Cmd/Ctrl + T` | Test mode |
| `Cmd/Ctrl + Shift + R` | Dry run |
| `Cmd/Ctrl + .` | Stop execution |

### Alignment
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Shift + L` | Align left |
| `Cmd/Ctrl + Shift + R` | Align right |
| `Cmd/Ctrl + Shift + T` | Align top |
| `Cmd/Ctrl + Shift + B` | Align bottom |
| `Cmd/Ctrl + Shift + H` | Distribute horizontally |
| `Cmd/Ctrl + Shift + V` | Distribute vertically |

[Screenshot: Keyboard shortcuts reference overlay]

## Advanced Features

Take your workflow building to the next level with these advanced features:

### Auto-layout

Automatically organize nodes for optimal clarity:

1. Select nodes to layout (or select all)
2. Click "Auto-layout" in toolbar
3. Choose layout algorithm:
   - **Hierarchical**: Top-down tree structure
   - **Force-directed**: Physics-based spacing
   - **Grid**: Uniform grid alignment
4. Click "Apply"

Auto-layout maintains connections and minimizes crossings.

[Screenshot: Before and after auto-layout]

### Templates

Save and reuse common node configurations:

**Create Template:**
1. Configure node as desired
2. Right-click node
3. Select "Save as Template"
4. Enter template name
5. Template appears in palette

**Use Template:**
1. Drag template from palette
2. Node created with saved configuration
3. Customize as needed

**Template Library:**
- Access built-in templates
- Share templates with team
- Import community templates

### Comments and Annotations

Add documentation to your workflows:

**Add Comment:**
1. Click "Comment" tool in toolbar
2. Click canvas to place comment
3. Type annotation text
4. Resize and style as needed

**Comment Features:**
- Markdown formatting support
- Link to specific nodes
- Color coding for organization
- Show/hide comment layer

[Screenshot: Workflow with comments]

### Version Control

Track changes and restore previous versions:

**Automatic Versioning:**
- Every save creates version snapshot
- Changes tracked with timestamp
- Author information recorded

**Version History:**
1. Click "History" in toolbar
2. Browse version timeline
3. Preview changes
4. Restore previous version if needed

**Branching:**
- Create experimental branches
- Test changes safely
- Merge successful changes back

### Collaboration Features

Work together on workflows in real-time:

**Real-time Collaboration:**
- Multiple users edit simultaneously
- See collaborator cursors and selections
- Changes sync instantly
- Conflict resolution automatic

**Comments and Reviews:**
- Leave feedback on nodes
- Tag team members for input
- Resolve discussions when addressed

**Permissions:**
- Owner: Full control
- Editor: Can edit workflow
- Viewer: Read-only access

## Tips and Tricks

Expert techniques for power users:

### Workflow Organization

**Use Node Groups:**
- Select related nodes
- Press `Cmd/Ctrl + G` to group
- Groups can be collapsed for clarity
- Name groups descriptively

**Color Coding:**
- Right-click node > Set Color
- Use consistent colors for node types
- Example: Blue for data processing, green for output

**Naming Conventions:**
- Use descriptive, consistent names
- Example: "Step 1: Parse Input", "Step 2: Generate Code"
- Makes workflows self-documenting

### Performance Optimization

**Large Workflows:**
- Use groups to collapse sections
- Split complex workflows into subworkflows
- Enable "Simplified View" for better performance
- Disable animations if experiencing lag

**Efficient Editing:**
- Use keyboard shortcuts exclusively
- Learn multi-select for bulk operations
- Master search to find nodes quickly
- Use templates for repeated patterns

### Testing Workflows

**Incremental Testing:**
- Build and test one node at a time
- Use dry run mode to validate logic
- Check connections before full execution
- Save working versions frequently

**Debug Mode:**
- Enable debug mode in toolbar
- Shows data passing through connections
- Pause execution at specific nodes
- Inspect intermediate results

[Screenshot: Debug mode visualization]

### Workflow Reuse

**Export and Import:**
- Export workflows as JSON
- Share via GitHub, Gist, or direct link
- Import community workflows
- Modify imported workflows for your needs

**Subworkflows:**
- Extract repeated patterns to subworkflows
- Reference subworkflows from main workflow
- Update subworkflow once, affects all references
- Organize complex logic hierarchically

## Next Steps

Now that you've mastered the visual editor, explore these advanced topics:

- **[Agent Configuration Guide](./agent-configuration.md)**: Write effective prompts and choose optimal models
- **[Working with Subagents](./subagents.md)**: Coordinate multiple specialized agents
- **[Variables and Secrets](./variables-secrets.md)**: Manage configuration and sensitive data
- **[Testing Workflows](./testing-workflows.md)**: Validate workflows before production

### Quick Links

- **[Workflow Design Best Practices](../best-practices/workflow-design.md)**
- **[Common Errors](../troubleshooting/common-errors.md)**
- **[Example Workflows](../../examples/)**
- **[Keyboard Shortcuts Reference](../reference/keyboard-shortcuts.md)**

---

**Need Help?** Join our [Discord community](https://discord.gg/cloutagent) or check the [FAQ](../troubleshooting/faq.md) for quick answers.
