/**
 * SearchEngine测试文件
 * 测试搜索功能的各种场景和边界条件
 */

import { SearchEngine } from '../../src/core/SearchEngine';
import { ParsedArticle } from '../../src/types';
import fc from 'fast-check';

describe('SearchEngine', () => {
  let searchEngine: SearchEngine;

  beforeEach(() => {
    searchEngine = new SearchEngine();
  });

  describe('buildIndex', () => {
    it('should build search index correctly from articles', () => {
      const articles: ParsedArticle[] = [
        {
          metadata: {
            title: 'Introduction to TypeScript',
            date: new Date('2023-01-01'),
            modifiedDate: new Date('2023-01-01'),
            tags: ['typescript', 'programming'],
            description: 'Learn TypeScript basics',
            draft: false
          },
          content: 'TypeScript is a typed superset of JavaScript.',
          filePath: '/path/to/typescript-article.md',
          wordCount: 10
        },
        {
          metadata: {
            title: 'Advanced JavaScript Concepts',
            date: new Date('2023-01-02'),
            modifiedDate: new Date('2023-01-02'),
            tags: ['javascript', 'programming'],
            description: 'Deep dive into JavaScript',
            draft: false
          },
          content: 'JavaScript is a versatile programming language.',
          filePath: '/path/to/javascript-article.md',
          wordCount: 12
        }
      ];

      const index = searchEngine.buildIndex(articles);

      expect(index.articles).toHaveLength(2);
      expect(index.index.size).toBeGreaterThan(0);
      expect(index.articles[0].title).toBe('Introduction to TypeScript');
      expect(index.articles[1].title).toBe('Advanced JavaScript Concepts');
    });

    it('should exclude draft articles from index', () => {
      const articles: ParsedArticle[] = [
        {
          metadata: {
            title: 'Published Article',
            date: new Date('2023-01-01'),
            modifiedDate: new Date('2023-01-01'),
            tags: ['published'],
            description: 'This is published',
            draft: false
          },
          content: 'Content of published article.',
          filePath: '/path/to/published.md',
          wordCount: 5
        },
        {
          metadata: {
            title: 'Draft Article',
            date: new Date('2023-01-02'),
            modifiedDate: new Date('2023-01-02'),
            tags: ['draft'],
            description: 'This is a draft',
            draft: true
          },
          content: 'Content of draft article.',
          filePath: '/path/to/draft.md',
          wordCount: 5
        }
      ];

      const index = searchEngine.buildIndex(articles);

      expect(index.articles).toHaveLength(1);
      expect(index.articles[0].title).toBe('Published Article');
    });

    it('should handle empty articles array', () => {
      const index = searchEngine.buildIndex([]);

      expect(index.articles).toHaveLength(0);
      expect(index.index.size).toBe(0);
    });
  });

  describe('search', () => {
    it('should return relevant results for search query', () => {
      const articles: ParsedArticle[] = [
        {
          metadata: {
            title: 'TypeScript Tutorial',
            date: new Date('2023-01-01'),
            modifiedDate: new Date('2023-01-01'),
            tags: ['typescript', 'tutorial'],
            description: 'Complete TypeScript tutorial',
            draft: false
          },
          content: 'This is a comprehensive tutorial about TypeScript features.',
          filePath: '/path/to/typescript-tutorial.md',
          wordCount: 15
        },
        {
          metadata: {
            title: 'JavaScript Guide',
            date: new Date('2023-01-02'),
            modifiedDate: new Date('2023-01-02'),
            tags: ['javascript', 'guide'],
            description: 'JavaScript guide for beginners',
            draft: false
          },
          content: 'Guide to learning JavaScript programming language.',
          filePath: '/path/to/javascript-guide.md',
          wordCount: 12
        }
      ];

      const index = searchEngine.buildIndex(articles);
      const results = searchEngine.search('TypeScript', index);

      expect(results).toHaveLength(1);
      expect(results[0].article.metadata.title).toBe('TypeScript Tutorial');
      expect(results[0].score).toBeGreaterThan(0);
    });

    it('should return empty results for empty query', () => {
      const articles: ParsedArticle[] = [
        {
          metadata: {
            title: 'Sample Article',
            date: new Date('2023-01-01'),
            modifiedDate: new Date('2023-01-01'),
            tags: ['sample'],
            description: 'Sample article',
            draft: false
          },
          content: 'Sample content for testing.',
          filePath: '/path/to/sample.md',
          wordCount: 8
        }
      ];

      const index = searchEngine.buildIndex(articles);
      const results = searchEngine.search('', index);

      expect(results).toHaveLength(0);
    });

    it('should return multiple results sorted by relevance', () => {
      const articles: ParsedArticle[] = [
        {
          metadata: {
            title: 'TypeScript Deep Dive',
            date: new Date('2023-01-01'),
            modifiedDate: new Date('2023-01-01'),
            tags: ['typescript', 'advanced'],
            description: 'Deep dive into TypeScript',
            draft: false
          },
          content: 'TypeScript is great. Learn advanced TypeScript concepts.',
          filePath: '/path/to/deep-dive.md',
          wordCount: 12
        },
        {
          metadata: {
            title: 'JavaScript Overview',
            date: new Date('2023-01-02'),
            modifiedDate: new Date('2023-01-02'),
            tags: ['javascript'],
            description: 'Overview of JavaScript',
            draft: false
          },
          content: 'JavaScript is the foundation. TypeScript builds on it.',
          filePath: '/path/to/overview.md',
          wordCount: 10
        },
        {
          metadata: {
            title: 'Python Introduction',
            date: new Date('2023-01-03'),
            modifiedDate: new Date('2023-01-03'),
            tags: ['python'],
            description: 'Intro to Python',
            draft: false
          },
          content: 'Python is another programming language.',
          filePath: '/path/to/python.md',
          wordCount: 8
        }
      ];

      const index = searchEngine.buildIndex(articles);
      const results = searchEngine.search('TypeScript', index);

      expect(results).toHaveLength(2);
      // TypeScript Deep Dive should have higher score than JavaScript Overview
      // because "TypeScript" appears in title and content vs just content
      expect(results[0].article.metadata.title).toBe('TypeScript Deep Dive');
      expect(results[1].article.metadata.title).toBe('JavaScript Overview');
      expect(results[0].score >= results[1].score).toBe(true);
    });

    it('should highlight search terms in results', () => {
      const articles: ParsedArticle[] = [
        {
          metadata: {
            title: 'TypeScript Benefits',
            date: new Date('2023-01-01'),
            modifiedDate: new Date('2023-01-01'),
            tags: ['typescript', 'benefits'],
            description: 'Benefits of using TypeScript',
            draft: false
          },
          content: 'TypeScript provides type safety and improves code quality.',
          filePath: '/path/to/benefits.md',
          wordCount: 12
        }
      ];

      const index = searchEngine.buildIndex(articles);
      const results = searchEngine.search('type', index);

      expect(results).toHaveLength(1);
      const result = results[0];
      expect(result.highlights.length).toBeGreaterThan(0);
      // Highligh should contain <mark> tags for the search term
      const hasHighlight = result.highlights.some(highlight =>
        highlight.includes('<mark>') && highlight.includes('type')
      );
      expect(hasHighlight).toBe(true);
    });
  });

  describe('generateSearchData', () => {
    it('should generate JSON search data correctly', () => {
      const articles: ParsedArticle[] = [
        {
          metadata: {
            title: 'Getting Started with React',
            date: new Date('2023-01-01'),
            modifiedDate: new Date('2023-01-01'),
            tags: ['react', 'frontend'],
            description: 'Getting started guide for React',
            draft: false,
            slug: 'getting-started-react'
          },
          content: 'React is a popular JavaScript library for building user interfaces.',
          filePath: '/path/to/react-guide.md',
          wordCount: 15
        }
      ];

      const index = searchEngine.buildIndex(articles);
      const searchData = searchEngine.generateSearchData(index);

      expect(searchData).toContain('Getting Started with React');
      expect(searchData).toContain('react');
      expect(searchData).toContain('frontend');
      expect(searchData).toContain('getting-started-react');

      // Verify it's valid JSON
      const parsedData = JSON.parse(searchData);
      expect(parsedData.articles).toHaveLength(1);
      expect(parsedData.articles[0].title).toBe('Getting Started with React');
    });

    it('should limit content length in search data', () => {
      const longContent = 'This is a very long content. '.repeat(50);
      const articles: ParsedArticle[] = [
        {
          metadata: {
            title: 'Long Article',
            date: new Date('2023-01-01'),
            modifiedDate: new Date('2023-01-01'),
            tags: ['long'],
            description: 'Article with long content',
            draft: false,
            slug: 'long-article'
          },
          content: longContent,
          filePath: '/path/to/long.md',
          wordCount: 200
        }
      ];

      const index = searchEngine.buildIndex(articles);
      const searchData = searchEngine.generateSearchData(index);

      const parsedData = JSON.parse(searchData);
      // Content should be limited to first 200 characters
      expect(parsedData.articles[0].content.length).toBeLessThanOrEqual(200);
    });
  });

  describe('Chinese and English support', () => {
    it('should handle Chinese characters in search', () => {
      const articles: ParsedArticle[] = [
        {
          metadata: {
            title: '学习TypeScript',
            date: new Date('2023-01-01'),
            modifiedDate: new Date('2023-01-01'),
            tags: ['typescript', '学习'],
            description: '学习TypeScript的指南',
            draft: false
          },
          content: 'TypeScript是一种类型安全的语言。这是中文内容。',
          filePath: '/path/to/chinese-typescript.md',
          wordCount: 12
        }
      ];

      const index = searchEngine.buildIndex(articles);
      const results = searchEngine.search('TypeScript', index);

      expect(results).toHaveLength(1);
      expect(results[0].article.metadata.title).toContain('TypeScript');
    });

    it('should handle mixed Chinese and English content', () => {
      const articles: ParsedArticle[] = [
        {
          metadata: {
            title: 'React教程',
            date: new Date('2023-01-01'),
            modifiedDate: new Date('2023-01-01'),
            tags: ['react', '教程'],
            description: 'React tutorial 教程',
            draft: false
          },
          content: 'React is great. React是非常好的库。这是一个混合内容的例子。',
          filePath: '/path/to/mixed-content.md',
          wordCount: 15
        }
      ];

      const index = searchEngine.buildIndex(articles);
      const results = searchEngine.search('React', index);

      expect(results).toHaveLength(1);
      expect(results[0].article.metadata.title).toContain('React');
    });
  });
});

