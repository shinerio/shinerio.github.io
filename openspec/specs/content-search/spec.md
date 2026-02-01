# Content Search Capability Specification

## Purpose

This specification defines the content search capabilities for the Obsidian blog generator. The content search functionality enables users to search specifically through article content to find relevant articles with appropriate relevance scoring for content matches.

## Requirements

### Requirement: ContentSearch Engine indexes article content
The ContentSearchEngine SHALL create an index of searchable terms from article content with a baseline relevance weight of 1.

#### Scenario: Indexing article content
- **WHEN** the ContentSearchEngine builds an index from a collection of articles
- **THEN** it SHALL extract searchable terms from each article's content and assign them a weight of 1

### Requirement: ContentSearch performs content-specific searches
The ContentSearchEngine SHALL perform searches specifically within article content and return results with appropriate relevance scores.

#### Scenario: Searching within content only
- **WHEN** a user performs a search that matches terms in article content
- **THEN** the ContentSearchEngine SHALL return articles where the search terms appear in content with appropriate relevance scores

### Requirement: ContentSearch generates content-specific highlights
The ContentSearchEngine SHALL generate search result highlights that indicate when matches occur in article content.

#### Scenario: Creating content search highlights
- **WHEN** the ContentSearchEngine creates highlights for search results
- **THEN** it SHALL mark content matches distinctly to indicate they came from the content search