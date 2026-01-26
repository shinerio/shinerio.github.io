/**
 * MetadataParser单元测试
 * Unit tests for MetadataParser
 */

import { MetadataParser } from '../MetadataParser';
import { createTempDir, cleanupTempDir, createTestMarkdownFile } from '../../test-setup';
import * as path from 'path';

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

      expect(result.content).toContain('[Another Note](another-note.html)');
      expect(result.content).toContain('[Some Other Note](some-other-note.html)');
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
      expect(result).toContain('[My Note](my-note.html)');
      expect(result).toContain('[Another Note](another-note.html)');
    });

    it('should convert Obsidian tags', () => {
      const content = 'Tagged with #important and #todo.';
      const result = parser.processMarkdown(content);
      expect(result).toContain('<span class="tag">#important</span>');
      expect(result).toContain('<span class="tag">#todo</span>');
    });
  });
});