### Requirement: Article list pagination
The articles page SHALL split the displayed article list into pages of a configurable number of items. The number of items per page SHALL be determined by the `postsPerPage` configuration value (default: 10). Only the current page's articles SHALL be visible at any time.

#### Scenario: Default pagination on page load
- **WHEN** a user navigates to the articles page with more than 10 articles and no page hash
- **THEN** only the first 10 articles are displayed, and pagination controls are visible below the list

#### Scenario: Fewer articles than page size
- **WHEN** the total number of articles is less than or equal to `postsPerPage`
- **THEN** all articles are displayed and no pagination controls are rendered

#### Scenario: Custom postsPerPage config
- **WHEN** `postsPerPage` is set to 5 in the blog config
- **THEN** each page displays at most 5 articles

### Requirement: Pagination controls
The system SHALL render a pagination bar below the article list containing: a Previous button, numbered page links, and a Next button. Page numbers SHALL show at most 5 numbers around the current page, with ellipsis (`...`) for gaps when total pages exceed 7.

#### Scenario: First page controls
- **WHEN** the user is on page 1
- **THEN** the Previous button is disabled, the Next button is enabled, and page 1 is highlighted as the current page

#### Scenario: Last page controls
- **WHEN** the user is on the last page
- **THEN** the Next button is disabled, the Previous button is enabled, and the last page number is highlighted

#### Scenario: Middle page with ellipsis
- **WHEN** there are 20 pages and the user is on page 10
- **THEN** the pagination shows: `« Prev | 1 ... 8 9 [10] 11 12 ... 20 | Next »`

#### Scenario: Navigate via page number
- **WHEN** a user clicks on page number 3
- **THEN** the article list updates to show articles for page 3, and page 3 is highlighted in the pagination controls

#### Scenario: Navigate via Previous/Next
- **WHEN** a user is on page 3 and clicks Next
- **THEN** the article list updates to show articles for page 4

### Requirement: Filter and sort integration
Pagination SHALL integrate with the existing tag filter and sort controls. When a filter or sort option changes, the page number SHALL reset to 1 and the filtered/sorted results SHALL be re-paginated. The filter controls, sort controls, and pagination controls SHALL only be visible when the list view is active. When the folder view is active, these controls SHALL be hidden.

#### Scenario: Tag filter resets page
- **WHEN** a user is on page 3 and selects a tag filter
- **THEN** the page resets to 1, and only articles matching the tag are paginated

#### Scenario: Sort change resets page
- **WHEN** a user is on page 2 and changes the sort order
- **THEN** the page resets to 1, and articles are re-sorted and re-paginated

#### Scenario: Filter reduces total pages
- **WHEN** a user applies a tag filter that results in only 3 articles (with `postsPerPage` = 10)
- **THEN** all 3 articles are shown on page 1 and pagination controls are hidden

#### Scenario: Controls hidden in folder view
- **WHEN** the user switches to folder view
- **THEN** the sort select, tag filter, active filters display, and pagination controls are not visible

#### Scenario: Controls restored in list view
- **WHEN** the user switches back to list view from folder view
- **THEN** the sort select, tag filter, active filters display, and pagination controls are visible and functional with their previous state preserved

### Requirement: URL state persistence
The current page number SHALL be persisted in the URL hash using the format `#page=N`. The system SHALL read the page number from the hash on page load. If the hash specifies a page beyond the valid range, the system SHALL clamp to the nearest valid page.

#### Scenario: Page number in URL hash
- **WHEN** a user navigates to `articles.html#page=3`
- **THEN** the articles page loads and displays page 3

#### Scenario: Invalid page number clamped
- **WHEN** a user navigates to `articles.html#page=999` and there are only 5 pages
- **THEN** the system displays page 5 (the last valid page)

#### Scenario: Hash updates on navigation
- **WHEN** a user clicks to go to page 4
- **THEN** the URL hash updates to `#page=4` without a full page reload

#### Scenario: Tag filter and page in URL
- **WHEN** a user navigates to `articles.html?tag=network#page=2`
- **THEN** the articles are filtered by the "network" tag and page 2 of the filtered results is displayed

### Requirement: Per-page config delivery
The `SiteGenerator` SHALL pass the `postsPerPage` value to the articles page by setting a `data-per-page` attribute on the `.article-list` container element. The client-side JavaScript SHALL read this attribute to determine the page size.

#### Scenario: Data attribute present in HTML
- **WHEN** the site is generated with `postsPerPage` set to 10
- **THEN** the `.article-list` element in `articles.html` includes `data-per-page="10"`

#### Scenario: JS reads per-page value
- **WHEN** the articles page JavaScript initializes
- **THEN** it reads the `data-per-page` attribute and uses it as the page size, defaulting to 10 if the attribute is missing
