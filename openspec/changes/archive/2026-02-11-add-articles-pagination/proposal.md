## Why

The articles page (`articles.html`) currently renders all articles in a single list with no pagination. As the number of articles grows, this leads to long page load times, excessive scrolling, and poor user experience. The `postsPerPage` config field already exists (default: 10) but is not utilized on the articles page.

## What Changes

- Add client-side pagination to the articles list page, splitting articles into pages of N items (controlled by `postsPerPage` config)
- Render pagination controls (previous/next, page numbers) below the article list
- Pagination integrates with the existing tag filtering and sorting — filtered/sorted results are re-paginated
- Persist current page in URL hash or query param so users can share/bookmark specific pages
- Default to 10 articles per page (matches existing `postsPerPage` config default)

## Capabilities

### New Capabilities
- `articles-pagination`: Client-side pagination for the articles list page, including page controls, integration with existing filters/sorting, and URL state management

### Modified Capabilities
_(none — no existing spec-level requirements are changing)_

## Impact

- **`src/core/SiteGenerator.ts`**: Pass `postsPerPage` value into the articles page template data so client-side JS can use it
- **`templates/assets/js/articles-filters.js`**: Add pagination logic that works alongside existing filter/sort functionality
- **`templates/assets/css/style.css`** (or `style-addition.css`): Add styles for pagination controls
- **No backend/build changes**: Pagination is entirely client-side since all article data is already serialized into the page as JSON
- **No breaking changes**: Existing articles page behavior is preserved; pagination enhances it
