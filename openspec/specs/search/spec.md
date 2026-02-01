# Search Capability Specification

## Purpose

This specification defines the search capabilities for the Obsidian blog generator. The search functionality enables users to find relevant articles by searching through article titles, content, and metadata.

## Requirements

### Requirement: Search engine shall differentiate between title and content matches with appropriate weighting
The system SHALL assign higher relevance scores to matches found in article titles compared to matches found in article content.

#### Scenario: Search term appears in title
- **WHEN** user searches for a term that appears in an article's title
- **THEN** the system SHALL assign a higher relevance score to that article compared to articles where the term only appears in content

#### Scenario: Search term appears in content only
- **WHEN** user searches for a term that only appears in article content
- **THEN** the system SHALL assign a lower relevance score to that article compared to articles where the term appears in the title

### Requirement: Search index shall maintain separate fields for title and content
The system SHALL maintain separate searchable fields for article titles and content to enable differentiated search scoring.

#### Scenario: Building search index
- **WHEN** the search engine builds the search index
- **THEN** the system SHALL store title and content as separate searchable fields in the index

### Requirement: Search functionality shall support searching in article titles and content separately
The system SHALL search both article titles and content to find relevant matches, with appropriate scoring to prioritize title matches over content matches.

#### Scenario: Searching for term in title and content
- **WHEN** user searches for a term that appears in both article titles and content
- **THEN** the system SHALL return results with title matches ranked higher than content-only matches

#### Scenario: Searching for term in content only
- **WHEN** user searches for a term that only appears in article content
- **THEN** the system SHALL return results with content matches ranked lower than potential title matches

### Requirement: Search result highlighting shall indicate match location when possible
The system SHALL provide highlighting that indicates whether a match was found in the title or content when displaying search results.

#### Scenario: Displaying search results with highlights
- **WHEN** user performs a search and results are displayed
- **THEN** the system SHALL provide highlights that help distinguish whether matches occurred in titles versus content

### Requirement: Search content-only mode matches content
When user performs a search with content-only mode, the system SHALL match against the article content rather than the title.

#### Scenario: Content-only search finds content matches
- **WHEN** user selects content-only search mode and enters a search term that appears in article content but not in title
- **THEN** system returns articles that contain the search term in content, excluding those with matches only in titles

### Requirement: Content search behavior in content-only mode
In the previous version, content-only searches would incorrectly match against titles. The system MUST now match against article content when in content-only mode.

#### Scenario: Content-only search in previous version
- **WHEN** user searched with content-only mode for a term in article content but not in title
- **THEN** system previously returned no results or incorrect results

#### Scenario: Content-only search in current version
- **WHEN** user searches with content-only mode for a term in article content but not in title
- **THEN** system now returns the correct articles containing that term in content

### Requirement: Enhanced search UI layout
The search UI elements SHALL be visually appealing with aligned input and button elements.

#### Scenario: Search UI appears with aligned elements
- **WHEN** user views the search page
- **THEN** search input field and search button appear in the same row with appropriate spacing

#### Scenario: Search box is clearly visible
- **WHEN** user visits a page with search functionality
- **THEN** search input field is visually distinct and easy to identify