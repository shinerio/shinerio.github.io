## 1. Search Index Enhancement

- [x] 1.1 Modify SearchEngine to maintain separate title/content indices for differentiated scoring
- [x] 1.2 Update buildIndex method to calculate separate scores for title and content matches
- [x] 1.3 Implement weighted scoring algorithm that prioritizes title matches over content matches

## 2. Search Result Improvements

- [x] 2.1 Update search method to incorporate title/content weightings in score calculation
- [x] 2.2 Enhance generateHighlights function to better identify match location (title vs content)
- [x] 2.3 Update search result structure to indicate whether matches occurred in title or content

## 3. Testing and Validation

- [x] 3.1 Add unit tests to verify title matches rank higher than content matches
- [x] 3.2 Create integration tests to validate the new search functionality
- [x] 3.3 Verify search performance is maintained with the new indexing approach

## 4. Documentation and Cleanup

- [x] 4.1 Update search-related documentation to reflect new functionality
- [x] 4.2 Ensure code follows existing patterns and maintains consistency
- [x] 4.3 Verify all search functionality works correctly across different languages (English/Chinese)