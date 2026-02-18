/**
 * CalloutProcessing 测试
 * Tests for Obsidian callout syntax processing in SiteGenerator
 */

import { SiteGenerator } from '../../src/core/SiteGenerator';

describe('Callout Processing', () => {
  let generator: SiteGenerator;

  beforeEach(() => {
    generator = new SiteGenerator();
  });

  describe('basic callout rendering', () => {
    it('should transform a note callout', () => {
      const input = '<blockquote>\n<p>[!note] My Note</p>\n<p>Some content here</p>\n</blockquote>';
      const result = generator.processCallouts(input);
      expect(result).toContain('class="callout callout-note"');
      expect(result).toContain('data-callout="note"');
      expect(result).toContain('class="callout-title-text">My Note</span>');
      expect(result).toContain('class="callout-content">');
      expect(result).toContain('Some content here');
    });

    it.each([
      'note', 'abstract', 'info', 'todo', 'tip', 'success',
      'question', 'warning', 'failure', 'danger', 'bug', 'example', 'quote'
    ])('should render %s callout type', (type) => {
      const input = `<blockquote>\n<p>[!${type}] Title</p>\n<p>Body</p>\n</blockquote>`;
      const result = generator.processCallouts(input);
      expect(result).toContain(`class="callout callout-${type}"`);
      expect(result).toContain(`data-callout="${type}"`);
      expect(result).toContain('class="callout-icon">');
      expect(result).toContain('<svg');
    });
  });

  describe('alias resolution', () => {
    it.each([
      ['hint', 'tip'],
      ['important', 'tip'],
      ['summary', 'abstract'],
      ['tldr', 'abstract'],
      ['check', 'success'],
      ['done', 'success'],
      ['help', 'question'],
      ['faq', 'question'],
      ['caution', 'warning'],
      ['attention', 'warning'],
      ['fail', 'failure'],
      ['missing', 'failure'],
      ['error', 'danger'],
      ['cite', 'quote']
    ])('should resolve alias [!%s] to %s', (alias, canonical) => {
      const input = `<blockquote>\n<p>[!${alias}] Title</p>\n<p>Body</p>\n</blockquote>`;
      const result = generator.processCallouts(input);
      expect(result).toContain(`class="callout callout-${canonical}"`);
      expect(result).toContain(`data-callout="${canonical}"`);
    });
  });

  describe('foldable callouts', () => {
    it('should render expanded foldable callout with +', () => {
      const input = '<blockquote>\n<p>[!note]+ Expandable</p>\n<p>Content</p>\n</blockquote>';
      const result = generator.processCallouts(input);
      expect(result).toContain('<details open>');
      expect(result).toContain('<summary class="callout-title">');
      expect(result).toContain('Expandable');
    });

    it('should render collapsed foldable callout with -', () => {
      const input = '<blockquote>\n<p>[!warning]- Collapsed</p>\n<p>Hidden content</p>\n</blockquote>';
      const result = generator.processCallouts(input);
      expect(result).toContain('<details>');
      expect(result).not.toContain('<details open>');
      expect(result).toContain('<summary class="callout-title">');
      expect(result).toContain('Collapsed');
    });
  });

  describe('title handling', () => {
    it('should use custom title when provided', () => {
      const input = '<blockquote>\n<p>[!tip] Custom Title</p>\n<p>Body</p>\n</blockquote>';
      const result = generator.processCallouts(input);
      expect(result).toContain('class="callout-title-text">Custom Title</span>');
    });

    it('should use default title when none provided', () => {
      const input = '<blockquote>\n<p>[!warning]</p>\n<p>Body</p>\n</blockquote>';
      const result = generator.processCallouts(input);
      expect(result).toContain('class="callout-title-text">Warning</span>');
    });
  });

  describe('multi-line callouts (br handling)', () => {
    it('should put content after <br> into body, not title', () => {
      // marked renders `> [!warning]\n> Body text` as a single <p> with <br>
      const input = '<blockquote>\n<p>[!warning]<br>Body text here</p>\n</blockquote>';
      const result = generator.processCallouts(input);
      expect(result).toContain('class="callout-title-text">Warning</span>');
      expect(result).toContain('class="callout-content">');
      expect(result).toContain('Body text here');
      // Title should only contain "Warning", not the body text
      expect(result).toContain('class="callout-title-text">Warning</span>');
      expect(result).not.toContain('callout-title-text">Warning<br>');
    });

    it('should handle custom title with <br> body', () => {
      const input = '<blockquote>\n<p>[!note] Custom Title<br>Body text here</p>\n</blockquote>';
      const result = generator.processCallouts(input);
      expect(result).toContain('class="callout-title-text">Custom Title</span>');
      expect(result).toContain('class="callout-content">');
      expect(result).toContain('Body text here');
    });

    it('should combine <br> body with additional paragraphs', () => {
      const input = '<blockquote>\n<p>[!note]<br>Line one</p>\n<p>Line two</p>\n</blockquote>';
      const result = generator.processCallouts(input);
      expect(result).toContain('class="callout-title-text">Note</span>');
      expect(result).toContain('Line one');
      expect(result).toContain('Line two');
      expect(result).toContain('class="callout-content">');
    });

    it('should handle real-world multi-line callout from 内存管理', () => {
      const input = '<blockquote>\n<p>[!warning]<br>非 JVM 管理的内存不受 GC 控制，若使用不当可能导致 OOM</p>\n</blockquote>';
      const result = generator.processCallouts(input);
      // Title should be "Warning", not contain the Chinese text
      expect(result).toContain('class="callout-title-text">Warning</span>');
      // Body should contain the Chinese text in callout-content
      expect(result).toContain('class="callout-content">');
      expect(result).toContain('非 JVM 管理的内存不受 GC 控制');
    });
  });

  describe('nested callouts', () => {
    it('should handle nested callouts', () => {
      const input = '<blockquote>\n<p>[!note] Outer</p>\n' +
        '<blockquote>\n<p>[!tip] Inner</p>\n<p>Inner content</p>\n</blockquote>\n' +
        '</blockquote>';
      const result = generator.processCallouts(input);
      expect(result).toContain('callout-note');
      expect(result).toContain('callout-tip');
      expect(result).toContain('Inner content');
    });
  });

  describe('regular blockquotes unchanged', () => {
    it('should not transform regular blockquotes', () => {
      const input = '<blockquote>\n<p>Just a normal quote</p>\n</blockquote>';
      const result = generator.processCallouts(input);
      expect(result).toBe(input);
      expect(result).not.toContain('class="callout');
    });

    it('should not transform blockquotes without [!type] syntax', () => {
      const input = '<blockquote>\n<p>Some text with [brackets] inside</p>\n</blockquote>';
      const result = generator.processCallouts(input);
      expect(result).toBe(input);
    });
  });

  describe('unknown type fallback', () => {
    it('should fall back to note styling for unknown types', () => {
      const input = '<blockquote>\n<p>[!unknowntype] Title</p>\n<p>Body</p>\n</blockquote>';
      const result = generator.processCallouts(input);
      expect(result).toContain('callout-unknowntype');
      // Should still render with note's icon as fallback
      expect(result).toContain('class="callout-icon">');
      expect(result).toContain('<svg');
    });
  });

  describe('empty body callout', () => {
    it('should render callout with title only (no body)', () => {
      const input = '<blockquote>\n<p>[!info] Just a title</p>\n</blockquote>';
      const result = generator.processCallouts(input);
      expect(result).toContain('callout-info');
      expect(result).toContain('Just a title');
      expect(result).not.toContain('class="callout-content">');
    });
  });

  describe('case insensitivity', () => {
    it('should handle uppercase type', () => {
      const input = '<blockquote>\n<p>[!NOTE] Title</p>\n<p>Body</p>\n</blockquote>';
      const result = generator.processCallouts(input);
      expect(result).toContain('callout-note');
    });

    it('should handle mixed case type', () => {
      const input = '<blockquote>\n<p>[!Warning] Title</p>\n<p>Body</p>\n</blockquote>';
      const result = generator.processCallouts(input);
      expect(result).toContain('callout-warning');
    });
  });
});
