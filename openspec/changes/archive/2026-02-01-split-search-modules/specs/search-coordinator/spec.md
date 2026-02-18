## ADDED Requirements

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