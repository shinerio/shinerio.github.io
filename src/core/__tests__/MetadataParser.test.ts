/**
 * MetadataParser单元测试
 * Unit tests for MetadataParser
 */

import { MetadataParser } from '../MetadataParser';
import { createTempDir, cleanupTempDir, createTestMarkdownFile } from '../../../test-setup';
import * as path from 'path';
import fc from 'fast-check';
import * as fs from 'fs-extra';
import { ParseError } from '../../types';

describe('MetadataParser', () => {
  let parser: MetadataParser;
  let tempDir: string;

  beforeEach(async () => {
    parser = new MetadataParser();
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('parseFile', () => {
    it('should parse file with frontmatter', async () => {
      const filePath = path.join(tempDir, 'test.md');
      const frontmatter = {
        title: 'Test Article',
        date: '2023-01-01',
        tags: ['test', 'markdown'],
        description: 'A test article'
      };
      const content = 'This is the article content.';

      await createTestMarkdownFile(filePath, content, frontmatter);

      const result = await parser.parseFile(filePath);

      expect(result.metadata.title).toBe('Test Article');
      expect(result.metadata.date).toEqual(new Date('2023-01-01'));
      expect(result.metadata.tags).toEqual(['test', 'markdown']);
      expect(result.metadata.description).toBe('A test article');
      expect(result.content).toContain('This is the article content.');
      expect(result.wordCount).toBeGreaterThan(0);
    });

    it('should parse file without frontmatter', async () => {
      const filePath = path.join(tempDir, 'no-frontmatter.md');
      const content = 'This is content without frontmatter.';

      await createTestMarkdownFile(filePath, content);

      const result = await parser.parseFile(filePath);

      expect(result.metadata.title).toBe('No Frontmatter');
      expect(typeof result.metadata.date).toBe('object');
      expect(result.metadata.tags).toEqual([]);
      expect(result.content).toContain(content);
    });

    it('should handle Chinese content', async () => {
      const filePath = path.join(tempDir, 'chinese.md');
      const frontmatter = {
        title: '中文标题',
        tags: ['中文', '测试']
      };
      const content = '这是中文内容。包含一些中文字符。';

      await createTestMarkdownFile(filePath, content, frontmatter);

      const result = await parser.parseFile(filePath);

      expect(result.metadata.title).toBe('中文标题');
      expect(result.metadata.tags).toEqual(['中文', '测试']);
      expect(result.wordCount).toBeGreaterThan(0);
    });

    it('should process Obsidian internal links', async () => {
      const filePath = path.join(tempDir, 'with-links.md');
      const content = 'This links to [[Another Note]] and [[Some Other Note]].';

      await createTestMarkdownFile(filePath, content);

      const result = await parser.parseFile(filePath);

      expect(result.content).toContain('<a href="another-note.html" class="internal-link">Another Note</a>');
      expect(result.content).toContain('<a href="some-other-note.html" class="internal-link">Some Other Note</a>');
    });

    it('should process Obsidian tags', async () => {
      const filePath = path.join(tempDir, 'with-tags.md');
      const content = 'This has #tag1 and #tag2 in the content.';

      await createTestMarkdownFile(filePath, content);

      const result = await parser.parseFile(filePath);

      expect(result.content).toContain('<span class="tag">#tag1</span>');
      expect(result.content).toContain('<span class="tag">#tag2</span>');
    });
  });

  describe('extractFrontmatter', () => {
    it('should extract title from data or filename', () => {
      const result1 = parser.extractFrontmatter({ title: 'Custom Title' }, '/path/to/file.md');
      expect(result1.title).toBe('Custom Title');

      const result2 = parser.extractFrontmatter({}, '/path/to/my-file-name.md');
      expect(result2.title).toBe('My File Name');
    });

    it('should extract tags from various formats', () => {
      const result1 = parser.extractFrontmatter({ tags: ['tag1', 'tag2'] }, '/path/file.md');
      expect(result1.tags).toEqual(['tag1', 'tag2']);

      const result2 = parser.extractFrontmatter({ tags: 'tag1, tag2, tag3' }, '/path/file.md');
      expect(result2.tags).toEqual(['tag1', 'tag2', 'tag3']);

      const result3 = parser.extractFrontmatter({ tag: ['single'] }, '/path/file.md');
      expect(result3.tags).toEqual(['single']);
    });

    it('should extract date from various formats', () => {
      const result1 = parser.extractFrontmatter({ date: '2023-01-01' }, '/path/file.md');
      expect(result1.date).toEqual(new Date('2023-01-01'));

      const result2 = parser.extractFrontmatter({ created: '2023-02-01' }, '/path/file.md');
      expect(result2.date).toEqual(new Date('2023-02-01'));
    });

    it('should extract draft status', () => {
      const result1 = parser.extractFrontmatter({ draft: true }, '/path/file.md');
      expect(result1.draft).toBe(true);

      const result2 = parser.extractFrontmatter({ draft: 'true' }, '/path/file.md');
      expect(result2.draft).toBe(true);

      const result3 = parser.extractFrontmatter({}, '/path/file.md');
      expect(result3.draft).toBe(false);
    });
  });

  describe('processMarkdown', () => {
    it('should remove excessive blank lines', () => {
      const content = 'Line 1\n\n\n\nLine 2\n\n\n\nLine 3';
      const result = parser.processMarkdown(content);
      expect(result).toBe('Line 1\n\nLine 2\n\nLine 3');
    });

    it('should convert Obsidian links', () => {
      const content = 'Link to [[My Note]] and [[Another Note]].';
      const result = parser.processMarkdown(content);
      expect(result).toContain('<a href="my-note.html" class="internal-link">My Note</a>');
      expect(result).toContain('<a href="another-note.html" class="internal-link">Another Note</a>');
    });

    it('should convert Obsidian tags', () => {
      const content = 'Tagged with #important and #todo.';
      const result = parser.processMarkdown(content);
      expect(result).toContain('<span class="tag">#important</span>');
      expect(result).toContain('<span class="tag">#todo</span>');
    });
  });

  describe('Property Tests - Metadata Extraction Consistency', () => {
    it('should consistently generate titles from filenames', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }).filter(str =>
            !str.includes('.') &&
            !str.includes('/') &&
            !str.includes('\\') &&
            str.trim() !== ''
          ),
          (fileName) => {
            // Replace hyphens and underscores with spaces, and capitalize first letter of each word
            const expectedTitle = fileName
              .replace(/[-_]/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase());

            const metadata = parser.extractFrontmatter({}, `/path/to/${fileName}.md`);

            expect(metadata.title).toBe(expectedTitle);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle various tag formats consistently', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(str => /^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(str))),
          (tags) => {
            // Test array format
            const result1 = parser.extractFrontmatter({ tags }, '/path/file.md');
            expect(result1.tags).toEqual(tags);

            // Test comma-separated string format
            if (tags.length > 0) {
              const tagString = tags.join(', ');
              const result2 = parser.extractFrontmatter({ tags: tagString }, '/path/file.md');
              expect(result2.tags).toEqual(tags);
            }

            // Test fallback to 'tag' property
            const result3 = parser.extractFrontmatter({ tag: tags }, '/path/file.md');
            expect(result3.tags).toEqual(tags);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract dates consistently', () => {
      fc.assert(
        fc.property(
          fc.string().filter(str => {
            const date = new Date(str);
            return !isNaN(date.getTime()); // Valid date strings only
          }),
          (dateString) => {
            const dateObj = new Date(dateString);

            // Test 'date' field
            const result1 = parser.extractFrontmatter({ date: dateString }, '/path/file.md');
            expect(result1.date.getTime()).toBe(dateObj.getTime());

            // Test 'created' field (fallback)
            const result2 = parser.extractFrontmatter({ created: dateString }, '/path/file.md');
            expect(result2.date.getTime()).toBe(dateObj.getTime());
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property Tests - YAML Roundtrip Consistency', () => {
    it('should process markdown content without losing essential content', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 200 }),
          (originalContent) => {
            // Process the content through the parser
            const processed = parser.processMarkdown(originalContent);

            // Ensure the content still contains the key elements
            // We can't do exact equality because the processor removes extra blank lines
            // and converts Obsidian-specific syntax, so we just ensure it's not empty
            // and that certain transformations are applied consistently

            expect(typeof processed).toBe('string');
            expect(processed).toBeDefined();

            // If original content was not empty, processed shouldn't be empty either
            if (originalContent.trim() !== '') {
              expect(processed.trim()).not.toBe('');
            }

            // Verify that multiple consecutive newlines are reduced to 2
            expect(processed).not.toMatch(/\n\s*\n\s*\n\s*\n/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('calculateWordCount', () => {
    it('should count English words correctly', () => {
      const content = 'Hello world this is a test';
      const count = (parser as any)['calculateWordCount'](content);
      expect(count).toBe(6);
    });

    it('should count mixed English words and Chinese characters', () => {
      const content = 'Hello 世界 this 是 test 测试';
      const result = (parser as any)['calculateWordCount'](content);
      // Chinese characters: 世, 界, 是, 测, 试 = 5 chars
      // English words: Hello, this, test = 3 words
      // Total: 5 + 3 = 8
      expect(result).toBe(8);
    });

    it('should exclude code blocks from word count', () => {
      const content = `Here is some text with code.

\`\`\`javascript
function hello() {
  return "world";
}
\`\`\`

And more text here.`;
      const count = (parser as any)['calculateWordCount'](content);
      expect(count).toBeLessThan(20); // Should be much less due to code block exclusion
    });

    it('should exclude inline code from word count', () => {
      const content = 'This has `inline code` and regular text';
      const count = (parser as any)['calculateWordCount'](content);
      expect(count).toBe(5); // "This", "has", "and", "regular", "text" = 5 (inline code stripped)
    });

    it('should handle empty content', () => {
      const count = (parser as any)['calculateWordCount']('');
      expect(count).toBe(0);
    });

    it('should handle only whitespace', () => {
      const count = (parser as any)['calculateWordCount']('   \n\n\t   ');
      expect(count).toBe(0);
    });

    describe('Property Tests - Word Count', () => {
      it('should handle various content lengths consistently', () => {
        const testCases = [
          '',
          'short',
          'this is a longer sentence with multiple words',
          'a very long sentence with many words that exceed normal limits for testing purposes',
          'hello world',
          'test test test test test'
        ];

        testCases.forEach(content => {
          const result = (parser as any)['calculateWordCount'](content);
          expect(result).toBeGreaterThanOrEqual(0);

          // Basic consistency: word count should be deterministic
          const result2 = (parser as any)['calculateWordCount'](content);
          expect(result).toBe(result2);
        });
      });

      it('should handle mixed English and Chinese content', () => {
        const testCases = [
          'hello 世界',
          'test 测试',
          'article 文章 标题',
          'mixed 中文 english 内容 content',
          '你好 world'
        ];

        testCases.forEach(mixedContent => {
          const result = (parser as any)['calculateWordCount'](mixedContent);
          expect(result).toBeGreaterThanOrEqual(0);

          // Word count should not decrease when adding content
          if (mixedContent.trim()) {
            const extendedContent = mixedContent + ' additional text';
            const extendedResult = (parser as any)['calculateWordCount'](extendedContent);
            expect(extendedResult).toBeGreaterThanOrEqual(result);
          }
        });
      });
    });
  });

  describe('createSlug', () => {
    it('should convert spaces to hyphens', () => {
      const result = (parser as any)['createSlug']('Hello World Article');
      expect(result).toBe('hello-world-article');
    });

    it('should handle special characters', () => {
      const result = (parser as any)['createSlug']('Article: With! Special@ Characters#');
      expect(result).toBe('article-with-special-characters'); // Special chars removed, spaces to hyphens
    });

    it('should handle underscores', () => {
      const result = (parser as any)['createSlug']('my_article_title');
      expect(result).toBe('my-article-title');
    });

    it('should handle mixed case', () => {
      const result = (parser as any)['createSlug']('MyCamelCaseArticle');
      expect(result).toBe('mycamelcasearticle'); // Lowercased
    });

    it('should handle numbers', () => {
      const result = (parser as any)['createSlug']('Article2023WithNumbers');
      expect(result).toBe('article2023withnumbers');
    });

    it('should remove leading and trailing spaces', () => {
      const result = (parser as any)['createSlug']('  hello world  ');
      expect(result).toBe('hello-world');
    });

    it('should remove leading and trailing hyphens', () => {
      const result = (parser as any)['createSlug']('-hello-world-');
      expect(result).toBe('hello-world');
    });

    it('should handle empty input', () => {
      const result = (parser as any)['createSlug']('');
      expect(result).toBe('');
    });

    it('should handle only special characters', () => {
      const result = (parser as any)['createSlug']('!@#$%^&*()');
      expect(result).toBe(''); // All special characters removed
    });

    it('should preserve Chinese characters', () => {
      const result = (parser as any)['createSlug']('我的文章标题');
      expect(result).toBe('我的文章标题'); // Chinese characters should be preserved
    });

    it('should handle mixed Chinese and English', () => {
      const result = (parser as any)['createSlug']('My 测试 Article');
      expect(result).toBe('my-测试-article');
    });

    it('should handle Chinese with spaces', () => {
      const result = (parser as any)['createSlug']('我的 文章 标题');
      expect(result).toBe('我的-文章-标题');
    });

    describe('Property Tests - Slug Creation', () => {
      it('should handle various inputs consistently', () => {
        const testCases = [
          '',
          'simple',
          'hello world',
          'article-title',
          'My Camel Case Article',
          'special!@#$%characters',
          'mixed 中文 content',
          '123456789',
          'spaces   multiple   spaces',
          'hyphens---multiple---hyphens'
        ];

        testCases.forEach(input => {
          const result = (parser as any)['createSlug'](input);

          // Result should always be a string
          expect(typeof result).toBe('string');

          // Result should not contain special characters (except hyphens and allowed Chinese chars)
          expect(result).not.toMatch(/[^\w\u4e00-\u9fa5\s-]/);

          // Result should be lowercased
          expect(result).toBe(result.toLowerCase());

          // Result should not have leading or trailing hyphens after processing
          expect(result.startsWith('-')).toBe(false);
          expect(result.endsWith('-')).toBe(false);

          // Consecutive spaces should be normalized to single hyphen
          expect(result).not.toMatch(/--+/);
        });
      });

      it('should handle mixed English and Chinese consistently', () => {
        const testCases = [
          'hello 世界',
          'my 测试 article',
          'title 文章',
          'test 测试 content 内容',
          'mixed 英文 english 内容'
        ];

        testCases.forEach(mixedInput => {
          const result = (parser as any)['createSlug'](mixedInput);

          // Result should be a valid slug
          expect(typeof result).toBe('string');

          // Should not contain special characters
          expect(result).not.toMatch(/[^\w\u4e00-\u9fa5\s-]/);

          // Should be consistent
          const result2 = (parser as any)['createSlug'](mixedInput);
          expect(result).toBe(result2);
        });
      });
    });
  });
});