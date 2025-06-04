# TokFlo Design System

This document outlines the design system implementation for the TokFlo application, based on the TokFlo Style System & Guide v1.0.

## Overview

The TokFlo design system is implemented using Tailwind CSS with custom configuration and design tokens. It provides a consistent visual language and component library for building the TikTok clone application.

## Implementation

### 1. Tailwind CSS Configuration

The design system is configured in `tailwind.config.js` with:

- **Custom Color Palette**: Primary, accent, neutral, and semantic colors
- **Typography System**: Inter (UI) and Poppins (display) fonts with consistent sizing
- **Spacing & Layout**: Custom spacing values and layout utilities
- **Component Classes**: Pre-built component styles for consistency
- **Animations**: Custom animations and transitions

### 2. Design Tokens

Design tokens are documented in `styles/design-tokens.js` for:

- Easy reference and maintenance
- Potential integration with other tools
- Documentation of the design system

## Color System

### Primary Colors
- **Brand Blue**: `primary-500` (#0ea5e9) - Main brand color
- **Accent Purple**: `accent-500` (#d946ef) - Secondary brand color

### Neutral Colors
- **White**: `neutral-0` (#ffffff)
- **Light Gray**: `neutral-100` (#f5f5f5)
- **Medium Gray**: `neutral-500` (#737373)
- **Dark Gray**: `neutral-900` (#171717)
- **Black**: `neutral-950` (#0a0a0a)

### Semantic Colors
- **Success**: `success-500` (#22c55e)
- **Warning**: `warning-500` (#f59e0b)
- **Error**: `error-500` (#ef4444)
- **Info**: `info-500` (#3b82f6)

## Typography

### Font Families
- **UI Text**: `font-sans` (Inter)
- **Display Text**: `font-display` (Poppins)
- **Code**: `font-mono` (JetBrains Mono)

### Font Sizes
- **Small**: `text-sm` (14px)
- **Base**: `text-base` (16px)
- **Large**: `text-lg` (18px)
- **Headings**: `text-xl` to `text-9xl`

## Component Classes

### Buttons
```html
<!-- Primary Button -->
<button class="btn-primary">Primary Action</button>

<!-- Secondary Button -->
<button class="btn-secondary">Secondary Action</button>

<!-- Accent Button -->
<button class="btn-accent">Accent Action</button>

<!-- Ghost Button -->
<button class="btn-ghost">Ghost Action</button>
```

### Cards
```html
<!-- Basic Card -->
<div class="card">
  <p>Card content</p>
</div>

<!-- Hoverable Card -->
<div class="card-hover">
  <p>Interactive card content</p>
</div>
```

### Input Fields
```html
<!-- Input Field -->
<input type="text" class="input-field" placeholder="Enter text..." />
```

### Avatars
```html
<!-- Small Avatar -->
<div class="avatar-sm">
  <img src="/avatar.jpg" alt="User" />
</div>

<!-- Medium Avatar -->
<div class="avatar-md">
  <img src="/avatar.jpg" alt="User" />
</div>

<!-- Large Avatar -->
<div class="avatar-lg">
  <img src="/avatar.jpg" alt="User" />
</div>
```

### Tags/Badges
```html
<!-- Primary Tag -->
<span class="tag-primary">Primary</span>

<!-- Success Tag -->
<span class="tag-success">Success</span>

<!-- Warning Tag -->
<span class="tag-warning">Warning</span>

<!-- Error Tag -->
<span class="tag-error">Error</span>
```

## Spacing System

### Standard Spacing
- **Extra Small**: `p-1` (4px), `p-2` (8px)
- **Small**: `p-3` (12px), `p-4` (16px)
- **Medium**: `p-6` (24px), `p-8` (32px)
- **Large**: `p-12` (48px), `p-16` (64px)
- **Extra Large**: `p-20` (80px), `p-24` (96px)

### Custom Spacing
- **18**: `p-18` (72px)
- **88**: `p-88` (352px)
- **128**: `p-128` (512px)
- **144**: `p-144` (576px)

## Shadows

### Standard Shadows
- **Small**: `shadow-sm`
- **Medium**: `shadow-md`
- **Large**: `shadow-lg`
- **Extra Large**: `shadow-xl`

### Custom Shadows
- **Card**: `shadow-card` - For card components
- **Button**: `shadow-button` - For button components
- **Modal**: `shadow-modal` - For modal dialogs

## Animations

### Available Animations
- **Fade In**: `animate-fade-in`
- **Slide Up**: `animate-slide-up`
- **Slide Down**: `animate-slide-down`
- **Scale In**: `animate-scale-in`
- **Bounce Gentle**: `animate-bounce-gentle`

## Usage Guidelines

### 1. Color Usage
- Use primary colors for main actions and branding
- Use accent colors sparingly for highlights and secondary actions
- Use neutral colors for text, backgrounds, and borders
- Use semantic colors for status indicators and feedback

### 2. Typography
- Use `font-display` for headings and brand elements
- Use `font-sans` for body text and UI elements
- Maintain consistent line heights and spacing

### 3. Spacing
- Use consistent spacing values from the design system
- Follow the 4px grid system
- Use larger spacing for section breaks and smaller for component spacing

### 4. Components
- Use pre-built component classes for consistency
- Extend component classes when needed rather than creating new ones
- Follow the established patterns for new components

## Development Workflow

### 1. Using Design Tokens
```javascript
import { colors, typography, spacing } from '../styles/design-tokens';

// Access design tokens in JavaScript
const primaryColor = colors.primary[500];
const headingFont = typography.fontFamily.display;
```

### 2. Extending the System
To add new components or modify existing ones:

1. Update `tailwind.config.js` with new component classes
2. Document changes in `styles/design-tokens.js`
3. Update this README with usage examples
4. Test across different components and pages

### 3. Best Practices
- Always use design system colors instead of arbitrary values
- Prefer component classes over utility combinations
- Test responsive behavior with all breakpoints
- Ensure accessibility standards are met

## File Structure

```
├── tailwind.config.js          # Main Tailwind configuration
├── styles/
│   ├── design-tokens.js        # Design tokens documentation
│   └── globals.css             # Global styles
└── DESIGN_SYSTEM.md           # This documentation
```

## Next Steps

1. **Font Integration**: Add Google Fonts links for Inter and Poppins
2. **Icon System**: Implement consistent icon usage
3. **Component Library**: Build reusable React components
4. **Dark Mode**: Implement dark mode support
5. **Responsive Design**: Ensure mobile-first responsive design

## Resources

- [TokFlo Style System & Guide v1.0](https://docs.google.com/document/d/1example) - Original design guide
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Design Tokens Specification](https://design-tokens.github.io/community-group/format/)

---

*This design system is implemented for the TokFlo project and should be maintained as the application evolves.*