# FormalizeIt — Stitch Design System

Read this file at the start of any UI task. All pages must follow this design system.

---

## Overview

Clean, minimal SaaS design. White background, teal + dark navy brand colors. No heavy gradients, no dark hero sections. Applied to: `src/app/page.tsx`, `src/app/about/page.tsx` — use these as reference implementations.

---

## Colors

- **Primary action:** `bg-teal-800 hover:bg-teal-700` (buttons — NOT teal-600)
- **Accent label:** `text-teal-700` (small uppercase section labels)
- **Body text:** `text-gray-900` (headings), `text-gray-500` (body/descriptions)
- **Borders:** `border-gray-100` (section dividers), `border-gray-200` (cards)
- **Backgrounds:** `bg-white` (primary), `bg-gray-50` (alternate sections)
- **Icon backgrounds:** `bg-teal-50 group-hover:bg-teal-100`
- **Status/highlight rows:** teal-50/teal-200 for variables, amber-50/amber-200 for custom clauses

---

## Typography

- **Page H1:** `text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight`
- **Section H2:** `text-2xl font-bold text-gray-900` or `text-3xl font-extrabold tracking-tight`
- **Step/card H3:** `text-sm font-bold text-gray-900` (small cards) or `text-2xl font-extrabold` (timeline)
- **Section accent label:** `text-teal-700 text-xs font-bold uppercase tracking-widest mb-3`
- **Body:** `text-base text-gray-500 leading-relaxed`
- **Small descriptions:** `text-sm text-gray-500 leading-relaxed`

---

## Layout

- **Container:** `max-w-5xl mx-auto px-4 sm:px-6 lg:px-8`
- **Section padding:** `py-10` to `py-16` (not py-24/py-32 — keep it tight)
- **Section divider:** `border-t border-gray-100` between sections
- **Hero padding:** `pt-12 pb-12`
- **Centered hero:** `text-center max-w-2xl mx-auto`
- **Two-column hero:** `grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center`

---

## Components

### Primary CTA Button
```tsx
<button className="inline-flex items-center gap-2 px-6 py-3 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-200 text-sm cursor-pointer">
  Label
  <ArrowRight className="w-4 h-4" />
</button>
```

### Feature Card
```tsx
<div className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all duration-200">
  <div className="w-10 h-10 bg-teal-50 group-hover:bg-teal-100 rounded-lg flex items-center justify-center mb-4 transition-colors duration-200">
    <Icon className="w-5 h-5 text-teal-700" />
  </div>
  <h3 className="text-sm font-bold text-gray-900 mb-1.5">Title</h3>
  <p className="text-sm text-gray-500 leading-relaxed">Description</p>
</div>
```

### Step Row ("How it Works" style)
```tsx
<div className="flex gap-4">
  <div className="flex-shrink-0 w-11 h-11 rounded-full bg-teal-800 flex items-center justify-center shadow-sm">
    <Icon className="w-5 h-5 text-white" />
  </div>
  <div>
    <p className="text-sm font-semibold text-gray-900 mb-1">1. Step title</p>
    <p className="text-sm text-gray-500 leading-relaxed">Description</p>
  </div>
</div>
```

### Section Header (with accent label)
```tsx
<p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-3">Label</p>
<h2 className="text-2xl font-bold text-gray-900 mb-8">Section Title</h2>
```

### CTA Strip (bottom of page)
```tsx
<section className="border-t border-gray-100 bg-gray-50 py-10">
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Heading</h2>
        <p className="text-sm text-gray-500">Subtext</p>
      </div>
      {/* Primary button */}
    </div>
  </div>
</section>
```

---

## Animations (Framer Motion)

```tsx
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}
const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.09 } },
}
```

- Hero: `initial/animate` with `fadeUp` + `stagger`
- Sections: `whileInView` + `viewport={{ once: true, margin: '-60px' }}`
- Cards: stagger children with `fadeUp`

---

## Document Mockup (reusable visual)

Used in hero sections to illustrate the NDA review concept.
See `src/app/page.tsx` → `DocumentMockup` component.
Key elements: browser chrome, gray text bars, teal-highlighted variable row, amber-highlighted clause row, floating tooltip card.

---

## Timeline (about page pattern)

Scroll-driven vertical timeline using `useScroll` + `useTransform` for a progress line.
See `src/app/about/page.tsx` for full implementation.
- Desktop: alternating left/right columns with centered line
- Mobile: left-aligned line, content stacked below dot
- Each step slides in from opposite sides via `useInView`
