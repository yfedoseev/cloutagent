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
