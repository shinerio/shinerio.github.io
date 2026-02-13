## Why

The blog generator currently renders code blocks with only basic styling (monospace font, background, border) via `marked`. There is no syntax highlighting and no copy-to-clipboard functionality, making code-heavy articles hard to read and inconvenient to use. These are baseline expectations for any technical blog.

## What Changes

- Add client-side syntax highlighting for fenced code blocks using a lightweight library (e.g., Highlight.js via CDN)
- Support both light and dark theme variants, synced with the existing theme toggle system
- Add a one-click "copy" button on each code block so readers can copy code to clipboard
- Display a language indicator badge on code blocks that specify a language

## Capabilities

### New Capabilities
- `code-highlight`: Client-side syntax highlighting for fenced code blocks with light/dark theme support and language badge
- `code-copy`: One-click copy-to-clipboard button on code blocks with visual feedback

### Modified Capabilities
<!-- No existing spec-level requirements are changing -->

## Impact

- **Templates**: `layout.html` — add Highlight.js CDN link and initialization script; `article.html` / `search.html` — may need minor adjustments
- **CSS**: `style.css` or `style-addition.css` — styles for copy button, language badge, and highlight theme overrides
- **JS**: New client-side script for copy button logic and Highlight.js initialization
- **Dependencies**: No new npm runtime dependencies (CDN-based); no changes to the Node.js build pipeline
- **Existing behavior**: No breaking changes; code blocks without a language tag remain styled as before
