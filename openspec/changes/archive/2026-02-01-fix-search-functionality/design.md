## Context

The Obsidian blog generator currently has limited search functionality. Based on the proposal, we need to enhance the search to support both title and content searches. The current implementation likely indexes only titles or has a basic search mechanism that doesn't adequately serve users looking for content within articles.

## Goals / Non-Goals

**Goals:**
- Implement search functionality that can search both article titles and content
- Improve search result relevance by considering both title and content matches
- Maintain good performance for search operations
- Preserve existing search interface while enhancing capabilities

**Non-Goals:**
- Complete overhaul of the entire search UI/UX
- Advanced search features like fuzzy matching or stemming (though basic relevance scoring is included)
- Real-time search suggestions
- Advanced filtering options

## Decisions

1. **Enhanced Indexing Strategy**: We will modify the existing SearchEngine to index both article titles and content separately, allowing for differentiated search scoring.

2. **Search Algorithm Enhancement**: The search algorithm will prioritize title matches over content matches, as users typically expect exact title matches to rank higher.

3. **Data Structure Modification**: We'll extend the search index data structure to include both title and content fields, with separate weighting factors.

4. **Template Updates**: Minor updates to search result templates to indicate whether a result matched on title or content.

5. **Performance Considerations**: Implement caching for search results to maintain performance when searching through large content collections.

## Risks / Trade-offs

[Risk: Increased search index size] → Mitigation: Optimize the indexing algorithm to only store essential searchable content, possibly with content truncation for very long articles.

[Risk: Slower search performance] → Mitigation: Implement caching and consider search result pagination to handle large result sets efficiently.

[Risk: Complex search result ranking] → Mitigation: Implement a simple but effective scoring system that balances title matches vs. content matches appropriately.