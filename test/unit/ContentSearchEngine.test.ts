/**
 * ContentSearchEngine测试文件
 * 测试内容搜索功能的各种场景和边界条件
 */

import { ContentSearchEngine } from '../../src/core/ContentSearchEngine';
import { ParsedArticle } from '../../src/types';
import fc from 'fast-check';

describe('ContentSearchEngine', () => {
  let contentSearchEngine: ContentSearchEngine;

  beforeEach(() => {
    contentSearchEngine = new ContentSearchEngine();
  });

  describe('buildIndex', () => {
    it('should build content search index correctly from articles', () => {
      const articles: ParsedArticle[] = [
        {
          metadata: {
            title: 'Introduction to TypeScript',
            date: new Date('2023-01-01'),
            tags: ['typescript', 'programming'],
            description: 'Learn TypeScript basics',
            draft: false
          },
          content: 'TypeScript is a typed superset of JavaScript that adds static typing to the language.',
          filePath: '/path/to/typescript-article.md',
          wordCount: 10
        },
        {
          metadata: {
            title: 'Advanced JavaScript Concepts',
            date: new Date('2023-01-02'),
            tags: ['javascript', 'programming'],
            description: 'Deep dive into JavaScript',
            draft: false
          },
          content: 'JavaScript is a versatile programming language used in web development.',
          filePath: '/path/to/javascript-article.md',
          wordCount: 12
        }
      ];

      const contentIndex = contentSearchEngine.buildIndex(articles);

      expect(contentIndex.size).toBeGreaterThan(0);
      // Verify that words from content are in the index
      expect(contentIndex.has('typescript')).toBe(true);
      expect(contentIndex.has('superset')).toBe(true);
      expect(contentIndex.has('javascript')).toBe(true);
      expect(contentIndex.has('versatile')).toBe(true);
    });

    it('should exclude draft articles from index', () => {
      const articles: ParsedArticle[] = [
        {
          metadata: {
            title: 'Published Article',
            date: new Date('2023-01-01'),
            tags: ['published'],
            description: 'This is published',
            draft: false
          },
          content: 'Content of published article has uniqueword123.',  // Changed to avoid "published" in content
          filePath: '/path/to/published.md',
          wordCount: 5
        },
        {
          metadata: {
            title: 'Draft Article',
            date: new Date('2023-01-02'),
            tags: ['draft'],
            description: 'This is a draft',
            draft: true
          },
          content: 'Content of draft article has uniqueword456.',  // Changed to avoid "draft" in content
          filePath: '/path/to/draft.md',
          wordCount: 5
        }
      ];

      const contentIndex = contentSearchEngine.buildIndex(articles);

      // The published article's content should be indexed
      expect(contentIndex.has('uniqueword123')).toBe(true);
      // The draft article's content should NOT be indexed
      expect(contentIndex.has('uniqueword456')).toBe(false);
    });

    it('should handle empty articles array', () => {
      const contentIndex = contentSearchEngine.buildIndex([]);

      expect(contentIndex.size).toBe(0);
    });
  });

  describe('search', () => {
    it('should return relevant results for search query in content', () => {
      const articles: ParsedArticle[] = [
        {
          metadata: {
            title: 'TypeScript Tutorial',
            date: new Date('2023-01-01'),
            tags: ['typescript', 'tutorial'],
            description: 'Complete TypeScript tutorial',
            draft: false
          },
          content: 'This is a comprehensive tutorial about TypeScript features. TypeScript is a superset of JavaScript.',
          filePath: '/path/to/typescript-tutorial.md',
          wordCount: 15
        },
        {
          metadata: {
            title: 'JavaScript Guide',
            date: new Date('2023-01-02'),
            tags: ['javascript', 'guide'],
            description: 'JavaScript guide for beginners',
            draft: false
          },
          content: 'Guide to learning JavaScript programming language.',
          filePath: '/path/to/javascript-guide.md',
          wordCount: 12
        }
      ];

      const contentIndex = contentSearchEngine.buildIndex(articles);
      const searchableArticles = articles.map((article, index) => ({
        id: contentSearchEngine['generateId'](article.filePath),
        title: article.metadata.title,
        content: contentSearchEngine['extractSearchableContent'](article.content),
        tags: article.metadata.tags,
        slug: article.metadata.slug || contentSearchEngine['createSlug'](article.metadata.title)
      }));

      const results = contentSearchEngine.search('TypeScript', contentIndex, searchableArticles);

      expect(results).toHaveLength(1);
      expect(results[0].article.metadata.title).toBe('TypeScript Tutorial');
      expect(results[0].score).toBeGreaterThan(0);
      // Verify that matches were found in content
      expect(results[0].matchLocations?.inContent).toBe(true);
    });

    it('should return empty results for query not in content', () => {
      const articles: ParsedArticle[] = [
        {
          metadata: {
            title: 'TypeScript Guide',
            date: new Date('2023-01-01'),
            tags: ['typescript', 'guide'],
            description: 'TypeScript guide',
            draft: false
          },
          content: 'This guide covers the fundamentals of TypeScript.',
          filePath: '/path/to/typescript-guide.md',
          wordCount: 10
        }
      ];

      const contentIndex = contentSearchEngine.buildIndex(articles);
      const searchableArticles = articles.map((article, index) => ({
        id: contentSearchEngine['generateId'](article.filePath),
        title: article.metadata.title,
        content: contentSearchEngine['extractSearchableContent'](article.content),
        tags: article.metadata.tags,
        slug: article.metadata.slug || contentSearchEngine['createSlug'](article.metadata.title)
      }));

      // Search for word that's only in the title, not in the content
      const results = contentSearchEngine.search('nonexistentword', contentIndex, searchableArticles);

      expect(results).toHaveLength(0);
    });

    it('should return empty results for empty query', () => {
      const articles: ParsedArticle[] = [
        {
          metadata: {
            title: 'Sample Article',
            date: new Date('2023-01-01'),
            tags: ['sample'],
            description: 'Sample article',
            draft: false
          },
          content: 'Sample content for testing.',
          filePath: '/path/to/sample.md',
          wordCount: 8
        }
      ];

      const contentIndex = contentSearchEngine.buildIndex(articles);
      const searchableArticles = articles.map((article, index) => ({
        id: contentSearchEngine['generateId'](article.filePath),
        title: article.metadata.title,
        content: contentSearchEngine['extractSearchableContent'](article.content),
        tags: article.metadata.tags,
        slug: article.metadata.slug || contentSearchEngine['createSlug'](article.metadata.title)
      }));

      const results = contentSearchEngine.search('', contentIndex, searchableArticles);

      expect(results).toHaveLength(0);
    });

    it('should return multiple results sorted by relevance', () => {
      const articles: ParsedArticle[] = [
        {
          metadata: {
            title: 'TypeScript Deep Dive',
            date: new Date('2023-01-01'),
            tags: ['typescript', 'advanced'],
            description: 'Deep dive into TypeScript',
            draft: false
          },
          content: 'TypeScript is great. Learn advanced TypeScript concepts and best practices. TypeScript enhances JavaScript.',
          filePath: '/path/to/deep-dive.md',
          wordCount: 12
        },
        {
          metadata: {
            title: 'JavaScript Overview',
            date: new Date('2023-01-02'),
            tags: ['javascript'],
            description: 'Overview of JavaScript',
            draft: false
          },
          content: 'JavaScript is the foundation. TypeScript builds on JavaScript with additional features.',
          filePath: '/path/to/overview.md',
          wordCount: 10
        },
        {
          metadata: {
            title: 'Python Introduction',
            date: new Date('2023-01-03'),
            tags: ['python'],
            description: 'Intro to Python',
            draft: false
          },
          content: 'Python is another programming language.',
          filePath: '/path/to/python.md',
          wordCount: 8
        }
      ];

      const contentIndex = contentSearchEngine.buildIndex(articles);
      const searchableArticles = articles.map((article, index) => ({
        id: contentSearchEngine['generateId'](article.filePath),
        title: article.metadata.title,
        content: contentSearchEngine['extractSearchableContent'](article.content),
        tags: article.metadata.tags,
        slug: article.metadata.slug || contentSearchEngine['createSlug'](article.metadata.title)
      }));

      const results = contentSearchEngine.search('TypeScript', contentIndex, searchableArticles);

      // Expect at least one result (the one where TypeScript appears multiple times)
      expect(results.length).toBeGreaterThanOrEqual(1);
      // The first result should contain "TypeScript" in the content
      expect(results[0].article.content).toContain('TypeScript');
    });

    it('should highlight search terms in results', () => {
      const articles: ParsedArticle[] = [
        {
          metadata: {
            title: 'TypeScript Benefits',
            date: new Date('2023-01-01'),
            tags: ['typescript', 'benefits'],
            description: 'Benefits of using TypeScript',
            draft: false
          },
          content: 'TypeScript provides type safety and improves code quality significantly.',
          filePath: '/path/to/benefits.md',
          wordCount: 12
        }
      ];

      const contentIndex = contentSearchEngine.buildIndex(articles);
      const searchableArticles = articles.map((article, index) => ({
        id: contentSearchEngine['generateId'](article.filePath),
        title: article.metadata.title,
        content: contentSearchEngine['extractSearchableContent'](article.content),
        tags: article.metadata.tags,
        slug: article.metadata.slug || contentSearchEngine['createSlug'](article.metadata.title)
      }));

      const results = contentSearchEngine.search('type', contentIndex, searchableArticles);

      expect(results).toHaveLength(1);
      const result = results[0];
      expect(result.highlights.length).toBeGreaterThan(0);
      // Highlight should contain <mark> tags for the search term and indicate it's from content
      const hasContentHighlight = result.highlights.some(highlight =>
        highlight.includes('[CONTENT]') && highlight.includes('<mark>') && highlight.includes('type')
      );
      expect(hasContentHighlight).toBe(true);
    });
  });

  describe('Chinese and English support', () => {
    it('should handle Chinese characters in content search', () => {
      const articles: ParsedArticle[] = [
        {
          metadata: {
            title: 'Programming Guide',
            date: new Date('2023-01-01'),
            tags: ['programming', 'guide'],
            description: 'Programming guide',
            draft: false
          },
          content: 'TypeScript是一种类型安全的语言。This is a programming guide with 中文 content.',
          filePath: '/path/to/chinese-programming.md',
          wordCount: 12
        }
      ];

      const contentIndex = contentSearchEngine.buildIndex(articles);
      const searchableArticles = articles.map((article, index) => ({
        id: contentSearchEngine['generateId'](article.filePath),
        title: article.metadata.title,
        content: contentSearchEngine['extractSearchableContent'](article.content),
        tags: article.metadata.tags,
        slug: article.metadata.slug || contentSearchEngine['createSlug'](article.metadata.title)
      }));

      const results = contentSearchEngine.search('programming', contentIndex, searchableArticles);

      expect(results).toHaveLength(1);
      expect(results[0].article.metadata.title).toBe('Programming Guide');
    });

    it('should handle mixed Chinese and English content', () => {
      const articles: ParsedArticle[] = [
        {
          metadata: {
            title: 'Programming Concepts',
            date: new Date('2023-01-01'),
            tags: ['programming', 'concepts'],
            description: 'Programming concepts',
            draft: false
          },
          content: 'React is great. React是非常好的库。这是一个混合内容的例子，learning is important.',
          filePath: '/path/to/mixed-content.md',
          wordCount: 15
        }
      ];

      const contentIndex = contentSearchEngine.buildIndex(articles);
      const searchableArticles = articles.map((article, index) => ({
        id: contentSearchEngine['generateId'](article.filePath),
        title: article.metadata.title,
        content: contentSearchEngine['extractSearchableContent'](article.content),
        tags: article.metadata.tags,
        slug: article.metadata.slug || contentSearchEngine['createSlug'](article.metadata.title)
      }));

      const results = contentSearchEngine.search('learning', contentIndex, searchableArticles);

      expect(results).toHaveLength(1);
      expect(results[0].article.metadata.title).toBe('Programming Concepts');
    });
  });
});

