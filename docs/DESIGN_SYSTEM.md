# FrostGuard LoRaWAN Emulator Design System

## Overview

This design system provides a consistent, scalable foundation for the FrostGuard LoRaWAN Emulator UI. It preserves all existing user flows while elevating the visual design to be cleaner, more professional, and easier to maintain.

---

## 1. FOUNDATIONS

### 1.1 Color Tokens

```css
/* Background */
--background-primary: hsl(220, 20%, 7%);      /* Main app background */
--background-surface: hsl(220, 18%, 10%);     /* Card surfaces */
--background-elevated: hsl(220, 18%, 12%);    /* Elevated elements */
--background-muted: hsl(220, 15%, 13%);       /* Subtle backgrounds */

/* Text */
--text-primary: hsl(210, 20%, 95%);           /* Main text */
--text-secondary: hsl(210, 20%, 75%);         /* Secondary text */
--text-muted: hsl(220, 10%, 55%);             /* Muted/helper text */

/* Status Colors */
--status-success: hsl(152, 76%, 48%);         /* Green - active, online, success */
--status-warning: hsl(38, 92%, 50%);          /* Amber - warnings, pending */
--status-error: hsl(0, 70%, 55%);             /* Red - errors, offline */
--status-info: hsl(199, 89%, 48%);            /* Blue - info, links */

/* Interactive */
--primary: hsl(152, 76%, 48%);                /* Primary actions */
--primary-hover: hsl(152, 76%, 42%);          /* Primary hover */
--primary-muted: hsla(152, 76%, 48%, 0.2);    /* Primary backgrounds */

/* Borders */
--border-default: hsl(220, 15%, 18%);         /* Default borders */
--border-muted: hsl(220, 15%, 15%);           /* Subtle borders */
--border-focus: hsl(152, 76%, 48%);           /* Focus rings */
```

### 1.2 Typography Scale

```css
/* Headings */
--font-h1: 700 1.5rem/1.3 'Manrope', system-ui;      /* 24px - Page titles */
--font-h2: 600 1.25rem/1.4 'Manrope', system-ui;     /* 20px - Section titles */
--font-h3: 600 1rem/1.4 'Manrope', system-ui;        /* 16px - Card titles */
--font-h4: 500 0.875rem/1.4 'Manrope', system-ui;    /* 14px - Subsections */

/* Body */
--font-body: 400 0.875rem/1.5 'Manrope', system-ui;  /* 14px - Default */
--font-body-sm: 400 0.75rem/1.5 'Manrope', system-ui; /* 12px - Small text */

/* Monospace (IDs, keys, payloads) */
--font-mono: 400 0.8125rem/1.5 'IBM Plex Mono', monospace; /* 13px */
--font-mono-sm: 400 0.75rem/1.5 'IBM Plex Mono', monospace; /* 12px */

/* Labels */
--font-label: 500 0.6875rem/1.3 'Manrope', system-ui; /* 11px - uppercase labels */
```

### 1.3 Spacing Scale

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
```

### 1.4 Border Radius

```css
--radius-sm: 0.25rem;   /* 4px - Small elements, pills */
--radius-md: 0.5rem;    /* 8px - Buttons, inputs */
--radius-lg: 0.75rem;   /* 12px - Cards */
--radius-xl: 1rem;      /* 16px - Large cards, modals */
--radius-full: 9999px;  /* Circular elements */
```

### 1.5 Shadows

```css
--shadow-sm: 0 1px 2px hsla(220, 20%, 0%, 0.3);
--shadow-md: 0 4px 6px hsla(220, 20%, 0%, 0.25);
--shadow-lg: 0 8px 16px hsla(220, 20%, 0%, 0.3);
--shadow-glow: 0 0 20px hsla(152, 76%, 48%, 0.15);
```

---

## 2. COMPONENT SYSTEM

### 2.1 Status Pills

**Purpose:** Indicate connection state, sync status, or operational mode.

**Variants:**
| Variant | Background | Text | Use Case |
|---------|------------|------|----------|
| success | primary/20 | primary | Online, Connected, Active |
| warning | warning/20 | warning | Pending, Syncing |
| error | error/20 | error | Offline, Failed, Error |
| neutral | muted | muted-foreground | Stopped, Disabled |
| info | info/20 | info | Info, New |

**States:** default, hover (slight brightness increase)

**Accessibility:** Minimum 4.5:1 contrast ratio, includes icon for color-blind users

### 2.2 Buttons

**Variants:**
| Variant | Use Case |
|---------|----------|
| primary | Main actions (Save, Start, Submit) |
| secondary | Secondary actions (Cancel, Back) |
| ghost | Tertiary actions, icon buttons |
| destructive | Delete, Remove, Reset |
| outline | Alternative secondary style |

**Sizes:** sm (28px), md (36px), lg (44px)

**States:** default, hover, active, disabled, loading

### 2.3 Cards

**Types:**
- **Surface Card:** Default card with subtle border
- **Elevated Card:** Slightly lighter background, for emphasis
- **Interactive Card:** Hover state, clickable
- **Status Card:** Includes status indicator

**Structure:**
```
Card
├── CardHeader (optional)
│   ├── CardTitle
│   └── CardDescription
├── CardContent
└── CardFooter (optional)
```

### 2.4 Form Inputs

**Types:**
- Text input (standard, with icon)
- Password input (with reveal toggle)
- Number input (with increment/decrement)
- Select dropdown
- Textarea
- Toggle switch
- Slider
- Checkbox/Radio

**States:** default, focus, error, disabled, readonly

**Validation:** Inline error messages below input

### 2.5 Copy Button

**Purpose:** Copy identifiers (DevEUI, API keys, URLs) to clipboard

**Behavior:**
1. Default: Shows copy icon
2. Click: Copies value, shows checkmark for 2s
3. Returns to copy icon

### 2.6 Empty States

**Structure:**
- Icon (muted, 48px)
- Title (text-secondary)
- Description (text-muted)
- Action button (optional)

### 2.7 Loading States

**Types:**
- Spinner (inline, button)
- Skeleton (content placeholder)
- Progress bar (determinate operations)
- Pulse animation (status indicators)

---

## 3. LAYOUT SYSTEM

### 3.1 Application Shell

```
┌─────────────────────────────────────────────────────┐
│ Header                                               │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Logo | Title | Status | Actions | User          │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Tab Navigation                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Sensors | Gateways | Devices | Webhook | ...    │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Content Area                                         │
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │
│ │  Tab-specific content                           │ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 3.2 Tab Structure

