## ADDED Requirements

### Requirement: Search content-only mode matches content
When user performs a search with content-only mode, the system SHALL match against the article content rather than the title.

#### Scenario: Content-only search finds content matches
- **WHEN** user selects content-only search mode and enters a search term that appears in article content but not in title
- **THEN** system returns articles that contain the search term in content, excluding those with matches only in titles

### Requirement: Enhanced search UI layout
The search UI elements SHALL be visually appealing with aligned input and button elements.

#### Scenario: Search UI appears with aligned elements
- **WHEN** user views the search page
- **THEN** search input field and search button appear in the same row with appropriate spacing

#### Scenario: Search box is clearly visible
- **WHEN** user visits a page with search functionality
- **THEN** search input field is visually distinct and easy to identify

## MODIFIED Requirements

### Requirement: Content search behavior in content-only mode
In the previous version, content-only searches would incorrectly match against titles. The system MUST now match against article content when in content-only mode.

#### Scenario: Content-only search in previous version
- **WHEN** user searched with content-only mode for a term in article content but not in title
- **THEN** system previously returned no results or incorrect results

#### Scenario: Content-only search in current version
- **WHEN** user searches with content-only mode for a term in article content but not in title
- **THEN** system now returns the correct articles containing that term in content