# ImgPDF Design System (DESIGN.md)

This document establishes the permanent visual design standard for the entire ImgPDF project (`https://img-pdf.github.io/`).

All future development, new tools, new pages, UI improvements, and updates must strictly adhere to this design specification.

---

## 1. Design Philosophy

ImgPDF follows the minimalist, high-trust SaaS visual philosophy inspired by **Cal.com**:

- **Pure White Canvas**: Crisp, clean `#ffffff` default background with generous breathing room.
- **Black Primary Actions**: Unapologetic `#111111` primary action buttons with white text and 8px border radius.
- **Subtle Surface Hierarchy**: Light-grey card surfaces (`#f5f5f5` and `#f8f9fa`) with delicate 1px hairline borders (`#e5e7eb`).
- **Product Chrome First**: Show real, functional tool interfaces inside cards rather than generic illustrations or abstract graphics.
- **Deliberate Dark Footer**: The only full dark surface is the `#101010` footer, visually anchoring long-scroll pages.
- **Zero AI Slop**: No heavy purple/pink gradients, no glassmorphism, no fake floating badges, no decorative clutter.
- **Typography Discipline**: Inter 600 with negative letter-spacing for display headings; Inter 400/500 for UI and body copy; JetBrains Mono for technical codes and metadata.

---

## 2. Color Palette & Design Tokens

### Core Colors
```css
:root {
  /* Brand / Primary */
  --primary: #111111;
  --primary-active: #242424;
  --primary-disabled: #e5e7eb;

  /* Typography */
  --ink: #111111;              /* Main text, titles, headings */
  --body: #374151;             /* Standard running text */
  --muted: #6b7280;            /* Subheadings, breadcrumbs, descriptions */
  --muted-soft: #898989;       /* Captions, subtle metadata */

  /* Surfaces */
  --canvas: #ffffff;           /* Default page background */
  --surface-soft: #f8f9fa;     /* Very soft section background, dropzone base */
  --surface-card: #f5f5f5;     /* Feature cards, tool cards, input backgrounds */
  --surface-strong: #e5e7eb;   /* Solid dividers, disabled button surface */
  --surface-dark: #101010;     /* Dark footer surface */
  --surface-dark-elevated: #1a1a1a; /* Nested cards inside dark footer */

  /* Hairlines / Borders */
  --border: #e5e7eb;           /* 1px primary border on cards, inputs */
  --border-soft: #f3f4f6;      /* Subtle dividers between white sections */

  /* Accents */
  --brand-accent: #3b82f6;     /* Rare blue accent for links and focus rings */
  --success: #10b981;          /* Completed states, positive file size savings */
  --warning: #f59e0b;          /* Warnings, caution notices */
  --error: #ef4444;            /* Validation errors, delete triggers */

  /* On-Color Text */
  --on-primary: #ffffff;
  --on-dark: #ffffff;
  --on-dark-soft: #a1a1aa;
}
```

### Dark Mode Tokens (Preserved for User Preference)
```css
[data-theme="dark"] {
  --canvas: #0d1117;
  --surface-soft: #161b22;
  --surface-card: #161b22;
  --surface-strong: #30363d;
  --ink: #f0f6fc;
  --body: #c9d1d9;
  --muted: #8b949e;
  --muted-soft: #6e7681;
  --border: #30363d;
  --border-soft: #21262d;
  --primary: #f0f6fc;
  --primary-active: #e6edf3;
  --primary-disabled: #30363d;
  --on-primary: #0d1117;
  --surface-dark: #07090d;
}
```

---

## 3. Typography Scale & Font Families

- **Body & UI**: `Inter`, system-ui, -apple-system, sans-serif
- **Headings**: `Inter` weight 600 with negative tracking (`-0.03em` to `-0.04em`, or `-0.5px` to `-2px`)
- **Monospace**: `JetBrains Mono`, Consolas, monospace

