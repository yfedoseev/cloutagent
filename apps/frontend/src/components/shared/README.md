# Shared Design System Components

A collection of reusable, accessible, and visually polished UI components following Apple-inspired design principles.

## Components

### StatusBadge

Shows execution status with icon and optional label. Includes animated spinner for running state.

**Props:**
- `status`: 'idle' | 'running' | 'success' | 'error' (required)
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `showLabel`: boolean (default: true)
- `className`: string

**Usage:**
```tsx
import { StatusBadge } from './components/shared';

// Basic usage
<StatusBadge status="running" />

// With custom size and no label
<StatusBadge status="success" size="lg" showLabel={false} />

// Custom styling
<StatusBadge status="error" className="ml-2" />
```

**Features:**
- Color-coded status indicators (idle=gray, running=blue, success=green, error=red)
- Animated spinner for "running" state
- Responsive sizing
- Accessible with proper ARIA labels
- Smooth transitions

---

### Tooltip

Displays helpful information on hover with configurable placement and delay.

**Props:**
- `content`: React.ReactNode (required)
- `children`: React.ReactNode (required)
- `placement`: 'top' | 'bottom' | 'left' | 'right' (default: 'top')
- `delay`: number (default: 200ms)
- `disabled`: boolean
- `className`: string

**Usage:**
```tsx
import { Tooltip } from './components/shared';

// Basic usage
<Tooltip content="This is helpful info">
  <button>Hover me</button>
</Tooltip>

// With custom placement and delay
<Tooltip content="Delete this item" placement="bottom" delay={500}>
  <button>Delete</button>
</Tooltip>

// Rich content
<Tooltip
  content={
    <div>
      <strong>Pro Tip:</strong>
      <p>Use keyboard shortcuts for faster editing</p>
    </div>
  }
>
  <HelpIcon />
</Tooltip>
```

**Features:**
- Multiple placement options (top, bottom, left, right)
- Configurable delay
- Glassmorphic design matching theme
- Smooth fade-in/out animations
- Pointer arrow for visual connection
- Accessible (ARIA describedby)
- Keyboard support (Esc to close)

---

### PropertyGroup

Collapsible group for organizing related properties in panels.

**Props:**
- `title`: string (required)
- `icon`: React.ReactNode
- `defaultOpen`: boolean (default: false)
- `children`: React.ReactNode (required)
- `className`: string

**Usage:**
```tsx
import { PropertyGroup, TextField } from './components/shared';

<PropertyGroup title="Basic Settings" icon="⚙️" defaultOpen={true}>
  <TextField label="Name" value={name} onChange={setName} />
  <TextField label="Description" value={desc} onChange={setDesc} />
</PropertyGroup>

<PropertyGroup title="Advanced" icon="🔧">
  <SelectField label="Mode" options={modes} />
  <TextField label="Custom Config" />
</PropertyGroup>
```

**Features:**
- Collapsible/expandable
- Smooth height animation
- Chevron icon rotation
- Optional group icon
- Hover state feedback
- Accessible (button semantics, keyboard navigation)

---

### TextField

Text input field with label, validation, help text, and optional icon.

**Props:**
- `label`: string (required)
- `error`: string
- `helpText`: string
- `icon`: React.ReactNode
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- All standard input props (value, onChange, placeholder, etc.)

**Usage:**
```tsx
import { TextField } from './components/shared';
import { User } from 'lucide-react';

// Basic usage
<TextField
  label="Username"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  required
/>

// With icon and help text
<TextField
  label="Email"
  type="email"
  icon={<User size={16} />}
  helpText="We'll never share your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// With validation error
<TextField
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>
```

**Features:**
- Inline error display (red border + error text)
- Help text support
- Optional icons (left-aligned)
- Glassmorphic input styling
- Focus states with blue border
- Disabled states
- Accessible labels and error announcements
- Responsive sizing

---

### SelectField

Dropdown select field with label, validation, and help text.

**Props:**
- `label`: string (required)
- `options`: Array<{ value: string; label: string }> (required)
- `error`: string
- `helpText`: string
- All standard select props (value, onChange, etc.)

