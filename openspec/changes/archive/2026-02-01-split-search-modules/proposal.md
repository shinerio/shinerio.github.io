## Why

Currently, the search functionality in the Obsidian blog generator combines title, content, and tag searches into a single monolithic SearchEngine class. This makes it difficult to customize search behavior, optimize performance for different search types, or extend with new search capabilities. Separating title and content searches into distinct modules will improve code organization, maintainability, and extensibility.

## What Changes

- Split the current SearchEngine.ts into separate modules: TitleSearchEngine.ts and ContentSearchEngine.ts
- Create a unified SearchCoordinator.ts to manage interactions between the different search engines
- Maintain backward compatibility with existing search API
- Introduce new configuration options to control title vs content search weights separately
- Update the search functionality to allow independent scoring and ranking of title vs content matches

## Capabilities

### New Capabilities
- `title-search`: Handles searching within article titles with higher priority weighting
- `content-search`: Manages searching within article content with customizable weighting
- `search-coordinator`: Coordinates search requests between title and content search engines

### Modified Capabilities
- `search-functionality`: Updates to support modular search approach while maintaining the same external API

## Impact

- src/core/SearchEngine.ts will be refactored into multiple files
- SearchIndex and SearchResult interfaces may need minor adjustments to accommodate modular search
- SiteGenerator.ts will interact with the new SearchCoordinator instead of the standalone SearchEngine
- Configuration will be extended to support separate controls for title and content search
- Existing tests will need updates to accommodate the new module structure