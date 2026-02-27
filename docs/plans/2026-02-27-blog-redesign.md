# Blog Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the blog's visual appearance from a sunset-orange warm palette to a GitHub-style blue/cyan technical aesthetic, inspired by openclaw101.dev/zh, while keeping all functionality and tests intact.

**Architecture:** Pure CSS/HTML template changes — no TypeScript logic, no test file changes, no new dependencies. The Jest test suite uses its own mock templates (not the actual `templates/` directory), so template edits will not break any tests. The implementation modifies `style.css` (color tokens, component styles), `layout.html` (font import, theme toggle icons), and `index.html` (hero markup).

**Tech Stack:** CSS custom properties, Google Fonts (Inter), inline SVG icons, existing Handlebars template system

---

## Pre-flight

### Task 0: Confirm baseline tests pass

**Files:** none modified

**Step 1: Run full test suite**

```bash
cd /Users/shinerio/Workspace/code/shinerio.github.io
npm test
```
Expected: all tests pass (green). If any fail, stop and investigate before proceeding.

---

## Task 1: Replace CSS color tokens

The entire color system lives in `:root` at the top of `style.css` (lines 1–118). Replace sunset-orange values with GitHub-style blue/cyan values.

**Files:**
- Modify: `templates/assets/css/style.css:1-118`

**Step 1: Replace the `:root` color and font variables block**

Find and replace the content from line 1 through the closing `}` of `:root` (line 118). The new block is:

```css
:root {
    /* ===========================
       🔷 GitHub Blue Color System
       =========================== */

    /* Light mode colors */
    --color-bg-primary: #ffffff;
    --color-bg-secondary: #f6f8fa;
    --color-bg-tertiary: #eef1f5;
    --color-text-primary: #1f2328;
    --color-text-secondary: #57606a;
    --color-text-tertiary: #6e7781;
    --color-border: #d0d7de;

    /* Blue Accent Palette */
    --color-accent-primary: #0969da;
    --color-accent-secondary: #0550ae;
    --color-accent-highlight: #54aeff;
    --color-accent-soft: #ddf4ff;

    /* Dark mode colors */
    --color-dark-bg-primary: #0d1117;
    --color-dark-bg-secondary: #161b22;
    --color-dark-bg-tertiary: #1c2128;
    --color-dark-text-primary: #f0f6fc;
    --color-dark-text-secondary: #8b949e;
    --color-dark-text-tertiary: #6e7781;
    --color-dark-border: #30363d;
    --color-dark-accent-primary: #58a6ff;
    --color-dark-accent-secondary: #1f6feb;
    --color-dark-accent-highlight: #79c0ff;
    --color-dark-accent-soft: #0c2d6b;
    --color-dark-overlay: rgba(1, 4, 9, 0.8);
    --color-dark-header-bg: rgba(13, 17, 23, 0.88);
    --color-dark-hero-glow: rgba(88, 166, 255, 0.15);

    /* Component-specific colors */
    --color-card-bg: var(--color-bg-secondary);
    --color-card-border: var(--color-border);
    --color-button-bg: var(--color-accent-primary);
    --color-button-text: white;
    --color-button-hover: var(--color-accent-secondary);

    /* ===========================
       📐 Spacing & Layout
       =========================== */
    --spacing-xs: 0.375rem;
    --spacing-sm: 0.625rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.75rem;
    --spacing-xl: 2.5rem;
    --spacing-2xl: 4rem;
    --spacing-3xl: 6rem;

    /* Border radius */
    --radius-sm: 0.375rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --radius-xl: 1rem;
    --radius-2xl: 1.5rem;

    /* Shadows */
    --shadow-sm: 0 1px 3px rgba(31, 35, 40, 0.12), 0 1px 2px rgba(31, 35, 40, 0.08);
    --shadow-md: 0 3px 6px rgba(31, 35, 40, 0.12), 0 2px 4px rgba(31, 35, 40, 0.08);
    --shadow-lg: 0 8px 24px rgba(31, 35, 40, 0.12), 0 4px 8px rgba(31, 35, 40, 0.06);
    --shadow-warm: 0 0 0 3px rgba(9, 105, 218, 0.3);
    --shadow-dark-sm: 0 1px 3px rgba(1, 4, 9, 0.4);
    --shadow-dark-md: 0 3px 6px rgba(1, 4, 9, 0.45);
    --shadow-dark-lg: 0 8px 24px rgba(1, 4, 9, 0.5);
    --shadow-dark-warm: 0 0 0 3px rgba(31, 111, 235, 0.4);

    /* Transitions */
    --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-normal: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-slow: 0.4s cubic-bezier(0.4, 0, 0.2, 1);

    /* Animations */
    --animation-duration-short: 0.3s;
    --animation-duration-medium: 0.5s;
    --animation-duration-long: 0.8s;
    --animation-easing: cubic-bezier(0.16, 1, 0.3, 1);

    /* ===========================
       📝 Typography
       =========================== */
    --font-display: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-mono: 'JetBrains Mono', 'Monaco', 'Cascadia Code', monospace;

    /* Font sizes */
    --font-size-xs: 0.75rem;
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    --font-size-xl: 1.25rem;
    --font-size-2xl: 1.5rem;
    --font-size-3xl: 1.875rem;
    --font-size-4xl: 2.25rem;
    --font-size-5xl: 3rem;

    /* Typography settings */
    --line-height-base: 1.75;
    --line-height-heading: 1.25;
    --line-height-code: 1.6;
    --letter-spacing-headings: -0.02em;
    --letter-spacing-body: 0;
    --letter-spacing-caps: 0.05em;

    /* Grid layout */
    --container-max-width: 1240px;
    --grid-gap: var(--spacing-lg);

    /* Responsive breakpoints */
    --breakpoint-sm: 576px;
    --breakpoint-md: 768px;
    --breakpoint-lg: 992px;
    --breakpoint-xl: 1200px;
}
```

