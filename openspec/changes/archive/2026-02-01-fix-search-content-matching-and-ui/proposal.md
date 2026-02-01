## Why

The current search functionality has two major issues: content-only searches incorrectly match titles instead of content, and the search UI is not visually appealing with misaligned search elements. These issues reduce user experience and search effectiveness.

## What Changes

- Fix the search functionality so that content-only searches properly match content instead of titles
- Optimize the search UI to make the search box more prominent and align the search button properly with the search input
- Update CSS styling to improve visual appearance of search components
- Adjust search algorithm to correctly prioritize content matches when in content-only mode

## Capabilities

### New Capabilities
- `search-ui-enhancement`: Covers the visual improvements to the search interface including layout and styling changes
- `content-search-fix`: Addresses the core search algorithm issue where content-only searches were incorrectly matching titles

### Modified Capabilities
- `search-functionality`: The search REQUIREMENTS are changing to fix incorrect matching behavior in content-only mode

## Impact

- Affected code: search module files, CSS stylesheets, search algorithm implementation
- Templates: search-related HTML templates will be updated
- APIs: Search API behavior may change slightly to fix content matching
- Dependencies: None expected beyond existing search dependencies