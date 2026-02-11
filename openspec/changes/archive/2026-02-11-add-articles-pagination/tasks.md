## 1. Pass postsPerPage to the articles page

- [x] 1.1 In `SiteGenerator.generateArticleList()`, add `data-per-page="${options.config.postsPerPage}"` to the `.article-list` container div

## 2. Core pagination logic in articles-filters.js

- [x] 2.1 Read the `data-per-page` attribute from `.article-list` at initialization, defaulting to 10 if missing
- [x] 2.2 Add `currentPage` and `perPage` fields to the `currentState` object
- [x] 2.3 Read initial page number from URL hash (`#page=N`) on load, defaulting to 1
- [x] 2.4 Add a `paginateArticles(filteredArticles)` function that slices the array to the current page's range and clamps `currentPage` to valid bounds
- [x] 2.5 Integrate pagination into `applyFilters()`: after filtering and sorting, call `paginateArticles()` before `updateArticleDisplay()`
- [x] 2.6 Reset `currentPage` to 1 when sort or tag filter changes

## 3. Pagination controls rendering

- [x] 3.1 Add a `renderPaginationControls(totalItems, currentPage, perPage)` function that generates the pagination HTML (Prev, page numbers with ellipsis, Next)
- [x] 3.2 Insert the pagination controls container below the `.article-list` element
- [x] 3.3 Disable the Previous button on page 1, disable the Next button on the last page
- [x] 3.4 Show ellipsis when total pages > 7, displaying at most 5 page numbers around the current page
- [x] 3.5 Hide pagination controls entirely when total pages ≤ 1
- [x] 3.6 Attach click handlers on page number buttons, Previous, and Next to update `currentPage` and re-run `applyFilters()`

## 4. URL hash state management

- [x] 4.1 Update `window.location.hash` to `#page=N` whenever the page changes (skip for page 1 to keep clean URLs)
- [x] 4.2 Listen for `hashchange` event to handle browser back/forward navigation between pages

## 5. Pagination styles

- [x] 5.1 Add CSS styles for the `.pagination` container (centered flex layout, spacing)
- [x] 5.2 Style page number buttons, active state, disabled state, and ellipsis elements
- [x] 5.3 Ensure pagination controls are responsive (appropriate sizing on mobile)
- [x] 5.4 Support both dark and light themes for pagination controls

## 6. Testing

- [x] 6.1 Verify default pagination shows 10 articles per page and correct controls
- [x] 6.2 Verify tag filter resets to page 1 and re-paginates filtered results
- [x] 6.3 Verify sort change resets to page 1
- [x] 6.4 Verify URL hash navigation (`#page=3`) loads correct page
- [x] 6.5 Verify out-of-range page numbers are clamped to valid range
- [x] 6.6 Verify pagination controls are hidden when total articles ≤ postsPerPage
