# iOS Liquid Glass opacity update

## Goal
Make the glass/frosted surfaces across the homepage and the `/app` dashboard feel more like iOS Liquid Glass: more opaque, heavier blur, brighter highlights, while keeping all text readable against the dark-blue/black background.

## Scope
- **Homepage**: top navbar, hero differentiator cards, stats cards, feature cards, how-it-works cards, CTA card.
- **App dashboard**: sidebar, mobile nav sheet, active nav pill, panels/data panels, schedule cards/rows, teacher schedule cards.

## What will change

### 1. Centralise glass tokens in `src/styles.css`
Add a set of semantic tokens so the effect is consistent and easy to tune:

```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.55);
  --glass-bg-strong: rgba(255, 255, 255, 0.72);
  --glass-bg-subtle: rgba(255, 255, 255, 0.40);
  --glass-border: rgba(255, 255, 255, 0.45);
  --glass-border-strong: rgba(255, 255, 255, 0.60);
  --glass-blur: 28px;
  --glass-saturate: 160%;
}
```

### 2. Update existing glass utilities
- `.panel`, `@utility panel`: background `--glass-bg` (`rgba(255,255,255,0.55)`), `backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate))`, border `--glass-border`.
- `.data-panel`: background `--glass-bg-strong` (`0.72`) for panels that carry denser content.
- `.feature-card`: background `--glass-bg` (`0.55`), blur `28px`, border `0.45`, plus a subtle top/left highlight.
- `.landing-cta-glass`: background `--glass-bg-strong` (`0.72`).
- `.top-navbar`: background `--glass-bg-subtle` (`0.40`) so the navbar feels airy.
- `.navbar-button-secondary`: background `--glass-bg` (`0.55`).
- `.app-sidebar`: stronger gradient using `--glass-bg-subtle`, blur `28px`.
- `.sidebar-active-pill`: background `--glass-bg-strong` (`0.72`), border `0.5`.
- `.flashcard`: background `--glass-bg` (`0.55`).
- Mobile `SheetContent` (`bg-sidebar/95`) mapped to `--glass-bg` (`0.55`) with matching blur/border.

### 3. Preserve readability
- All glass containers keep `color: var(--color-foreground)` (white/off-white on the dark theme) so text inherits the high-contrast foreground colour.
- No panel text colour will be changed to a low-contrast value.
- `text-muted-foreground` remains a light slate (`#94a3b8`) for secondary text.
- Buttons/chips inside glass panels keep their existing `primary`/`secondary` tokens, which already provide strong contrast.
- Hover/focus states keep visible rings and shadows.

### 4. Validation
- Run the typecheck/build after the CSS-only change to confirm no component regressions.
- Visually spot-check both `/` and `/app` in preview for readability and the frosted look.

## Out of scope
- No structural component changes.
- No colour palette changes beyond tuning the glass layer opacity/blur/border.
- No new components or features.
