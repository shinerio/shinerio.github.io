/**
 * SearchEngine测试文件
 * 测试搜索功能的各种场景和边界条件
 */

import { SearchEngine } from '../SearchEngine';
import { ParsedArticle } from '../../types';

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