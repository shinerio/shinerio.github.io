## Context

The articles page renders all published articles at once, using client-side JavaScript (`articles-filters.js`) for sorting and tag filtering. Article data is serialized as JSON into a `<script id="article-data">` element during build time. The `postsPerPage` config (default: 10) exists but is unused on this page.

The existing `applyFilters()` function filters/sorts the full article array, then calls `updateArticleDisplay()` to rebuild the DOM. Pagination needs to slot into this pipeline — after filtering/sorting, before rendering.

## Goals / Non-Goals

**Goals:**
- Paginate the filtered/sorted article list, showing `postsPerPage` articles per page
- Provide navigation controls (previous, next, page numbers) below the article list
- Reset to page 1 when filters or sort order change
- Persist current page number in the URL so links are shareable
- Integrate cleanly with existing filter/sort logic without breaking it

**Non-Goals:**
- Server-side pagination or generating separate HTML files per page — the full dataset is already embedded in the page and is small enough for client-side handling
- Infinite scroll or "load more" patterns
- Changing the home page or any other page's pagination behavior

## Decisions

### 1. Client-side pagination (not static multi-page generation)

All article data is already serialized into the page as JSON. Generating separate `articles-2.html`, `articles-3.html`, etc. would add build complexity and make client-side filtering/sorting across pages impossible. Client-side pagination keeps the existing architecture intact and allows filters + sort + pagination to work together seamlessly.

**Alternative considered**: Static page generation — rejected because it would break the existing client-side filter/sort workflow and add significant build complexity.

### 2. Extend `currentState` with pagination fields

Add `currentPage` and `perPage` to the existing `currentState` object in `articles-filters.js`. The `perPage` value is read from a `data-per-page` attribute on the article container, set by `SiteGenerator` from the config's `postsPerPage`.

**Alternative considered**: Separate pagination module — rejected because the pagination logic is tightly coupled with filtering (changing filters resets page) and adding a separate file would increase complexity for a small amount of code.

### 3. URL hash for page state (`#page=2`)

Use URL hash (`#page=N`) to persist the current page. Hash changes don't trigger page reloads, work well with the existing `?tag=` query parameter for tag filtering, and are simple to implement with `hashchange` event.

**Alternative considered**: Query parameter (`?page=2`) — rejected because it would conflict with the existing `?tag=` parameter handling and cause full page reloads when changed programmatically without `history.pushState` complexity.

### 4. Pagination controls: prev/next + numbered pages with ellipsis

Render a pagination bar with: `« Prev | 1 ... 4 5 [6] 7 8 ... 20 | Next »`. Show at most 5 page numbers around the current page, with ellipsis for gaps. This scales well from 2 pages to hundreds.

**Alternative considered**: Simple prev/next only — rejected because users need to jump to specific pages and see total page count.

### 5. Pass `postsPerPage` via `data-` attribute

`SiteGenerator` sets `data-per-page="10"` on the `.article-list` container. The JS reads this value at initialization. This avoids adding another `<script>` block or global variable.

**Alternative considered**: Separate config JSON block — rejected as over-engineered for a single value.

## Risks / Trade-offs

- **[Filter + pagination interaction]** → When a user changes the tag filter or sort, pagination resets to page 1. This is the expected behavior but could momentarily disorient users. Mitigation: the URL hash updates immediately so the state is always reflected.

- **[Hash conflicts]** → If the site later uses hashes for other purposes (anchors, routing), the `#page=N` scheme could conflict. Mitigation: use a namespaced format `#page=N` that is unlikely to collide, and the implementation is easy to migrate to query params later if needed.

- **[No results on deep page links]** → A bookmarked `#page=5` link may point to a non-existent page if articles are deleted. Mitigation: clamp page number to the valid range (1 to totalPages), falling back to the last valid page.
