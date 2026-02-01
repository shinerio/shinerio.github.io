# Quickstart Guide: Articles Page Sorting and Filtering

## Overview
Quick setup guide to implement and customize the articles page sorting and filtering functionality.

## Implementation Steps

### 1. Add JavaScript Functionality
Include the client-side filtering JavaScript file in the articles page:

```javascript
// In the articles page HTML or layout
<script src="assets/js/articles-filters.js"></script>
```

The JavaScript will automatically initialize when the DOM is ready and attach event handlers to the existing filter elements.

### 2. Update SiteGenerator (SiteGenerator.ts)
Modify the `generateArticleList` method to include a JavaScript object containing article data:

```typescript
// Add this to the content generation in generateArticleList method
const articleDataScript = `
  <script type="application/json" id="article-data">
    ${JSON.stringify(publishedArticles.map(article => ({
      id: article.id,
      title: article.title,
      date: article.date.toISOString(),
      tags: article.tags,
      readingTime: article.readingTime,
      slug: article.slug,
      description: article.description
    })))}
  </script>
`;
```

### 3. Enhanced CSS Styling
The following CSS classes will be available for styling:

- `.filter-select` - For the filter dropdowns
- `.filter-group` - For filter group containers
- `.active-filter` - For active filter indicators
- `.articles-filters` - For the entire filter section
- `.article-item.filtered-out` - For filtered-out articles

### 4. Initialization
The JavaScript will automatically initialize when the page loads. No additional configuration required.

## Customization Options

### Changing Available Sort Options
Modify the sort options array in the JavaScript file:

```javascript
const SORT_OPTIONS = [
  { id: 'date-desc', name: '最新发布', compare: (a, b) => b.date.getTime() - a.date.getTime() },
  { id: 'date-asc', name: '最早发布', compare: (a, b) => a.date.getTime() - b.date.getTime() },
  { id: 'title-asc', name: '标题 A-Z', compare: (a, b) => a.title.localeCompare(b.title) },
  { id: 'title-desc', name: '标题 Z-A', compare: (a, b) => b.title.localeCompare(a.title) },
  { id: 'readtime-asc', name: '阅读时间 (短至长)', compare: (a, b) => a.readingTime - b.readingTime },
  { id: 'readtime-desc', name: '阅读时间 (长至短)', compare: (a, b) => b.readingTime - a.readingTime }
];
```

### Adding New Filter Types
To add new filter types, extend the filter processor:

1. Add new UI element in the template
2. Update the filter function to handle the new criteria
3. Add event listener for the new filter element

## Troubleshooting

### Filters not working
- Verify that article data is properly serialized in the page
- Check browser console for JavaScript errors
- Ensure filter elements have the correct IDs (`sort-select`, `tag-filter`)

### Slow performance with many articles
The current implementation should handle up to 500 articles efficiently. For larger datasets, consider:
- Implementing virtual scrolling
- Adding pagination
- Optimizing the comparison functions

### UI Styling Issues
- Verify CSS is loaded correctly
- Check that CSS selectors match the expected class names
- Ensure there are no conflicting styles from other parts of the site