**Usage:**
```tsx
import { SelectField } from './components/shared';

const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

<SelectField
  label="Choose Option"
  options={options}
  value={selected}
  onChange={(e) => setSelected(e.target.value)}
  required
/>

// With error
<SelectField
  label="Status"
  options={statusOptions}
  error="Please select a valid status"
  value={status}
  onChange={(e) => setStatus(e.target.value)}
/>
```

**Features:**
- Custom dropdown styling
- Inline error display
- Help text support
- Glassmorphic select styling
- Focus states
- Accessible
- Custom chevron icon

---

### TextareaField

Multi-line text input with label, validation, and help text.

**Props:**
- `label`: string (required)
- `error`: string
- `helpText`: string
- All standard textarea props (value, onChange, rows, etc.)

**Usage:**
```tsx
import { TextareaField } from './components/shared';

<TextareaField
  label="Description"
  rows={4}
  placeholder="Enter a detailed description..."
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  helpText="Max 500 characters"
/>

// With validation
<TextareaField
  label="Comments"
  error="Comments are required"
  value={comments}
  onChange={(e) => setComments(e.target.value)}
  required
/>
```

**Features:**
- Inline error display
- Help text support
- Glassmorphic styling
- Focus states
- Accessible
- Disabled states

---

### ValidationBadge (Enhanced)

Displays validation errors and warnings with tooltip and pulse animation.

**Props:**
- `errors`: ValidationError[] (required)
- `warnings`: ValidationError[] (required)
- `onErrorClick`: (error: ValidationError) => void
- `className`: string

**Usage:**
```tsx
import { ValidationBadge } from './components/nodes/ValidationBadge';

<ValidationBadge
  errors={nodeErrors}
  warnings={nodeWarnings}
  onErrorClick={(error) => {
    console.log('Error clicked:', error);
    // Focus on problematic field
  }}
/>
```

**Features:**
- Absolute positioning (top-right of parent)
- Glassmorphic badge design
- Error count + warning count display
- Pulse animation for errors (draws attention)
- Tooltip showing all error/warning messages
- Click to trigger error callback
- Accessible keyboard navigation
- Hover scale animation

---

## Design Tokens

All components use the shared design system tokens defined in `index.css`:

### Colors
- `--color-accent`: Apple System Blue (#007AFF)
- `--color-glass-bg`: Glass surface background
- `--color-text-primary`: Primary text color

### Shadows
- `--shadow-sm`: Small elevation
- `--shadow-md`: Medium elevation
- `--shadow-lg`: Large elevation

### Animation Curves
- `--ease-ios`: iOS-style ease curve
- `--ease-smooth`: Smooth transitions
- `--ease-spring`: Spring animations

## Accessibility Features

All components follow WCAG 2.1 AA standards:

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **ARIA Labels**: Proper aria-label, aria-describedby, aria-expanded attributes
- **Focus Management**: Visible focus indicators
- **Screen Reader Support**: Semantic HTML and proper labeling
- **Error Announcements**: Validation errors announced to screen readers
- **Required Field Indicators**: Visual and semantic indication of required fields

## Animation Guidelines

All animations use:
- **Duration**: 200ms for micro-interactions, 300ms for larger movements
- **Easing**: iOS-style cubic-bezier curves
- **GPU Acceleration**: Transform and opacity for performance
- **Respect Motion Preferences**: Consider prefers-reduced-motion

## Styling Best Practices

1. **Use Utility Classes**: Leverage existing glass/btn-glass utilities
2. **Consistent Spacing**: Use Tailwind spacing scale (px-3, py-2, gap-2)
3. **Color Consistency**: Use CSS variables for theme colors
4. **Responsive Design**: Components work on all screen sizes
5. **Dark Mode First**: All components designed for dark backgrounds

## Testing

Each component includes:
- TypeScript type safety
- Proper prop validation
- Accessible markup
- Responsive behavior
- Error states
- Loading states (where applicable)

## Future Enhancements

Potential improvements:
- [ ] Add theme variants (light mode support)
- [ ] Add more form components (Checkbox, Radio, Switch)
- [ ] Add animation variants (spring, bounce)
- [ ] Add loading skeletons
- [ ] Add toast/notification component
- [ ] Add modal/dialog component
