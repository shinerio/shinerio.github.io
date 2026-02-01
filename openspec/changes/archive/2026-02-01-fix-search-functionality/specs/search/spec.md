## ADDED Requirements

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

## MODIFIED Requirements

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