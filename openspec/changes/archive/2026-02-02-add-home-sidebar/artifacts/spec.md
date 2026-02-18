# Feature Specification: Add Sidebar to Home Page

## Overview
Modify the home page layout to include a sidebar that contains:
- Article total count
- Tag cloud
- Recent updates
While preserving the existing content layout including recent articles, "view all" button, article titles, and content previews.

Based on code analysis, the current home page (`generateHomePage` in `src/core/SiteGenerator.ts`) includes a "featured-content" section with these elements at the bottom in a grid layout (lines 86-105). The elements are:
- Articles total count (line 90)
- Tag cloud (lines 94-99)
- Recent updates (lines 101-103)

## Goals
- Move current featured-content statistics to a sidebar on the home page
- Maintain responsive design for different screen sizes
- Preserve existing home page content and functionality
- Follow existing styling patterns in the application

## Requirements
- The sidebar should appear on the home page only
- Existing content layout should remain unchanged in the main content area
- Sidebar should contain article counts, tag cloud, and recent updates
- Should be responsive (collapse on smaller screens if needed)
- Should follow the existing CSS patterns and theme
- Site generator should provide the same data to the new sidebar layout

## Out of Scope
- Changes to other pages (articles, search, individual article pages)
- Major redesign of existing elements
- Changing the functionality of existing components, only relocating them

## Technical Approach
- Modify the home page generation logic in `src/core/SiteGenerator.ts` to create a sidebar layout instead of the current featured-content grid
- Update the home page template structure to include sidebar container
- Create new CSS for sidebar layout and styling
- Ensure the data currently shown in featured-content is available for the sidebar