**Step 2: Run tests to confirm nothing broke**

```bash
npm test
```
Expected: all tests still pass.

**Step 3: Commit**

```bash
git add templates/assets/css/style.css
git commit -m "style: replace color tokens with GitHub blue/cyan palette"
```

---

## Task 2: Update Google Fonts import in layout.html

Replace `Outfit` and `Crimson Pro` with `Inter`.

**Files:**
- Modify: `templates/layout.html:34-36`

**Step 1: Replace the Google Fonts link tag**

Find:
```html
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

Replace with:
```html
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Step 2: Replace emoji theme toggle icons with SVG**

Find in `templates/layout.html`:
```html
                        <button id="theme-toggle" aria-label="Toggle dark mode" class="theme-toggle-btn">
                            <span class="sun-icon">☀️</span>
                            <span class="moon-icon">🌙</span>
                        </button>
```

Replace with:
```html
                        <button id="theme-toggle" aria-label="Toggle dark mode" class="theme-toggle-btn">
                            <span class="sun-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                            </span>
                            <span class="moon-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                            </span>
                        </button>
```

**Step 3: Run tests**

```bash
npm test
```

**Step 4: Commit**

```bash
git add templates/layout.html
git commit -m "style: update fonts to Inter, replace emoji theme toggle with SVG icons"
```

---

## Task 3: Update header/navigation CSS

**Files:**
- Modify: `templates/assets/css/style.css` — header section (approx lines 279–404)

**Step 1: Update `.page-header` light mode background**

Find:
```css
.page-header {
    background-color: rgba(255, 252, 249, 0.85);
```

Replace with:
```css
.page-header {
    background-color: rgba(255, 255, 255, 0.9);
```

**Step 2: Update `.theme-toggle-btn` hover — remove orange box-shadow**

Find:
```css
.theme-toggle-btn:hover {
    background: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
    transform: scale(1.05) rotate(20deg);
    box-shadow: var(--shadow-warm);
}
```

Replace with:
```css
.theme-toggle-btn:hover {
    background: var(--color-bg-tertiary);
    border-color: var(--color-accent-primary);
    color: var(--color-accent-primary);
    transform: scale(1.05);
    box-shadow: var(--shadow-warm);
}
```

**Step 3: Update `.sun-icon` / `.moon-icon` sizing for SVG**

Find:
```css
.sun-icon,
.moon-icon {
    position: absolute;
    font-size: 1.25rem;
    transition: all var(--transition-normal);
}
```

