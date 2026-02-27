# Blog Redesign Design — Plan A

**Date:** 2026-02-27
**Inspiration:** https://openclaw101.dev/zh
**Scope:** Visual overhaul of `templates/assets/css/style.css` and HTML templates. No functional changes. All existing tests must pass.

---

## Goals

- Replace sunset-orange color scheme with GitHub-style blue/cyan palette
- Dark mode: deep navy (`#0d1117`) + blue/cyan gradient accents (openclaw101 aesthetic)
- Light mode: clean white + blue accents
- Keep dual light/dark theme toggle
- Keep collapsible sidebar layout
- Prioritize reading experience on article pages (preserve line-height 1.75)
- Modernize typography with Inter font
- Update card, button, tag, and navigation components

---

## 1. Color System

### Light Mode
| Token | Value | Usage |
|---|---|---|
| `--color-bg-primary` | `#ffffff` | Page background |
| `--color-bg-secondary` | `#f6f8fa` | Cards, sidebar |
| `--color-bg-tertiary` | `#eef1f5` | Hover states, code header |
| `--color-text-primary` | `#1f2328` | Body text |
| `--color-text-secondary` | `#57606a` | Meta, secondary text |
| `--color-text-tertiary` | `#6e7781` | Placeholders, muted |
| `--color-border` | `#d0d7de` | Borders |
| `--color-accent-primary` | `#0969da` | Links, buttons, active states |
| `--color-accent-secondary` | `#0550ae` | Hover states |
| `--color-accent-highlight` | `#54aeff` | Highlights |
| `--color-accent-soft` | `#ddf4ff` | Tag backgrounds, soft badges |

### Dark Mode
| Token | Value | Usage |
|---|---|---|
| `--color-dark-bg-primary` | `#0d1117` | Page background |
| `--color-dark-bg-secondary` | `#161b22` | Cards, sidebar |
| `--color-dark-bg-tertiary` | `#1c2128` | Hover states, code header |
| `--color-dark-text-primary` | `#f0f6fc` | Body text |
| `--color-dark-text-secondary` | `#8b949e` | Meta, secondary text |
| `--color-dark-text-tertiary` | `#6e7781` | Placeholders, muted |
| `--color-dark-border` | `#30363d` | Borders |
| `--color-dark-accent-primary` | `#58a6ff` | Links, buttons, active states |
| `--color-dark-accent-secondary` | `#1f6feb` | Hover states |
| `--color-dark-accent-highlight` | `#79c0ff` | Highlights |
| `--color-dark-accent-soft` | `#0c2d6b` | Tag backgrounds, soft badges |
| `--color-dark-accent-gradient` | `linear-gradient(135deg, #58a6ff, #3fb950)` | Hero title, special accents |

---

## 2. Typography

- **Primary font:** `Inter` (replace `Outfit`) — imported from Google Fonts
- **Mono font:** `JetBrains Mono` — keep as-is
- **Serif (article body option):** remove `Crimson Pro`, use system serif fallback if needed
- **Font weights:** 400 (body), 500 (medium), 600 (semibold), 700 (bold)
- **Base line-height:** Keep `1.75` — already optimal for reading
- **Body font size:** Keep `16px`

---

## 3. Hero Section (`templates/index.html`)

- Remove meteor shower animation (`<div class="meteor-shower">` + CSS keyframes)
- Dark mode: deep `#0d1117` background + subtle dot-grid pattern (CSS `radial-gradient`) + soft blue radial glow behind title
- Light mode: clean white background + blue title
- Title: apply blue/cyan gradient text in dark mode (`background-clip: text`)
- Keep `{{siteTitle}}` and `{{siteDescription}}` template variables unchanged

---

## 4. Navigation Header

- Dark mode: `background: rgba(13,17,23,0.85)` + `backdrop-filter: blur(12px)` for frosted glass
- Light mode: `background: rgba(255,255,255,0.9)` + `backdrop-filter: blur(12px)`
- Nav links: remove colored hover glow, use simple underline + accent color on hover
- Theme toggle: replace emoji (☀️/🌙) with clean SVG icons inline in `layout.html`
- Keep all existing nav links (Home, Articles, Search, TODO)

---

## 5. Sidebar

- Background: dark mode `rgba(22,27,34,0.8)`, light mode `#f6f8fa`
- Profile section: avatar + site title/author + GitHub link button (styled as outlined pill)
- Tag cloud: pill-shaped tags with article count, hover → accent color
- Stats section (optional): article count, last updated
- Border: `1px solid var(--color-border)` with subtle separator between sections

---

## 6. Article Cards (Home + Articles List)

- Upgrade plain `<li>` list to styled card list
- Each card: title (link), date, description/excerpt (if available), tag pills
- Card style: `border-radius: 8px`, `border: 1px solid var(--color-border)`, padding `20px`
- Hover: `transform: translateY(-2px)` + border color → accent
- Tags inside cards: pill shape, `background: var(--color-accent-soft)`, `color: var(--color-accent-primary)`

---

## 7. Article Detail Page

- **Reading experience is first priority** — do not change `line-height: 1.75`
- Keep `max-width: ~70ch` for article body column
- Heading font sizes: maintain clear hierarchy (h1 > h2 > h3)
- TOC sidebar: accent-colored active heading indicator, smooth scroll highlight
- Tags: updated pill style matching global tag style
- All existing features preserved: comments section, markdown export button, TOC

---

## 8. Tags & Badges

- All tags: `border-radius: 20px` (pill), `padding: 2px 10px`, `font-size: 0.75rem`
- Light: `background: #ddf4ff`, `color: #0969da`, `border: 1px solid #54aeff`
- Dark: `background: #0c2d6b`, `color: #79c0ff`, `border: 1px solid #1f6feb`

---

## 9. Buttons

- Primary: `background: #0969da` (light) / `#1f6feb` (dark), white text, `border-radius: 6px`
- Secondary/outline: transparent bg, accent border, accent text
- Hover: slight darken + `translateY(-1px)` lift

---

## 10. Code Blocks

- Keep existing macOS-style header bar
- Update code header background to match new dark/light tokens
- Keep `JetBrains Mono`, keep copy/fullscreen buttons

---

## Files to Modify

| File | Change |
|---|---|
| `templates/assets/css/style.css` | Full color token replacement, font update, component styles |
| `templates/layout.html` | Theme toggle SVG icons, Google Fonts import (Inter) |
| `templates/index.html` | Remove meteor shower, add dot-grid hero |
| `templates/assets/css/style-addition.css` | Update code header tokens if needed |

**Files NOT to modify:** All JS files, `article.html`, `articles.html`, `search.html`, `todo.html`, `style-fixes.css`, `text-selection-comment.css` — unless minor color token fixes needed.

---

## Constraints

- All existing template variables (`{{title}}`, `{{content}}`, etc.) must remain intact
- All existing JavaScript functionality must work unchanged
- All Jest unit/integration tests must pass after changes
- No new npm dependencies
- Mobile responsive behavior must be preserved