| Tab | Purpose |
|-----|---------|
| Sensors | Configure sensor parameters and test scenarios |
| Gateways | Manage LoRaWAN gateways |
| Devices | Manage end devices and provisioning |
| Webhook | TTN integration and webhook configuration |
| Testing | Multi-tenant testing and telemetry validation |
| Monitor | Real-time telemetry and emulator state |
| Logs | Activity logs and debugging |

### 3.3 Grid System

- **Single column:** Forms, settings
- **Two column:** Dashboard (50/50 or 60/40)
- **Three column:** Card grids (responsive)
- **Responsive breakpoints:** sm (640px), md (768px), lg (1024px), xl (1280px)

---

## 4. DATA-DENSE UI RULES

### 4.1 Identifier Display

- Always use monospace font
- Truncate with ellipsis for long values
- Provide copy button
- Show full value on hover (tooltip)

### 4.2 Telemetry Values

- Use tabular-nums for alignment
- Include unit labels
- Color-code status (green=normal, amber=warning, red=critical)
- Update in real-time with subtle transition

### 4.3 Tables

- Fixed header on scroll
- Sortable columns (where applicable)
- Row hover highlight
- Actions in rightmost column
- Empty state for no data

---

## 5. INTERACTION PATTERNS

### 5.1 Transitions

```css
--transition-fast: 150ms ease;
--transition-normal: 200ms ease;
--transition-slow: 300ms ease;
```

### 5.2 Hover States

- Buttons: Slight background change
- Cards: Subtle border highlight
- Interactive elements: Cursor change

### 5.3 Focus States

- Visible focus ring (2px, primary color)
- Skip focus on mouse click, show on keyboard

### 5.4 Feedback

- Toast notifications for actions
- Inline validation for forms
- Loading states for async operations
- Confirmation dialogs for destructive actions

---

## 6. ACCESSIBILITY

### 6.1 Color Contrast

- Text on background: Minimum 4.5:1
- Large text: Minimum 3:1
- Interactive elements: Minimum 3:1

### 6.2 Keyboard Navigation

- All interactive elements focusable
- Logical tab order
- Escape to close modals/dropdowns
- Enter to activate buttons

### 6.3 Screen Readers

- Meaningful alt text for icons
- ARIA labels for icon-only buttons
- Live regions for dynamic content
- Proper heading hierarchy

---

## 7. COMPONENT INVENTORY

### Shared Components (src/components/ui/)
- [x] Button
- [x] Card
- [x] Input
- [x] Select
- [x] Tabs
- [x] Toggle
- [x] Slider
- [x] Toast
- [ ] StatusPill (new)
- [ ] CopyButton (new)
- [ ] EmptyState (new)
- [ ] DataCard (new)
- [ ] IdentifierDisplay (new)

### Feature Components (src/components/emulator/)
- [ ] SensorConfigCard
- [ ] TestScenarioCard
- [ ] GatewayCard
- [ ] DeviceCard
- [ ] WebhookPanel
- [ ] TelemetryPanel
- [ ] LogViewer

---

## 8. IMPLEMENTATION CHECKLIST

### Phase 1: Foundation
- [x] Color tokens in CSS variables
- [x] Typography scale
- [x] Spacing scale
- [ ] Create shared utility components

### Phase 2: Core Components
- [ ] StatusPill component
- [ ] CopyButton component
- [ ] EmptyState component
- [ ] DataCard component

### Phase 3: Feature Screens
- [ ] Sensors tab
- [ ] Gateways tab
- [ ] Devices tab
- [ ] Webhook tab
- [ ] Testing tab
- [ ] Monitor tab (enhance existing)
- [ ] Logs tab

### Phase 4: Integration
- [ ] Connect to real API data
- [ ] Wire up all interactions
- [ ] Add loading/error states
- [ ] Test all flows

### Phase 5: Polish
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Remove dev routes
- [ ] Final QA

---

## 9. FLOW PRESERVATION CHECKLIST

- [ ] Navigation between all tabs works
- [ ] Sensor configuration saves correctly
- [ ] Gateway provisioning flow complete
- [ ] Device CRUD operations work
- [ ] TTN webhook setup flow complete
- [ ] Testing flow (Start → Observe → Logs) works
- [ ] Real-time telemetry updates
- [ ] Log streaming functional
