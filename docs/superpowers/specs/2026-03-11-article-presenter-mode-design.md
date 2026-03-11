# Article Presenter Mode Design

**Date:** 2026-03-11
**Scope:** Add a desktop-focused presenter mode to article detail pages with fullscreen support, cursor spotlight, a right-click presenter menu, temporary single-color drawing, and temporary text highlighting that clears on exit.

---

## Goals

- Add presenter mode only to article detail pages
- Enter browser fullscreen when available, but still work in a page-contained fallback mode
- Show a subtle cursor spotlight during presentations
- Support a single-color pen for temporary freehand annotations
- Support temporary text highlighting for spoken walkthroughs
- Clear all temporary presenter annotations when presenter mode exits
- Preserve existing article reading features outside presenter mode

---

## 1. Entry Point

- Add a presenter mode trigger button beside the existing Markdown export action in `templates/article.html`
- Label and icon should match the current article action style and remain understandable in both light and dark themes
- Presenter script should load only on article pages

---

## 2. Presenter States

Presenter mode uses a small state machine:

- `browse`: spotlight active, page stays readable and clickable
- `draw`: left mouse drag draws temporary annotations on an overlay
- `highlight`: normal text selection stays enabled; releasing a valid selection creates a temporary highlight

Right-click opens a presenter menu with these actions:

- Browse mode
- Draw mode
- Highlight mode
- Clear annotations
- Exit presenter mode

`Escape` always exits presenter mode.

---

## 3. Layout Behavior

When presenter mode is active:

- Add a global presenter class to `body.article-page`
- Hide or suppress non-essential chrome such as header, footer, comments, and the article TOC sidebar
- Expand the article reading column to use more horizontal space without making lines excessively wide
- Preserve normal page scrolling

The mode is desktop-first. Touch devices should not enable the full presenter interaction set.

---

## 4. Interaction Layers

### Cursor Spotlight

- Render a fixed spotlight element that follows pointer movement
- Use a soft monochrome halo with restrained motion
- Disable spotlight on touch devices and when presenter mode is inactive

### Drawing Layer

- Use a dedicated fullscreen `svg` overlay for pen strokes
- Store each stroke as a separate path so clearing is simple
- Drawing should not mutate article HTML

### Temporary Text Highlighting

- In `highlight` mode, allow native selection inside `.content`
- After selection completes, wrap the selected content in temporary highlight markers when the range is safe to transform
- Avoid applying temporary highlights inside controls, code action buttons, comments UI, and other non-reading affordances
- Remove all presenter highlights on exit or via "Clear annotations"

---

## 5. Conflict Handling

- Presenter mode must not reuse or persist data through the existing text selection comment system
- In `draw` mode, suppress the native context menu and reserve left drag for drawing
- In `highlight` mode, do not block selection; only react after selection is finalized
- Existing article interactions should remain intact outside presenter mode
- If fullscreen APIs fail or are denied, keep presenter mode active in a non-fullscreen fallback

---

## 6. Cleanup Rules

On exit:

- Remove presenter body classes
- Remove all temporary text highlight wrappers
- Clear all `svg` drawing paths
- Tear down presenter menu visibility and pointer state
- Exit fullscreen if the page entered fullscreen successfully

No presenter artifacts should remain after exit or page reload.

---

## 7. Files to Modify

| File | Change |
|---|---|
| `templates/article.html` | Add presenter mode entry button and presenter overlay mount if needed |
| `templates/layout.html` | Load presenter script and styles for article pages only |
| `templates/assets/css/style-addition.css` or `templates/assets/css/style.css` | Add presenter mode styles, spotlight, menu, overlay, and temporary highlight styling |
| `templates/assets/js/article-presenter.js` | New presenter controller for fullscreen, state changes, spotlight, draw, highlight, and cleanup |

---

## 8. Verification

- Article page can enter and exit presenter mode without breaking layout
- Spotlight follows cursor only in presenter mode
- Right-click menu switches between browse, draw, and highlight modes
- Draw mode creates visible temporary pen strokes and clears them correctly
- Highlight mode creates temporary text highlights and clears them correctly
- Existing article features still work after exiting presenter mode
- Desktop light and dark themes both remain usable