Replace with:
```css
.sun-icon,
.moon-icon {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-normal);
}
```

**Step 4: Run tests**

```bash
npm test
```

**Step 5: Commit**

```bash
git add templates/assets/css/style.css
git commit -m "style: update header and navigation colors"
```

---

## Task 4: Redesign the hero section

Remove meteor shower animation; add subtle dot-grid background + blue gradient title.

**Files:**
- Modify: `templates/index.html`
- Modify: `templates/assets/css/style.css` — hero section (approx lines 460–636)

**Step 1: Update `templates/index.html` — remove meteor shower markup**

Current content:
```html
<section class="hero">
    <div class="meteor-shower" aria-hidden="true">
        <span class="meteor"></span>
        <span class="meteor"></span>
        <span class="meteor"></span>
        <span class="meteor"></span>
        <span class="meteor"></span>
        <span class="meteor"></span>
        <span class="meteor"></span>
        <span class="meteor"></span>
    </div>
    <h1>{{siteTitle}}</h1>
    <p class="hero-description">{{siteDescription}}</p>
</section>
```

Replace with:
```html
<section class="hero">
    <div class="hero-bg-grid" aria-hidden="true"></div>
    <div class="hero-glow" aria-hidden="true"></div>
    <h1>{{siteTitle}}</h1>
    <p class="hero-description">{{siteDescription}}</p>
</section>
```

**Step 2: Replace the entire hero CSS block in style.css**

Find the block starting at `.hero {` through `}` closing `@keyframes meteorFall` (approx lines 464–636). Replace the entire section with:

```css
/* ===========================
   🦸 Hero Section
   =========================== */

.hero {
    text-align: center;
    padding: var(--spacing-3xl) 0;
    margin-bottom: var(--spacing-2xl);
    position: relative;
    overflow: hidden;
    background: var(--color-bg-primary);
}

[data-theme="dark"] .hero {
    background: linear-gradient(180deg, #0d1117 0%, #0d1117 100%);
}

/* Dot-grid background */
.hero-bg-grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: radial-gradient(circle, var(--color-border) 1px, transparent 1px);
    background-size: 28px 28px;
    opacity: 0.5;
    z-index: 0;
}

[data-theme="dark"] .hero-bg-grid {
    background-image: radial-gradient(circle, #30363d 1px, transparent 1px);
    opacity: 0.6;
}

@media (prefers-color-scheme: dark) {
    :root:not([data-theme]) .hero {
        background: linear-gradient(180deg, #0d1117 0%, #0d1117 100%);
    }
    :root:not([data-theme]) .hero-bg-grid {
        background-image: radial-gradient(circle, #30363d 1px, transparent 1px);
        opacity: 0.6;
    }
}

/* Blue radial glow behind title in dark mode */
.hero-glow {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 700px;
    height: 400px;
    background: radial-gradient(ellipse at center, rgba(88, 166, 255, 0.12) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
    opacity: 0;
}

[data-theme="dark"] .hero-glow {
    opacity: 1;
}

@media (prefers-color-scheme: dark) {
    :root:not([data-theme]) .hero-glow {
        opacity: 1;
    }
}

.hero h1 {
    font-family: var(--font-display);
    font-size: var(--font-size-5xl);
    font-weight: 800;
    letter-spacing: var(--letter-spacing-headings);
    line-height: var(--line-height-heading);
    margin-bottom: var(--spacing-lg);
    color: var(--color-text-primary);
    position: relative;
    z-index: 1;
    animation: fadeInUp 0.6s var(--animation-easing) backwards;
}

[data-theme="dark"] .hero h1 {
    background: linear-gradient(135deg, #f0f6fc 0%, #58a6ff 50%, #3fb950 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

@media (prefers-color-scheme: dark) {
    :root:not([data-theme]) .hero h1 {
        background: linear-gradient(135deg, #f0f6fc 0%, #58a6ff 50%, #3fb950 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
}

.hero p {
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
    animation: fadeInUp 0.6s var(--animation-easing) 0.15s backwards;
    position: relative;
    z-index: 1;
}

.hero .hero-description {
    font-weight: 400;
    color: var(--color-text-secondary);
    -webkit-text-fill-color: unset;
    background: none;
}

@keyframes colorCycle {
    0%   { background-position: 0% 50%; }
    100% { background-position: -300% 50%; }
}
```