describe('SearchEngine Property Tests', () => {
  let searchEngine: SearchEngine;

  beforeEach(() => {
    searchEngine = new SearchEngine();
  });

  describe('Search Functionality Completeness', () => {
    it('should handle various query strings without crashing', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 30 }).filter(str => str.trim() !== ''),
              content: fc.string({ minLength: 10, maxLength: 200 }),
              tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (query, articleData) => {
            const articles: ParsedArticle[] = articleData.map((data, idx) => ({
              metadata: {
                title: data.title,
                date: new Date('2023-01-01'),
                modifiedDate: new Date('2023-01-01'),
                tags: data.tags,
                description: `Description for ${data.title}`,
                draft: false,
                slug: `article-${idx}`
              },
              content: data.content,
              filePath: `/path/to/article-${idx}.md`,
              wordCount: data.content.length
            }));

            const index = searchEngine.buildIndex(articles);
            const results = searchEngine.search(query, index);

            // Search should always return an array
            expect(Array.isArray(results)).toBe(true);

            // Each result should have proper structure
            results.forEach(result => {
              expect(result.article).toBeDefined();
              expect(result.score).toBeGreaterThanOrEqual(0);
              expect(Array.isArray(result.highlights)).toBe(true);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should return consistent results for same query and index', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(str => str.trim() !== ''),
          fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 30 }).filter(str => str.trim() !== ''),
              content: fc.string({ minLength: 10, maxLength: 100 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (query, articleData) => {
            const articles: ParsedArticle[] = articleData.map((data, idx) => ({
              metadata: {
                title: data.title,
                date: new Date('2023-01-01'),
                modifiedDate: new Date('2023-01-01'),
                tags: [`tag${idx}`],
                description: `Description for ${data.title}`,
                draft: false,
                slug: `article-${idx}`
              },
              content: data.content,
              filePath: `/path/to/article-${idx}.md`,
              wordCount: data.content.length
            }));

            const index = searchEngine.buildIndex(articles);

            // Run the same search twice and compare results
            const results1 = searchEngine.search(query, index);
            const results2 = searchEngine.search(query, index);

            expect(results1).toEqual(results2);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Search Result Highlighting Consistency', () => {
    it('should generate valid highlights for search terms', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 15 }).filter(str =>
            str.trim() !== '' && !/[.*+?^${}()|[\]\\]/.test(str) // Avoid regex special chars
          ),
          fc.string({ minLength: 20, maxLength: 200 }),
          (queryTerm, content) => {
            const articles: ParsedArticle[] = [{
              metadata: {
                title: `Article about ${queryTerm}`,
                date: new Date('2023-01-01'),
                modifiedDate: new Date('2023-01-01'),
                tags: [queryTerm],
                description: `Article about ${queryTerm}`,
                draft: false,
                slug: 'test-article'
              },
              content: `${content} ${queryTerm} more content`,
              filePath: '/path/to/test.md',
              wordCount: content.length
            }];

            const index = searchEngine.buildIndex(articles);
            const results = searchEngine.search(queryTerm, index);

            // If results exist, highlights should be properly formatted
            results.forEach(result => {
              result.highlights.forEach(highlight => {
                // Highlights should be strings
                expect(typeof highlight).toBe('string');

                // If the highlight contains marks, they should be properly formatted
                if (highlight.includes('<mark>')) {
                  expect(highlight).toContain('</mark>');
                }
              });
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not generate negative scores', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }),
          fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 30 }).filter(str => str.trim() !== ''),
              content: fc.string({ minLength: 10, maxLength: 100 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (query, articleData) => {
            const articles: ParsedArticle[] = articleData.map((data, idx) => ({
              metadata: {
                title: data.title,
                date: new Date('2023-01-01'),
                modifiedDate: new Date('2023-01-01'),
                tags: [`tag${idx}`],
                description: `Description for ${data.title}`,
                draft: false,
                slug: `article-${idx}`
              },
              content: data.content,
              filePath: `/path/to/article-${idx}.md`,
              wordCount: data.content.length
            }));

            const index = searchEngine.buildIndex(articles);
            const results = searchEngine.search(query, index);

            // All scores should be non-negative
            results.forEach(result => {
              expect(result.score).toBeGreaterThanOrEqual(0);
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Search Navigation Correctness', () => {
    it('should maintain search result order by relevance score', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(str => str.trim() !== ''),
          fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 30 }).filter(str => str.trim() !== ''),
              content: fc.string({ minLength: 10, maxLength: 100 })
            }),
            { minLength: 2, maxLength: 10 }
          ),
          (query, articleData) => {
            const articles: ParsedArticle[] = articleData.map((data, idx) => ({
              metadata: {
                title: data.title,
                date: new Date('2023-01-01'),
                modifiedDate: new Date('2023-01-01'),
                tags: [`tag${idx}`],
                description: `Description for ${data.title}`,
                draft: false,
                slug: `article-${idx}`
              },
              content: `${data.content} ${query} additional ${query} terms`,
              filePath: `/path/to/article-${idx}.md`,
              wordCount: data.content.length
            }));

            const index = searchEngine.buildIndex(articles);
            const results = searchEngine.search(query, index);

            // Results should be ordered by score (descending)
            for (let i = 0; i < results.length - 1; i++) {
              expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should handle empty or whitespace-only queries', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 10 }).filter(str => str.trim() === ''), // Strings with only whitespace or empty
          fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 30 }).filter(str => str.trim() !== ''),
              content: fc.string({ minLength: 10, maxLength: 100 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (emptyQuery, articleData) => {
            const articles: ParsedArticle[] = articleData.map((data, idx) => ({
              metadata: {
                title: data.title,
                date: new Date('2023-01-01'),
                modifiedDate: new Date('2023-01-01'),
                tags: [`tag${idx}`],
                description: `Description for ${data.title}`,
                draft: false,
                slug: `article-${idx}`
              },
              content: data.content,
              filePath: `/path/to/article-${idx}.md`,
              wordCount: data.content.length
            }));

            const index = searchEngine.buildIndex(articles);
            const results = searchEngine.search(emptyQuery, index);

            // Empty queries should return empty results
            expect(results).toHaveLength(0);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should prioritize title matches over content matches in search results', () => {
      const articles: ParsedArticle[] = [
        {
          metadata: {
            title: 'Understanding React Components',
            date: new Date('2023-01-01'),
            modifiedDate: new Date('2023-01-01'),
            tags: ['react'],
            description: 'Learning React components',
            draft: false
          },
          content: 'This article explains how to use components in React development.',
          filePath: '/path/to/react-components.md',
          wordCount: 15
        },
        {
          metadata: {
            title: 'JavaScript Fundamentals',
            date: new Date('2023-01-02'),
            modifiedDate: new Date('2023-01-02'),
            tags: ['javascript'],
            description: 'Basic JavaScript concepts',
            draft: false
          },
          content: 'This article discusses React components in detail.',
          filePath: '/path/to/js-fundamentals.md',
          wordCount: 12
        }
      ];

      const index = searchEngine.buildIndex(articles);
      const results = searchEngine.search('React', index);

      // The article with "React" in the title should rank higher than the one with "React" in content
      expect(results).toHaveLength(2);
      expect(results[0].article.metadata.title).toBe('Understanding React Components'); // Title match
      expect(results[1].article.metadata.title).toBe('JavaScript Fundamentals'); // Content match
      expect(results[0].score > results[1].score).toBe(true);
    });

    it('should properly indicate match locations in search results', () => {
      const articles: ParsedArticle[] = [
        {
          metadata: {
            title: 'TypeScript Guide',
            date: new Date('2023-01-01'),
            modifiedDate: new Date('2023-01-01'),
            tags: ['typescript', 'guide'],
            description: 'TypeScript guide',
            draft: false
          },
          content: 'This is a comprehensive guide about TypeScript.',
          filePath: '/path/to/typescript-guide.md',
          wordCount: 10
        }
      ];

      const index = searchEngine.buildIndex(articles);
      const results = searchEngine.search('TypeScript', index);

      expect(results).toHaveLength(1);
      const result = results[0];

      // Should have match location information
      expect(result.matchLocations).toBeDefined();
      expect(result.matchLocations!.inTitle).toBe(true); // Should match in title
      expect(result.matchLocations!.inContent).toBe(true); // Should also match in content
    });
  });
});

describe('Search Performance Tests', () => {
  let searchEngine: SearchEngine;

  beforeEach(() => {
    searchEngine = new SearchEngine();
  });

  it('should maintain reasonable performance with larger datasets', () => {
    // Create a moderately sized dataset to test performance
    const articles: ParsedArticle[] = Array.from({ length: 100 }, (_, idx) => ({
      metadata: {
        title: `Article ${idx} about TypeScript and JavaScript`,
        date: new Date('2023-01-01'),
        modifiedDate: new Date('2023-01-01'),
        tags: ['javascript', 'typescript', 'programming'].slice(0, Math.floor(Math.random() * 3) + 1),
        description: `Description for article ${idx}`,
        draft: false,
        slug: `article-${idx}`
      },
      content: `This is the content for article ${idx}. It discusses TypeScript and JavaScript development.
                JavaScript and TypeScript are both important technologies in modern web development.
                This content has repeated terms to test the search functionality thoroughly.`,
      filePath: `/path/to/article-${idx}.md`,
      wordCount: 50
    }));

    // Measure buildIndex performance
    const startTime = Date.now(); // Using Date.now() instead of performance.now() for broader compatibility
    const index = searchEngine.buildIndex(articles);
    const buildIndexTime = Date.now() - startTime;

    // Indexing should complete in reasonable time (less than 2 seconds for 100 articles)
    expect(buildIndexTime).toBeLessThan(2000);

    // Measure search performance
    const searchStartTime = Date.now();
    const results = searchEngine.search('TypeScript', index);
    const searchTime = Date.now() - searchStartTime;

    // Search should be fast (less than 200ms for 100 articles)
    expect(searchTime).toBeLessThan(200);

    // Should return reasonable number of results
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(100);
  });
});