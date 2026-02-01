## Context

The current SearchEngine implementation in the Obsidian blog generator is a monolithic class that handles all aspects of search functionality - indexing titles, content, and tags, as well as performing searches across all these elements. This approach worked well initially but has become difficult to maintain and extend. The search functionality combines title and content search with different weights in a single algorithm, making it hard to optimize specific aspects independently.

The SearchEngine class currently handles:
- Building a combined index with weighted terms (titles get weight 3, tags get weight 2, content gets weight 1)
- Performing searches across all indexed content
- Generating search result highlights
- Managing the search index structure

Our goal is to separate title and content search functionalities into distinct modules to improve modularity, maintainability, and extensibility.

## Goals / Non-Goals

**Goals:**
- Separate title and content search into independent modules with distinct responsibilities
- Maintain the same external API for backward compatibility
- Allow independent tuning and optimization of title vs content search algorithms
- Improve code readability and maintainability
- Enable easier addition of new search types in the future (e.g., tag search, metadata search)

**Non-Goals:**
- Change the fundamental search algorithm approach
- Modify the existing search UI in templates
- Redesign the entire search experience from a user perspective
- Implement new search features beyond structural refactoring

## Decisions

**Decision 1: Create TitleSearchEngine and ContentSearchEngine modules**

We'll create separate classes for title and content search, each with its own indexing and search methods. This allows each to be optimized independently while keeping the core search logic encapsulated.

*Alternative considered*: Keep one SearchEngine class but refactor to separate methods. This was rejected because it wouldn't provide the modularity benefits of separate classes.

**Decision 2: Implement SearchCoordinator as the unified interface**

A SearchCoordinator class will manage both title and content search engines, maintaining the same external API as the current SearchEngine. This coordinator will handle:
- Combining results from both engines with appropriate weighting
- Managing the search index structure
- Maintaining backward compatibility with existing code

*Alternative considered*: Direct composition where SiteGenerator interacts with both engines separately. This was rejected because it would require more extensive changes to existing code.

**Decision 3: Preserve existing search result scoring**

The existing weighted scoring system (title = 3, tag = 2, content = 1) will be maintained. The TitleSearchEngine will handle title indexing and scoring with weight 3, while ContentSearchEngine will handle content with weight 1. Tags will remain managed by the coordinator since they span both title and content aspects.

**Decision 4: Incremental refactoring approach**

We'll implement the new architecture while maintaining the old SearchEngine temporarily, allowing us to migrate gradually and test thoroughly. Once confident in the new implementation, we'll remove the old SearchEngine.

## Risks / Trade-offs

[Risk: Complexity in coordination between search engines] → Mitigation: Implement clear interfaces between components and thorough testing of combined results

[Risk: Potential performance degradation during transition] → Mitigation: Carefully benchmark both implementations and optimize the new architecture as needed

[Risk: Breaking existing functionality] → Mitigation: Maintain identical external APIs and comprehensive integration testing

[Risk: Increased memory usage due to duplicated indexing logic] → Mitigation: Share common indexing utilities between the engines and implement efficient data structures