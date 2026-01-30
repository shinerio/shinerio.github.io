/**
 * FileScanner单元测试
 * Unit tests for FileScanner
 */

import { FileScanner } from '../FileScanner';
import { createTempDir, cleanupTempDir, createTestMarkdownFile } from '../../test-setup';
import * as fs from 'fs-extra';
import * as path from 'path';
import fc from 'fast-check';

describe('FileScanner', () => {
  let fileScanner: FileScanner;
  let tempDir: string;

  beforeEach(async () => {
    fileScanner = new FileScanner();
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('isMarkdownFile', () => {
    it('should identify .md files as markdown', () => {
      expect(fileScanner.isMarkdownFile('test.md')).toBe(true);
      expect(fileScanner.isMarkdownFile('path/to/file.md')).toBe(true);
    });

    it('should identify .markdown files as markdown', () => {
      expect(fileScanner.isMarkdownFile('test.markdown')).toBe(true);
      expect(fileScanner.isMarkdownFile('path/to/file.markdown')).toBe(true);
    });

    it('should reject non-markdown files', () => {
      expect(fileScanner.isMarkdownFile('test.txt')).toBe(false);
      expect(fileScanner.isMarkdownFile('test.html')).toBe(false);
      expect(fileScanner.isMarkdownFile('test.js')).toBe(false);
      expect(fileScanner.isMarkdownFile('test')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(fileScanner.isMarkdownFile('test.MD')).toBe(true);
      expect(fileScanner.isMarkdownFile('test.Markdown')).toBe(true);
      expect(fileScanner.isMarkdownFile('test.MARKDOWN')).toBe(true);
    });
  });

  describe('getFileStats', () => {
    it('should return file statistics', async () => {
      const filePath = path.join(tempDir, 'test.md');
      await createTestMarkdownFile(filePath, 'Test content');

      const stats = await fileScanner.getFileStats(filePath);
      
      expect(stats.size).toBeGreaterThan(0);
      expect(typeof stats.created).toBe('object');
      expect(typeof stats.modified).toBe('object');
      expect(stats.isDirectory).toBe(false);
    });

    it('should throw FileError for non-existent file', async () => {
      const filePath = path.join(tempDir, 'nonexistent.md');
      
      await expect(fileScanner.getFileStats(filePath)).rejects.toThrow();
    });
  });

  describe('scanVault', () => {
    it('should scan empty directory', async () => {
      const result = await fileScanner.scanVault(tempDir);
      
      expect(result.files).toHaveLength(0);
      expect(result.totalSize).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should find markdown files in directory', async () => {
      await createTestMarkdownFile(path.join(tempDir, 'file1.md'), 'Content 1');
      await createTestMarkdownFile(path.join(tempDir, 'file2.markdown'), 'Content 2');
      await fs.writeFile(path.join(tempDir, 'file3.txt'), 'Not markdown');

      const result = await fileScanner.scanVault(tempDir);
      
      expect(result.files).toHaveLength(2);
      expect(result.files.some(f => f.endsWith('file1.md'))).toBe(true);
      expect(result.files.some(f => f.endsWith('file2.markdown'))).toBe(true);
      expect(result.totalSize).toBeGreaterThan(0);
    });

    it('should scan nested directories', async () => {
      const subDir = path.join(tempDir, 'subdir');
      await fs.ensureDir(subDir);
      
      await createTestMarkdownFile(path.join(tempDir, 'root.md'), 'Root content');
      await createTestMarkdownFile(path.join(subDir, 'nested.md'), 'Nested content');

      const result = await fileScanner.scanVault(tempDir);
      
      expect(result.files).toHaveLength(2);
      expect(result.files.some(f => f.endsWith('root.md'))).toBe(true);
      expect(result.files.some(f => f.endsWith('nested.md'))).toBe(true);
    });

    it('should skip hidden directories', async () => {
      const hiddenDir = path.join(tempDir, '.hidden');
      await fs.ensureDir(hiddenDir);
      await createTestMarkdownFile(path.join(hiddenDir, 'hidden.md'), 'Hidden content');
      await createTestMarkdownFile(path.join(tempDir, 'visible.md'), 'Visible content');

      const result = await fileScanner.scanVault(tempDir);
      
      expect(result.files).toHaveLength(1);
      expect(result.files[0]).toMatch(/visible\.md$/);
    });

    it('should handle non-existent directory', async () => {
      const nonExistentDir = path.join(tempDir, 'nonexistent');
      
      const result = await fileScanner.scanVault(nonExistentDir);
      
      expect(result.files).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('not_found');
    });

    it('should handle file instead of directory', async () => {
      const filePath = path.join(tempDir, 'notdir.txt');
      await fs.writeFile(filePath, 'content');
      
      const result = await fileScanner.scanVault(filePath);
      
      expect(result.files).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('Property Tests - Markdown File Identification Completeness', () => {
    it('should correctly identify all valid markdown extensions', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(str => !str.includes('.') && !str.includes('/') && !str.includes('\\') && !str.includes(':') && !str.includes('*') && !str.includes('?') && !str.includes('"') && !str.includes('<') && !str.includes('>') && !str.includes('|')),
          fc.constantFrom('.md', '.markdown'),
          (fileNameBase, extension) => {
            const fileName = fileNameBase + extension;
            const upperCaseFileName = fileNameBase + extension.toUpperCase();

            // Lowercase extension should be identified as markdown
            expect(fileScanner.isMarkdownFile(fileName)).toBe(true);

            // Uppercase extension should also be identified as markdown (case insensitive)
            expect(fileScanner.isMarkdownFile(upperCaseFileName)).toBe(true);

            // Files with other extensions should not be identified as markdown
            expect(fileScanner.isMarkdownFile(fileNameBase + '.txt')).toBe(false);
            expect(fileScanner.isMarkdownFile(fileNameBase + '.html')).toBe(false);
            expect(fileScanner.isMarkdownFile(fileNameBase + '.pdf')).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly handle paths with directory structure', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(str => !str.includes('/') && !str.includes('\\') && !str.includes('.') && !str.includes(':') && !str.includes('*') && !str.includes('?') && !str.includes('"') && !str.includes('<') && !str.includes('>') && !str.includes('|'))),
          fc.string({ minLength: 1, maxLength: 20 }).filter(str => !str.includes('.') && !str.includes('/') && !str.includes('\\')),
          fc.constantFrom('.md', '.markdown'),
          (dirs, fileNameBase, extension) => {
            const filePath = path.join(...dirs, fileNameBase + extension);
            const nonMarkdownPath = path.join(...dirs, fileNameBase + '.txt');

            expect(fileScanner.isMarkdownFile(filePath)).toBe(true);
            expect(fileScanner.isMarkdownFile(nonMarkdownPath)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be consistent with case variations', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }).filter(str => !str.includes('.') && !str.includes('/') && !str.includes('\\') && !str.includes(':') && !str.includes('*') && !str.includes('?') && !str.includes('"') && !str.includes('<') && !str.includes('>') && !str.includes('|') && str.length > 0),
          (fileNameBase) => {
            // All variations of markdown extensions should be recognized
            expect(fileScanner.isMarkdownFile(fileNameBase + '.md')).toBe(true);
            expect(fileScanner.isMarkdownFile(fileNameBase + '.MD')).toBe(true);
            expect(fileScanner.isMarkdownFile(fileNameBase + '.Md')).toBe(true);
            expect(fileScanner.isMarkdownFile(fileNameBase + '.mD')).toBe(true);

            expect(fileScanner.isMarkdownFile(fileNameBase + '.markdown')).toBe(true);
            expect(fileScanner.isMarkdownFile(fileNameBase + '.MARKDOWN')).toBe(true);
            expect(fileScanner.isMarkdownFile(fileNameBase + '.Markdown')).toBe(true);
            expect(fileScanner.isMarkdownFile(fileNameBase + '.MarkDown')).toBe(true);

            // Non-markdown extensions should not be recognized
            expect(fileScanner.isMarkdownFile(fileNameBase + '.txt')).toBe(false);
            expect(fileScanner.isMarkdownFile(fileNameBase + '.TXT')).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});