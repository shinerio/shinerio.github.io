## MODIFIED Requirements

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
