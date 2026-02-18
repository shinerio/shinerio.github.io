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

### Requirement: ContentSearch Engine indexes article content
The ContentSearchEngine SHALL create an index of searchable terms from article content with a baseline relevance weight of 1.

#### Scenario: Indexing article content
- **WHEN** the ContentSearchEngine builds an index from a collection of articles
- **THEN** it SHALL extract searchable terms from each article's content and assign them a weight of 1

### Requirement: ContentSearch performs content-specific searches
The ContentSearchEngine SHALL perform searches specifically within article content and return results with appropriate relevance scores.

#### Scenario: Searching within content only
- **WHEN** a user performs a search that matches terms in article content
- **THEN** the ContentSearchEngine SHALL return articles where the search terms appear in content with appropriate relevance scores

### Requirement: ContentSearch generates content-specific highlights
The ContentSearchEngine SHALL generate search result highlights that indicate when matches occur in article content.

#### Scenario: Creating content search highlights
- **WHEN** the ContentSearchEngine creates highlights for search results
- **THEN** it SHALL mark content matches distinctly to indicate they came from the content search

### Requirement: SearchCoordinator manages title and content search engines
The SearchCoordinator SHALL orchestrate searches across both TitleSearchEngine and ContentSearchEngine and combine their results appropriately.

#### Scenario: Coordinating search across both engines
- **WHEN** a search query is received by the SearchCoordinator
- **THEN** it SHALL distribute the query to both TitleSearchEngine and ContentSearchEngine and aggregate results

### Requirement: SearchCoordinator maintains combined search index
The SearchCoordinator SHALL maintain a combined index that integrates results from both title and content search engines with appropriate weights.

#### Scenario: Building combined search index
- **WHEN** the SearchCoordinator builds its search index
- **THEN** it SHALL utilize both TitleSearchEngine and ContentSearchEngine to create a unified index with properly weighted results

### Requirement: SearchCoordinator preserves external search API compatibility
The SearchCoordinator SHALL maintain the same external interface as the original SearchEngine to ensure backward compatibility.

#### Scenario: Preserving external API
- **WHEN** existing code calls the SearchCoordinator using the original SearchEngine interface
- **THEN** the call SHALL succeed without modification to the calling code