**Step 3: Run tests**

```bash
npm test
```

**Step 4: Commit**

```bash
git add templates/index.html templates/assets/css/style.css
git commit -m "style: replace meteor shower hero with dot-grid + blue gradient design"
```

---

## Task 5: Update sidebar CSS

**Files:**
- Modify: `templates/assets/css/style.css` — sidebar section (approx lines 1086–1206)

**Step 1: Update `.sidebar` background**

Find:
```css
.sidebar {
```
(the block with `position: fixed; left: 0;` etc.)

Update the background and border properties in `.sidebar` to use:
```css
    background: var(--color-bg-secondary);
    border-right: 1px solid var(--color-border);
```

These already use CSS variables, so they will automatically use the new token values. No change needed if they already reference `--color-bg-secondary` and `--color-border`.

**Step 2: Update `.sidebar-widget h3` underline — remove orange gradient**

Find:
```css
.sidebar-widget h3::after {
```
(the block with `background: linear-gradient(90deg, var(--color-accent-primary)...`)

Confirm it already uses `var(--color-accent-primary)`. Since the token now maps to blue, this automatically works.

**Step 3: Update `.sidebar-widget .tag-cloud` tag styles**

Find the `.sidebar-widget .tag-cloud` block and confirm tags inside use `.tag` class which will be updated in Task 6.

**Step 4: Run tests**

```bash
npm test
```

**Step 5: Commit**

```bash
git add templates/assets/css/style.css
git commit -m "style: verify sidebar uses updated CSS tokens"
```

---

## Task 6: Update article cards and recent articles list

**Files:**
- Modify: `templates/assets/css/style.css` — article cards (~line 695) and recent articles (~line 1224)

**Step 1: Find the `.recent-articles li` block and update hover state**

Find:
```css
.recent-articles li:hover {
```

Confirm it uses `var(--color-accent-soft)` or `var(--color-border)` for background. Since tokens are updated, the blue soft tint applies automatically.

**Step 2: Update recent articles section heading underline**

Find:
```css
.recent-articles h2::after,
.article-list h2::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 60px;
    height: 4px;
    background: linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-highlight));
    border-radius: 2px;
}
```

This already uses CSS variable tokens — no change needed, it will render in blue automatically.

**Step 3: Update `.article-card` hover border color**

Find the `.article-card:hover` or similar block. Confirm border-color uses `var(--color-accent-primary)`.

If any hardcoded orange values exist (e.g., `#FF8C42`, `#FF6F1E`, `rgba(255, 140, 66`), replace them with:
- `var(--color-accent-primary)` for borders/accents
- `var(--color-accent-soft)` for soft backgrounds

Search for remaining orange hardcodes:
```bash
grep -n "FF8C42\|FF6F1E\|FFB380\|FFE5D3\|FF8C\|rgba(255, 140" templates/assets/css/style.css
```

Replace any found with the equivalent blue token.

**Step 4: Run tests**

```bash
npm test
```

**Step 5: Commit**

```bash
git add templates/assets/css/style.css
git commit -m "style: update article cards and list to blue accent tokens"
```

---

## Task 7: Update tag/badge styles

**Files:**
- Modify: `templates/assets/css/style.css` — tag block (approx lines 771–791)

**Step 1: Find and update the `.tag` block**

Find:
```css
.tag {
```

Replace the entire `.tag` and `.tag:hover` blocks with:

```css
.tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    font-size: var(--font-size-xs);
    font-weight: 500;
    font-family: var(--font-display);
    border-radius: 20px;
    background: var(--color-accent-soft);
    color: var(--color-accent-primary);
    border: 1px solid var(--color-accent-highlight);
    cursor: default;
    transition: all var(--transition-fast);
    white-space: nowrap;
    letter-spacing: 0.01em;
}

.tag:hover {
    background: var(--color-accent-primary);
    color: white;
    border-color: var(--color-accent-primary);
    transform: translateY(-1px);
}

[data-theme="dark"] .tag {
    background: var(--color-dark-accent-soft);
    color: var(--color-dark-accent-highlight);
    border-color: var(--color-dark-accent-secondary);
}

[data-theme="dark"] .tag:hover {
    background: var(--color-dark-accent-secondary);
    color: white;
    border-color: var(--color-dark-accent-secondary);
}
```

