## Why

The current search functionality in the Obsidian blog generator is limited and doesn't provide comprehensive search capabilities. Users need to search both article titles and article content to find relevant posts efficiently.

## What Changes

- Enhance the search functionality to support searching in article titles
- Add support for searching within article content (body text)
- Improve the search indexing to include both title and content fields
- Update the search UI to display more relevant results from both titles and content

## Capabilities

### Modified Capabilities
- `search`: Modify existing search capability to support searching in both titles and article content

## Impact

- Changes to the SearchEngine component to index both titles and content
- Updates to search algorithm to prioritize results appropriately
- Potential changes to search result display in templates
- Possible updates to the Article data structure to include searchable content