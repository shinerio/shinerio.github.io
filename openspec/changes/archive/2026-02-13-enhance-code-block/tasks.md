## 1. Highlight.js Integration

- [x] 1.1 Add Highlight.js CDN links (core JS + GitHub Light/Dark theme CSS) to `templates/layout.html` via `{{additionalHead}}` or directly in `<head>`
- [x] 1.2 Update `SiteGenerator.ts` to inject Highlight.js CDN resources in `additionalHead` for article pages

## 2. Code Enhancement Script

- [x] 2.1 Create `templates/assets/js/code-enhance.js` with Highlight.js initialization (`hljs.highlightAll()`)
- [x] 2.2 Add copy button injection logic — iterate `<pre><code>` blocks, insert copy button into each `<pre>`
- [x] 2.3 Implement clipboard copy with `navigator.clipboard.writeText` and `execCommand('copy')` fallback
- [x] 2.4 Add copy success feedback (checkmark icon / "Copied!" text for ~2 seconds)
- [x] 2.5 Add language badge injection — read detected language from `hljs` result class and insert badge element into `<pre>`

## 3. Theme Sync

- [x] 3.1 Add dual Highlight.js theme stylesheet loading (light + dark) with enable/disable logic tied to `data-theme` attribute
- [x] 3.2 Hook into existing theme toggle to switch Highlight.js theme stylesheets when user toggles dark/light mode

## 4. CSS Styling

- [x] 4.1 Add styles for copy button (positioning top-right, hover visibility, light/dark variants) in `style-addition.css`
- [x] 4.2 Add styles for language badge (positioning top-right, typography, light/dark variants) in `style-addition.css`
- [x] 4.3 Adjust `<pre>` block styling to accommodate badge and button (`position: relative`, padding-top for badge area)

## 5. Verification

- [x] 5.1 Test syntax highlighting renders correctly for common languages (JS, Python, HTML, CSS, TypeScript, Bash)
- [x] 5.2 Test copy button works and shows feedback
- [x] 5.3 Test theme toggle switches highlight colors correctly
- [x] 5.4 Test graceful degradation when CDN is unavailable (code blocks still readable)
- [x] 5.5 Test on mobile viewport — button and badge are accessible