**Step 2: Run tests**

```bash
npm test
```

**Step 3: Commit**

```bash
git add templates/assets/css/style.css
git commit -m "style: update tag/badge to pill style with blue accent"
```

---

## Task 8: Sweep for remaining hardcoded orange values

**Files:**
- Modify: `templates/assets/css/style.css`
- Modify: `templates/assets/css/style-addition.css`

**Step 1: Find all remaining orange hardcodes in both CSS files**

```bash
grep -n "FF8C42\|FF6F1E\|FFB380\|FFE5D3\|FFF8F3\|FFFCF9\|FFE8D9\|2D1810\|5C3D2E\|8B7269\|F4D4C0\|FFF5EE\|rgba(255, 140\|rgba(45, 24" \
  templates/assets/css/style.css templates/assets/css/style-addition.css
```

**Step 2: For each found instance, replace with the blue equivalent**

Common replacements:
- `#FF8C42` → `var(--color-accent-primary)` or `#0969da`
- `rgba(255, 140, 66, 0.XX)` → `rgba(9, 105, 218, 0.XX)`
- `rgba(45, 24, 16, 0.XX)` → `rgba(31, 35, 40, 0.XX)`
- `#FFF5EE` → `var(--color-bg-secondary)` or `#f6f8fa`
- `#FFFCF9` → `#ffffff`

**Step 3: Also check style-addition.css for hardcoded orange-tinted values**

The `style-addition.css` file primarily handles code blocks and image overlays. These use CSS variable tokens already — confirm there are no leftover orange hardcodes.

**Step 4: Run tests**

```bash
npm test
```

**Step 5: Commit**

```bash
git add templates/assets/css/style.css templates/assets/css/style-addition.css
git commit -m "style: remove all remaining hardcoded orange values"
```

---

## Task 9: Final polish — article page reading experience

**Files:**
- Modify: `templates/assets/css/style.css` — article/content section (approx lines 800–1000)

**Step 1: Confirm article content max-width**

Search for where article content width is set:
```bash
grep -n "max-width\|article-main\|\.content\|article-page" templates/assets/css/style.css | head -30
```

Ensure the article body column is constrained to ~`70ch` or `720px` for optimal reading. If not, find the `.article-main-column` or `.content` rule and add `max-width: 72ch;`.

**Step 2: Update TOC active state to blue**

Find:
```bash
grep -n "toc\|article-toc" templates/assets/css/style.css | head -20
```

Ensure the active TOC item uses `var(--color-accent-primary)` (now blue) for its indicator/border. If it has a hardcoded orange value, replace it.

**Step 3: Run final test suite**

```bash
npm test
```
Expected: all tests pass.

**Step 4: Commit**

```bash
git add templates/assets/css/style.css
git commit -m "style: finalize article page reading experience with blue accents"
```

---

## Task 10: Integration verification

**Step 1: Build the project**

```bash
npm run build
```
Expected: no TypeScript errors.

**Step 2: Run linter**

```bash
npm run lint
```
Expected: no lint errors (CSS files are not linted by ESLint in this project).

**Step 3: Run full test suite one final time**

```bash
npm test
```
Expected: all tests pass.

**Step 4: Final commit with summary**

```bash
git add -A
git commit -m "feat: complete blog redesign — GitHub blue/cyan aesthetic (openclaw101 style)"
```

---

## Notes for implementor

- The tests in `test/` use their own mock templates created in `beforeEach`. Changes to `templates/` will **not** affect test outcomes.
- Do **not** modify any `.ts` source files, any `.js` template assets, `style-fixes.css`, or `text-selection-comment.css`.
- Do **not** change any Handlebars template variables (`{{title}}`, `{{content}}`, etc.).
- After each task, run `npm test` to confirm no regressions before committing.
- The `style.css` file is ~1650 lines — use `grep -n` liberally to find exact line numbers before editing.