| Token | Size | Weight | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-xl` | 56px–64px | 600 | 1.05 | -2px | Hero H1 on homepage |
| `display-lg` | 40px–48px | 600 | 1.1 | -1.5px | Major section titles |
| `display-md` | 30px–36px | 600 | 1.15 | -1px | Tool page H1 titles |
| `display-sm` | 24px–28px | 600 | 1.2 | -0.5px | Secondary section headers, CTA banners |
| `title-lg` | 20px–22px | 600 | 1.3 | -0.3px | Category headers, tool group titles |
| `title-md` | 17px–18px | 600 | 1.4 | 0 | Tool card names |
| `title-sm` | 15px–16px | 600 | 1.4 | 0 | Sub-panel labels, control labels |
| `body-md` | 15px–16px | 400 | 1.55 | 0 | Default running paragraphs |
| `body-sm` | 13px–14px | 400 | 1.5 | 0 | Footnotes, captions, small tool hints |
| `caption` | 12px–13px | 500 | 1.4 | 0 | File size tags, status text |
| `button` | 14px | 600 | 1.0 | 0 | Button labels |
| `nav-link` | 14px | 500 | 1.4 | 0 | Header navigation items |

---

## 4. Spacing & Shape Geometry

- **Base Spacing**: 4px grid (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`, `96px`).
- **Container Max-Width**: `1200px` centered with `24px` horizontal padding (`16px` on mobile).
- **Section Spacing**: `64px` to `96px` vertical padding.
- **Border Radii**:
  - `rounded.sm`: `6px` (dropdown items, small badges)
  - `rounded.md`: `8px` (all buttons, text inputs, search fields, chips)
  - `rounded.lg`: `12px` (tool cards, feature cards, dropzones, result panels)
  - `rounded.xl`: `16px` (main tool processing panels, hero preview cards)
  - `rounded.pill`: `9999px` (status pills, filter groups)
  - `rounded.full`: `50%` (circular icon buttons, avatars)

---

## 5. Standard Component Guidelines

### A. Navigation Bar (`site-header`)
- **Height**: 64px fixed.
- **Background**: Pure white (`#ffffff`) with a 1px solid bottom hairline border (`#e5e7eb`).
- **Brand Logo**: Clean monochrome mark: square with 8px radius, black background (`#111111`), white text `IMG`, followed by `ImgPDF` in Inter 600 (`#111111`).
- **Nav Links**: Inter 14px/500 in `#374151`, hover `#111111`, active with subtle `#f5f5f5` pill background.

### B. Buttons
- **Primary Button (`.btn--primary`)**:
  - Background: `#111111`, text `#ffffff`.
  - Height: 40px (or 44px for primary tool execution).
  - Radius: 8px.
  - Font: Inter 14px, 600 weight.
  - Hover: `#242424`.
  - Disabled: `#e5e7eb` background, `#6b7280` text.
- **Secondary / Ghost Button (`.btn--ghost`)**:
  - Background: `#ffffff`, text `#111111`.
  - Border: 1px solid `#e5e7eb`.
  - Radius: 8px.
  - Hover: Border `#111111`, background `#f8f9fa`.

### C. Text Inputs & Search
- Background: `#ffffff`.
- Border: 1px solid `#e5e7eb`.
- Radius: 8px.
- Height: 40px to 46px.
- Focus: Outline 2px solid `#111111` or `#3b82f6` with 0px offset.

### D. Tool Cards (`.tool-card`)
- Background: `#ffffff` or `#f8f9fa`.
- Border: 1px solid `#e5e7eb`.
- Radius: 12px.
- Padding: 20px to 24px.
- Hover: Border color shifts to `#111111` or slight subtle elevation (`0 4px 12px rgba(0,0,0,0.04)`). Never dramatic jumps or garish colors.

### E. Tool Upload Dropzone (`.dropzone`)
- Background: `#f8f9fa`.
- Border: 2px dashed `#e5e7eb`.
- Radius: 12px.
- Padding: 48px 24px.
- States:
  - Drag-over: Border `#111111`, background `#f3f4f6`.
  - Simple upload icon, clear file format and size guidance.

### F. Dark Footer (`site-footer`)
- Background: `#101010` (the only dark surface on light pages).
- Text: `#ffffff` for headers and brand, `#a1a1aa` for links and body text.
- Layout: 4 columns on desktop, clean wrapping on mobile.
- Bottom copyright bar: Subtle `#262626` top border.

---

## 6. Rules for All Future Updates

1. **Monochrome Dominance**: Never introduce saturated colored buttons (e.g. green, purple, yellow CTAs) for primary actions. The primary action is always `#111111`.
2. **No Generic Illustrations**: Always embed actual product chrome (upload zone, format selectors, real file cards, progress bars) rather than clip art or oversized stock illustrations.
3. **No Pill Clutter**: Render metadata (reading times, file types, timestamps) as clean unboxed text separated by dots (`·`) or slashes (`/`), not static colored pill capsules.
4. **Permanent Component Reuse**: Always reuse existing classes (`.btn`, `.dropzone`, `.tool-panel`, `.tool-card`, `.site-header`, `.site-footer`) instead of creating disconnected styles.
5. **SEO & Accessibility**: Always preserve valid HTML semantic hierarchy (single H1 per page, matching meta tags, JSON-LD schemas, focus states, mobile tap targets $\ge 44\text{px}$).
