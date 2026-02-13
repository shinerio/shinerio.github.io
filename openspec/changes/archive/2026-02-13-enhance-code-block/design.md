## Context

The blog generator converts Obsidian markdown to static HTML using `marked` (v9, GFM mode). Code blocks are output as `<pre><code class="language-xxx">` with basic CSS styling only — no syntax highlighting and no copy functionality. The site already has a robust dark/light theme system (`data-theme="dark"` attribute, CSS variables, `localStorage` persistence) and a template variable `{{additionalHead}}` for injecting per-page resources.

## Goals / Non-Goals

**Goals:**
- Add syntax highlighting for fenced code blocks with language detection
- Provide a one-click copy-to-clipboard button on every code block
- Display a language indicator badge on code blocks that specify a language
- Ensure highlight colors work correctly in both light and dark themes
- Keep the solution client-side only — no changes to the Node.js build pipeline

**Non-Goals:**
- Line numbers (can be added later)
- Line highlighting / focus ranges
- Editable / runnable code blocks
- Server-side (build-time) syntax highlighting
- Custom theme editor for highlight colors

## Decisions

### 1. Client-side Highlight.js via CDN (over Prism.js, over build-time highlighting)

Use Highlight.js loaded from a CDN (`cdnjs.cloudflare.com`).

**Rationale:**
- Highlight.js auto-detects languages when class is present — `marked` already outputs `class="language-xxx"` on `<code>` tags
- Broad language support (~190 languages) with small core (~40 KB gzipped)
- Well-maintained, widely adopted
- CDN approach means zero npm dependency changes and no build pipeline modifications
- Prism.js requires more manual configuration for language loading; Highlight.js is more plug-and-play
- Build-time highlighting would require modifying `marked` configuration and increasing build complexity

**CDN resources to load in `<head>`:**
- `highlight.min.js` core
- A theme CSS that supports both light/dark (e.g., `github.min.css` for light, `github-dark.min.css` for dark)

### 2. Theme switching via dual stylesheets with `media` attribute toggle

Load two Highlight.js theme stylesheets. Use JavaScript to enable/disable them based on the current `data-theme` attribute, synced with the existing theme toggle logic.

**Rationale:**
- Leverages the existing theme toggle system without modification
- Simpler than dynamically swapping stylesheet `href` attributes
- Both themes are preloaded so switching is instant with no flash

### 3. Copy button injected via JavaScript post-rendering (over template modification)

After `hljs.highlightAll()` runs, iterate over all `<pre><code>` blocks and inject a copy button into each `<pre>` element.

**Rationale:**
- No changes needed to `marked` configuration or markdown processing
- Works for all code blocks including those on search result pages
- Button uses the Clipboard API (`navigator.clipboard.writeText`) with a fallback for older browsers

### 4. Single new JS file (`code-enhance.js`) loaded via `additionalHead` on article pages

Create `templates/assets/js/code-enhance.js` containing both highlight initialization and copy button logic. Load it via the existing `{{additionalHead}}` template variable in `SiteGenerator.ts` for article pages.

**Rationale:**
- Keeps code block enhancement self-contained in one file
- Follows the existing pattern used by `articles-filters.js` and `todo.js`
- Only loaded on pages that have article content (not index or article list pages)

## Risks / Trade-offs

- **CDN dependency** → If CDN is unreachable, code blocks render without highlighting (graceful degradation — basic styling still applies). Mitigation: Highlight.js is on `cdnjs`, a highly available CDN.
- **Page load size** → ~40 KB gzipped for highlight.js core + theme CSS. Mitigation: Loaded via CDN with browser caching; minimal impact on perceived performance. Use `defer` on script.
- **Language coverage** → The common subset loaded by default covers ~40 languages. Rare languages may not highlight. Mitigation: Sufficient for a personal technical blog; can add specific language packs later if needed.
- **Clipboard API browser support** → Requires HTTPS or localhost. Mitigation: GitHub Pages serves over HTTPS; add fallback using `document.execCommand('copy')` for edge cases.
