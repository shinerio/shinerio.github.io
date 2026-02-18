## Context

The current search functionality in the Obsidian blog generator has two issues that need to be addressed. First, when performing content-only searches, the search algorithm incorrectly matches titles instead of the actual content. Second, the UI for the search functionality needs improvement in terms of visibility and layout to enhance user experience.

## Goals / Non-Goals

**Goals:**
- Fix the content search algorithm to properly match content rather than titles when in content-only mode
- Improve the search UI layout and styling to make it more visually appealing and user-friendly
- Maintain backward compatibility with existing search functionality
- Ensure the fix doesn't negatively impact search performance

**Non-Goals:**
- Redesign the entire search system from scratch
- Add new search features beyond fixing the current issues
- Modify the search index generation process significantly
- Change the search API for external integrations

## Decisions

1. **Search Algorithm Fix Approach**: Modify the search logic in the search engine module to ensure that content-only searches examine the article content instead of titles. This will involve updating the search matching logic in the SearchEngine class.

2. **UI Enhancement Strategy**: Update the search-related templates and CSS to improve the layout and visual appearance. This includes aligning the search input field and search button in the same row, and enhancing the visibility of the search box.

3. **Implementation Method**: Rather than creating new files, we'll modify existing search functionality in the existing codebase to maintain consistency and minimize potential breakages.

## Risks / Trade-offs

[Risk: Breaking existing search functionality] → Mitigation: Thorough testing of all search modes (title, content, combined) to ensure nothing is broken by the changes

[Risk: Performance degradation] → Mitigation: Monitor search performance after implementing changes to ensure no negative impact

[Risk: UI inconsistency] → Mitigation: Follow existing design patterns and CSS classes to maintain visual consistency with the rest of the site

[Risk: Regression in search accuracy] → Mitigation: Comprehensive testing with various search queries to ensure search relevance remains high