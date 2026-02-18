# Search Functionality Enhancement

## Overview
The search functionality has been enhanced to provide more relevant results by implementing weighted scoring for different parts of articles.

## Key Improvements

### 1. Differentiated Scoring System
- **Title matches**: Weight of 3 (highest priority)
- **Tag matches**: Weight of 2 (medium priority)
- **Content matches**: Weight of 1 (baseline priority)
- **Combined matches**: Weights are added (e.g., title + content = weight 4)

### 2. Improved Search Result Relevance
- Articles with search terms in the title rank higher than those with terms only in content
- Search results include match location indicators (`inTitle`, `inContent`, `inTags`)
- Enhanced highlighting shows where matches occurred (title vs content)

### 3. Performance Optimization
- Maintains good performance with larger datasets
- Implements efficient indexing for both English and Chinese text
- Handles mixed-language content appropriately

## Technical Details

### Indexing Process
The system now builds separate indices for titles, content, and tags, then combines them with appropriate weights:

1. Title words receive a weight of 3
2. Content words receive a weight of 1
3. Tag words receive a weight of 2
4. Combined occurrences get cumulative weights

### Text Processing
- Supports both English and Chinese text
- Removes markdown syntax and HTML tags from searchable content
- Filters out common stop words to improve search relevance
- Individual Chinese characters are filtered out (length > 1 requirement) but multi-character terms are preserved

### Search Algorithm
- Results are sorted by relevance score (descending)
- Match location tracking allows identification of where terms were found
- Highlight generation distinguishes between title and content matches