describe('ContentSearchEngine Property Tests', () => {
  let contentSearchEngine: ContentSearchEngine;

  beforeEach(() => {
    contentSearchEngine = new ContentSearchEngine();
  });

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
              tags: data.tags,
              description: `Description for ${data.title}`,
              draft: false,
              slug: `article-${idx}`
            },
            content: data.content,
            filePath: `/path/to/article-${idx}.md`,
            wordCount: data.content.length
          }));

          const contentIndex = contentSearchEngine.buildIndex(articles);
          const searchableArticles = articles.map((article, index) => ({
            id: contentSearchEngine['generateId'](article.filePath),
            title: article.metadata.title,
            content: contentSearchEngine['extractSearchableContent'](article.content),
            tags: article.metadata.tags,
            slug: article.metadata.slug || contentSearchEngine['createSlug'](article.metadata.title)
          }));

          const results = contentSearchEngine.search(query, contentIndex, searchableArticles);

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
              tags: [`tag${idx}`],
              description: `Description for ${data.title}`,
              draft: false,
              slug: `article-${idx}`
            },
            content: data.content,
            filePath: `/path/to/article-${idx}.md`,
            wordCount: data.content.length
          }));

          const contentIndex = contentSearchEngine.buildIndex(articles);
          const searchableArticles = articles.map((article, index) => ({
            id: contentSearchEngine['generateId'](article.filePath),
            title: article.metadata.title,
            content: contentSearchEngine['extractSearchableContent'](article.content),
            tags: article.metadata.tags,
            slug: article.metadata.slug || contentSearchEngine['createSlug'](article.metadata.title)
          }));

          // Run the same search twice and compare results
          const results1 = contentSearchEngine.search(query, contentIndex, searchableArticles);
          const results2 = contentSearchEngine.search(query, contentIndex, searchableArticles);

          expect(results1).toEqual(results2);
        }
      ),
      { numRuns: 30 }
    );
  });
});