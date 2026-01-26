# HTML Templates for Obsidian Blog Generator

This directory contains the HTML templates, CSS styles, and JavaScript files for the Obsidian Blog Generator.

## Structure

```
templates/
├── layout.html              # Base layout template
├── index.html              # Homepage template
├── articles.html           # Article list page template
├── article.html            # Individual article page template
├── search.html             # Search page template
├── config.json             # Template configuration
├── components/             # Reusable template components
│   ├── article-card.html   # Article card component
│   └── article-list-item.html # Article list item component
├── assets/
│   ├── css/
│   │   └── style.css       # Main stylesheet with responsive design
│   └── js/
│       └── main.js         # Main JavaScript file
└── README.md               # This file
```

## Template System

The templates use a simple placeholder system with double curly braces `{{placeholder}}` for variable substitution. The system supports:

- Simple variables: `{{title}}`
- Conditional blocks: `{{#if condition}}...{{/if}}`
- Loops: `{{#each items}}...{{/each}}`

## Responsive Design

The CSS implements a mobile-first responsive design with the following breakpoints:

- **Mobile**: Up to 767px (single column, touch-friendly)
- **Tablet**: 768px - 1023px (two columns)
- **Desktop**: 1024px - 1199px (three columns, sidebar)
- **Large Desktop**: 1200px+ (optimized layout)

### Key Responsive Features

1. **Flexible Grid System**: Uses CSS Grid for article layouts
2. **Touch-Friendly**: Minimum 44px touch targets on mobile
3. **Adaptive Navigation**: Hamburger menu on mobile, horizontal on desktop
4. **Scalable Typography**: Responsive font sizes
5. **Optimized Images**: Responsive images with lightbox
6. **Print Styles**: Optimized for printing

## Accessibility Features

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- High contrast mode support
- Screen reader friendly
- Skip links for navigation
- Focus indicators

## Interactive Features

### Search Functionality
- Real-time search with debouncing
- Search in titles, content, and tags
- Highlighted search results
- Filter options

### Article Features
- Table of contents generation
- Code block copy buttons
- Image lightbox
- Social sharing
- Reading time calculation

### Navigation
- Responsive hamburger menu
- Smooth scrolling
- Active page indicators

## Dark Mode Support

The templates include automatic dark mode detection using `prefers-color-scheme` media query. The system automatically switches between light and dark themes based on user preferences.

## Performance Optimizations

- Minimal CSS and JavaScript
- Efficient animations
- Lazy loading support
- Optimized for fast rendering
- Reduced motion support

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Progressive enhancement for older browsers

## Customization

### Colors
Main color variables can be customized by modifying the CSS:
- Primary: `#3498db`
- Secondary: `#2c3e50`
- Background: `#fff`
- Text: `#333`

### Typography
Font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif`

### Layout
Grid breakpoints and container widths can be adjusted in the CSS media queries.

## Template Variables

### Layout Template
- `{{title}}` - Page title
- `{{siteTitle}}` - Site title
- `{{siteDescription}}` - Site description
- `{{content}}` - Main content area
- `{{currentYear}}` - Current year
- `{{author}}` - Author name
- Navigation active states: `{{homeActive}}`, `{{articlesActive}}`, `{{searchActive}}`

### Article Template
- `{{title}}` - Article title
- `{{content}}` - Article HTML content
- `{{date}}` - Formatted date
- `{{dateISO}}` - ISO date format
- `{{readingTime}}` - Reading time in minutes
- `{{wordCount}}` - Word count
- `{{tags}}` - Array of tags
- `{{tableOfContents}}` - Generated TOC
- `{{relatedArticles}}` - Related articles

### Index Template
- `{{recentArticles}}` - Recent articles HTML
- `{{popularTags}}` - Popular tags HTML

### Articles Template
- `{{totalArticles}}` - Total article count
- `{{articleList}}` - Article list HTML
- `{{tagOptions}}` - Tag filter options
- `{{pagination}}` - Pagination HTML

## Usage in SiteGenerator

The templates are designed to be used with the SiteGenerator class. The generator should:

1. Load template files
2. Replace placeholders with actual data
3. Generate final HTML files
4. Copy static assets to output directory

## Future Enhancements

- Template inheritance system
- More customization options
- Additional interactive features
- Enhanced accessibility features
- Performance monitoring