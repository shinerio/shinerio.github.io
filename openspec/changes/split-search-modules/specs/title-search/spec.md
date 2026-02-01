## ADDED Requirements

### Requirement: TitleSearch Engine indexes article titles
The TitleSearchEngine SHALL create an index of searchable terms from article titles with a high relevance weight of 3.

#### Scenario: Indexing article titles
- **WHEN** the TitleSearchEngine builds an index from a collection of articles
- **THEN** it SHALL extract searchable terms from each article's title and assign them a weight of 3

### Requirement: TitleSearch performs title-specific searches
The TitleSearchEngine SHALL perform searches specifically within article titles and return results with appropriate relevance scores.

#### Scenario: Searching within titles only
- **WHEN** a user performs a search that matches terms in article titles
- **THEN** the TitleSearchEngine SHALL return articles where the search terms appear in titles with high relevance scores

### Requirement: TitleSearch generates title-specific highlights
The TitleSearchEngine SHALL generate search result highlights that indicate when matches occur in article titles.

#### Scenario: Creating title search highlights
- **WHEN** the TitleSearchEngine creates highlights for search results
- **THEN** it SHALL mark title matches distinctly to indicate they came from the title search