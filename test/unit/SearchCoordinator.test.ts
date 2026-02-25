/**
 * SearchCoordinator Compatibility Test
 * Verify that SearchCoordinator maintains backward compatibility with SearchEngine interface
 */

import { SearchCoordinator } from '../../src/core/SearchCoordinator';
import { ParsedArticle } from '../../src/types';

describe('SearchCoordinator Backward Compatibility', () => {
  let searchCoordinator: SearchCoordinator;

  beforeEach(() => {
    searchCoordinator = new SearchCoordinator();
  });

  it('should have the same interface methods as the original SearchEngine', () => {
    // Verify that all required methods exist
    expect(typeof searchCoordinator.buildIndex).toBe('function');
    expect(typeof searchCoordinator.search).toBe('function');
    expect(typeof searchCoordinator.generateSearchData).toBe('function');
  });

  it('should work with the same input format as original SearchEngine', () => {
    const articles: ParsedArticle[] = [
      {
        metadata: {
          title: 'Test Article',
          date: new Date('2023-01-01'),
          modifiedDate: new Date('2023-01-01'),
          tags: ['test', 'article'],
          description: 'Test description',
          draft: false
        },
        content: 'This is test content for the article.',
        filePath: '/path/to/test-article.md',
        wordCount: 10
      }
    ];

    // Should be able to build index like the original
    const searchIndex = searchCoordinator.buildIndex(articles);
    expect(searchIndex.articles).toHaveLength(1);
    expect(searchIndex.index).toBeTruthy();

    // Should be able to search like the original
    const searchResults = searchCoordinator.search('test', searchIndex);
    expect(Array.isArray(searchResults)).toBe(true);
    if (searchResults.length > 0) {
      expect(searchResults[0].article).toBeTruthy();
      expect(typeof searchResults[0].score).toBe('number');
    }

    // Should be able to generate search data like the original
    const searchData = searchCoordinator.generateSearchData(searchIndex);
    expect(typeof searchData).toBe('string');
    const parsedData = JSON.parse(searchData);
    expect(parsedData.articles).toBeTruthy();
    // Verify new paragraphs format
    if (parsedData.articles.length > 0) {
      expect(Array.isArray(parsedData.articles[0].paragraphs)).toBe(true);
      expect(parsedData.articles[0].content).toBeUndefined();
    }
  });

  it('should maintain the same search behavior as the original', () => {
    const articles: ParsedArticle[] = [
      {
        metadata: {
          title: 'TypeScript Guide',
          date: new Date('2023-01-01'),
          modifiedDate: new Date('2023-01-01'),
          tags: ['typescript', 'guide'],
          description: 'Complete TypeScript guide',
          draft: false
        },
        content: 'This is a comprehensive guide about TypeScript and its features.',
        filePath: '/path/to/typescript-guide.md',
        wordCount: 15
      },
      {
        metadata: {
          title: 'JavaScript and TypeScript Basics',
          date: new Date('2023-01-02'),
          modifiedDate: new Date('2023-01-02'),
          tags: ['javascript', 'typescript', 'basics'],
          description: 'JavaScript and TypeScript fundamentals',
          draft: false
        },
        content: 'Learn JavaScript and TypeScript basics and advanced concepts.',
        filePath: '/path/to/javascript-typescript-basics.md',
        wordCount: 12
      }
    ];

    const searchIndex = searchCoordinator.buildIndex(articles);

    // Search for TypeScript - should return both articles since both contain "TypeScript"
    const results = searchCoordinator.search('TypeScript', searchIndex);

    expect(results).toHaveLength(2); // Both articles contain TypeScript
    expect(results[0].article.metadata.title).toContain('TypeScript'); // First result has highest relevance
    expect(results[0].score).toBeGreaterThan(0);
  });

  it('should split article content into paragraphs in search data', () => {
    const articles: ParsedArticle[] = [
      {
        metadata: {
          title: 'Paragraph Test',
          date: new Date('2023-01-01'),
          modifiedDate: new Date('2023-01-01'),
          tags: [],
          draft: false,
          slug: 'paragraph-test'
        },
        content: 'First paragraph with enough text here.\n\nSecond paragraph also long enough.\n\nShort.',
        filePath: '/vault/paragraph-test.md',
        wordCount: 10
      }
    ];

    const searchIndex = searchCoordinator.buildIndex(articles);
    const searchData = searchCoordinator.generateSearchData(searchIndex);
    const parsed = JSON.parse(searchData);

    expect(parsed.articles).toHaveLength(1);
    const article = parsed.articles[0];
    expect(Array.isArray(article.paragraphs)).toBe(true);
    // "Short." is less than 10 chars and should be filtered out
    expect(article.paragraphs).toContain('First paragraph with enough text here.');
    expect(article.paragraphs).toContain('Second paragraph also long enough.');
    expect(article.paragraphs).not.toContain('Short.');
  });
});